import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Video,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { api, type Doctor, type Clinic, type AvailabilitySlot, type Appointment } from "@/lib/api"
import { formatINR } from "@/lib/currency"
import { EDITORIAL_EASE, modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedDoctor?: Doctor | null
  clinics: Clinic[]
  onBookingSuccess: (appointment: Appointment) => void
}

function formatOffsetDate(daysFromToday: number): string {
  const d = new Date(Date.now() + daysFromToday * 86400000)
  return d.toISOString().split("T")[0]
}

const STEP_LABELS = [
  "Provider & Location",
  "Select Date",
  "Select Time Slot",
  "Visit Type & Details",
  "Review & Payment",
]

const stepVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EDITORIAL_EASE } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.16, ease: EDITORIAL_EASE } },
}

export function BookingModal({
  isOpen,
  onClose,
  preselectedDoctor,
  clinics,
  onBookingSuccess,
}: BookingModalProps) {
  const [datePresets] = useState(() => [
    { label: "Today", value: formatOffsetDate(0) },
    { label: "Tomorrow", value: formatOffsetDate(1) },
    { label: "In 2 Days", value: formatOffsetDate(2) },
  ])
  const todayIso = datePresets[0].value

  const [step, setStep] = useState(1)
  const [manualDoctor, setManualDoctor] = useState<Doctor | null>(null)
  const [directoryDoctors, setDirectoryDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [fallbackClinics, setFallbackClinics] = useState<Clinic[]>([])
  const [manualClinicId, setManualClinicId] = useState<string>("")

  const [selectedDate, setSelectedDate] = useState<string>(() => formatOffsetDate(1))
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [visitType, setVisitType] = useState<"IN_CLINIC" | "VIDEO_VISIT">("IN_CLINIC")
  const [reasonForVisit, setReasonForVisit] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"PAY_AT_CLINIC" | "ONLINE_PENDING">("PAY_AT_CLINIC")

  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  const availableClinics = clinics.length > 0 ? clinics : fallbackClinics
  const selectedDoctor = manualDoctor ?? preselectedDoctor ?? directoryDoctors[0] ?? null
  const selectedClinicId =
    manualClinicId || selectedDoctor?.clinic?.id || availableClinics[0]?.id || ""

  const handleClose = useCallback(() => {
    setStep(1)
    setManualDoctor(null)
    setManualClinicId("")
    setSelectedSlot("")
    setReasonForVisit("")
    setSlotsError(null)
    setSubmitError(null)
    setConfirmedAppointment(null)
    onClose()
  }, [onClose])

  // Escape-key dismissal & body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleClose])

  // Load doctors / clinics on demand if modal opened without preselected doctor or clinics
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    async function loadMissingOptions() {
      const needsDoctors = !preselectedDoctor && directoryDoctors.length === 0
      const needsClinics = clinics.length === 0 && fallbackClinics.length === 0
      if (!needsDoctors && !needsClinics) return

      if (needsDoctors) setLoadingDoctors(true)
      try {
        const [docs, cls] = await Promise.all([
          needsDoctors ? api.getDoctors() : Promise.resolve(null),
          needsClinics ? api.getClinics() : Promise.resolve(null),
        ])
        if (cancelled) return
        if (docs) setDirectoryDoctors(docs)
        if (cls) setFallbackClinics(cls)
      } catch {
        // Keep existing state; user will see validation message if empty
      } finally {
        if (!cancelled && needsDoctors) setLoadingDoctors(false)
      }
    }
    loadMissingOptions()
    return () => {
      cancelled = true
    }
  }, [isOpen, preselectedDoctor, clinics.length, directoryDoctors.length, fallbackClinics.length])

  // Fetch live availability slots whenever doctor or date changes while open
  useEffect(() => {
    if (!isOpen || !selectedDoctor || !selectedDate) return
    let cancelled = false

    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedSlot("")
      setSlotsError(null)
      try {
        const res = await api.getAvailability(selectedDoctor!.id, selectedDate)
        if (!cancelled) {
          setSlots(res.slots || [])
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err.message || "Could not load doctor availability"
          setSlotsError(msg)
          setSlots([])
          toast.error("Failed to fetch slots", { description: msg })
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }

    fetchSlots()
    return () => {
      cancelled = true
    }
  }, [isOpen, selectedDoctor, selectedDate])

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
      setSubmitError(null)
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
      setStep(6)
      onBookingSuccess(appointment)
      toast.success("Appointment Confirmed!", {
        description: `Booking Reference: ${appointment.bookingReference}`,
      })
    } catch (err: any) {
      const msg = err.message || "Unable to reserve this slot. Please try another time."
      setSubmitError(msg)
      toast.error("Booking Error", { description: msg })
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

  const selectedClinic =
    availableClinics.find((c) => c.id === selectedClinicId) || selectedDoctor?.clinic

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Book Medical Consultation"
        >
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-[#1e1815]/55 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-2xl rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl overflow-hidden my-8 text-[#1e1815] max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#ece6dd] bg-white/80 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial-serif text-2xl font-normal text-[#1e1815] flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-[#cb6440]" />
                  {step === 6 ? "Booking Confirmed" : "Book Medical Consultation"}
                </h2>
                {step < 6 && (
                  <p className="text-xs text-[#6e6059] mt-0.5">
                    Step {step} of 5 • {STEP_LABELS[step - 1]}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close booking dialog"
                className="p-2 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ede5d9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            {step < 6 && (
              <div className="w-full bg-[#ede5d9] h-1.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[#cb6440] to-[#4a6356] h-full"
                  animate={{ width: `${(step / 5) * 100}%` }}
                  transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                />
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* STEP 1: Select Doctor & Clinic */}
                {step === 1 && (
                  <motion.div
                    key="booking-step-1"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#1e1815]">Review Doctor & Facility</h3>
                      <p className="text-xs text-[#6e6059]">
                        Confirm physician details and select your consultation clinic location.
                      </p>
                    </div>

                    {loadingDoctors ? (
                      <div className="p-4 rounded-2xl border border-[#e8e2d8] bg-white flex items-center gap-4">
                        <Skeleton rounded="xl" className="w-12 h-12 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    ) : !preselectedDoctor && directoryDoctors.length > 0 ? (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#4a3e39] block">
                          Select Physician
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {directoryDoctors.map((doc) => {
                            const isSelected = selectedDoctor?.id === doc.id
                            return (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => {
                                  setManualDoctor(doc)
                                  if (doc.clinic?.id) setManualClinicId(doc.clinic.id)
                                }}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected
                                    ? "border-[#cb6440] bg-[#fbf5f2] ring-1 ring-[#cb6440]/20"
                                    : "border-[#e8e2d8] bg-white hover:border-[#cb6440]/50"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-[#1e1815] truncate">
                                    Dr. {doc.profile.firstName} {doc.profile.lastName}
                                  </p>
                                  <p className="text-xs text-[#cb6440] font-medium truncate">
                                    {doc.specialty}
                                  </p>
                                </div>
                                <span className="font-bold text-xs text-[#1e1815] bg-[#f5f1e9] px-2.5 py-1 rounded-full shrink-0">
                                  {formatINR(doc.consultationFee)}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : selectedDoctor ? (
                      <div className="p-4 rounded-2xl border border-[#4a6356]/30 bg-white flex items-start gap-4 shadow-2xs">
                        <div className="w-12 h-12 rounded-xl bg-[#4a6356]/10 text-[#4a6356] flex items-center justify-center shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-[#1e1815]">
                              Dr. {selectedDoctor.profile.firstName} {selectedDoctor.profile.lastName}
                            </h4>
                            <Badge variant="teal">{selectedDoctor.specialty}</Badge>
                          </div>
                          <p className="text-xs text-[#6e6059] mt-1">
                            {selectedDoctor.qualifications || "Board Certified Specialist"} •{" "}
                            {selectedDoctor.yearsOfExperience} yrs exp
                          </p>
                          <p className="text-xs font-bold text-[#cb6440] mt-1.5">
                            Consultation Fee: {formatINR(selectedDoctor.consultationFee)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-[#dcd3c6] bg-white text-center text-xs text-[#6e6059]">
                        No physician selected yet. Please choose a doctor from the Find Doctors directory.
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="booking-clinic-select"
                        className="text-xs font-semibold text-[#4a3e39] block mb-1.5"
                      >
                        Select Healthcare Facility / Clinic
                      </label>
                      <select
                        id="booking-clinic-select"
                        value={selectedClinicId}
                        onChange={(e) => setManualClinicId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white text-xs font-medium text-[#1e1815] focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none"
                      >
                        {availableClinics.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city}, {c.state})
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Choose Appointment Date */}
                {step === 2 && (
                  <motion.div
                    key="booking-step-2"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#1e1815]">Choose Consultation Date</h3>
                      <p className="text-xs text-[#6e6059]">
                        Pick any available date on the physician's schedule.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {datePresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSelectedDate(preset.value)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            selectedDate === preset.value
                              ? "border-[#cb6440] bg-[#fbf5f2] text-[#cb6440] font-bold ring-1 ring-[#cb6440]/20"
                              : "border-[#e8e2d8] bg-white text-[#4a3e39] hover:border-[#cb6440]/50"
                          }`}
                        >
                          <span className="block text-xs font-semibold">{preset.label}</span>
                          <span className="text-[10px] text-[#8c7e77]">{preset.value}</span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label
                        htmlFor="booking-custom-date"
                        className="text-xs font-semibold text-[#4a3e39] block mb-1.5"
                      >
                        Or pick a custom date
                      </label>
                      <input
                        id="booking-custom-date"
                        type="date"
                        min={todayIso}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white text-xs font-medium text-[#1e1815] focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Select Available Slot */}
                {step === 3 && (
                  <motion.div
                    key="booking-step-3"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#1e1815]">Select Consultation Time</h3>
                        <p className="text-xs text-[#6e6059]">Live 30-minute slots for {selectedDate}</p>
                      </div>
                      <Badge variant="teal">30 min slots</Badge>
                    </div>

                    {loadingSlots ? (
                      <div className="space-y-2.5" aria-label="Loading available time slots">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-[#ece6dd] bg-white space-y-1.5"
                            >
                              <Skeleton className="h-3.5 w-12 mx-auto" />
                              <Skeleton className="h-2.5 w-8 mx-auto" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-center text-[#8c7e77]">
                          Checking live physician schedule...
                        </p>
                      </div>
                    ) : slotsError ? (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Unable to load availability</p>
                          <p className="mt-0.5 text-rose-600">{slotsError}</p>
                        </div>
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="py-8 px-4 text-center text-[#6e6059] bg-white border border-dashed border-[#dcd3c6] rounded-2xl">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-[#c5a880]" />
                        <p className="text-xs font-semibold text-[#1e1815]">
                          No open consultation slots on this date
                        </p>
                        <p className="text-[11px] text-[#8c7e77] mt-1">
                          Go back to select another date on the calendar.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`p-2.5 rounded-xl border text-center transition-all duration-150 ${
                              !slot.available
                                ? "border-[#ece6dd] bg-[#f5f1e9]/70 opacity-45 cursor-not-allowed text-[#8c7e77]"
                                : selectedSlot === slot.time
                                ? "border-[#cb6440] bg-[#cb6440] text-white shadow-sm font-bold cursor-pointer"
                                : "border-[#e8e2d8] hover:border-[#cb6440] bg-white text-[#1e1815] cursor-pointer"
                            }`}
                          >
                            <span className="block text-xs font-bold">{slot.time}</span>
                            <span
                              className={`text-[10px] block mt-0.5 ${
                                selectedSlot === slot.time ? "text-white/85" : "text-[#8c7e77]"
                              }`}
                            >
                              {slot.available ? "Open" : slot.reason || "Booked"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 4: Visit Type & Consultation Details */}
                {step === 4 && (
                  <motion.div
                    key="booking-step-4"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#1e1815]">Visit Type & Reason</h3>
                      <p className="text-xs text-[#6e6059]">
                        Share context for your clinician to review prior to the consultation.
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[#4a3e39] block mb-2">
                        Consultation Format
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setVisitType("IN_CLINIC")}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                            visitType === "IN_CLINIC"
                              ? "border-[#4a6356] bg-[#f4f7f5] text-[#1e1815] ring-1 ring-[#4a6356]/20"
                              : "border-[#e8e2d8] bg-white text-[#6e6059] hover:border-[#4a6356]/40"
                          }`}
                        >
                          <Building2 className="w-5 h-5 text-[#4a6356] shrink-0" />
                          <div className="text-left text-xs">
                            <span className="block font-semibold text-[#1e1815]">In-Clinic Visit</span>
                            <span className="text-[10px] text-[#6e6059]">At healthcare facility</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVisitType("VIDEO_VISIT")}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                            visitType === "VIDEO_VISIT"
                              ? "border-[#cb6440] bg-[#fbf5f2] text-[#1e1815] ring-1 ring-[#cb6440]/20"
                              : "border-[#e8e2d8] bg-white text-[#6e6059] hover:border-[#cb6440]/40"
                          }`}
                        >
                          <Video className="w-5 h-5 text-[#cb6440] shrink-0" />
                          <div className="text-left text-xs">
                            <span className="block font-semibold text-[#1e1815]">Telehealth Video</span>
                            <span className="text-[10px] text-[#6e6059]">Join via secure room</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-reason"
                        className="text-xs font-semibold text-[#4a3e39] block mb-1.5"
                      >
                        Reason for Consultation / Symptoms *
                      </label>
                      <textarea
                        id="booking-reason"
                        required
                        rows={3}
                        value={reasonForVisit}
                        onChange={(e) => setReasonForVisit(e.target.value)}
                        placeholder="e.g. Experiencing mild shortness of breath during exertion for past 2 weeks..."
                        className="w-full p-3 rounded-xl border border-[#dcd3c6] bg-white text-xs font-medium text-[#1e1815] placeholder:text-[#a28c7a] focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Review & Confirm */}
                {step === 5 && (
                  <motion.div
                    key="booking-step-5"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#1e1815]">Review & Confirm Booking</h3>
                      <p className="text-xs text-[#6e6059]">
                        Verify your appointment summary and choose your payment preference.
                      </p>
                    </div>

                    {submitError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] space-y-2.5 text-xs">
                      <div className="flex justify-between gap-3 pb-2 border-b border-[#f2ede4]">
                        <span className="text-[#8c7e77]">Doctor</span>
                        <span className="font-bold text-[#1e1815] text-right">
                          Dr. {selectedDoctor?.profile.firstName} {selectedDoctor?.profile.lastName} (
                          {selectedDoctor?.specialty})
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 pb-2 border-b border-[#f2ede4]">
                        <span className="text-[#8c7e77]">Facility</span>
                        <span className="font-semibold text-[#1e1815] text-right">
                          {selectedClinic?.name}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 pb-2 border-b border-[#f2ede4]">
                        <span className="text-[#8c7e77]">Date & Time</span>
                        <span className="font-bold text-[#4a6356] text-right">
                          {selectedDate} at {selectedSlot} (
                          {visitType === "VIDEO_VISIT" ? "Telehealth" : "In-Clinic"})
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-sm font-bold">
                        <span>Consultation Fee</span>
                        <span className="text-[#cb6440]">
                          {formatINR(selectedDoctor?.consultationFee)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[#4a3e39] block mb-2">
                        Payment Method
                      </span>
                      <div className="space-y-2 text-xs">
                        <label
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            paymentMethod === "PAY_AT_CLINIC"
                              ? "border-[#4a6356] bg-[#f4f7f5]"
                              : "border-[#e8e2d8] bg-white hover:border-[#c5a880]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PAY_AT_CLINIC"
                            checked={paymentMethod === "PAY_AT_CLINIC"}
                            onChange={() => setPaymentMethod("PAY_AT_CLINIC")}
                            className="accent-[#4a6356]"
                          />
                          <div>
                            <span className="font-bold text-[#1e1815] block">
                              Pay at Clinic Reception (Instant Confirmation)
                            </span>
                            <span className="text-[11px] text-[#6e6059]">
                              Zero upfront charge. Pay via UPI, Card, Cash, or Insurance upon arrival.
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            paymentMethod === "ONLINE_PENDING"
                              ? "border-[#cb6440] bg-[#fbf5f2]"
                              : "border-[#e8e2d8] bg-white hover:border-[#c5a880]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="ONLINE_PENDING"
                            checked={paymentMethod === "ONLINE_PENDING"}
                            onChange={() => setPaymentMethod("ONLINE_PENDING")}
                            className="accent-[#cb6440]"
                          />
                          <div>
                            <span className="font-bold text-[#1e1815] block">
                              Online Payment (UPI / Card / NetBanking)
                            </span>
                            <span className="text-[11px] text-[#6e6059]">
                              Payment recorded as pending until online checkout confirmation.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: Confirmation Screen */}
                {step === 6 && confirmedAppointment && (
                  <motion.div
                    key="booking-step-6"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                    className="text-center py-4 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#4a6356]/12 text-[#4a6356] flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div>
                      <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                        Consultation Booked Successfully
                      </h3>
                      <p className="text-xs text-[#6e6059] mt-1">
                        Your appointment has been securely confirmed with your care provider.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] max-w-sm mx-auto space-y-2.5 text-xs">
                      <span className="text-[10px] text-[#8c7e77] uppercase tracking-wider font-semibold block">
                        Unique Booking Reference
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <code className="px-3 py-1.5 bg-[#fbf9f5] rounded-lg text-sm font-mono font-bold text-[#cb6440] border border-[#e8e2d8] select-all">
                          {confirmedAppointment.bookingReference}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 py-1"
                          onClick={() => copyReference(confirmedAppointment.bookingReference)}
                        >
                          {copiedRef ? (
                            <Check className="w-3.5 h-3.5 text-[#4a6356]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </Button>
                      </div>

                      <div className="pt-2.5 border-t border-[#f2ede4] text-left space-y-1.5 text-[#4a3e39]">
                        <p>
                          <strong>Doctor:</strong> Dr. {confirmedAppointment.doctor?.profile.firstName}{" "}
                          {confirmedAppointment.doctor?.profile.lastName}
                        </p>
                        <p>
                          <strong>Scheduled:</strong>{" "}
                          {new Date(confirmedAppointment.scheduledStart).toLocaleDateString()} at{" "}
                          {new Date(confirmedAppointment.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>
                          <strong>Consultation Fee:</strong>{" "}
                          <span className="font-bold text-[#1e1815]">
                            {formatINR(confirmedAppointment.consultationFee)}
                          </span>
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className="text-[#4a6356] font-semibold">
                            {confirmedAppointment.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full max-w-xs mx-auto rounded-full"
                      onClick={handleClose}
                    >
                      Done • View My Appointments
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stepper Navigation Buttons (Steps 1 to 5) */}
              {step < 6 && (
                <div className="flex items-center justify-between pt-5 mt-6 border-t border-[#ece6dd]">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs rounded-full"
                      onClick={() => {
                        setSubmitError(null)
                        setStep(step - 1)
                      }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 5 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="gap-1.5 text-xs rounded-full px-5"
                      disabled={
                        (step === 1 && (!selectedDoctor || !selectedClinicId)) ||
                        (step === 2 && !selectedDate) ||
                        (step === 3 && !selectedSlot) ||
                        (step === 4 && !reasonForVisit.trim())
                      }
                      onClick={() => setStep(step + 1)}
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting}
                      className="gap-1.5 text-xs font-semibold rounded-full px-5"
                      onClick={handleConfirmBooking}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Securing Consultation Slot...
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
