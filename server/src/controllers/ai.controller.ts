import { Request, Response, NextFunction } from "express"
import { AiService, AppError } from "../services/ai.service.js"
import {
  updateAiConsentSchema,
  analyzeLabReportSchema,
  summarizeDocumentSchema,
  consultationDraftSchema,
  clinicalQaSchema,
  explainTermSchema,
  suggestQuestionsSchema,
  reviewAnalysisSchema
} from "../validators/ai.validator.js"

function getUserId(req: Request): string {
  if (!req.user || !req.user.id) {
    throw new AppError("Authentication required", 401)
  }
  return req.user.id
}

function getUserRole(req: Request): string {
  return req.user?.role || "PATIENT"
}

function getParam(req: Request, name: string): string {
  const val = req.params[name]
  if (Array.isArray(val)) return val[0]
  return val || ""
}

export class AiController {
  static async getConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getParam(req, "patientId")
      const profileId = getUserId(req)
      const role = getUserRole(req)

      const result = await AiService.getPatientConsent(patientId, profileId, role)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async updateConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getParam(req, "patientId")
      const profileId = getUserId(req)
      const body = updateAiConsentSchema.parse(req.body)

      const result = await AiService.updatePatientConsent(patientId, profileId, body.consentGiven, req.ip)
      res.status(200).json({
        status: "success",
        message: body.consentGiven ? "AI consent granted" : "AI consent revoked",
        data: result
      })
    } catch (err) {
      next(err)
    }
  }

  static async analyzeLabReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const role = getUserRole(req)
      const body = analyzeLabReportSchema.parse(req.body)

      const result = await AiService.analyzeLabReport(body.recordId, profileId, role, body.saveAnalysis, req.ip)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async summarizeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const role = getUserRole(req)
      const body = summarizeDocumentSchema.parse(req.body)

      const result = await AiService.summarizeDocument(body.recordId, profileId, role, body.saveAnalysis, req.ip)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async generateConsultationDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const body = consultationDraftSchema.parse(req.body)

      const result = await AiService.generateConsultationDraft(body.appointmentId, profileId, body.includeRecordIds, req.ip)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async clinicalQa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const body = clinicalQaSchema.parse(req.body)

      const result = await AiService.clinicalQa(body.patientId, profileId, body.query, body.recordIds, req.ip)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async explainTerm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = explainTermSchema.parse(req.body)
      const result = await AiService.explainTerm(body.term)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async suggestQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const patientId = getParam(req, "patientId")
      const body = suggestQuestionsSchema.parse(req.body)

      const result = await AiService.suggestQuestions(patientId, profileId, body.reportCategory, req.query.recordId as string)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async reviewAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const body = reviewAnalysisSchema.parse(req.body)

      const result = await AiService.reviewAnalysis(body.analysisId, profileId, body.reviewStatus, body.clinicianNotes, req.ip)
      res.status(200).json({ status: "success", message: "Review recorded successfully", data: result })
    } catch (err) {
      next(err)
    }
  }

  static async getPatientAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = getUserId(req)
      const role = getUserRole(req)
      const patientId = getParam(req, "patientId")

      const result = await AiService.getPatientAnalyses(patientId, profileId, role)
      res.status(200).json({ status: "success", data: result })
    } catch (err) {
      next(err)
    }
  }
}
