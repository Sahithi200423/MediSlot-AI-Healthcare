import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { api, type Appointment } from "@/lib/api"

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !appointment) return null

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 3) {
      toast.error("Please provide a valid cancellation reason")
      return
    }

    try {
      setIsSubmitting(true)
      const cancelled = await api.cancelAppointment(appointment.id, reason)
      onCancelled(cancelled)
      toast.success("Appointment has been cancelled")
      onClose()
    } catch (err: any) {
      toast.error("Cancellation failed", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between">
          <h2 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Cancel Appointment
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancel} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to cancel your consultation with{" "}
            <strong className="text-slate-900 dark:text-white">
              Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName}
            </strong>{" "}
            scheduled for{" "}
            <strong className="text-slate-900 dark:text-white">
              {new Date(appointment.scheduledStart).toLocaleDateString()}
            </strong>
            ? This action cannot be undone.
          </p>

          <div>
            <label className="text-slate-400 block mb-1">
              Reason for Cancellation *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Symptoms resolved, personal emergency, scheduling conflict..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Keep Appointment
            </Button>
            <Button 
              type="submit" 
              variant="danger" 
              size="sm" 
              disabled={isSubmitting || reason.trim().length < 3}
            >
              {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
