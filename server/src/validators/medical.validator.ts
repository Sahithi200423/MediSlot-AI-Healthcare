import { z } from "zod"

export const MedicalRecordCategoryEnum = z.enum([
  "LAB_REPORT",
  "PRESCRIPTION",
  "IMAGING_SCAN",
  "DISCHARGE_SUMMARY",
  "VACCINATION_RECORD",
  "OTHER",
])

export const uploadRecordMetadataSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  category: MedicalRecordCategoryEnum.default("OTHER"),
  patientId: z.string().uuid("Invalid patient ID").optional(), // If uploaded on behalf of patient
})

export const grantDoctorAccessSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor ID"),
  patientId: z.string().uuid("Invalid patient ID").optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export const revokeDoctorAccessSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor ID"),
  patientId: z.string().uuid("Invalid patient ID").optional(),
})

export const soapClinicalNoteSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  subjective: z.string().min(5, "Subjective section must be at least 5 characters").max(4000),
  objective: z.string().min(5, "Objective section must be at least 5 characters").max(4000),
  assessment: z.string().min(5, "Assessment section must be at least 5 characters").max(4000),
  plan: z.string().min(5, "Plan section must be at least 5 characters").max(4000),
  status: z.enum(["DRAFT", "FINALIZED"]).default("DRAFT"),
})

export const updateSoapClinicalNoteSchema = z.object({
  subjective: z.string().min(5).max(4000).optional(),
  objective: z.string().min(5).max(4000).optional(),
  assessment: z.string().min(5).max(4000).optional(),
  plan: z.string().min(5).max(4000).optional(),
  status: z.enum(["DRAFT", "FINALIZED"]).optional(),
  amendmentNotes: z.string().max(2000).optional(),
})

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(2, "Medicine name is required").max(100),
  dosage: z.string().min(1, "Dosage is required (e.g., 500mg)").max(50),
  frequency: z.string().min(1, "Frequency is required (e.g., Twice daily)").max(50),
  duration: z.string().min(1, "Duration is required (e.g., 7 days)").max(50),
  instructions: z.string().max(250).optional(),
})

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  diagnosis: z.string().min(2, "Diagnosis is required").max(500),
  generalInstructions: z.string().max(1000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD").optional(),
  items: z.array(prescriptionItemSchema).min(1, "Prescription must contain at least one medication"),
})

export type UploadRecordMetadataInput = z.infer<typeof uploadRecordMetadataSchema>
export type GrantDoctorAccessInput = z.infer<typeof grantDoctorAccessSchema>
export type SoapClinicalNoteInput = z.infer<typeof soapClinicalNoteSchema>
export type UpdateSoapClinicalNoteInput = z.infer<typeof updateSoapClinicalNoteSchema>
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>
