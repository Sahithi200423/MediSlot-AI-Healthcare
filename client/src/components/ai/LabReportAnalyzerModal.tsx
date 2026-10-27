import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Bookmark,
  Shield,
  Loader2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react"
import { api, type MedicalRecord, type LabAnalysisResult } from "../../lib/api"

interface LabReportAnalyzerModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord | null
}

export const LabReportAnalyzerModal: React.FC<LabReportAnalyzerModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<LabAnalysisResult | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && record) {
      runAnalysis(record.id)
    } else {
      setAnalysis(null)
      setError(null)
      setSelectedCitation(null)
    }
  }, [isOpen, record])

  const runAnalysis = async (recordId: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.analyzeLabReport(recordId)
      setAnalysis(res)
    } catch (err: any) {
      setError(err.message || "Failed to analyze laboratory report.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !record) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                    AI Lab Report Analyzer
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Physician Decision Support
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Source: <span className="text-slate-300 font-medium">{record.fileName}</span> ({record.category})
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">
                  Extracting laboratory measurements and generating grounded clinical summary...
                </p>
                <p className="text-xs text-slate-500">
                  Executing deterministic LOINC matching and source page citation mapping
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-300">Analysis Error</h4>
                  <p className="text-xs mt-1 text-red-300/80 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {analysis && (
              <>
                {/* Out-of-Range Banner if abnormal count > 0 */}
                {analysis.abnormalCount > 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300">
                        {analysis.abnormalCount} Out-of-Range Measurement(s) Detected
                      </h4>
                      <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                        These laboratory measurements fall outside the reference intervals noted in the report.
                        This is an assistive detection only and does not establish a diagnosis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-300">
                        All Extracted Measurements Within Reference Limits
                      </h4>
                      <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                        Extracted tests matched reference ranges documented in the source report.
                      </p>
                    </div>
                  </div>
                )}

                {/* Plain-Language Overview Card */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    <Info className="w-4 h-4" />
                    <span>Plain-Language Patient Overview</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {analysis.plainLanguageSummary}
                  </p>
                </div>

                {/* Structured Measurements Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Extracted Laboratory Measurements ({analysis.totalMeasurements})</span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      Mode: <span className="text-slate-300 font-mono">{analysis.extractionMode}</span>
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-medium">
                        <tr>
                          <th className="py-2.5 px-3.5">Test Name</th>
                          <th className="py-2.5 px-3.5">Extracted Value</th>
                          <th className="py-2.5 px-3.5">Reference Range</th>
                          <th className="py-2.5 px-3.5">Status</th>
                          <th className="py-2.5 px-3.5">Source Citation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {analysis.measurements.map((m, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              m.is_out_of_range ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3.5 font-medium text-white flex items-center gap-1.5">
                              {m.flag === "HIGH" && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
                              {m.flag === "LOW" && <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
                              {m.flag === "NORMAL" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              <span>{m.test_name}</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-semibold text-white">
                              {m.value} <span className="font-normal text-slate-400">{m.unit}</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-400">{m.reference_range}</td>
                            <td className="py-2.5 px-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  m.flag === "HIGH"
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                    : m.flag === "LOW"
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                }`}
                              >
                                {m.flag}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <button
                                onClick={() => setSelectedCitation(m.source_context)}
                                className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center gap-1 group"
                              >
                                <Bookmark className="w-3 h-3 text-indigo-400" />
                                <span>Page {m.source_page}</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Citation Snippet Viewer */}
                {selectedCitation && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5" /> Source Document Excerpt
                      </span>
                      <p className="text-xs text-indigo-200 mt-1 font-mono italic">
                        {selectedCitation}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCitation(null)}
                      className="text-indigo-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Structured Clinical Summary */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Full Clinical Analysis & Findings
                  </h4>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {analysis.summary}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 max-w-xl text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {analysis?.disclaimer ||
                  "AI-Generated Decision Support. Requires licensed clinician review prior to medical decisions."}
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
