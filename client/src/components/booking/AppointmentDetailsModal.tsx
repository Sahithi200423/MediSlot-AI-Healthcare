import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Calendar, Stethoscope, Building2, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { type Appointment } from "@/lib/api"
import { formatINR } from "@/lib/currency"
import { modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

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

  const isCancellable =
    appointment?.status === "PENDING" || appointment?.status === "CONFIRMED"
  const start = appointment ? new Date(appointment.scheduledStart) : null
  const end = appointment ? new Date(appointment.scheduledEnd) : null

  return (
    <AnimatePresence>
      {isOpen && appointment && start && end && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Appointment Summary"
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
            className="relative z-10 w-full max-w-lg rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl overflow-hidden text-[#1e1815] max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#ece6dd] bg-white/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-[#cb6440] block font-semibold">
                  {appointment.bookingReference}
                </span>
                <h2 className="font-editorial-serif text-xl font-normal text-[#1e1815]">
                  Appointment Summary & Chart
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close appointment details"
                className="p-1.5 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ede5d9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Status Badge & Fee */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      appointment.status === "CONFIRMED"
                        ? "teal"
                        : appointment.status === "COMPLETED"
                        ? "success"
                        : appointment.status === "IN_PROGRESS"
                        ? "info"
                        : appointment.status === "CANCELLED"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {appointment.status}
                  </Badge>
                  <Badge variant="neutral">
                    {appointment.visitType === "VIDEO_VISIT" ? "Telehealth Video" : "In-Clinic"}
                  </Badge>
                </div>
                <span className="font-bold text-[#1e1815] bg-white border border-[#e8e2d8] px-3 py-1 rounded-full">
                  Fee: {formatINR(appointment.consultationFee)}
                </span>
              </div>

              {/* Scheduled Date & Time */}
              <div className="p-3.5 rounded-2xl bg-[#4a6356]/8 border border-[#4a6356]/25 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#4a6356] shrink-0" />
                <div>
                  <span className="font-bold text-[#1e1815] block">
                    {start.toLocaleDateString("en-IN", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[11px] text-[#6e6059]">
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="space-y-1.5">
                <span className="text-[#8c7e77] font-semibold block text-[10px] uppercase tracking-wider">
                  Attending Physician
                </span>
                <div className="p-3.5 rounded-2xl bg-white border border-[#e8e2d8] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1e1815]">
                      Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName}
                    </p>
                    <p className="text-[11px] text-[#cb6440] font-medium">
                      {appointment.doctor?.specialty}
                    </p>
                  </div>
                  <Stethoscope className="w-5 h-5 text-[#4a6356]" />
                </div>
              </div>

              {/* Clinic Location */}
              <div className="space-y-1.5">
                <span className="text-[#8c7e77] font-semibold block text-[10px] uppercase tracking-wider">
                  Healthcare Facility
                </span>
                <div className="p-3.5 rounded-2xl bg-white border border-[#e8e2d8] flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#cb6440] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#1e1815]">{appointment.clinic?.name}</p>
                    <p className="text-[11px] text-[#6e6059]">
                      {appointment.clinic?.address}, {appointment.clinic?.city},{" "}
                      {appointment.clinic?.state}
                    </p>
                    {appointment.clinic?.phone && (
                      <p className="text-[11px] text-[#4a6356] font-semibold mt-0.5">
                        {appointment.clinic.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason for Visit */}
              {appointment.reasonForVisit && (
                <div className="space-y-1.5">
                  <span className="text-[#8c7e77] font-semibold block text-[10px] uppercase tracking-wider">
                    Clinical Reason & Symptoms
                  </span>
                  <p className="p-3.5 rounded-2xl bg-white border border-[#e8e2d8] text-[#4a3e39] leading-relaxed">
                    {appointment.reasonForVisit}
                  </p>
                </div>
              )}

              {/* Cancellation reason if cancelled */}
              {appointment.status === "CANCELLED" && appointment.cancellationReason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
                </div>
              )}

              {/* Actions */}
              {isCancellable && (
                <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-[#ece6dd]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs rounded-full"
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
                    className="flex-1 gap-1.5 text-xs rounded-full"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
