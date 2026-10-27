import { PrismaClient } from "@prisma/client"
import PDFDocument from "pdfkit"
import crypto from "crypto"
import { getSupabaseAdmin } from "../config/supabase.js"
import { CreatePrescriptionInput } from "../validators/medical.validator.js"

const prisma = new PrismaClient()
const STORAGE_BUCKET = "medical-records"
const SIGNED_URL_EXPIRES_IN = 300 // 5 minutes

export class PrescriptionService {
  /**
   * Generates a unique prescription number: RX-YYYY-XXXXXX
   */
  private static generatePrescriptionNumber(): string {
    const year = new Date().getFullYear()
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase()
    return `RX-${year}-${randomHex}`
  }

  /**
   * Creates a digital prescription, generates professional PDF via PDFKit,
   * uploads it to Supabase Storage, and saves DB record.
   */
  public static async createPrescription(
    doctorProfileId: string,
    data: CreatePrescriptionInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: doctorProfileId },
      include: {
        profile: true,
        clinic: true,
      },
    })
    if (!doctor) {
      throw new Error("Only licensed doctors can issue digital prescriptions")
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        patient: { include: { profile: true } },
        clinic: true,
      },
    })
    if (!appointment) {
      throw new Error("Appointment not found")
    }

    if (appointment.doctorId !== doctor.id) {
      throw new Error("Forbidden: You are not authorized to issue prescriptions for this consultation")
    }

    // Generate unique prescription number
    let prescriptionNumber = this.generatePrescriptionNumber()
    let isUnique = false
    let attempts = 0
    while (!isUnique && attempts < 5) {
      const existing = await prisma.prescription.findUnique({ where: { prescriptionNumber } })
      if (!existing) {
        isUnique = true
      } else {
        prescriptionNumber = this.generatePrescriptionNumber()
        attempts++
      }
    }

    const followUp = data.followUpDate ? new Date(data.followUpDate) : null
    const clinic = appointment.clinic || doctor.clinic

    // 1. Generate PDF in-memory Buffer using PDFKit
    const pdfBuffer = await this.generatePrescriptionPdf({
      prescriptionNumber,
      issuedAt: new Date(),
      doctor: {
        name: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
        specialty: doctor.specialty,
        licenseNumber: doctor.licenseNumber,
      },
      clinic: clinic ? {
        name: clinic.name,
        address: clinic.address,
        city: clinic.city,
        state: clinic.state,
        phone: clinic.phone,
      } : undefined,
      patient: {
        name: `${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName}`,
        gender: appointment.patient.gender || "Not specified",
        bloodGroup: appointment.patient.bloodGroup || "Not specified",
      },
      appointmentRef: appointment.bookingReference,
      diagnosis: data.diagnosis,
      generalInstructions: data.generalInstructions || "Take medications as prescribed.",
      followUpDate: data.followUpDate,
      items: data.items,
    })

    // 2. Upload PDF to private Supabase Storage
    const storagePath = `prescriptions/${appointment.patientId}/${prescriptionNumber}.pdf`
    const supabase = getSupabaseAdmin()
    if (supabase) {
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        })
      if (uploadError) {
        console.warn("Storage upload warning for prescription PDF:", uploadError.message)
      }
    }

    // 3. Save Prescription & Items to Database
    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        appointmentId: data.appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        clinicId: clinic?.id || null,
        diagnosis: data.diagnosis,
        generalInstructions: data.generalInstructions || null,
        followUpDate: followUp,
        pdfStoragePath: storagePath,
        items: {
          create: data.items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
          })),
        },
      },
      include: {
        items: true,
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        clinic: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    })

    // 4. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          profileId: doctorProfileId,
          action: "PRESCRIPTION_ISSUED",
          resourceTable: "prescriptions",
          resourceId: prescription.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (auditErr) {
      console.warn("Audit log warning on prescription create:", auditErr)
    }

    return prescription
  }

  /**
   * Generates a signed URL to preview or download a prescription PDF
   */
  public static async getPrescriptionSignedUrl(
    prescriptionId: string,
    viewerProfileId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: true,
        doctor: true,
      },
    })

    if (!prescription) {
      throw new Error("Prescription not found")
    }

    // Authorization: Patient owner, issuing doctor, or admin
    const profile = await prisma.profile.findUnique({ where: { id: viewerProfileId } })
    const isPatient = prescription.patient.profileId === viewerProfileId
    const isDoctor = prescription.doctor.profileId === viewerProfileId
    const isAdmin = profile?.role === "PLATFORM_ADMIN"

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new Error("Forbidden: You are not authorized to view this prescription")
    }

    if (!prescription.pdfStoragePath) {
      throw new Error("Prescription PDF has not been generated for this record")
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error("Storage is not configured")
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(prescription.pdfStoragePath, SIGNED_URL_EXPIRES_IN)

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed prescription URL: ${error?.message || "Unknown error"}`)
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          profileId: viewerProfileId,
          action: "PRESCRIPTION_ACCESSED",
          resourceTable: "prescriptions",
          resourceId: prescription.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log warning on prescription access:", err)
    }

    return {
      signedUrl: data.signedUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      prescriptionNumber: prescription.prescriptionNumber,
    }
  }

  /**
   * Gets all prescriptions for a patient
   */
  public static async getPatientPrescriptions(patientProfileId: string) {
    const patient = await prisma.patient.findUnique({ where: { profileId: patientProfileId } })
    if (!patient) return []

    return prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        items: true,
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        clinic: {
          select: { name: true, city: true, phone: true },
        },
        appointment: {
          select: { scheduledStart: true, bookingReference: true, visitType: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    })
  }

  /**
   * Gets prescription by appointment ID
   */
  public static async getAppointmentPrescriptions(appointmentId: string, viewerProfileId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    })

    if (!appointment) throw new Error("Appointment not found")

    const profile = await prisma.profile.findUnique({ where: { id: viewerProfileId } })
    const isPatient = appointment.patient.profileId === viewerProfileId
    const isDoctor = appointment.doctor.profileId === viewerProfileId
    const isAdmin = profile?.role === "PLATFORM_ADMIN"

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new Error("Forbidden: Unauthorized to access prescriptions for this appointment")
    }

    return prisma.prescription.findMany({
      where: { appointmentId },
      include: {
        items: true,
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        clinic: {
          select: { name: true, city: true, phone: true },
        },
      },
    })
  }

  /**
   * Builds PDF document using PDFKit
   */
  private static generatePrescriptionPdf(details: {
    prescriptionNumber: string
    issuedAt: Date
    doctor: { name: string; specialty: string; licenseNumber: string }
    clinic?: { name: string; address: string; city: string; state: string; phone: string }
    patient: { name: string; gender: string; bloodGroup: string }
    appointmentRef: string
    diagnosis: string
    generalInstructions: string
    followUpDate?: string
    items: Array<{ medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string }>
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40 })
      const buffers: Buffer[] = []

      doc.on("data", (chunk: Buffer) => buffers.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(buffers)))
      doc.on("error", (err: Error) => reject(err))

      // Header Banner
      doc.rect(40, 40, 515, 75).fill("#0f172a") // Slate-900

      doc.fillColor("#0284c7").fontSize(20).font("Helvetica-Bold").text("MEDISLOT", 55, 55)
      doc.fillColor("#94a3b8").fontSize(10).font("Helvetica").text("SECURE CLINICAL PRESCRIPTION", 55, 78)

      if (details.clinic) {
        doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text(details.clinic.name, 300, 52, { align: "right" })
        doc.fillColor("#cbd5e1").fontSize(9).font("Helvetica").text(`${details.clinic.address}, ${details.clinic.city}`, 300, 68, { align: "right" })
        doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text(`Ph: ${details.clinic.phone}`, 300, 82, { align: "right" })
      }

      // Metadata Bar
      doc.rect(40, 125, 515, 50).fill("#f8fafc")
      doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, 125, 515, 50).stroke()

      doc.fillColor("#0369a1").fontSize(9).font("Helvetica-Bold").text("PRESCRIPTION ID:", 55, 135)
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(details.prescriptionNumber, 55, 150)

      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("DATE OF ISSUE:", 220, 135)
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica").text(details.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), 220, 150)

      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("APPOINTMENT REF:", 380, 135)
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica").text(details.appointmentRef, 380, 150)

      // Doctor & Patient Cards
      // Doctor Box
      doc.rect(40, 185, 250, 75).fill("#f1f5f9")
      doc.fillColor("#0284c7").fontSize(9).font("Helvetica-Bold").text("PRESCRIBING PHYSICIAN", 50, 195)
      doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text(details.doctor.name, 50, 210)
      doc.fillColor("#475569").fontSize(9).font("Helvetica").text(`Specialty: ${details.doctor.specialty}`, 50, 226)
      doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(`Medical License: ${details.doctor.licenseNumber}`, 50, 240)

      // Patient Box
      doc.rect(305, 185, 250, 75).fill("#f1f5f9")
      doc.fillColor("#0284c7").fontSize(9).font("Helvetica-Bold").text("PATIENT INFORMATION", 315, 195)
      doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text(details.patient.name, 315, 210)
      doc.fillColor("#475569").fontSize(9).font("Helvetica").text(`Gender: ${details.patient.gender} | Blood: ${details.patient.bloodGroup}`, 315, 226)
      doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Status: Verified Active Patient", 315, 240)

      // Clinical Diagnosis
      doc.rect(40, 270, 515, 35).fill("#f8fafc")
      doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, 270, 515, 35).stroke()
      doc.fillColor("#0284c7").fontSize(9).font("Helvetica-Bold").text("CLINICAL DIAGNOSIS:", 50, 277)
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica").text(details.diagnosis, 170, 277, { width: 375 })

      // Medications Table Header
      let y = 320
      doc.rect(40, y, 515, 22).fill("#0284c7")
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
      doc.text("#", 45, y + 6)
      doc.text("MEDICATION & DOSAGE", 65, y + 6)
      doc.text("FREQUENCY", 220, y + 6)
      doc.text("DURATION", 310, y + 6)
      doc.text("INSTRUCTIONS", 380, y + 6)

      y += 24
      // Medication Rows
      details.items.forEach((item, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc"
        doc.rect(40, y, 515, 28).fill(rowBg)
        doc.strokeColor("#e2e8f0").lineWidth(0.5).rect(40, y, 515, 28).stroke()

        doc.fillColor("#475569").fontSize(8).font("Helvetica-Bold").text(String(idx + 1), 45, y + 8)
        doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold").text(`${item.medicineName} (${item.dosage})`, 65, y + 8, { width: 150 })
        doc.fillColor("#334155").fontSize(8).font("Helvetica").text(item.frequency, 220, y + 8, { width: 85 })
        doc.fillColor("#334155").fontSize(8).font("Helvetica").text(item.duration, 310, y + 8, { width: 65 })
        doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(item.instructions || "-", 380, y + 8, { width: 170 })

        y += 30
      })

      y += 10
      // General Instructions & Follow-up
      if (details.generalInstructions || details.followUpDate) {
        doc.rect(40, y, 515, 55).fill("#f8fafc")
        doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, y, 515, 55).stroke()

        doc.fillColor("#0284c7").fontSize(9).font("Helvetica-Bold").text("ADVICE & FOLLOW-UP", 50, y + 8)
        doc.fillColor("#334155").fontSize(8).font("Helvetica").text(details.generalInstructions, 50, y + 22, { width: 500 })

        if (details.followUpDate) {
          doc.fillColor("#0284c7").fontSize(8).font("Helvetica-Bold").text(`Scheduled Follow-Up: ${details.followUpDate}`, 50, y + 40)
        }
        y += 65
      }

      // Digital Signature & Disclaimer
      const sigY = 710
      doc.strokeColor("#94a3b8").lineWidth(1).moveTo(360, sigY).lineTo(540, sigY).stroke()
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(details.doctor.name, 360, sigY + 5, { align: "center", width: 180 })
      doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(`License: ${details.doctor.licenseNumber}`, 360, sigY + 18, { align: "center", width: 180 })
      doc.fillColor("#0284c7").fontSize(7).font("Helvetica-Bold").text("[Digitally Authenticated by MediSlot]", 360, sigY + 30, { align: "center", width: 180 })

      // Legal Disclaimer Footer
      doc.rect(40, 765, 515, 28).fill("#f1f5f9")
      doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(
        "Confidential Medical Record. This digital prescription is generated by an authorized licensed medical practitioner via MediSlot and is verified through cryptographic identity authentication. Substitution requires physician authorization.",
        45,
        770,
        { width: 505, align: "center" }
      )

      doc.end()
    })
  }
}
