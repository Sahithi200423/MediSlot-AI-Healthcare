import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  X,
  Search,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react"
import { api, type PatientTermExplanation, type PatientSuggestedQuestions } from "../../lib/api"

interface PatientAiExplainerModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

const COMMON_TERMS = [
  "HbA1c",
  "Dyslipidemia",
  "TSH",
  "Serum Creatinine",
  "Hypertension",
  "Anemia",
  "Leukocytosis",
  "Thrombocytopenia",
]

export const PatientAiExplainerModal: React.FC<PatientAiExplainerModalProps> = ({
  isOpen,
  onClose,
  patientId,
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "questions">("terms")

  // Term explainer state
  const [searchTerm, setSearchTerm] = useState("")
  const [termLoading, setTermLoading] = useState(false)
  const [termResult, setTermResult] = useState<PatientTermExplanation | null>(null)
  const [termError, setTermError] = useState<string | null>(null)

  // Question suggester state
  const [category, setCategory] = useState("LAB_REPORT")
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsResult, setQuestionsResult] = useState<PatientSuggestedQuestions | null>(null)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleExplain = async (termToLookup: string) => {
    if (!termToLookup.trim()) return

    try {
      setTermLoading(true)
      setTermError(null)
      const res = await api.explainMedicalTerm(termToLookup.trim())
      setTermResult(res)
    } catch (err: any) {
      setTermError(err.message || "Failed to retrieve terminology explanation.")
    } finally {
      setTermLoading(false)
    }
  }

  const handleSuggestQuestions = async () => {
    try {
      setQuestionsLoading(true)
      setQuestionsError(null)
      const res = await api.suggestPatientQuestions(patientId, category)
      setQuestionsResult(res)
    } catch (err: any) {
      setQuestionsError(err.message || "Failed to generate doctor questions.")
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleCopyQuestions = () => {
    if (!questionsResult?.suggested_questions) return
    const text = questionsResult.suggested_questions.map((q, i) => `${i + 1}. ${q}`).join("\n\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Patient Health AI Assistant
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plain-language medical terminology and doctor visit preparation
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
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "terms"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Medical Term Explainer</span>
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "questions"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions for Your Doctor</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* TAB 1: MEDICAL TERM EXPLAINER */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    handleExplain(searchTerm)
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Type any medical test or diagnosis (e.g. HbA1c, Dyslipidemia)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={termLoading || !searchTerm.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {termLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Explain"}
                  </button>
                </form>

                {/* Quick select buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400">
                    Commonly checked terms:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TERMS.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchTerm(term)
                          handleExplain(term)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {termError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{termError}</span>
                  </div>
                )}

                {termResult && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    {termResult.is_emergency && (
                      <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold uppercase">
                        Emergency Alert: These symptoms require immediate medical intervention.
                      </div>
                    )}
                    <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {termResult.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUESTIONS FOR DOCTOR */}
            {activeTab === "questions" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LAB_REPORT">General Blood & Lab Reports</option>
                    <option value="IMAGING_SCAN">X-Ray / MRI / Imaging Scans</option>
                    <option value="PRESCRIPTION">Medication & Prescription Review</option>
                    <option value="DISCHARGE_SUMMARY">Post-Hospital Discharge Care</option>
                  </select>
                  <button
                    onClick={handleSuggestQuestions}
                    disabled={questionsLoading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {questionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate Questions</span>
                  </button>
                </div>

                {questionsError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{questionsError}</span>
                  </div>
                )}

                {questionsResult && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Suggested Discussion Points for Your Doctor:
                      </h4>
                      <button
                        onClick={handleCopyQuestions}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "Copied" : "Copy Questions"}</span>
                      </button>
                    </div>

                    <ul className="space-y-2">
                      {questionsResult.suggested_questions.map((q, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 max-w-lg text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                MediSlot AI is an educational assistant, not a doctor. Does not provide personalized diagnosis, medication dosing, or treatment.
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
