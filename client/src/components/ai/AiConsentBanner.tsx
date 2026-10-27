import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ShieldAlert, Sparkles, AlertCircle, X, CheckCircle2 } from "lucide-react"
import { api, type PatientAiConsentStatus } from "../../lib/api"

interface AiConsentBannerProps {
  patientId: string
  consentStatus: PatientAiConsentStatus | null
  onConsentChange: (newStatus: PatientAiConsentStatus) => void
}

export const AiConsentBanner: React.FC<AiConsentBannerProps> = ({
  patientId,
  consentStatus,
  onConsentChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConsented = consentStatus?.consentGiven ?? false

  const handleToggleConsent = async (targetState: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.updateAiConsent(patientId, targetState)
      onConsentChange({
        patientId,
        consentGiven: res.consentGiven,
        consentDate: res.consentDate,
        revokedAt: res.revokedAt,
      })
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update AI processing consent.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isConsented ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {isConsented ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                AI Clinical Decision Support
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isConsented
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isConsented ? "Consent Granted" : "Consent Required"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConsented
                ? "Secure document extraction and plain-language summaries are enabled."
                : "Explicit patient consent is required before sensitive documents can be processed."}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isConsented
              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          }`}
        >
          {isConsented ? "Manage Consent" : "Enable AI Features"}
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    Patient AI Data Processing Consent
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-200">
                    How MediSlot Clinical AI protects your privacy:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Your records are processed via authenticated temporary buffers and immediately wiped.</li>
                    <li>No medical text or lab measurements are ever logged in plain application logs.</li>
                    <li>Only your authorized doctors with explicit clinical access can view AI summaries.</li>
                    <li>AI outputs are strictly assistive drafts requiring human clinician evaluation.</li>
                  </ul>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="text-xs text-slate-400 leading-relaxed">
                  By enabling this feature, you authorize MediSlot to extract text and structured
                  measurements from your uploaded medical documents to provide plain-language explanations
                  and assist your attending physician with consultation prep. You can revoke this consent at any time.
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800">
                {isConsented ? (
                  <button
                    disabled={loading}
                    onClick={() => handleToggleConsent(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    {loading ? "Revoking..." : "Revoke Consent"}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  {!isConsented && (
                    <button
                      disabled={loading}
                      onClick={() => handleToggleConsent(true)}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {loading ? "Granting..." : "I Consent & Agree"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
