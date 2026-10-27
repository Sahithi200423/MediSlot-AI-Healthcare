const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("medislot_token")
  const headers: Record<string, string> = {}
  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

export interface Clinic {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  postalCode: string
  phone: string
  email: string
  operatingHours: string
  timezone: string
  isVerified: boolean
  _count?: { doctors: number; appointments: number }
}

export interface Doctor {
  id: string
  specialty: string
  licenseNumber: string
  licenseVerified: boolean
  qualifications?: string
  yearsOfExperience: number
  bio?: string
  consultationFee: number | string
  isAcceptingPatients: boolean
  profile: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
    phone?: string
  }
  clinic?: {
    id: string
    name: string
    city: string
    state: string
    address: string
  }
}

export interface AvailabilitySlot {
  time: string
  endTime: string
  available: boolean
  reason?: string
}

export interface Appointment {
  id: string
  bookingReference: string
  patientId: string
  doctorId: string
  clinicId: string
  scheduledStart: string
  scheduledEnd: string
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_CONSULTATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  visitType: "IN_CLINIC" | "VIDEO_VISIT"
  consultationFee: number | string
  paymentStatus: string
  paymentMethod: string
  reasonForVisit?: string
  reason?: string
  cancellationReason?: string
  checkInTime?: string
  doctor?: {
    id: string
    specialty: string
    consultationFee: number | string
    profile: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      avatarUrl?: string
    }
  }
  clinic?: {
    id: string
    name: string
    address: string
    city: string
    state: string
    phone: string
  }
  patient?: {
    id: string
    profile: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      avatarUrl?: string
    }
  }
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface DoctorAvailabilityResult {
  date: string
  doctorId: string
  doctorName: string
  specialty: string
  consultationFee: number | string
  clinic: string
  status: string
  leaveReason?: string
  totalSlots: number
  availableSlotsCount: number
  slots: AvailabilitySlot[]
}

export type MedicalRecordCategory =
  | "LAB_REPORT"
  | "PRESCRIPTION"
  | "IMAGING_SCAN"
  | "DISCHARGE_SUMMARY"
  | "VACCINATION_RECORD"
  | "OTHER"

export interface MedicalRecord {
  id: string
  patientId: string
  uploadedByProfileId: string
  title: string
  description?: string | null
  category: MedicalRecordCategory
  fileName: string
  storagePath: string
  fileType: string
  fileSize: number
  scanStatus: "CLEAN" | "PENDING_SCAN" | "QUARANTINED"
  isArchived: boolean
  createdAt: string
  uploadedByProfile?: {
    firstName: string
    lastName: string
    role: string
  }
}

export interface DoctorRecordAccess {
  id: string
  patientId: string
  doctorId: string
  isRevoked: boolean
  revokedAt?: string | null
  expiresAt?: string | null
  createdAt: string
  doctor: {
    id: string
    profile: {
      firstName: string
      lastName: string
      email: string
    }
    clinic?: {
      id: string
      name: string
    }
  }
}

export interface ClinicalNote {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  status: "DRAFT" | "FINALIZED"
  finalizedAt?: string | null
  amendmentNotes?: string | null
  createdAt: string
  updatedAt: string
  doctor?: {
    profile: {
      firstName: string
      lastName: string
    }
    clinic?: {
      id: string
      name: string
    }
  }
  patient?: {
    profile: {
      firstName: string
      lastName: string
    }
  }
  appointment?: {
    id: string
    scheduledStart: string
    scheduledEnd: string
    visitType: string
    bookingReference: string
  }
}

export interface PrescriptionItem {
  id?: string
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Prescription {
  id: string
  prescriptionNumber: string
  appointmentId: string
  patientId: string
  doctorId: string
  clinicId?: string | null
  diagnosis?: string | null
  generalInstructions?: string | null
  followUpDate?: string | null
  pdfStoragePath?: string | null
  issuedAt: string
  items: PrescriptionItem[]
  doctor?: {
    profile: {
      firstName: string
      lastName: string
    }
  }
  clinic?: {
    name: string
    city: string
    phone?: string
  }
  appointment?: {
    scheduledStart: string
    bookingReference: string
    visitType: string
  }
}

// ================= PHASE SIX: CLINICAL AI COPILOT INTERFACES =================

export interface LabMeasurement {
  test_id: string
  test_name: string
  value: string
  numeric_value: number
  unit: string
  reference_range: string
  is_out_of_range: boolean
  flag: "HIGH" | "LOW" | "NORMAL"
  confidence: number
  source_page: number
  source_context: string
}

export interface LabAnalysisResult {
  analysisId: string | null
  recordId: string
  patientId: string
  documentName: string
  category: string
  extractionMode: string
  totalMeasurements: number
  abnormalCount: number
  measurements: LabMeasurement[]
  summary: string
  plainLanguageSummary: string
  citations: Array<{ test_name: string; source_page: number; citation: string }>
  isAiDraft: boolean
  disclaimer: string
}

export interface DocumentSummaryResult {
  analysisId: string | null
  recordId: string
  patientId: string
  documentName: string
  category: string
  summary: string
  plainLanguageSummary: string
  citations: Array<{ test_name?: string; source_page: number; citation: string }>
  measurements: LabMeasurement[]
  isAiDraft: boolean
  disclaimer: string
}

export interface ConsultationDraftResult {
  analysisId: string
  appointmentId: string
  patientId: string
  soapDraft: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  missingInformation: string[]
  abnormalMeasurementsCount: number
  isAiDraft: boolean
  disclaimer: string
}

export interface ClinicalQaResult {
  analysisId: string
  patientId: string
  query: string
  answer: string
  citations: Array<{ source: string; page: number }>
  isEmergency: boolean
  isAiDraft: boolean
  disclaimer: string
}

export interface PatientAiConsentStatus {
  patientId: string
  consentGiven: boolean
  consentDate: string | null
  revokedAt: string | null
}

export interface PatientTermExplanation {
  term: string
  explanation: string
  is_emergency: boolean
  disclaimer: string
}

export interface PatientSuggestedQuestions {
  category: string
  abnormal_tests: string[]
  suggested_questions: string[]
  disclaimer: string
}

export interface AiAnalysisRecord {
  id: string
  patientId: string
  doctorId?: string
  medicalRecordId?: string
  analysisType: string
  extractedData: any
  summary: string
  plainLanguageSummary?: string
  disclaimer: string
  reviewedByProfileId?: string
  reviewedAt?: string
  reviewStatus: "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "MODIFIED"
  clinicianNotes?: string
  createdAt: string
  medicalRecord?: { id: string; fileName: string; category: string }
  reviewedByProfile?: { firstName: string; lastName: string }
}


export const api = {
  // Clinics
  async getClinics(): Promise<Clinic[]> {
    const res = await fetch(`${API_BASE}/clinics?includeAll=true`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch clinics")
    return json.data?.clinics || []
  },

  async updateClinic(clinicId: string, data: Partial<Clinic>): Promise<Clinic> {
    const res = await fetch(`${API_BASE}/clinics/${clinicId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to update clinic")
    return json.data?.clinic
  },

  async getClinicStaff(clinicId: string) {
    const res = await fetch(`${API_BASE}/clinics/${clinicId}/staff`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch staff")
    return json.data
  },

  async inviteStaff(clinicId: string, email: string, role = "DOCTOR") {
    const res = await fetch(`${API_BASE}/clinics/${clinicId}/invite`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to invite staff")
    return json.data?.invitation
  },

  // Doctors
  async getDoctors(specialty?: string, search?: string): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (specialty && specialty !== "all") params.append("specialty", specialty)
    if (search) params.append("search", search)

    const res = await fetch(`${API_BASE}/doctors?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch doctors")
    return json.data?.doctors || []
  },

  async getDoctorSchedule(doctorId: string) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/schedule`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch schedule")
    return json.data
  },

  async setDoctorSchedule(doctorId: string, slots: any[]) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/schedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ slots }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to save schedule")
    return json
  },

  async addDoctorBreak(doctorId: string, breakData: { dayOfWeek: number; startTime: string; endTime: string; title?: string }) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/breaks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(breakData),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to add break")
    return json.data?.break
  },

  async addDoctorLeave(doctorId: string, leaveData: { startDate: string; endDate: string; reason?: string }) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/leaves`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(leaveData),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to record leave")
    return json.data?.leave
  },

  async createClinic(data: Partial<Clinic>): Promise<Clinic> {
    const res = await fetch(`${API_BASE}/clinics`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to create clinic")
    return json.data?.clinic
  },

  async onboardDoctor(data: {
    specialty: string
    licenseNumber: string
    yearsOfExperience?: number
    bio?: string
    consultationFee?: number
    clinicId?: string
    qualifications?: string
  }): Promise<Doctor> {
    const res = await fetch(`${API_BASE}/doctors/onboard`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to onboard doctor")
    return json.data?.doctor
  },

  async getMyDoctorProfile(): Promise<Doctor | null> {
    const res = await fetch(`${API_BASE}/doctors/me`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) return null
    return json.data?.doctor || null
  },

  async getAvailability(doctorId: string, date: string): Promise<DoctorAvailabilityResult> {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability?date=${date}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch availability")
    return json.data
  },

  // Appointments
  async bookAppointment(data: {
    doctorId: string
    clinicId: string
    date: string
    time: string
    visitType?: string
    reasonForVisit: string
    paymentMethod?: string
  }): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to book appointment")
    return json.data?.appointment
  },

  async getMyAppointments(filter?: "upcoming" | "past" | "all"): Promise<Appointment[]> {
    const url = filter ? `${API_BASE}/appointments/my?filter=${filter}` : `${API_BASE}/appointments/my`
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch appointments")
    return json.data?.appointments || []
  },

  async cancelAppointment(appointmentId: string, cancellationReason: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancellationReason }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to cancel appointment")
    return json.data?.appointment
  },

  async rescheduleAppointment(appointmentId: string, date: string, time: string, reason?: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/reschedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, time, reason }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to reschedule appointment")
    return json.data?.appointment
  },

  async getDoctorAppointments(doctorId: string, params?: { date?: string; status?: string }): Promise<Appointment[]> {
    const query = new URLSearchParams()
    if (params?.date) query.append("date", params.date)
    if (params?.status) query.append("status", params.status)

    const res = await fetch(`${API_BASE}/appointments/doctor/${doctorId}?${query.toString()}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch doctor appointments")
    return json.data?.appointments || []
  },

  async getClinicAppointments(clinicId: string, params?: { doctorId?: string; status?: string; date?: string }): Promise<Appointment[]> {
    const query = new URLSearchParams()
    if (params?.doctorId) query.append("doctorId", params.doctorId)
    if (params?.status) query.append("status", params.status)
    if (params?.date) query.append("date", params.date)

    const res = await fetch(`${API_BASE}/appointments/clinic/${clinicId}?${query.toString()}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch clinic appointments")
    return json.data?.appointments || []
  },

  async updateAppointmentStatus(appointmentId: string, status: string, notes?: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to update appointment status")
    return json.data?.appointment
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/appointments/notifications`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to fetch notifications")
    return json.data
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/appointments/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || "Failed to mark notification as read")
  },

  // ================= PHASE FIVE: MEDICAL RECORDS =================

  async uploadMedicalRecord(formData: FormData): Promise<MedicalRecord> {
    const res = await fetch(`${API_BASE}/medical/records/upload`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: formData,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to upload medical record")
    return json.record
  },

  async getMyMedicalRecords(category?: string): Promise<MedicalRecord[]> {
    const query = category ? `?category=${category}` : ""
    const res = await fetch(`${API_BASE}/medical/records/my-records${query}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch medical records")
    return json
  },

  async getPatientMedicalRecords(patientId: string, category?: string): Promise<MedicalRecord[]> {
    const query = category ? `?category=${category}` : ""
    const res = await fetch(`${API_BASE}/medical/records/patient/${patientId}${query}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch patient records")
    return json
  },

  async getRecordDownloadUrl(recordId: string): Promise<{ signedUrl: string; expiresIn: number; fileName: string; fileType: string; title: string }> {
    const res = await fetch(`${API_BASE}/medical/records/${recordId}/download-url`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to generate download URL")
    return json
  },

  async deleteMedicalRecord(recordId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/medical/records/${recordId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to delete medical record")
  },

  async grantDoctorRecordAccess(doctorId: string, expiresInDays?: number): Promise<DoctorRecordAccess> {
    const res = await fetch(`${API_BASE}/medical/records/access/grant`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ doctorId, expiresInDays }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to grant doctor access")
    return json.access
  },

  async revokeDoctorRecordAccess(doctorId: string): Promise<DoctorRecordAccess> {
    const res = await fetch(`${API_BASE}/medical/records/access/revoke`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ doctorId }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to revoke doctor access")
    return json.access
  },

  async getDoctorAccessList(): Promise<DoctorRecordAccess[]> {
    const res = await fetch(`${API_BASE}/medical/records/access/doctors`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch doctor access list")
    return json
  },

  // ================= PHASE FIVE: CLINICAL NOTES (SOAP) =================

  async createClinicalNote(data: {
    appointmentId: string
    subjective: string
    objective: string
    assessment: string
    plan: string
    status: "DRAFT" | "FINALIZED"
  }): Promise<ClinicalNote> {
    const res = await fetch(`${API_BASE}/medical/clinical-notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to create clinical note")
    return json.note
  },

  async updateClinicalNote(
    id: string,
    data: {
      subjective?: string
      objective?: string
      assessment?: string
      plan?: string
      status?: "DRAFT" | "FINALIZED"
      amendmentNotes?: string
    }
  ): Promise<ClinicalNote> {
    const res = await fetch(`${API_BASE}/medical/clinical-notes/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to update clinical note")
    return json.note
  },

  async getClinicalNoteByAppointment(appointmentId: string): Promise<ClinicalNote | null> {
    const res = await fetch(`${API_BASE}/medical/clinical-notes/appointment/${appointmentId}`, {
      headers: getAuthHeaders(),
    })
    if (res.status === 404 || res.status === 204) return null
    const json = await res.json()
    if (!res.ok) {
      if (res.status === 403) return null
      throw new Error(json.error || "Failed to fetch clinical note")
    }
    return json
  },

  async getPatientClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    const res = await fetch(`${API_BASE}/medical/clinical-notes/patient/${patientId}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch patient clinical notes")
    return json
  },

  // ================= PHASE FIVE: DIGITAL PRESCRIPTIONS =================

  async createPrescription(data: {
    appointmentId: string
    diagnosis: string
    generalInstructions?: string
    followUpDate?: string
    items: Array<{
      medicineName: string
      dosage: string
      frequency: string
      duration: string
      instructions?: string
    }>
  }): Promise<Prescription> {
    const res = await fetch(`${API_BASE}/medical/prescriptions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to create prescription")
    return json.prescription
  },

  async getMyPrescriptions(): Promise<Prescription[]> {
    const res = await fetch(`${API_BASE}/medical/prescriptions/my-prescriptions`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch prescriptions")
    return json
  },

  async getAppointmentPrescriptions(appointmentId: string): Promise<Prescription[]> {
    const res = await fetch(`${API_BASE}/medical/prescriptions/appointment/${appointmentId}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch appointment prescriptions")
    return json
  },

  async getPrescriptionDownloadUrl(id: string): Promise<{ signedUrl: string; expiresIn: number; prescriptionNumber: string }> {
    const res = await fetch(`${API_BASE}/medical/prescriptions/${id}/download-url`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to generate prescription download URL")
    return json
  },

  // ================= PHASE SIX: CLINICAL AI COPILOT API =================

  async getAiConsent(patientId: string): Promise<PatientAiConsentStatus> {
    const res = await fetch(`${API_BASE}/ai/consent/${patientId}`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch AI consent status")
    return json.data
  },

  async updateAiConsent(patientId: string, consentGiven: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/consent/${patientId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ consentGiven }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to update AI consent")
    return json.data
  },

  async analyzeLabReport(recordId: string, saveAnalysis = true): Promise<LabAnalysisResult> {
    const res = await fetch(`${API_BASE}/ai/analyze-lab-report`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ recordId, saveAnalysis }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to analyze lab report")
    return json.data
  },

  async summarizeDocument(recordId: string, saveAnalysis = true): Promise<DocumentSummaryResult> {
    const res = await fetch(`${API_BASE}/ai/summarize-document`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ recordId, saveAnalysis }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to summarize document")
    return json.data
  },

  async generateConsultationDraft(appointmentId: string, includeRecordIds?: string[]): Promise<ConsultationDraftResult> {
    const res = await fetch(`${API_BASE}/ai/copilot/consultation-draft`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ appointmentId, includeRecordIds }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to generate consultation draft")
    return json.data
  },

  async askClinicalQa(patientId: string, query: string, recordIds?: string[]): Promise<ClinicalQaResult> {
    const res = await fetch(`${API_BASE}/ai/copilot/qa`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ patientId, query, recordIds }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to process clinical QA query")
    return json.data
  },

  async explainMedicalTerm(term: string): Promise<PatientTermExplanation> {
    const res = await fetch(`${API_BASE}/ai/patient/explain`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ term }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to explain medical term")
    return json.data
  },

  async suggestPatientQuestions(patientId: string, reportCategory: string, recordId?: string): Promise<PatientSuggestedQuestions> {
    const query = recordId ? `?recordId=${recordId}` : ""
    const res = await fetch(`${API_BASE}/ai/patient/suggest-questions/${patientId}${query}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reportCategory }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to generate patient questions")
    return json.data
  },

  async reviewAiAnalysis(analysisId: string, reviewStatus: "ACCEPTED" | "REJECTED" | "MODIFIED", clinicianNotes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ analysisId, reviewStatus, clinicianNotes }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.message || "Failed to review AI analysis")
    return json.data
  },

  async getPatientAiAnalyses(patientId: string): Promise<AiAnalysisRecord[]> {
    const res = await fetch(`${API_BASE}/ai/patient/${patientId}/analyses`, {
      headers: getAuthHeaders(),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to fetch patient AI analyses")
    return json.data || []
  },
}


