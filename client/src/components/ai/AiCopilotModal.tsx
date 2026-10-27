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
      setQaError(err.message || "Failed to process clinical inquiry.")
    } finally {
      setQaLoading(false)
    }
  }

  const handleReviewAction = async (status: "ACCEPTED" | "REJECTED" | "MODIFIED") => {
    if (!draftResult?.analysisId) return

    try {
      setReviewLoading(true)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1, y: 15 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">
                    Physician Clinical AI Copilot
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Decision Support Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient: <span className="text-slate-200 font-medium">
                    {appointment.patient ? `${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName}` : "Patient"}
                  </span> | Ref: <span className="font-mono text-slate-300">{appointment.bookingReference}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/30">
            <button
              onClick={() => setActiveTab("draft")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "draft"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SOAP Consultation Pre-Draft</span>
            </button>
            <button
              onClick={() => setActiveTab("qa")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "qa"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Document Q&A</span>
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "review"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clinician Approval & Audit</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* TAB 1: SOAP CONSULTATION PRE-DRAFT */}
            {activeTab === "draft" && (
              <div className="space-y-5">
                {!draftResult && !draftLoading && (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Synthesize Patient Records & Prepare SOAP Draft
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Aggregates uploaded lab reports, past consultation notes, and the stated visit reason
                      to generate structured SOAP suggestions and identify missing clinical records.
                    </p>
                    <button
                      onClick={handleGenerateDraft}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      Generate Consultation Pre-Draft
                    </button>
                  </div>
                )}

                {draftLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-sm font-medium text-slate-300">
                      Compiling patient history and synthesizing structured SOAP draft...
                    </p>
                    <p className="text-xs text-slate-500">
                      Correlating laboratory investigations with stated chief complaint
                    </p>
                  </div>
                )}

                {draftError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{draftError}</span>
                  </div>
                )}

                {draftResult && (
                  <div className="space-y-5">
                    {/* Missing Information Alerts */}
                    {draftResult.missingInformation.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Missing Clinical Data Alerts ({draftResult.missingInformation.length})</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-amber-300/80">
                          {draftResult.missingInformation.map((info, idx) => (
                            <li key={idx}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">
                        Status: <span className="text-indigo-400 font-semibold uppercase text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI Draft</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onAdoptSoapDraft && (
                          <button
                            onClick={() => {
                              onAdoptSoapDraft(draftResult.soapDraft)
                              onClose()
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Adopt into Consultation Note</span>
                          </button>
                        )}
                        <button
                          onClick={handleGenerateDraft}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>

                    {/* SOAP Sections */}
                    <div className="space-y-4">
                      {/* S: Subjective */}
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            S — Subjective (Symptoms & History)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.subjective, "S")}
                            className="text-slate-400 hover:text-white p-1 text-[11px] flex items-center gap-1"
                          >
                            {copiedSection === "S" ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "S" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {draftResult.soapDraft.subjective}
                        </p>
                      </div>

                      {/* O: Objective */}
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            O — Objective (Vitals & Extracted Lab Findings)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.objective, "O")}
                            className="text-slate-400 hover:text-white p-1 text-[11px] flex items-center gap-1"
                          >
                            {copiedSection === "O" ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "O" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {draftResult.soapDraft.objective}
                        </p>
                      </div>

                      {/* A: Assessment */}
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            A — Assessment (Differential Considerations)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.assessment, "A")}
                            className="text-slate-400 hover:text-white p-1 text-[11px] flex items-center gap-1"
                          >
                            {copiedSection === "A" ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "A" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {draftResult.soapDraft.assessment}
                        </p>
                      </div>

                      {/* P: Plan */}
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            P — Plan (Diagnostic, Follow-up & Lifestyle)
                          </h4>
                          <button
                            onClick={() => copyToClipboard(draftResult.soapDraft.plan, "P")}
                            className="text-slate-400 hover:text-white p-1 text-[11px] flex items-center gap-1"
                          >
                            {copiedSection === "P" ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
                            <span>{copiedSection === "P" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={qaLoading || !qaQuery.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {qaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Inquire</span>
                  </button>
                </form>

                {qaError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{qaError}</span>
                  </div>
                )}

                {qaHistory.length === 0 && !qaLoading && (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No clinical queries asked yet. Inquire about specific laboratory values or dates across authorized records.
                  </div>
                )}

                <div className="space-y-4">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span className="text-indigo-400">Q: {item.query}</span>
                        {item.isEmergency && (
                          <span className="text-red-400 font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">
                            Emergency Alert
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.answer}
                      </p>
                      {item.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
                          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Citations:</span>
                          {item.citations.map((c, cIdx) => (
                            <span key={cIdx} className="font-mono text-indigo-300">
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
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Clinician Review & Audit Attestation
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Under MediSlot clinical governance guidelines, every AI-assisted summary must be reviewed,
                    verified, and recorded with clinician attestation before final medical record integration.
                  </p>

                  {reviewSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-400">
                      Clinician Amendment Notes / Clinical Modifications:
                    </label>
                    <textarea
                      rows={3}
                      value={clinicianNotes}
                      onChange={e => setClinicianNotes(e.target.value)}
                      placeholder="Enter optional clinical notes or modifications regarding the AI suggestions..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("ACCEPTED")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Draft As-Is</span>
                    </button>
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("MODIFIED")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Accept with Modifications</span>
                    </button>
                    <button
                      disabled={reviewLoading || !draftResult}
                      onClick={() => handleReviewAction("REJECTED")}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
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
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 max-w-xl text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Preliminary assistive draft. Not an autonomous clinical diagnosis. Licensed healthcare provider evaluation required.
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Copilot
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
