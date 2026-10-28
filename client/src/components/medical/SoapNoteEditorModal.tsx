import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, CheckCircle2, Lock, Save, AlertCircle, Clock } from "lucide-react"
import { api, type ClinicalNote, type Appointment } from "../../lib/api"

interface SoapNoteEditorModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onSaved?: (note: ClinicalNote) => void
  initialDraft?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  } | null
}

export const SoapNoteEditorModal: React.FC<SoapNoteEditorModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSaved,
  initialDraft,
}) => {
  const [existingNote, setExistingNote] = useState<ClinicalNote | null>(null)
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")
  const [amendment, setAmendment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !appointment) {
      setExistingNote(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    api
      .getClinicalNoteByAppointment(appointment.id)
      .then((note) => {
        if (note) {
          setExistingNote(note)
          setSubjective(note.subjective)
          setObjective(note.objective)
          setAssessment(note.assessment)
          setPlan(note.plan)
        } else if (initialDraft) {
          setExistingNote(null)
          setSubjective(initialDraft.subjective)
          setObjective(initialDraft.objective)
          setAssessment(initialDraft.assessment)
          setPlan(initialDraft.plan)
        } else {
          setExistingNote(null)
          // Default initial template
          setSubjective(appointment.reasonForVisit ? `Patient reports: ${appointment.reasonForVisit}. ` : "")
          setObjective("BP: 120/80 mmHg | HR: 72 bpm | Temp: 98.6 F | SpO2: 99%\nGeneral: Well-nourished, in no acute distress.")
          setAssessment("")
          setPlan("")
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load clinical note")
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, appointment, initialDraft])

  if (!isOpen || !appointment) return null

  const isFinalized = existingNote?.status === "FINALIZED"

  const handleSave = async (status: "DRAFT" | "FINALIZED") => {
    try {
      setIsSaving(true)
      setError(null)

      if (isFinalized) {
        if (!amendment.trim()) {
          setError("Please provide an addendum message to amend this finalized note.")
          setIsSaving(false)
          return
        }
        const updated = await api.updateClinicalNote(existingNote!.id, {
          amendmentNotes: amendment.trim(),
        })
        setExistingNote(updated)
        setAmendment("")
        setSuccessMsg("Addendum appended to finalized note.")
        if (onSaved) onSaved(updated)
      } else if (existingNote) {
        const updated = await api.updateClinicalNote(existingNote.id, {
          subjective,
          objective,
          assessment,
          plan,
          status,
        })
        setExistingNote(updated)
        setSuccessMsg(status === "FINALIZED" ? "Clinical note finalized and sealed." : "Draft saved.")
        if (onSaved) onSaved(updated)
      } else {
        const created = await api.createClinicalNote({
          appointmentId: appointment.id,
          subjective,
          objective,
          assessment,
          plan,
          status,
        })
        setExistingNote(created)
        setSuccessMsg(status === "FINALIZED" ? "Clinical note finalized and sealed." : "Draft saved.")
        if (onSaved) onSaved(created)
      }
    } catch (err: any) {
      setError(err.message || "Failed to save clinical note")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1815]/50 backdrop-blur-sm font-editorial-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-[#fbf9f5] border border-[#e8e2d8] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] text-[#1e1815]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#ece6dd] bg-[#fbf9f5] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">SOAP Clinical Documentation</h3>
                  {isFinalized ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4a6356]/15 text-[#4a6356] border border-[#4a6356]/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Finalized & Sealed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#cb6440]/15 text-[#cb6440] border border-[#cb6440]/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Draft Note
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6e6059]">
                  Patient: {appointment.patient?.profile.firstName} {appointment.patient?.profile.lastName} • Ref: {appointment.bookingReference}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ece6dd] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-[#4a6356]/10 border border-[#4a6356]/30 flex items-center gap-2 text-[#4a6356] text-xs shrink-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-[#8c7e77] text-sm">Loading consultation notes...</div>
            ) : (
              <>
                {/* S: Subjective */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#cb6440] uppercase tracking-wider">
                      S — Subjective (Symptoms & Patient History)
                    </label>
                  </div>
                  <textarea
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    disabled={isFinalized || isSaving}
                    rows={3}
                    placeholder="Describe patient's chief complaint, duration, onset, pain scale, and reported symptoms..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e4ded5] disabled:bg-[#f8f5ee] disabled:text-[#8c7e77] rounded-xl text-[#1e1815] text-xs focus:outline-none focus:border-[#cb6440] transition resize-none font-mono"
                  />
                </div>

                {/* O: Objective */}
                <div>
                  <label className="block text-xs font-bold text-[#4a6356] uppercase tracking-wider mb-1.5">
                    O — Objective (Physical Exam & Clinical Findings)
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    disabled={isFinalized || isSaving}
                    rows={3}
                    placeholder="Vital signs, physical examinations, heart/lung auscultation, lab results..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e4ded5] disabled:bg-[#f8f5ee] disabled:text-[#8c7e77] rounded-xl text-[#1e1815] text-xs focus:outline-none focus:border-[#cb6440] transition resize-none font-mono"
                  />
                </div>

                {/* A: Assessment */}
                <div>
                  <label className="block text-xs font-bold text-[#8c6b3e] uppercase tracking-wider mb-1.5">
                    A — Assessment (Clinical Diagnosis & Differential)
                  </label>
                  <textarea
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    disabled={isFinalized || isSaving}
                    rows={2}
                    placeholder="Primary diagnosis, differential diagnoses, progression status..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e4ded5] disabled:bg-[#f8f5ee] disabled:text-[#8c7e77] rounded-xl text-[#1e1815] text-xs focus:outline-none focus:border-[#cb6440] transition resize-none font-mono"
                  />
                </div>

                {/* P: Plan */}
                <div>
                  <label className="block text-xs font-bold text-[#1e1815] uppercase tracking-wider mb-1.5">
                    P — Plan (Treatment, Diagnostics, Referrals)
                  </label>
                  <textarea
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    disabled={isFinalized || isSaving}
                    rows={3}
                    placeholder="Prescribed medications, diagnostic workups, dietary recommendations, follow-up timeline..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e4ded5] disabled:bg-[#f8f5ee] disabled:text-[#8c7e77] rounded-xl text-[#1e1815] text-xs focus:outline-none focus:border-[#cb6440] transition resize-none font-mono"
                  />
                </div>

                {/* Amendment history if any */}
                {existingNote?.amendmentNotes && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#e8e2d8]">
                    <p className="text-xs font-semibold text-[#1e1815] mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#cb6440]" />
                      <span>Legal Amendments & Addenda Log:</span>
                    </p>
                    <pre className="text-[11px] text-[#6e6059] font-mono whitespace-pre-wrap">
                      {existingNote.amendmentNotes}
                    </pre>
                  </div>
                )}

                {/* If Finalized, Addendum Box */}
                {isFinalized && (
                  <div className="p-4 rounded-xl bg-[#fbf5f2] border border-[#cb6440]/30 space-y-2">
                    <label className="block text-xs font-semibold text-[#cb6440]">
                      Add Addendum to Finalized Record
                    </label>
                    <textarea
                      value={amendment}
                      onChange={(e) => setAmendment(e.target.value)}
                      disabled={isSaving}
                      rows={2}
                      placeholder="Add timestamped correction or follow-up note..."
                      className="w-full px-3 py-2 bg-white border border-[#e4ded5] rounded-xl text-[#1e1815] text-xs focus:outline-none focus:border-[#cb6440] transition resize-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-[#ece6dd] bg-[#fbf9f5] flex items-center justify-between shrink-0">
            <div className="text-[11px] text-[#8c7e77]">
              {isFinalized ? (
                <span>Sealed on {existingNote?.finalizedAt ? new Date(existingNote.finalizedAt).toLocaleString() : "record"}</span>
              ) : (
                <span>Drafts are auto-saved and visible only to the provider team.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs text-[#6e6059] hover:text-[#1e1815] rounded-full transition cursor-pointer"
              >
                Close
              </button>

              {isFinalized ? (
                <button
                  type="button"
                  onClick={() => handleSave("FINALIZED")}
                  disabled={isSaving || !amendment.trim()}
                  className="rounded-full px-5 py-2 bg-[#cb6440] hover:bg-[#b85633] text-white text-xs font-medium transition disabled:opacity-50 cursor-pointer"
                >
                  Append Addendum
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave("DRAFT")}
                    disabled={isSaving || !subjective.trim()}
                    className="rounded-full flex items-center gap-1.5 px-4 py-2 bg-white border border-[#dcd3c6] hover:border-[#cb6440] text-[#1e1815] text-xs font-medium transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave("FINALIZED")}
                    disabled={isSaving || !subjective.trim() || !assessment.trim()}
                    className="rounded-full flex items-center gap-1.5 px-5 py-2 bg-[#4a6356] hover:bg-[#3d5448] text-white text-xs font-medium transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Finalize & Seal Note</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
