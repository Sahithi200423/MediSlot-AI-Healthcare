import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, AlertCircle, Pill } from "lucide-react"
import { api, type Prescription } from "../../lib/api"

interface PrescriptionViewerModalProps {
  prescription: Prescription | null
  isOpen: boolean
  onClose: () => void
}

export const PrescriptionViewerModal: React.FC<PrescriptionViewerModalProps> = ({
  prescription,
  isOpen,
  onClose,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !prescription) {
      setSignedUrl(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    api
      .getPrescriptionDownloadUrl(prescription.id)
      .then((res) => {
        if (isMounted) setSignedUrl(res.signedUrl)
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load prescription PDF")
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, prescription])

  if (!isOpen || !prescription) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">Prescription #{prescription.prescriptionNumber}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Digitally Signed
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Issued: {new Date(prescription.issuedAt).toLocaleDateString()} • Dr. {prescription.doctor?.profile.firstName} {prescription.doctor?.profile.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {signedUrl && (
                <a
                  href={signedUrl}
                  download={`Prescription-${prescription.prescriptionNumber}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
            {isLoading && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Retrieving signed prescription document...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-rose-300">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!isLoading && !error && signedUrl && (
              <iframe
                src={`${signedUrl}#toolbar=0`}
                title={`Prescription ${prescription.prescriptionNumber}`}
                className="w-full h-full rounded-xl border border-slate-800 bg-white"
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
