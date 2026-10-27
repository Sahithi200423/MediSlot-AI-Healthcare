import { useState, useEffect } from "react"
import { 
  X, Calendar, Clock, Stethoscope, Building2, 
  CheckCircle2, ArrowRight, ArrowLeft, Video, 
  Loader2,
  Copy, Check
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { api, type Doctor, type Clinic, type AvailabilitySlot, type Appointment } from "@/lib/api"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedDoctor?: Doctor | null
  clinics: Clinic[]
  onBookingSuccess: (appointment: Appointment) => void
}

export function BookingModal({
  isOpen,
  onClose,
  preselectedDoctor,
  clinics,
  onBookingSuccess,
}: BookingModalProps) {
  const [step, setStep] = useState(1) // Steps 1 to 5, and 6 for Confirmation
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preselectedDoctor || null)
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to tomorrow
    const tomorrow = new Date(Date.now() + 86400000)
    return tomorrow.toISOString().split("T")[0]
  })
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [visitType, setVisitType] = useState<"IN_CLINIC" | "VIDEO_VISIT">("IN_CLINIC")
  const [reasonForVisit, setReasonForVisit] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"PAY_AT_CLINIC" | "ONLINE_PENDING">("PAY_AT_CLINIC")

  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  // Sync preselected doctor
  useEffect(() => {
    if (preselectedDoctor) {
      setSelectedDoctor(preselectedDoctor)
      if (preselectedDoctor.clinic?.id) {
        setSelectedClinicId(preselectedDoctor.clinic.id)
      } else if (clinics.length > 0) {
        setSelectedClinicId(clinics[0].id)
      }
    }
  }, [preselectedDoctor, clinics])

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots()
    }
  }, [selectedDoctor, selectedDate])

  const loadSlots = async () => {
    if (!selectedDoctor) return
    setLoadingSlots(true)
    setSelectedSlot("")
    try {
      const res = await api.getAvailability(selectedDoctor.id, selectedDate)
      setSlots(res.slots || [])
    } catch (err: any) {
      toast.error("Failed to fetch slots", { description: err.message })
    } finally {
      setLoadingSlots(false)
    }
  }

  if (!isOpen) return null

  // Handle final submission
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedClinicId || !selectedDate || !selectedSlot) {
      toast.error("Please complete all booking steps")
      return
    }

    if (!reasonForVisit.trim()) {
      toast.error("Please provide a brief reason for your consultation")
      return
    }

    try {
      setIsSubmitting(true)
      const appointment = await api.bookAppointment({
        doctorId: selectedDoctor.id,
        clinicId: selectedClinicId,
        date: selectedDate,
        time: selectedSlot,
        visitType,
        reasonForVisit,
        paymentMethod,
      })

      setConfirmedAppointment(appointment)
      setStep(6) // Move to confirmation screen
      onBookingSuccess(appointment)
      toast.success("Appointment Confirmed!", {
        description: `Booking Reference: ${appointment.bookingReference}`,
      })
    } catch (err: any) {
      toast.error("Booking Error", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedRef(true)
    toast.success("Booking reference copied!")
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) || selectedDoctor?.clinic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-8">
        {/* Header with Step Progress */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              {step === 6 ? "Booking Confirmed" : "Book Medical Consultation"}
            </h2>
            {step < 6 && (
              <p className="text-xs text-slate-500 mt-0.5">
                Step {step} of 5 • {
                  step === 1 ? "Provider & Location" :
                  step === 2 ? "Select Date" :
                  step === 3 ? "Select Time Slot" :
                  step === 4 ? "Visit Type & Details" : "Review & Payment"
                }
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar (Only during steps 1-5) */}
        {step < 6 && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-1.5 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {/* STEP 1: Select Doctor & Clinic */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Review Doctor & Facility</h3>
                <p className="text-xs text-slate-500">Confirm physician details and select consultation clinic location.</p>
              </div>

              {selectedDoctor && (
                <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/20 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0 font-bold text-base">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Dr. {selectedDoctor.profile.firstName} {selectedDoctor.profile.lastName}
                      </h4>
                      <Badge variant="teal">{selectedDoctor.specialty}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedDoctor.qualifications || "Board Certified Specialist"} • {selectedDoctor.yearsOfExperience} yrs exp
                    </p>
                    <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-1">
                      Consultation Fee: ${Number(selectedDoctor.consultationFee).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Healthcare Facility / Clinic
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}, {c.state})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Appointment Date */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Choose Consultation Date</h3>
                <p className="text-xs text-slate-500">Pick any available date on the doctor's calendar.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Today", days: 0 },
                  { label: "Tomorrow", days: 1 },
                  { label: "In 2 Days", days: 2 },
                ].map((preset) => {
                  const d = new Date(Date.now() + preset.days * 86400000).toISOString().split("T")[0]
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedDate === d
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-xs font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-slate-400">{d}</span>
                    </button>
                  )
                })}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Or pick a custom date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Select Available Slot */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Select Consultation Time</h3>
                  <p className="text-xs text-slate-500">
                    Live 30-minute slots for {selectedDate}
                  </p>
                </div>
                <Badge variant="teal">30 min slots</Badge>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                  <p className="text-xs">Calculating live physician availability...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No working shifts scheduled for this date</p>
                  <p className="text-[11px] text-slate-400 mt-1">Please select another date on the calendar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        !slot.available
                          ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 opacity-50 cursor-not-allowed"
                          : selectedSlot === slot.time
                          ? "border-teal-500 bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold"
                          : "border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span className="block text-xs font-bold">{slot.time}</span>
                      <span className={`text-[10px] block mt-0.5 ${selectedSlot === slot.time ? "text-teal-100" : "text-slate-400"}`}>
                        {slot.available ? "Open" : slot.reason || "Booked"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Visit Type & Consultation Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Visit Type & Reason</h3>
                <p className="text-xs text-slate-500">Provide reason for the clinician to review before consultation.</p>
              </div>

              {/* Visit Type Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Consultation Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisitType("IN_CLINIC")}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      visitType === "IN_CLINIC"
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <div className="text-left text-xs">
                      <span className="block font-semibold">In-Clinic Visit</span>
                      <span className="text-[10px] text-slate-400">At healthcare facility</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType("VIDEO_VISIT")}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      visitType === "VIDEO_VISIT"
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Video className="w-5 h-5 text-teal-600" />
                    <div className="text-left text-xs">
                      <span className="block font-semibold">Telehealth Video</span>
                      <span className="text-[10px] text-slate-400">Join via secure room</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Reason for Consultation / Symptoms *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g. Experiencing mild shortness of breath during exertion for past 2 weeks..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Review & Confirm Booking</h3>
                <p className="text-xs text-slate-500">Verify your appointment summary and choose payment mode.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Dr. {selectedDoctor?.profile.firstName} {selectedDoctor?.profile.lastName} ({selectedDoctor?.specialty})
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Facility</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedClinic?.name}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {selectedDate} at {selectedSlot} ({visitType === "VIDEO_VISIT" ? "Telehealth" : "In-Clinic"})
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span>Consultation Fee</span>
                  <span className="text-slate-900 dark:text-white">
                    ${Number(selectedDoctor?.consultationFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Payment Method
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAY_AT_CLINIC"
                      checked={paymentMethod === "PAY_AT_CLINIC"}
                      onChange={() => setPaymentMethod("PAY_AT_CLINIC")}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Pay at Clinic Reception (Instant Confirmation)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Zero upfront charge. Pay via Cash, Card, or Insurance upon arrival.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE_PENDING"
                      checked={paymentMethod === "ONLINE_PENDING"}
                      onChange={() => setPaymentMethod("ONLINE_PENDING")}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Online Payment (Razorpay Ready)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Card, UPI, NetBanking. (Payment status recorded as PENDING until Phase Five).
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation Screen */}
          {step === 6 && confirmedAppointment && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Consultation Booked Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your appointment is confirmed and recorded in Supabase PostgreSQL.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-500/30 max-w-sm mx-auto space-y-2 text-xs">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Unique Booking Reference
                </span>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-sm font-mono font-bold text-teal-700 dark:text-teal-300 border border-teal-500/20 select-all">
                    {confirmedAppointment.bookingReference}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs gap-1 py-1"
                    onClick={() => copyReference(confirmedAppointment.bookingReference)}
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                </div>

                <div className="pt-2 text-left space-y-1 text-slate-600 dark:text-slate-300">
                  <p><strong>Doctor:</strong> Dr. {confirmedAppointment.doctor?.profile.firstName} {confirmedAppointment.doctor?.profile.lastName}</p>
                  <p><strong>Scheduled:</strong> {new Date(confirmedAppointment.scheduledStart).toLocaleDateString()} at {new Date(confirmedAppointment.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Status:</strong> <span className="text-emerald-600 font-semibold">{confirmedAppointment.status}</span></p>
                </div>
              </div>

              <Button 
                variant="teal" 
                size="sm" 
                className="w-full max-w-xs mx-auto"
                onClick={onClose}
              >
                Done • View My Appointments
              </Button>
            </div>
          )}

          {/* Stepper Navigation Buttons (Steps 1 to 5) */}
          {step < 6 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              {step < 5 ? (
                <Button
                  type="button"
                  variant="teal"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={
                    (step === 1 && (!selectedDoctor || !selectedClinicId)) ||
                    (step === 2 && !selectedDate) ||
                    (step === 3 && !selectedSlot) ||
                    (step === 4 && !reasonForVisit.trim())
                  }
                  onClick={() => setStep(step + 1)}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="teal"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs font-bold shadow-md shadow-teal-600/30"
                  onClick={handleConfirmBooking}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reserving Slot in Supabase...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Secure Appointment
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
