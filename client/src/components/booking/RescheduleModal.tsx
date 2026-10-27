import { useState, useEffect } from "react"
import { X, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { api, type Appointment, type AvailabilitySlot } from "@/lib/api"

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onRescheduled: (updated: Appointment) => void
}

export function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  onRescheduled,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000)
    return tomorrow.toISOString().split("T")[0]
  })
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (appointment && newDate) {
      loadSlots()
    }
  }, [appointment, newDate])

  const loadSlots = async () => {
    if (!appointment) return
    setLoadingSlots(true)
    setSelectedSlot("")
    try {
      const res = await api.getAvailability(appointment.doctorId, newDate)
      setSlots(res.slots || [])
    } catch (err: any) {
      toast.error("Could not fetch slots", { description: err.message })
    } finally {
      setLoadingSlots(false)
    }
  }

  if (!isOpen || !appointment) return null

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) {
      toast.error("Please select a time slot")
      return
    }

    try {
      setIsSubmitting(true)
      const updated = await api.rescheduleAppointment(appointment.id, newDate, selectedSlot, reason)
      onRescheduled(updated)
      toast.success("Appointment rescheduled successfully!")
      onClose()
    } catch (err: any) {
      toast.error("Reschedule failed", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-600" />
            Reschedule Appointment
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Doctor</label>
            <p className="font-bold text-slate-900 dark:text-white">
              Dr. {appointment.doctor?.profile.firstName} {appointment.doctor?.profile.lastName} ({appointment.doctor?.specialty})
            </p>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Select New Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Available Slots on {newDate}</label>
            {loadingSlots ? (
              <div className="py-6 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-600" />
                <span className="text-[11px] mt-1 block">Checking doctor schedule...</span>
              </div>
            ) : slots.length === 0 ? (
              <p className="text-slate-400 italic py-2">No open slots on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      !slot.available
                        ? "border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed"
                        : selectedSlot === slot.time
                        ? "border-teal-500 bg-teal-600 text-white font-bold"
                        : "border-slate-200 dark:border-slate-800 hover:border-teal-500 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <span className="block text-xs font-bold">{slot.time}</span>
                    <span className="text-[9px] block text-slate-400">{slot.available ? "Open" : "Booked"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Reason for Rescheduling (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict with work"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Keep Current Time
            </Button>
            <Button 
              type="submit" 
              variant="teal" 
              size="sm" 
              disabled={isSubmitting || !selectedSlot}
            >
              {isSubmitting ? "Updating in Supabase..." : "Confirm New Slot"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
