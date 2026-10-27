import { PrismaClient } from "@prisma/client"
import { getSupabaseAdmin } from "../config/supabase.js"
import { config } from "../config/env.js"

const prisma = new PrismaClient()
const STORAGE_BUCKET = "medical-records"

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

interface HttpFetchOptions {
  method: string
  headers?: Record<string, string>
  body?: any
}

async function callAiService(endpoint: string, options: HttpFetchOptions = { method: "GET" }): Promise<any> {
  const url = `${config.aiServiceUrl}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-AI-Service-Secret": config.aiServiceSecret,
    ...(options.headers || {})
  }

  try {
    const res = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    if (!res.ok) {
      const errText = await res.text()
      let parsedErr: any = errText
      try {
        parsedErr = JSON.parse(errText)
      } catch (_) {}
      throw new AppError(
        typeof parsedErr === "object" && parsedErr.detail ? parsedErr.detail : `AI Service Error (${res.status}): ${errText}`,
        res.status >= 400 && res.status < 500 ? res.status : 502
      )
    }

    return await res.json()
  } catch (error: any) {
    if (error instanceof AppError) throw error
    throw new AppError(`Failed to connect to MediSlot AI Microservice: ${error.message}`, 503)
  }
}

export class AiService {
  /**
   * Checks if an authorized actor has permission to access a patient's medical data.
   */
  static async verifyPatientAccess(patientId: string, actorProfileId: string, actorRole: string): Promise<{ patient: any, doctorId?: string }> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { profile: true }
    })

    if (!patient) {
      throw new AppError("Patient not found", 404)
    }

    if (actorRole === "PLATFORM_ADMIN") {
      return { patient }
    }

    // Patient accessing own record
    if (patient.profileId === actorProfileId) {
      return { patient }
    }

    // Doctor accessing patient record
    if (actorRole === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { profileId: actorProfileId }
      })

      if (!doctor) {
        throw new AppError("Doctor profile not found", 403)
      }

      // Check explicit ACL grant
      const accessGrant = await prisma.doctorRecordAccess.findFirst({
        where: {
          patientId,
          doctorId: doctor.id,
          isRevoked: false
        }
      })

      if (accessGrant) {
        return { patient, doctorId: doctor.id }
      }

      // Check active or recent appointment
      const appointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          doctorId: doctor.id
        }
      })

      if (appointment) {
        return { patient, doctorId: doctor.id }
      }

      throw new AppError("Access denied: You do not have verified clinical access to this patient's records.", 403)
    }

    throw new AppError("Unauthorized access to patient medical data", 403)
  }

  /**
   * Verifies explicit patient AI consent.
   */
  static async verifyAiConsent(patientId: string): Promise<boolean> {
    const consent = await prisma.patientAiConsent.findUnique({
      where: { patientId }
    })

    if (!consent || !consent.consentGiven) {
      throw new AppError(
        "Patient has not consented to external AI clinical analysis. Please obtain explicit patient consent before processing sensitive medical documents.",
        403
      )
    }
    return true
  }

  /**
   * Retrieves or initializes patient AI consent.
   */
  static async getPatientConsent(patientId: string, actorProfileId: string, actorRole: string) {
    await this.verifyPatientAccess(patientId, actorProfileId, actorRole)
    const consent = await prisma.patientAiConsent.findUnique({
      where: { patientId }
    })

    return {
      patientId,
      consentGiven: consent ? consent.consentGiven : false,
      consentDate: consent ? consent.consentDate : null,
      revokedAt: consent ? consent.revokedAt : null
    }
  }

  /**
   * Updates patient AI consent.
   */
  static async updatePatientConsent(patientId: string, actorProfileId: string, consentGiven: boolean, ipAddress?: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient || patient.profileId !== actorProfileId) {
      throw new AppError("Only the patient can update their own AI data processing consent.", 403)
    }

    const consent = await prisma.patientAiConsent.upsert({
      where: { patientId },
      update: {
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined,
        revokedAt: consentGiven ? null : new Date(),
        ipAddress: ipAddress || null
      },
      create: {
        patientId,
        consentGiven,
        consentDate: new Date(),
        ipAddress: ipAddress || null
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        profileId: actorProfileId,
        action: consentGiven ? "PATIENT_AI_CONSENT_GRANTED" : "PATIENT_AI_CONSENT_REVOKED",
        resourceTable: "patient_ai_consent",
        resourceId: consent.id,
        ipAddress: ipAddress || null
      }
    })

    return consent
  }

  /**
   * Downloads medical record from private Supabase storage buffer.
   */
  private static async downloadRecordBuffer(storagePath: string): Promise<Buffer> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new AppError("Supabase storage client not initialized", 500)
    }
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(storagePath)

    if (error || !data) {
      throw new AppError("Could not retrieve document from secure storage", 500)
    }

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Analyzes an uploaded laboratory report.
   */
  static async analyzeLabReport(recordId: string, actorProfileId: string, actorRole: string, saveAnalysis = true, ipAddress?: string) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: { include: { profile: true } } }
    })

    if (!record) {
      throw new AppError("Medical record not found", 404)
    }

    const { doctorId } = await this.verifyPatientAccess(record.patientId, actorProfileId, actorRole)
    await this.verifyAiConsent(record.patientId)

    // Securely download document buffer
    const fileBuffer = await this.downloadRecordBuffer(record.storagePath)
    const base64Content = fileBuffer.toString("base64")

    // Send to Python AI service
    const extractRes: any = await callAiService("/extract/document", {
      method: "POST",
      body: {
        file_base64: base64Content,
        mime_type: record.fileType,
        filename: record.fileName
      }
    })

    const summaryRes: any = await callAiService("/summarize", {
      method: "POST",
      body: {
        pages: extractRes.pages,
        measurements: extractRes.measurements,
        document_category: record.category,
        filename: record.fileName
      }
    })

    let savedAnalysis: any = null
    if (saveAnalysis) {
      savedAnalysis = await prisma.aiAnalysis.create({
        data: {
          patientId: record.patientId,
          doctorId: doctorId || null,
          medicalRecordId: record.id,
          analysisType: "LAB_SUMMARY",
          extractedData: {
            measurements: extractRes.measurements,
            page_count: extractRes.page_count,
            extraction_mode: extractRes.extraction_mode,
            citations: summaryRes.citations
          },
          summary: summaryRes.summary,
          plainLanguageSummary: summaryRes.plain_language_summary,
          disclaimer: summaryRes.disclaimer,
          reviewStatus: "PENDING_REVIEW"
        }
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        profileId: actorProfileId,
        action: "AI_LAB_REPORT_ANALYZED",
        resourceTable: "medical_records",
        resourceId: record.id,
        ipAddress: ipAddress || null
      }
    })

    return {
      analysisId: savedAnalysis ? savedAnalysis.id : null,
      recordId: record.id,
      patientId: record.patientId,
      documentName: record.fileName,
      category: record.category,
      extractionMode: extractRes.extraction_mode,
      totalMeasurements: extractRes.measurements_count,
      abnormalCount: extractRes.abnormal_count,
      measurements: extractRes.measurements,
      summary: summaryRes.summary,
      plainLanguageSummary: summaryRes.plain_language_summary,
      citations: summaryRes.citations,
      isAiDraft: true,
      disclaimer: summaryRes.disclaimer
    }
  }

  /**
   * Summarizes an uploaded medical document with page citations.
   */
  static async summarizeDocument(recordId: string, actorProfileId: string, actorRole: string, saveAnalysis = true, ipAddress?: string) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: { include: { profile: true } } }
    })

    if (!record) {
      throw new AppError("Medical record not found", 404)
    }

    const { doctorId } = await this.verifyPatientAccess(record.patientId, actorProfileId, actorRole)
    await this.verifyAiConsent(record.patientId)

    const fileBuffer = await this.downloadRecordBuffer(record.storagePath)
    const base64Content = fileBuffer.toString("base64")

    const extractRes: any = await callAiService("/extract/document", {
      method: "POST",
      body: {
        file_base64: base64Content,
        mime_type: record.fileType,
        filename: record.fileName
      }
    })

    const summaryRes: any = await callAiService("/summarize", {
      method: "POST",
      body: {
        pages: extractRes.pages,
        measurements: extractRes.measurements,
        document_category: record.category,
        filename: record.fileName
      }
    })

    let savedAnalysis: any = null
    if (saveAnalysis) {
      savedAnalysis = await prisma.aiAnalysis.create({
        data: {
          patientId: record.patientId,
          doctorId: doctorId || null,
          medicalRecordId: record.id,
          analysisType: "DOCUMENT_SUMMARY",
          extractedData: {
            page_count: extractRes.page_count,
            citations: summaryRes.citations
          },
          summary: summaryRes.summary,
          plainLanguageSummary: summaryRes.plain_language_summary,
          disclaimer: summaryRes.disclaimer,
          reviewStatus: "PENDING_REVIEW"
        }
      })
    }

    await prisma.auditLog.create({
      data: {
        profileId: actorProfileId,
        action: "AI_DOCUMENT_SUMMARIZED",
        resourceTable: "medical_records",
        resourceId: record.id,
        ipAddress: ipAddress || null
      }
    })

    return {
      analysisId: savedAnalysis ? savedAnalysis.id : null,
      recordId: record.id,
      patientId: record.patientId,
      documentName: record.fileName,
      category: record.category,
      summary: summaryRes.summary,
      plainLanguageSummary: summaryRes.plain_language_summary,
      citations: summaryRes.citations,
      measurements: extractRes.measurements,
      isAiDraft: true,
      disclaimer: summaryRes.disclaimer
    }
  }

  /**
   * Generates a preliminary clinical SOAP draft and missing data checklist for a doctor's appointment.
   */
  static async generateConsultationDraft(appointmentId: string, doctorProfileId: string, includeRecordIds?: string[], ipAddress?: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { profile: true } },
        doctor: { include: { profile: true } }
      }
    })

    if (!appointment) {
      throw new AppError("Appointment not found", 404)
    }

    if (appointment.doctor.profileId !== doctorProfileId) {
      throw new AppError("Only the attending doctor can generate a consultation draft for this appointment.", 403)
    }

    await this.verifyAiConsent(appointment.patientId)

    // Fetch past clinical notes for this patient
    const pastNotes = await prisma.clinicalNote.findMany({
      where: { patientId: appointment.patientId, status: "FINALIZED" },
      orderBy: { createdAt: "desc" },
      take: 3
    })

    // Fetch patient records
    const recordsQuery: any = {
      patientId: appointment.patientId,
      isArchived: false
    }
    if (includeRecordIds && includeRecordIds.length > 0) {
      recordsQuery.id = { in: includeRecordIds }
    }

    const records = await prisma.medicalRecord.findMany({
      where: recordsQuery,
      take: 5
    })

    // Extract measurements from records
    const recentDocuments: any[] = []
    for (const rec of records) {
      try {
        const fileBuffer = await this.downloadRecordBuffer(rec.storagePath)
        const extractRes: any = await callAiService("/extract/document", {
          method: "POST",
          body: {
            file_base64: fileBuffer.toString("base64"),
            mime_type: rec.fileType,
            filename: rec.fileName
          }
        })
        recentDocuments.push({
          recordId: rec.id,
          fileName: rec.fileName,
          category: rec.category,
          measurements: extractRes.measurements || []
        })
      } catch (err) {
        console.warn(`Could not extract document ${rec.id} for consultation draft:`, err)
      }
    }

    const patientAge = appointment.patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(appointment.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : "Unknown"

    const draftRes: any = await callAiService("/copilot/consultation-draft", {
      method: "POST",
      body: {
        patient_info: {
          name: `${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName}`,
          age: patientAge,
          gender: appointment.patient.gender || "Unknown",
          blood_group: appointment.patient.bloodGroup,
          allergies: appointment.patient.allergies,
          chronic_conditions: appointment.patient.chronicConditions
        },
        appointment_reason: appointment.reasonForVisit || "General Consultation",
        recent_documents: recentDocuments,
        past_notes: pastNotes
      }
    })

    const savedAnalysis = await prisma.aiAnalysis.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        analysisType: "CONSULTATION_DRAFT",
        extractedData: {
          appointmentId: appointment.id,
          soapDraft: draftRes.soap_draft,
          missingInformation: draftRes.missing_information
        },
        summary: `Preliminary SOAP draft generated for Appointment ${appointment.bookingReference}`,
        disclaimer: draftRes.disclaimer,
        reviewStatus: "PENDING_REVIEW"
      }
    })

    await prisma.auditLog.create({
      data: {
        profileId: doctorProfileId,
        action: "AI_CONSULTATION_DRAFT_GENERATED",
        resourceTable: "appointments",
        resourceId: appointment.id,
        ipAddress: ipAddress || null
      }
    })

    return {
      analysisId: savedAnalysis.id,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      soapDraft: draftRes.soap_draft,
      missingInformation: draftRes.missing_information,
      abnormalMeasurementsCount: draftRes.abnormal_measurements_count,
      isAiDraft: true,
      disclaimer: draftRes.disclaimer
    }
  }

  /**
   * Answers clinician questions grounded strictly in authorized patient documents.
   */
  static async clinicalQa(patientId: string, doctorProfileId: string, query: string, recordIds?: string[], ipAddress?: string) {
    const { doctorId } = await this.verifyPatientAccess(patientId, doctorProfileId, "DOCTOR")
    await this.verifyAiConsent(patientId)

    const recordsQuery: any = {
      patientId,
      isArchived: false
    }
    if (recordIds && recordIds.length > 0) {
      recordsQuery.id = { in: recordIds }
    }

    const records = await prisma.medicalRecord.findMany({
      where: recordsQuery,
      take: 5
    })

    let combinedText = ""
    let allMeasurements: any[] = []

    for (const rec of records) {
      try {
        const fileBuffer = await this.downloadRecordBuffer(rec.storagePath)
        const extractRes: any = await callAiService("/extract/document", {
          method: "POST",
          body: {
            file_base64: fileBuffer.toString("base64"),
            mime_type: rec.fileType,
            filename: rec.fileName
          }
        })
        combinedText += `\n\n--- Document: ${rec.fileName} (${rec.category}) ---\n${extractRes.full_text || ""}`
        if (extractRes.measurements) {
          allMeasurements.push(...extractRes.measurements)
        }
      } catch (err) {
        console.warn(`Could not extract document ${rec.id} for QA:`, err)
      }
    }

    const qaRes: any = await callAiService("/copilot/qa", {
      method: "POST",
      body: {
        query,
        document_text: combinedText,
        measurements: allMeasurements
      }
    })

    const savedAnalysis = await prisma.aiAnalysis.create({
      data: {
        patientId,
        doctorId: doctorId || null,
        analysisType: "CLINICAL_QA",
        extractedData: {
          query,
          citations: qaRes.citations,
          is_emergency: qaRes.is_emergency
        },
        summary: qaRes.answer,
        disclaimer: qaRes.disclaimer,
        reviewStatus: "PENDING_REVIEW"
      }
    })

    await prisma.auditLog.create({
      data: {
        profileId: doctorProfileId,
        action: "AI_CLINICAL_QA_QUERY",
        resourceTable: "patients",
        resourceId: patientId,
        ipAddress: ipAddress || null
      }
    })

    return {
      analysisId: savedAnalysis.id,
      patientId,
      query,
      answer: qaRes.answer,
      citations: qaRes.citations,
      isEmergency: qaRes.is_emergency,
      isAiDraft: true,
      disclaimer: qaRes.disclaimer
    }
  }

  /**
   * Explains medical terminology in 6th-grade plain English.
   */
  static async explainTerm(term: string) {
    return await callAiService("/patient/explain", {
      method: "POST",
      body: { term }
    })
  }

  /**
   * Suggests empowered questions for patient to discuss with their doctor.
   */
  static async suggestQuestions(patientId: string, actorProfileId: string, reportCategory: string, recordId?: string) {
    await this.verifyPatientAccess(patientId, actorProfileId, "PATIENT")

    let abnormalTests: string[] = []
    if (recordId) {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: recordId }
      })
      if (record) {
        try {
          const fileBuffer = await this.downloadRecordBuffer(record.storagePath)
          const extractRes: any = await callAiService("/extract/document", {
            method: "POST",
            body: {
              file_base64: fileBuffer.toString("base64"),
              mime_type: record.fileType,
              filename: record.fileName
            }
          })
          const abnormal = (extractRes.measurements || []).filter((m: any) => m.is_out_of_range)
          abnormalTests = abnormal.map((m: any) => m.test_name)
        } catch (_) {}
      }
    }

    return await callAiService("/patient/suggest-questions", {
      method: "POST",
      body: {
        report_category: reportCategory,
        abnormal_tests: abnormalTests
      }
    })
  }

  /**
   * Doctor accepts, modifies, or rejects an AI draft analysis.
   */
  static async reviewAnalysis(analysisId: string, doctorProfileId: string, reviewStatus: "ACCEPTED" | "REJECTED" | "MODIFIED", clinicianNotes?: string, ipAddress?: string) {
    const analysis = await prisma.aiAnalysis.findUnique({
      where: { id: analysisId },
      include: { patient: true }
    })

    if (!analysis) {
      throw new AppError("AI analysis not found", 404)
    }

    await this.verifyPatientAccess(analysis.patientId, doctorProfileId, "DOCTOR")

    const updated = await prisma.aiAnalysis.update({
      where: { id: analysisId },
      data: {
        reviewStatus,
        reviewedAt: new Date(),
        reviewedByProfileId: doctorProfileId,
        clinicianNotes: clinicianNotes || null
      }
    })

    await prisma.auditLog.create({
      data: {
        profileId: doctorProfileId,
        action: `AI_ANALYSIS_${reviewStatus}`,
        resourceTable: "ai_analyses",
        resourceId: analysis.id,
        ipAddress: ipAddress || null
      }
    })

    return updated
  }

  /**
   * Retrieves previous AI analyses for a patient.
   */
  static async getPatientAnalyses(patientId: string, actorProfileId: string, actorRole: string) {
    await this.verifyPatientAccess(patientId, actorProfileId, actorRole)

    return await prisma.aiAnalysis.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        medicalRecord: {
          select: { id: true, fileName: true, category: true }
        },
        reviewedByProfile: {
          select: { firstName: true, lastName: true }
        }
      }
    })
  }
}
