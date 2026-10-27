import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, ShieldCheck, FileText, AlertCircle, ExternalLink, Clock } from "lucide-react"
import { api, type MedicalRecord } from "../../lib/api"

interface RecordViewerModalProps {
  record: MedicalRecord | null
  isOpen: boolean
  onClose: () => void
}

export const RecordViewerModal: React.FC<RecordViewerModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [expiresIn, setExpiresIn] = useState<number>(300)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !record) {
      setSignedUrl(null)
      setError(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    api
      .getRecordDownloadUrl(record.id)
      .then((res) => {
        if (isMounted) {
          setSignedUrl(res.signedUrl)
          setExpiresIn(res.expiresIn)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load secure document preview")
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, record])

  if (!isOpen || !record) return null

  const isPdf = record.fileType === "application/pdf" || record.fileName.endsWith(".pdf")
  const isImage = record.fileType.startsWith("image/")

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
            <div className="flex items-center gap-3 truncate">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white truncate">{record.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Clean
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {record.fileName} • {(record.fileSize / (1024 * 1024)).toFixed(2)} MB • {record.category.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {signedUrl && (
                <>
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Link expires in {Math.round(expiresIn / 60)} min</span>
                  </div>
                  <a
                    href={signedUrl}
                    download={record.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Preview Area */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4">
            {isLoading && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Generating secure authenticated document preview...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-rose-300">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs text-slate-400">The signed access token may have expired or you may lack permissions to view this record.</p>
              </div>
            )}

            {!isLoading && !error && signedUrl && (
              <>
                {isPdf ? (
                  <iframe
                    src={`${signedUrl}#toolbar=0`}
                    title={record.title}
                    className="w-full h-full rounded-xl border border-slate-800 bg-white"
                  />
                ) : isImage ? (
                  <div className="max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={signedUrl}
                      alt={record.title}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
                    <FileText className="w-12 h-12 text-sky-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">{record.fileName}</p>
                      <p className="text-xs text-slate-400 mt-1">This format does not support inline browser preview.</p>
                    </div>
                    <a
                      href={signedUrl}
                      download={record.fileName}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File Directly</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Confidential Medical Information • Protected under MediSlot Private Cloud Vault</span>
            </div>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sky-400 hover:underline"
              >
                <span>Open in new window</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
