import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react"
import { api, type MedicalRecordCategory, type MedicalRecord } from "../../lib/api"

interface UploadRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (record: MedicalRecord) => void
}

const CATEGORIES: { value: MedicalRecordCategory; label: string; desc: string }[] = [
  { value: "LAB_REPORT", label: "Lab Report", desc: "Blood work, pathology, urinalysis" },
  { value: "PRESCRIPTION", label: "Prescription", desc: "External prescriptions, pharmacy receipts" },
  { value: "IMAGING_SCAN", label: "Imaging & Scan", desc: "X-Rays, MRIs, CT scans, Ultrasounds" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary", desc: "Hospital admission or post-op records" },
  { value: "VACCINATION_RECORD", label: "Vaccination Record", desc: "Immunization history and certificates" },
  { value: "OTHER", label: "Other Clinical Document", desc: "Insurance, doctor letters, notes" },
]

export const UploadRecordModal: React.FC<UploadRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<MedicalRecordCategory>("LAB_REPORT")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      const MAX_SIZE = 15 * 1024 * 1024
      if (selected.size > MAX_SIZE) {
        setError("File size exceeds 15 MB. Please select a smaller document.")
        return
      }
      setFile(selected)
      setError(null)
      if (!title) {
        // Pre-fill title without extension
        const baseName = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload.")
      return
    }
    if (!title.trim()) {
      setError("Please provide a title for this record.")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title.trim())
      formData.append("category", category)
      if (description.trim()) {
        formData.append("description", description.trim())
      }

      const uploaded = await api.uploadMedicalRecord(formData)
      onSuccess(uploaded)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Medical Record</h3>
                <p className="text-xs text-slate-400">Encrypted and privately stored with strict HIPAA-grade isolation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* File Dropzone */}
            <div className="relative">
              <input
                type="file"
                id="medical-file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <label
                htmlFor="medical-file-upload"
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-slate-700 hover:border-sky-500/50 bg-slate-950/40 hover:bg-slate-800/40"
                }`}
              >
                {file ? (
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white truncate max-w-sm">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 mb-2 rounded-full bg-slate-800 text-sky-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      <span className="text-sky-400 hover:underline">Click to browse</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, or WebP (max 15 MB)</p>
                  </div>
                )}
              </label>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Document Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC) Report"
                required
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Record Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicalRecordCategory)}
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                    {cat.label} ({cat.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes / Clinical Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any relevant doctor observations or symptoms noted..."
                rows={2}
                disabled={isUploading}
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition resize-none"
              />
            </div>

            {/* Privacy Notice */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Only you and explicitly authorized healthcare providers have access to this document.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !file}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-sky-600/20"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Encrypting & Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Securely</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
