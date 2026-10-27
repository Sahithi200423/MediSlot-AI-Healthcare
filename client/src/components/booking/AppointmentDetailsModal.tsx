import { X, Calendar, Stethoscope, Building2, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { type Appointment } from "@/lib/api"

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onOpenReschedule: (appointment: Appointment) => void
  onOpenCancel: (appointment: Appointment) => void
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onOpenReschedule,
  onOpenCancel,
}: AppointmentDetailsModalProps) {
  if (!isOpen || !appointment) return null

  const isCancellable = appointment.status === "PENDING" || appointment.status === "CONFIRMED"
  const start = new Date(appointment.scheduledStart)
  const end = new Date(appointment.scheduledEnd)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 block font-semibold">
              {appointment.bookingReference}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Appointment Summary & Chart
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Status Badge & Visit Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={
                appointment.status === "CONFIRMED" ? "teal" :
                appointment.status === "COMPLETED" ? "success" :
                appointment.status === "IN_PROGRESS" ? "info" :
                appointment.status === "CANCELLED" ? "danger" : "neutral"
              }>
                {appointment.status}
              </Badge>
              <Badge variant="neutral">
                {appointment.visitType === "VIDEO_VISIT" ? "Telehealth Video" : "In-Clinic"}
              </Badge>
            </div>
            <span className="text-slate-400">
              Fee: ${Number(appointment.consultationFee).toFixed(2)}
            </span>
          </div>

          {/* Scheduled Date & Time */}
          <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-500/30 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[11px] text-slate-500">
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
              Attending Physician
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName}
                </p>
                <p className="text-[11px] text-slate-500">{appointment.doctor?.specialty}</p>
              </div>
              <Stethoscope className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          {/* Clinic Location */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
              Healthcare Facility
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{appointment.clinic?.name}</p>
                <p className="text-[11px] text-slate-500">{appointment.clinic?.address}, {appointment.clinic?.city}, {appointment.clinic?.state}</p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">{appointment.clinic?.phone}</p>
              </div>
            </div>
          </div>

          {/* Reason for Visit */}
          {appointment.reasonForVisit && (
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
                Clinical Reason & Symptoms
              </span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {appointment.reasonForVisit}
              </p>
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {appointment.status === "CANCELLED" && appointment.cancellationReason && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs">
              <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
            </div>
          )}

          {/* Actions */}
          {isCancellable && (
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  onClose()
                  onOpenReschedule(appointment)
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reschedule
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  onClose()
                  onOpenCancel(appointment)
                }}
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Appointment
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
