import { Router } from "express"
import { AiController } from "../controllers/ai.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// All AI endpoints require Supabase authentication
router.use(authenticate)

// AI Consent Management
router.get("/consent/:patientId", AiController.getConsent)
router.post("/consent/:patientId", AiController.updateConsent)

// Lab Report Analyzer & Document Summarizer
router.post("/analyze-lab-report", AiController.analyzeLabReport)
router.post("/summarize-document", AiController.summarizeDocument)

// Clinical AI Copilot (Physician-Supervised)
router.post(
  "/copilot/consultation-draft",
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  AiController.generateConsultationDraft
)
router.post(
  "/copilot/qa",
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  AiController.clinicalQa
)
router.post(
  "/review",
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  AiController.reviewAnalysis
)

// Patient AI Features
router.post("/patient/explain", AiController.explainTerm)
router.post("/patient/suggest-questions/:patientId", AiController.suggestQuestions)

// History of AI Analyses for a Patient
router.get("/patient/:patientId/analyses", AiController.getPatientAnalyses)

export default router
