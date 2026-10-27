import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Pill, CheckCircle, FileText, AlertCircle } from "lucide-react"
import { api, type Appointment, type Prescription, type PrescriptionItem } from "../../lib/api"

interface PrescriptionBuilderModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onCreated?: (prescription: Prescription) => void
}

const COMMON_FREQUENCIES = [
  "Once daily (OD)",
  "Twice daily (BID)",
  "Three times daily (TID)",
  "Four times daily (QID)",
  "Every 8 hours",
  "As needed (PRN)",
  "Before bedtime (QHS)",
]

export const PrescriptionBuilderModal: React.FC<PrescriptionBuilderModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [diagnosis, setDiagnosis] = useState("")
  const [generalInstructions, setGeneralInstructions] = useState("Take medications after food with plenty of water. Complete the entire course.")
  const [followUpDate, setFollowUpDate] = useState("")
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      medicineName: "",
      dosage: "500 mg",
      frequency: "Twice daily (BID)",
      duration: "5 days",
      instructions: "After meals",
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPrescription, setCreatedPrescription] = useState<Prescription | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  if (!isOpen || !appointment) return null

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medicineName: "",
        dosage: "1 tab",
        frequency: "Once daily (OD)",
        duration: "7 days",
        instructions: "With water",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagnosis.trim()) {
      setError("Please specify a primary diagnosis.")
      return
    }

    const invalidItems = items.some((item) => !item.medicineName.trim())
    if (invalidItems) {
      setError("Please provide a medicine name for each prescribed medication.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const rx = await api.createPrescription({
        appointmentId: appointment.id,
        diagnosis: diagnosis.trim(),
        generalInstructions: generalInstructions.trim() || undefined,
        followUpDate: followUpDate || undefined,
        items,
      })

      setCreatedPrescription(rx)
      if (onCreated) onCreated(rx)

      // Get signed URL for preview/download
      const dl = await api.getPrescriptionDownloadUrl(rx.id)
      setDownloadUrl(dl.signedUrl)
    } catch (err: any) {
      setError(err.message || "Failed to generate digital prescription")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Digital Prescription Builder</h3>
                <p className="text-xs text-slate-400">
                  Patient: {appointment.patient?.profile.firstName} {appointment.patient?.profile.lastName} • Ref: {appointment.bookingReference}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdPrescription ? (
            /* Success State with PDF preview option */
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Digital Prescription Generated!</h4>
                <p className="text-xs text-slate-400 mt-1">Prescription ID: <span className="text-sky-400 font-mono font-semibold">{createdPrescription.prescriptionNumber}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">Stored securely in private medical vault with cryptographic watermark.</p>
              </div>

              {downloadUrl && (
                <div className="flex items-center gap-3 pt-4">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View & Download Official PDF</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white pt-2"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bacterial Pharyngitis / Hypertension Stage 1"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Medication Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Prescribed Medications ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medication</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-400">Medication #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={item.medicineName}
                            onChange={(e) => handleItemChange(idx, "medicineName", e.target.value)}
                            placeholder="Drug name (e.g. Amoxicillin, Paracetamol)"
                            required
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, "dosage", e.target.value)}
                            placeholder="Dosage (500mg, 10ml)"
                            required
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                            placeholder="Duration (5 days, 1 month)"
                            required
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <select
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, "frequency", e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500"
                          >
                            {COMMON_FREQUENCIES.map((freq) => (
                              <option key={freq} value={freq}>
                                {freq}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.instructions || ""}
                            onChange={(e) => handleItemChange(idx, "instructions", e.target.value)}
                            placeholder="Instructions (e.g. Take with warm water after meals)"
                            disabled={isSubmitting}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Instructions & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dietary & Lifestyle Advice
                  </label>
                  <textarea
                    value={generalInstructions}
                    onChange={(e) => setGeneralInstructions(e.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Recommended Follow-Up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl transition shadow-lg shadow-sky-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Sign & Issue Prescription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
