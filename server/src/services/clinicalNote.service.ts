import crypto from "crypto"
import { NoteStatus } from "@prisma/client"
import { prisma } from "../config/db.js"
import { isProdEnv } from "../config/env.js"
import { SoapClinicalNoteInput, UpdateSoapClinicalNoteInput } from "../validators/medical.validator.js"

export class ClinicalNoteService {
  /**
   * Creates a SOAP clinical note for an appointment
   * Only the assigned doctor for the consultation can create the note
   */
  public static async createNote(
    doctorProfileId: string,
    data: SoapClinicalNoteInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const prodMode = isProdEnv()
    let doctor = null
    let isOfflineDb = false
    try {
      doctor = await prisma.doctor.findUnique({
        where: { profileId: doctorProfileId },
      })
    } catch (err) {
      if (prodMode) throw err
      isOfflineDb = true
    }

    if (!doctor && !prodMode && isOfflineDb && (doctorProfileId === "00000000-0000-4000-a000-000000000005" || doctorProfileId === "demo-doctor-001")) {
      doctor = { id: "00000000-0000-4000-a000-000000000002", profileId: doctorProfileId } as any
    }

    if (!doctor) {
      throw new Error("Only licensed doctors can author clinical notes")
    }

    let appointment = null
    try {
      appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        include: {
          patient: { include: { profile: true } },
          doctor: { include: { profile: true } },
        },
      })
    } catch (err) {
      if (prodMode) throw err
      isOfflineDb = true
    }

    if (!appointment && !prodMode && isOfflineDb) {
      appointment = {
        id: data.appointmentId,
        doctorId: doctor.id,
        patientId: "demo-patient-001",
      } as any
    }

    if (!appointment) {
      throw new Error("Appointment not found")
    }

    // Verify assigned doctor
    if (appointment.doctorId !== doctor.id) {
      throw new Error("Forbidden: You are not the assigned doctor for this consultation")
    }

    if (!isOfflineDb || prodMode) {
      try {
        // Check if a clinical note already exists for this appointment
        const existing = await prisma.clinicalNote.findUnique({
          where: { appointmentId: data.appointmentId },
        })
        if (existing) {
          throw new Error("A clinical note has already been created for this appointment. Please update the existing note instead.")
        }

        const isFinalized = data.status === "FINALIZED"
        const now = new Date()

        const note = await prisma.clinicalNote.create({
          data: {
            appointmentId: data.appointmentId,
            patientId: appointment.patientId,
            doctorId: doctor.id,
            subjective: data.subjective,
            objective: data.objective,
            assessment: data.assessment,
            plan: data.plan,
            status: isFinalized ? NoteStatus.FINALIZED : NoteStatus.DRAFT,
            finalizedAt: isFinalized ? now : null,
            finalizedByProfileId: isFinalized ? doctorProfileId : null,
          },
          include: {
            doctor: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
            patient: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        })

        try {
          await prisma.auditLog.create({
            data: {
              profileId: doctorProfileId,
              action: isFinalized ? "CLINICAL_NOTE_FINALIZED" : "CLINICAL_NOTE_DRAFT_CREATED",
              resourceTable: "clinical_notes",
              resourceId: note.id,
              ipAddress: ipAddress || null,
              userAgent: userAgent || null,
            },
          })
        } catch (auditErr) {
          console.warn("Audit log warning on clinical note create:", auditErr)
        }

        return note
      } catch (dbErr: any) {
        if (prodMode) {
          throw dbErr
        }
        if (dbErr.message && dbErr.message.includes("already been created")) {
          throw dbErr
        }
      }
    }

    // Production Safety Guard: Never accept clinical notes without persistent storage
    if (prodMode) {
      throw new Error("Database service is temporarily unavailable. Cannot finalize clinical notes without persistent database storage.")
    }

    return {
      id: crypto.randomUUID(),
      appointmentId: data.appointmentId,
      patientId: appointment.patientId || "demo-patient-001",
      doctorId: doctor.id,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      status: data.status || NoteStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      doctor: { profile: { firstName: "Sarah", lastName: "Jenkins" } },
      patient: { profile: { firstName: "Sarah", lastName: "Jenkins" } },
    } as any
  }

  /**
   * Updates a SOAP clinical note.
   * If note is FINALIZED, core SOAP fields cannot be modified; only amendmentNotes can be appended.
   */
  public static async updateNote(
    noteId: string,
    doctorProfileId: string,
    data: UpdateSoapClinicalNoteInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: doctorProfileId },
      include: { profile: true },
    })
    if (!doctor) throw new Error("Only doctors can update clinical notes")

    const note = await prisma.clinicalNote.findUnique({
      where: { id: noteId },
      include: { doctor: { include: { profile: true } } },
    })
    if (!note) throw new Error("Clinical note not found")

    if (note.doctorId !== doctor.id) {
      throw new Error("Forbidden: You are not authorized to update this clinical note")
    }

    const now = new Date()

    // If note is already finalized, prevent altering original SOAP text
    if (note.status === NoteStatus.FINALIZED) {
      if (data.subjective || data.objective || data.assessment || data.plan) {
        throw new Error("Forbidden: Finalized clinical notes are legally sealed and cannot be modified. You may only add an addendum/amendment note.")
      }

      if (!data.amendmentNotes) {
        throw new Error("No amendments provided for finalized note")
      }

      const timestamp = now.toISOString()
      const doctorName = `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`
      const newEntry = `\n\n[Addendum by ${doctorName} on ${timestamp}]:\n${data.amendmentNotes}`
      const updatedAmendments = (note.amendmentNotes || "") + newEntry

      const updated = await prisma.clinicalNote.update({
        where: { id: noteId },
        data: {
          amendmentNotes: updatedAmendments,
        },
      })

      // Log addendum
      try {
        await prisma.auditLog.create({
          data: {
            profileId: doctorProfileId,
            action: "CLINICAL_NOTE_AMENDED",
            resourceTable: "clinical_notes",
            resourceId: noteId,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
          },
        })
      } catch (err) {
        console.warn("Audit log warning on note amendment:", err)
      }

      return updated
    }

    // Note is currently DRAFT
    const finalizing = data.status === "FINALIZED"
    const updated = await prisma.clinicalNote.update({
      where: { id: noteId },
      data: {
        subjective: data.subjective !== undefined ? data.subjective : note.subjective,
        objective: data.objective !== undefined ? data.objective : note.objective,
        assessment: data.assessment !== undefined ? data.assessment : note.assessment,
        plan: data.plan !== undefined ? data.plan : note.plan,
        status: finalizing ? NoteStatus.FINALIZED : note.status,
        finalizedAt: finalizing ? now : note.finalizedAt,
        finalizedByProfileId: finalizing ? doctorProfileId : note.finalizedByProfileId,
        amendmentNotes: data.amendmentNotes !== undefined ? data.amendmentNotes : note.amendmentNotes,
      },
    })

    // Log update
    try {
      await prisma.auditLog.create({
        data: {
          profileId: doctorProfileId,
          action: finalizing ? "CLINICAL_NOTE_FINALIZED" : "CLINICAL_NOTE_DRAFT_UPDATED",
          resourceTable: "clinical_notes",
          resourceId: noteId,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log warning on note update:", err)
    }

    return updated
  }

  /**
   * Retrieves clinical note for an appointment
   * Patient can view if finalized. Assigned doctor and admin can view drafts as well.
   */
  public static async getNoteByAppointment(appointmentId: string, viewerProfileId: string) {
    const note = await prisma.clinicalNote.findUnique({
      where: { appointmentId },
      include: {
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            clinic: { select: { id: true, name: true } },
          },
        },
        patient: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        appointment: {
          select: { id: true, scheduledStart: true, scheduledEnd: true, visitType: true, bookingReference: true },
        },
      },
    })

    if (!note) return null

    // Authorization check
    const profile = await prisma.profile.findUnique({ where: { id: viewerProfileId } })
    const isPatient = note.patient.profileId === viewerProfileId
    const isDoctor = note.doctor.profileId === viewerProfileId
    const isAdmin = profile?.role === "PLATFORM_ADMIN"

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new Error("Forbidden: You are not authorized to view this clinical note")
    }

    // If patient is viewing, hide draft notes
    if (isPatient && note.status === NoteStatus.DRAFT) {
      return null
    }

    return note
  }

  /**
   * Gets all clinical notes for a patient
   */
  public static async getPatientClinicalNotes(patientId: string, viewerProfileId: string) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) throw new Error("Patient not found")

    const profile = await prisma.profile.findUnique({ where: { id: viewerProfileId } })
    const isPatient = patient.profileId === viewerProfileId
    const isAdmin = profile?.role === "PLATFORM_ADMIN"

    let isAuthorizedDoctor = false
    const doctor = await prisma.doctor.findUnique({ where: { profileId: viewerProfileId } })
    if (doctor) {
      const grant = await prisma.doctorRecordAccess.findUnique({
        where: { patientId_doctorId: { patientId, doctorId: doctor.id } },
      })
      if (grant && !grant.isRevoked) isAuthorizedDoctor = true
      const hasAppt = await prisma.appointment.findFirst({
        where: { doctorId: doctor.id, patientId },
      })
      if (hasAppt) isAuthorizedDoctor = true
    }

    if (!isPatient && !isAdmin && !isAuthorizedDoctor) {
      throw new Error("Forbidden: Unauthorized to view clinical notes for this patient")
    }

    const where: any = { patientId }
    if (isPatient) {
      where.status = NoteStatus.FINALIZED
    }

    return prisma.clinicalNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        appointment: {
          select: { scheduledStart: true, bookingReference: true, visitType: true },
        },
      },
    })
  }
}
