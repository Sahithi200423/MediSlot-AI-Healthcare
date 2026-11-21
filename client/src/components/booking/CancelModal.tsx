import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, AlertTriangle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { api, type Appointment } from "@/lib/api"
import { modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onCancelled: (cancelled: Appointment) => void
}

export function CancelModal({
  isOpen,
  onClose,
  appointment,
  onCancelled,
}: CancelModalProps) {
  const [reason, setReason] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    if (reason.trim().length < 3) {
      setErrorMessage("Please provide a brief cancellation reason (at least 3 characters).")
      toast.error("Please provide a valid cancellation reason")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const cancelled = await api.cancelAppointment(appointment.id, reason)
      setReason("")
      onCancelled(cancelled)
      toast.success("Appointment has been cancelled")
      onClose()
    } catch (err: any) {
      const msg = err.message || "Unable to cancel appointment"
      setErrorMessage(msg)
      toast.error("Cancellation failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Cancel Appointment"
        >
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-[#1e1815]/55 backdrop-blur-sm"
          />

          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-md rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl overflow-hidden text-[#1e1815]"
          >
            <div className="p-5 border-b border-rose-200/70 bg-rose-50/70 flex items-center justify-between gap-3">
              <h2 className="font-editorial-serif text-xl font-normal text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Cancel Appointment
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cancel dialog"
                className="p-1.5 rounded-full text-rose-400 hover:text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancel} className="p-6 space-y-4 text-xs">
              <p className="text-[#4a3e39] leading-relaxed">
                Are you sure you want to cancel your consultation with{" "}
                <strong className="text-[#1e1815]">
                  Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName}
                </strong>{" "}
                scheduled for{" "}
                <strong className="text-[#1e1815]">
                  {new Date(appointment.scheduledStart).toLocaleDateString()}
                </strong>
                ? This action cannot be undone.
              </p>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label htmlFor="cancel-reason" className="text-[#4a3e39] font-semibold block mb-1.5">
                  Reason for Cancellation *
                </label>
                <textarea
                  id="cancel-reason"
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="e.g. Symptoms resolved, personal emergency, scheduling conflict..."
                  className="w-full p-3 rounded-xl border border-[#dcd3c6] bg-white text-[#1e1815] placeholder:text-[#a28c7a] focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ece6dd]">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onClose}>
                  Keep Appointment
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  className="rounded-full"
                  disabled={isSubmitting || reason.trim().length < 3}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
