import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  X,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bookmark,
  Shield,
  Loader2,
  Send,
  AlertTriangle,
  ClipboardCopy,
  Check
} from "lucide-react"
import {
  api,
  type Appointment,
  type ConsultationDraftResult,
  type ClinicalQaResult
} from "../../lib/api"

interface AiCopilotModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onAdoptSoapDraft?: (draft: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }) => void
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onAdoptSoapDraft,
}) => {
  const [activeTab, setActiveTab] = useState<"draft" | "qa" | "review">("draft")

  // Draft state
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [draftResult, setDraftResult] = useState<ConsultationDraftResult | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // QA state
  const [qaQuery, setQaQuery] = useState("")
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState<string | null>(null)
  const [qaHistory, setQaHistory] = useState<ClinicalQaResult[]>([])

  // Review state
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [clinicianNotes, setClinicianNotes] = useState("")

  if (!isOpen || !appointment) return null

  const handleGenerateDraft = async () => {
    try {
      setDraftLoading(true)
      setDraftError(null)
      const res = await api.generateConsultationDraft(appointment.id)
      setDraftResult(res)
    } catch (err: any) {
      setDraftError(err.message || "Failed to generate consultation draft.")
    } finally {
      setDraftLoading(false)
    }
  }

  const handleAskQa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qaQuery.trim()) return

    try {
      setQaLoading(true)
      setQaError(null)
      const res = await api.askClinicalQa(appointment.patientId, qaQuery.trim())
      setQaHistory(prev => [res, ...prev])
      setQaQuery("")
    } catch (err: any) {
      setQaError(err.message || "Failed to process clinical query.")
    } finally {
      setQaLoading(false)
    }
  }

  const handleReviewAction = async (status: "ACCEPTED" | "REJECTED" | "MODIFIED") => {
    if (!draftResult || !draftResult.analysisId) return
    try {
      setReviewLoading(true)
      setDraftError(null)
      await api.reviewAiAnalysis(draftResult.analysisId, status, clinicianNotes)
      setReviewSuccess(`AI analysis draft successfully marked as ${status}.`)
    } catch (err: any) {
      setDraftError(err.message || "Failed to submit clinician review.")
    } finally {
      setReviewLoading(false)
    }
  }

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1815]/50 backdrop-blur-sm font-editorial-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1, y: 15 }}
          className="w-full max-w-4xl bg-[#fbf9f5] border border-[#e8e2d8] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#1e1815]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#ece6dd] bg-[#fbf9f5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#cb6440]/10 text-[#cb6440] flex items-center justify-center border border-[#cb6440]/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                    Physician Clinical AI Copilot
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#4a6356]/15 text-[#4a6356] border border-[#4a6356]/30">
                    Decision Support Only
                  </span>
                </div>
                <p className="text-xs text-[#6e6059] mt-0.5">
                  Patient: <span className="text-[#1e1815] font-medium">
                    {appointment.patient ? `${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName}` : "Patient"}
                  </span> | Ref: <span className="font-mono text-[#cb6440] font-semibold">#{appointment.bookingReference}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#8c7e77] hover:text-[#1e1815] p-2 rounded-full hover:bg-[#ece6dd] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#ece6dd] bg-[#f8f5ee]">
            <button
              onClick={() => setActiveTab("draft")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "draft"
                  ? "border-[#cb6440] text-[#cb6440] bg-[#fbf9f5]"
                  : "border-transparent text-[#6e6059] hover:text-[#1e1815]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SOAP Consultation Pre-Draft</span>
            </button>
            <button
              onClick={() => setActiveTab("qa")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "qa"
                  ? "border-[#cb6440] text-[#cb6440] bg-[#fbf9f5]"
                  : "border-transparent text-[#6e6059] hover:text-[#1e1815]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Document Q&A</span>
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "review"
                  ? "border-[#cb6440] text-[#cb6440] bg-[#fbf9f5]"
                  : "border-transparent text-[#6e6059] hover:text-[#1e1815]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clinician Approval & Audit</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: SOAP CONSULTATION PRE-DRAFT */}
            {activeTab === "draft" && (
              <div className="space-y-5">
                {!draftResult && !draftLoading && (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-[#e4ded5] rounded-3xl bg-white space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#cb6440]/10 text-[#cb6440] mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                      Synthesize Patient Records & Prepare SOAP Draft
                    </h4>
                    <p className="text-xs text-[#6e6059] max-w-md mx-auto leading-relaxed">
                      Aggregates uploaded lab reports, past consultation notes, and the stated visit reason
                      to generate structured SOAP suggestions and identify missing clinical records.
                    </p>
                    <button
                      onClick={handleGenerateDraft}
                      className="mt-2 rounded-full px-6 py-2.5 bg-[#cb6440] hover:bg-[#b85633] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                    >
                      Generate Consultation Pre-Draft
                    </button>
                  </div>
                )}

                {draftLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 text-[#cb6440] animate-spin" />
                    <p className="text-sm font-medium text-[#1e1815]">
                      Compiling patient history and synthesizing structured SOAP draft...
                    </p>
                    <p className="text-xs text-[#6e6059]">
                      Correlating laboratory investigations with stated chief complaint
                    </p>
                  </div>
                )}

                {draftError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{draftError}</span>
                  </div>
                )}

                {draftResult && (
                  <div className="space-y-5">
                    {/* Missing Information Alerts */}
                    {draftResult.missingInformation.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#fbf5f2] border border-[#cb6440]/30 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#cb6440]">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Missing Clinical Data Alerts ({draftResult.missingInformation.length})</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#6e6059]">
                          {draftResult.missingInformation.map((info, idx) => (
                            <li key={idx}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#e8e2d8]">
                      <div className="text-xs text-[#6e6059]">
                        Status: <span className="text-[#cb6440] font-semibold uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-[#cb6440]/10 border border-[#cb6440]/20">AI Draft</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onAdoptSoapDraft && (
                          <button
                            onClick={() => {
                              onAdoptSoapDraft(draftResult.soapDraft)
                              onClose()
                            }}
                            className="rounded-full px-4 py-1.5 bg-[#4a6356] hover:bg-[#3d5448] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Adopt into Consultation Note</span>
                          </button>
                        )}
                        <button
                          onClick={handleGenerateDraft}
                          className="rounded-full px-4 py-1.5 border border-[#dcd3c6] bg-white text-[#1e1815] hover:border-[#cb6440] text-xs font-medium transition-colors cursor-pointer"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>

                    {/* SOAP Sections */}
                    <div className="space-y-4">
                      {/* S: Subjective */}
                      <div className="p-4.5 bg-white rounded-2xl border border-[#e8e2d8] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#cb6440] uppercase tracking-wider">
                            S — Subjective (Symptoms & History)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.subjective, "S")}
                            className="text-[#6e6059] hover:text-[#1e1815] p-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSection === "S" ? <Check className="w-3 h-3 text-[#4a6356]" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "S" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#4a3e39] whitespace-pre-wrap leading-relaxed font-mono">
                          {draftResult.soapDraft.subjective}
                        </p>
                      </div>

                      {/* O: Objective */}
                      <div className="p-4.5 bg-white rounded-2xl border border-[#e8e2d8] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#4a6356] uppercase tracking-wider">
                            O — Objective (Vitals & Extracted Lab Findings)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.objective, "O")}
                            className="text-[#6e6059] hover:text-[#1e1815] p-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSection === "O" ? <Check className="w-3 h-3 text-[#4a6356]" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "O" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#4a3e39] whitespace-pre-wrap leading-relaxed font-mono">
                          {draftResult.soapDraft.objective}
                        </p>
                      </div>

                      {/* A: Assessment */}
                      <div className="p-4.5 bg-white rounded-2xl border border-[#e8e2d8] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#8c6b3e] uppercase tracking-wider">
                            A — Assessment (Differential Considerations)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.assessment, "A")}
                            className="text-[#6e6059] hover:text-[#1e1815] p-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSection === "A" ? <Check className="w-3 h-3 text-[#4a6356]" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "A" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#4a3e39] whitespace-pre-wrap leading-relaxed font-mono">
                          {draftResult.soapDraft.assessment}
                        </p>
                      </div>

                      {/* P: Plan */}
                      <div className="p-4.5 bg-white rounded-2xl border border-[#e8e2d8] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#1e1815] uppercase tracking-wider">
                            P — Plan (Diagnostic, Follow-up & Lifestyle)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.plan, "P")}
                            className="text-[#6e6059] hover:text-[#1e1815] p-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSection === "P" ? <Check className="w-3 h-3 text-[#4a6356]" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "P" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#4a3e39] whitespace-pre-wrap leading-relaxed font-mono">
                          {draftResult.soapDraft.plan}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DOCUMENT Q&A */}
            {activeTab === "qa" && (
              <div className="space-y-5">
                <form onSubmit={handleAskQa} className="flex gap-2">
                  <input
                    type="text"
                    value={qaQuery}
                    onChange={e => setQaQuery(e.target.value)}
                    placeholder="Ask about patient's documents (e.g., 'What was the last recorded HbA1c?')"
                    className="flex-1 px-4 py-2.5 rounded-full bg-white border border-[#e4ded5] text-xs text-[#1e1815] placeholder-[#8c7e77] focus:outline-none focus:border-[#cb6440]"
                  />
                  <button
                    type="submit"
                    disabled={qaLoading || !qaQuery.trim()}
                    className="rounded-full px-5 py-2.5 bg-[#cb6440] hover:bg-[#b85633] disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {qaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Inquire</span>
                  </button>
                </form>

                {qaError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{qaError}</span>
                  </div>
                )}

                {qaHistory.length === 0 && !qaLoading && (
                  <div className="text-center py-12 text-[#8c7e77] text-xs italic">
                    No clinical queries asked yet. Inquire about specific laboratory values or dates across authorized records.
                  </div>
                )}

                <div className="space-y-4">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="p-4.5 bg-white rounded-2xl border border-[#e8e2d8] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#cb6440]">Q: {item.query}</span>
                        {item.isEmergency && (
                          <span className="text-rose-700 font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                            Emergency Alert
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4a3e39] whitespace-pre-wrap leading-relaxed">
                        {item.answer}
                      </p>
                      {item.citations.length > 0 && (
                        <div className="pt-2 border-t border-[#f2ede4] flex items-center gap-2 text-[11px] text-[#8c7e77]">
                          <Bookmark className="w-3.5 h-3.5 text-[#cb6440]" />
                          <span>Citations:</span>
                          {item.citations.map((c, cIdx) => (
                            <span key={cIdx} className="font-mono text-[#cb6440]">
                              [Page {c.page}]
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CLINICIAN APPROVAL & AUDIT */}
            {activeTab === "review" && (
              <div className="space-y-5">
                <div className="p-6 bg-white rounded-2xl border border-[#e8e2d8] space-y-4 shadow-2xs">
                  <h4 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                    Clinician Review & Audit Attestation
                  </h4>
                  <p className="text-xs text-[#6e6059] leading-relaxed">
                    Under MediSlot clinical governance guidelines, every AI-assisted summary must be reviewed,
                    verified, and recorded with clinician attestation before final medical record integration.
                  </p>

                  {reviewSuccess && (
                    <div className="p-3 rounded-xl bg-[#4a6356]/10 border border-[#4a6356]/30 text-[#4a6356] text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#8c7e77]">
                      Clinician Amendment Notes / Clinical Modifications:
                    </label>
                    <textarea
                      rows={3}
                      value={clinicianNotes}
                      onChange={e => setClinicianNotes(e.target.value)}
                      placeholder="Enter optional clinical notes or modifications regarding the AI suggestions..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf9f5] border border-[#e4ded5] text-xs text-[#1e1815] placeholder-[#8c7e77] focus:outline-none focus:border-[#cb6440]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("ACCEPTED")}
                      className="rounded-full px-5 py-2 bg-[#4a6356] hover:bg-[#3d5448] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Draft As-Is</span>
                    </button>
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("MODIFIED")}
                      className="rounded-full px-5 py-2 bg-[#cb6440] hover:bg-[#b85633] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Accept with Modifications</span>
                    </button>
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("REJECTED")}
                      className="rounded-full px-5 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject AI Suggestions</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="p-4.5 bg-[#f8f5ee] border-t border-[#ece6dd] flex items-center justify-between text-xs text-[#8c7e77]">
            <div className="flex items-center gap-2 max-w-xl text-[11px]">
              <Shield className="w-4 h-4 text-[#cb6440] shrink-0" />
              <span>
                Preliminary assistive draft. Not an autonomous clinical diagnosis. Licensed healthcare provider evaluation required.
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full px-5 py-1.5 bg-white border border-[#dcd3c6] text-[#1e1815] hover:border-[#cb6440] font-medium transition-colors cursor-pointer"
            >
              Close Copilot
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
