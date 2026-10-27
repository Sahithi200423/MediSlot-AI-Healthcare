import { Request, Response } from "express"
import { MedicalRecordService, UploadedFile } from "../services/medicalRecord.service.js"
import { ClinicalNoteService } from "../services/clinicalNote.service.js"
import { PrescriptionService } from "../services/prescription.service.js"
import {
  uploadRecordMetadataSchema,
  grantDoctorAccessSchema,
  revokeDoctorAccessSchema,
  soapClinicalNoteSchema,
  updateSoapClinicalNoteSchema,
  createPrescriptionSchema,
} from "../validators/medical.validator.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function getUserId(req: Request): string {
  if (!req.user?.id) {
    throw new Error("Authentication required")
  }
  return req.user.id
}

function getParam(req: Request, name: string): string {
  const val = req.params[name]
  if (Array.isArray(val)) return val[0]
  return val || ""
}

export class MedicalController {
  /**
   * Upload medical record file and metadata
   */
  public static async uploadRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)

      if (!req.file) {
        res.status(400).json({ error: "No file attached. Please select a valid document or image." })
        return
      }

      const parsed = uploadRecordMetadataSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid metadata", details: parsed.error.format() })
        return
      }

      const file: UploadedFile = {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      }

      const record = await MedicalRecordService.uploadRecord(
        userId,
        file,
        parsed.data,
        req.ip,
        req.headers["user-agent"]
      )

      res.status(201).json({
        message: "Medical record uploaded and verified successfully",
        record,
      })
    } catch (err: any) {
      const status = err.message === "Authentication required" ? 401 : 400
      res.status(status).json({ error: err.message || "Failed to upload medical record" })
    }
  }

  /**
   * Get records for the authenticated patient
   */
  public static async getMyRecords(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const patient = await prisma.patient.findUnique({ where: { profileId: userId } })
      if (!patient) {
        res.status(200).json([])
        return
      }

      const category = req.query.category as string | undefined
      const records = await MedicalRecordService.getPatientRecords(patient.id, userId, category)
      res.status(200).json(records)
    } catch (err: any) {
      const status = err.message === "Authentication required" ? 401 : 400
      res.status(status).json({ error: err.message || "Failed to fetch medical records" })
    }
  }

  /**
   * Get records for a specific patient (for authorized doctors or admins)
   */
  public static async getPatientRecords(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const patientId = getParam(req, "patientId")
      const category = req.query.category as string | undefined
      const records = await MedicalRecordService.getPatientRecords(patientId, userId, category)
      res.status(200).json(records)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : err.message === "Authentication required" ? 401 : 400
      res.status(status).json({ error: err.message || "Failed to fetch patient records" })
    }
  }

  /**
   * Get authenticated short-lived signed URL to preview or download a medical record
   */
  public static async getRecordDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const recordId = getParam(req, "recordId")
      const result = await MedicalRecordService.getSignedDownloadUrl(
        recordId,
        userId,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json(result)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : err.message === "Authentication required" ? 401 : 400
      res.status(status).json({ error: err.message || "Failed to generate download URL" })
    }
  }

  /**
   * Delete a medical record
   */
  public static async deleteRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const recordId = getParam(req, "recordId")
      const result = await MedicalRecordService.deleteRecord(
        recordId,
        userId,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json(result)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : err.message === "Authentication required" ? 401 : 400
      res.status(status).json({ error: err.message || "Failed to delete medical record" })
    }
  }

  /**
   * Grant doctor access to patient's medical records
   */
  public static async grantDoctorAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const parsed = grantDoctorAccessSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Validation error", details: parsed.error.format() })
        return
      }

      const access = await MedicalRecordService.grantDoctorAccess(
        userId,
        parsed.data,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json({ message: "Doctor access granted successfully", access })
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to grant doctor access" })
    }
  }

  /**
   * Revoke doctor access
   */
  public static async revokeDoctorAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const parsed = revokeDoctorAccessSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Validation error", details: parsed.error.format() })
        return
      }

      const access = await MedicalRecordService.revokeDoctorAccess(
        userId,
        parsed.data.doctorId,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json({ message: "Doctor access revoked successfully", access })
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to revoke doctor access" })
    }
  }

  /**
   * Get list of doctors with access to patient's records
   */
  public static async getDoctorAccessList(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const list = await MedicalRecordService.getPatientDoctorAccessList(userId)
      res.status(200).json(list)
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to fetch doctor access list" })
    }
  }

  // ================= CLINICAL NOTES =================

  /**
   * Create SOAP clinical note
   */
  public static async createClinicalNote(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const parsed = soapClinicalNoteSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Validation error", details: parsed.error.format() })
        return
      }

      const note = await ClinicalNoteService.createNote(
        userId,
        parsed.data,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(201).json({ message: "Clinical note created successfully", note })
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to create clinical note" })
    }
  }

  /**
   * Update or finalize SOAP clinical note
   */
  public static async updateClinicalNote(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const id = getParam(req, "id")
      const parsed = updateSoapClinicalNoteSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Validation error", details: parsed.error.format() })
        return
      }

      const updated = await ClinicalNoteService.updateNote(
        id,
        userId,
        parsed.data,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json({ message: "Clinical note updated successfully", note: updated })
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to update clinical note" })
    }
  }

  /**
   * Get clinical note by appointment ID
   */
  public static async getClinicalNoteByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const appointmentId = getParam(req, "appointmentId")
      const note = await ClinicalNoteService.getNoteByAppointment(appointmentId, userId)
      res.status(200).json(note)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to fetch clinical note" })
    }
  }

  /**
   * Get all clinical notes for a patient
   */
  public static async getPatientClinicalNotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const patientId = getParam(req, "patientId")
      const notes = await ClinicalNoteService.getPatientClinicalNotes(patientId, userId)
      res.status(200).json(notes)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to fetch clinical notes" })
    }
  }

  // ================= PRESCRIPTIONS =================

  /**
   * Create digital prescription with PDF generation
   */
  public static async createPrescription(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const parsed = createPrescriptionSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: "Validation error", details: parsed.error.format() })
        return
      }

      const prescription = await PrescriptionService.createPrescription(
        userId,
        parsed.data,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(201).json({ message: "Prescription issued successfully", prescription })
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to create prescription" })
    }
  }

  /**
   * Get all prescriptions for authenticated patient
   */
  public static async getMyPrescriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const prescriptions = await PrescriptionService.getPatientPrescriptions(userId)
      res.status(200).json(prescriptions)
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to fetch prescriptions" })
    }
  }

  /**
   * Get prescriptions for an appointment
   */
  public static async getAppointmentPrescriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const appointmentId = getParam(req, "appointmentId")
      const list = await PrescriptionService.getAppointmentPrescriptions(appointmentId, userId)
      res.status(200).json(list)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to fetch prescriptions" })
    }
  }

  /**
   * Get signed URL to view or download prescription PDF
   */
  public static async getPrescriptionDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req)
      const id = getParam(req, "id")
      const result = await PrescriptionService.getPrescriptionSignedUrl(
        id,
        userId,
        req.ip,
        req.headers["user-agent"]
      )
      res.status(200).json(result)
    } catch (err: any) {
      const status = err.message.includes("Forbidden") ? 403 : 400
      res.status(status).json({ error: err.message || "Failed to generate prescription download URL" })
    }
  }
}
