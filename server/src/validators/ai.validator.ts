import { z } from "zod"

export const updateAiConsentSchema = z.object({
  consentGiven: z.boolean(),
})

export const analyzeLabReportSchema = z.object({
  recordId: z.string().uuid("Invalid medical record ID format"),
  saveAnalysis: z.boolean().optional().default(true),
})

export const summarizeDocumentSchema = z.object({
  recordId: z.string().uuid("Invalid medical record ID format"),
  saveAnalysis: z.boolean().optional().default(true),
})

export const consultationDraftSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID format"),
  includeRecordIds: z.array(z.string().uuid()).optional(),
})

export const clinicalQaSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID format"),
  query: z.string().min(2, "Query is too short").max(1000, "Query is too long"),
  recordIds: z.array(z.string().uuid()).optional(),
})

export const explainTermSchema = z.object({
  term: z.string().min(2, "Term is too short").max(200, "Term is too long"),
})

export const suggestQuestionsSchema = z.object({
  reportCategory: z.string().min(2).max(100),
  abnormalTests: z.array(z.string()).optional(),
})

export const reviewAnalysisSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID format"),
  reviewStatus: z.enum(["ACCEPTED", "REJECTED", "MODIFIED"]),
  clinicianNotes: z.string().max(2000).optional(),
})
