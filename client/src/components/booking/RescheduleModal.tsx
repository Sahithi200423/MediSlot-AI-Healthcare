import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, RefreshCw, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { api, type Appointment, type AvailabilitySlot } from "@/lib/api"
import { modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onRescheduled: (updated: Appointment) => void
}

function getDateIso(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().split("T")[0]
}

export function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  onRescheduled,
}: RescheduleModalProps) {
  const [todayIso] = useState(() => getDateIso(0))
  const [newDate, setNewDate] = useState(() => getDateIso(1))
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [loadingSlots, setLoadingSlots] = useState(false)
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

  useEffect(() => {
    if (!isOpen || !appointment || !newDate) return
    let cancelled = false

    async function loadSlots() {
      setLoadingSlots(true)
      setSelectedSlot("")
      setErrorMessage(null)
      try {
        const res = await api.getAvailability(appointment!.doctorId, newDate)
        if (!cancelled) {
          setSlots(res.slots || [])
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err.message || "Could not load slots for the selected date"
          setErrorMessage(msg)
          setSlots([])
          toast.error("Could not fetch slots", { description: msg })
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }

    loadSlots()
    return () => {
      cancelled = true
    }
  }, [isOpen, appointment, newDate])

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    if (!selectedSlot) {
      toast.error("Please select a time slot")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const updated = await api.rescheduleAppointment(appointment.id, newDate, selectedSlot, reason)
      setReason("")
      onRescheduled(updated)
      toast.success("Appointment rescheduled successfully!")
      onClose()
    } catch (err: any) {
      const msg = err.message || "Unable to reschedule this appointment"
      setErrorMessage(msg)
      toast.error("Reschedule failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule Appointment"
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
            <div className="p-5 border-b border-[#ece6dd] bg-white/80 flex items-center justify-between gap-3">
              <h2 className="font-editorial-serif text-xl font-normal text-[#1e1815] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#cb6440]" />
                Reschedule Appointment
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close reschedule dialog"
                className="p-1.5 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ede5d9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#e8e2d8]">
                <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">
                  Attending Physician
                </span>
                <p className="font-bold text-[#1e1815] mt-0.5">
                  Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName}
                </p>
                <p className="text-[11px] text-[#cb6440] font-medium">{appointment.doctor?.specialty}</p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label htmlFor="reschedule-date" className="text-[#4a3e39] font-semibold block mb-1.5">
                  Select New Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  required
                  min={todayIso}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white font-semibold text-[#1e1815] focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none"
                />
              </div>

              <div>
                <span className="text-[#4a3e39] font-semibold block mb-1.5">
                  Available Slots on {newDate}
                </span>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2" aria-label="Loading available slots">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-[#ece6dd] bg-white space-y-1.5">
                        <Skeleton className="h-3.5 w-10 mx-auto" />
                        <Skeleton className="h-2.5 w-8 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-dashed border-[#dcd3c6] text-center text-[#8c7e77]">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-[#c5a880]" />
                    <span>No open slots on this date. Try another day.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          !slot.available
                            ? "border-[#ece6dd] bg-[#f5f1e9]/60 opacity-45 cursor-not-allowed text-[#8c7e77]"
                            : selectedSlot === slot.time
                            ? "border-[#cb6440] bg-[#cb6440] text-white font-bold shadow-xs cursor-pointer"
                            : "border-[#e8e2d8] bg-white hover:border-[#cb6440] text-[#1e1815] cursor-pointer"
                        }`}
                      >
                        <span className="block text-xs font-bold">{slot.time}</span>
                        <span
                          className={`text-[9px] block ${
                            selectedSlot === slot.time ? "text-white/85" : "text-[#8c7e77]"
                          }`}
                        >
                          {slot.available ? "Open" : "Booked"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reschedule-reason" className="text-[#4a3e39] font-semibold block mb-1.5">
                  Reason for Rescheduling (Optional)
                </label>
                <input
                  id="reschedule-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Schedule conflict with work"
                  className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white text-[#1e1815] placeholder:text-[#a28c7a] focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ece6dd]">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onClose}>
                  Keep Current Time
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="rounded-full"
                  disabled={isSubmitting || !selectedSlot}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Confirming..." : "Confirm New Slot"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
