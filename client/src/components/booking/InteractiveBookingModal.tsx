import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Video,
  Building2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { formatINR } from "@/lib/currency"
import { EDITORIAL_EASE, modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

export interface BookingPreviewDoctor {
  id: string
  name: string
  specialty: string
  clinic: string
  fee: number | string
  avatar?: string | null
  initials?: string
  isVerified?: boolean
  isLive?: boolean
}

const SAMPLE_DOCTORS: BookingPreviewDoctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Jenkins, MD",
    specialty: "Cardiology",
    clinic: "Metropolitan Heart & Vascular Pavilion",
    fee: 499,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    initials: "SJ",
    isVerified: true,
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, DO",
    specialty: "Neurology & Spine Care",
    clinic: "Apex Brain & Spine Medical Center",
    fee: 499,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    initials: "MV",
    isVerified: true,
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel, MBBS",
    specialty: "Clinical Dermatology",
    clinic: "Lumina Academic Health Center",
    fee: 299,
    avatar: "https://images.unsplash.com/photo-1594824813511-2090432c74d8?auto=format&fit=crop&q=80&w=200",
    initials: "PP",
    isVerified: true,
  },
  {
    id: "doc-4",
    name: "Dr. Aarav Mehta, MBBS",
    specialty: "General Physician",
    clinic: "MediSlot Primary Care Pavilion",
    fee: 199,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    initials: "AM",
    isVerified: true,
  },
  {
    id: "doc-5",
    name: "Dr. Ananya Rao, MD",
    specialty: "Pediatrics",
    clinic: "Lumina Child & Family Clinic",
    fee: 249,
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200",
    initials: "AR",
    isVerified: true,
  },
  {
    id: "doc-6",
    name: "Dr. Kavita Nair, MS",
    specialty: "Gynecology & Obstetrics",
    clinic: "Lotus Women's Health Pavilion",
    fee: 349,
    avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200",
    initials: "KN",
    isVerified: true,
  },
  {
    id: "doc-7",
    name: "Dr. Rohan Kapoor, MS",
    specialty: "Orthopedic Specialist",
    clinic: "Apex Joint & Spine Center",
    fee: 399,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    initials: "RK",
    isVerified: true,
  },
]

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:30 AM",
  "11:15 AM",
  "02:00 PM",
  "02:45 PM",
  "03:30 PM",
  "04:15 PM",
]

function buildUpcomingDates(): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getTime() + i * 86400000)
    const shortDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    if (i === 0) labels.push(`Today (${shortDate})`)
    else if (i === 1) labels.push(`Tomorrow (${shortDate})`)
    else {
      const weekday = d.toLocaleDateString("en-IN", { weekday: "short" })
      labels.push(`${weekday} (${shortDate})`)
    }
  }
  return labels
}

export function InteractiveBookingModal({
  isOpen,
  onClose,
  initialDoctorId,
  doctors,
}: {
  isOpen: boolean
  onClose: () => void
  initialDoctorId?: string
  doctors?: BookingPreviewDoctor[]
}) {
  const doctorOptions = doctors && doctors.length > 0 ? doctors : SAMPLE_DOCTORS
  const [dateOptions] = useState<string[]>(() => buildUpcomingDates())

  const [step, setStep] = useState(1)
  const [manualDoctorId, setManualDoctorId] = useState<string | null>(null)
  const selectedDoctor: BookingPreviewDoctor =
    doctorOptions.find((d) => d.id === (manualDoctorId ?? initialDoctorId)) || doctorOptions[0]

  const [selectedDate, setSelectedDate] = useState(() => dateOptions[1] || "Tomorrow")
  const [selectedTime, setSelectedTime] = useState("10:30 AM")
  const [consultType, setConsultType] = useState<"in-clinic" | "video">("in-clinic")
  const [patientName, setPatientName] = useState("Alex Turner")
  const [symptoms, setSymptoms] = useState("Follow-up consultation and lab review")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [bookingRef, setBookingRef] = useState("")

  const resetAndClose = () => {
    setStep(1)
    setManualDoctorId(null)
    setValidationError(null)
    setIsCompleted(false)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStep(1)
        setManualDoctorId(null)
        setValidationError(null)
        setIsCompleted(false)
        onClose()
      }
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleNext = () => {
    setValidationError(null)
    if (step === 4) {
      if (!patientName.trim()) {
        setValidationError("Please enter the patient's full name to continue.")
        return
      }
      if (!symptoms.trim()) {
        setValidationError("Please share a brief reason for your consultation.")
        return
      }
    }
    if (step < 5) setStep(step + 1)
  }

  const handlePrev = () => {
    setValidationError(null)
    if (step > 1) setStep(step - 1)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 650))
    const generatedRef = `#SLOT-${Math.floor(100000 + Math.random() * 900000)}`
    setBookingRef(generatedRef)
    setIsSubmitting(false)
    setIsCompleted(true)
    toast.success("Demonstration appointment reserved successfully", {
      description: `Reference ${generatedRef} · ${formatINR(selectedDoctor.fee)}`,
    })
  }

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EDITORIAL_EASE } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.16, ease: EDITORIAL_EASE } },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-label="Schedule Clinical Consultation"
        >
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={resetAndClose}
            className="fixed inset-0 bg-[#1e1815]/55 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-[#1e1815] max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#ece6dd]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4a6356] animate-pulse shrink-0" />
                  <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                    Schedule Clinical Consultation
                  </h3>
                </div>
                <p className="text-xs text-[#6e6059] mt-0.5 font-medium">
                  {selectedDoctor.isLive
                    ? "Interactive booking preview · Connected to live clinician directory"
                    : "Interactive booking preview · Sign in to complete live reservation"}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="p-2 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ece6dd] transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Indicators */}
            {!isCompleted && (
              <div className="py-4">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-[#8c7e77] uppercase tracking-wider">
                  <span className={step >= 1 ? "text-[#cb6440] font-bold" : ""}>1. Physician</span>
                  <span className={step >= 2 ? "text-[#cb6440] font-bold" : ""}>2. Date</span>
                  <span className={step >= 3 ? "text-[#cb6440] font-bold" : ""}>3. Slot</span>
                  <span className={step >= 4 ? "text-[#cb6440] font-bold" : ""}>4. Details</span>
                  <span className={step >= 5 ? "text-[#cb6440] font-bold" : ""}>5. Confirm</span>
                </div>
                <div className="mt-2 w-full bg-[#ede5d9] h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-[#cb6440] h-full rounded-full"
                    animate={{ width: `${(step / 5) * 100}%` }}
                    transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                  />
                </div>
              </div>
            )}

            {/* Modal Body with Animated Step Switcher */}
            <div className="py-2 min-h-[290px]">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.32, ease: EDITORIAL_EASE }}
                  className="text-center py-5 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-[#4a6356]/12 text-[#4a6356] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                      Consultation Preview Confirmed
                    </h4>
                    <p className="text-xs text-[#6e6059] max-w-sm mx-auto leading-relaxed mt-1.5">
                      Your demonstration consultation with{" "}
                      <strong className="text-[#1e1815]">{selectedDoctor.name}</strong> is scheduled for{" "}
                      <strong className="text-[#1e1815]">{selectedDate}</strong> at{" "}
                      <strong className="text-[#1e1815]">{selectedTime}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] text-xs text-[#6e6059] space-y-1.5 max-w-sm mx-auto">
                    <div className="flex items-center justify-between">
                      <span>Booking Reference</span>
                      <span className="font-mono font-bold text-[#cb6440]">{bookingRef}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consultation Fee</span>
                      <span className="font-bold text-[#1e1815]">{formatINR(selectedDoctor.fee)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delivery Mode</span>
                      <span className="font-medium text-[#4a6356] capitalize">
                        {consultType === "video" ? "Telehealth Video" : "In-Clinic Visit"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Link
                      to="/login"
                      onClick={resetAndClose}
                      className="flex-1 rounded-full border border-[#dcd3c6] bg-white hover:bg-[#f5f1e9] text-[#1e1815] py-2.5 px-4 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      Sign In for Live Booking
                    </Link>
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="flex-1 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Done & Return
                    </button>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* Step 1: Doctor Selection */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#1e1815]">
                          Select a Practicing Physician:
                        </p>
                        <span className="text-[10px] text-[#8c7e77] font-medium">
                          {doctorOptions.length} specialists
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                        {doctorOptions.map((doc) => {
                          const initials =
                            doc.initials ||
                            doc.name
                              .replace(/^Dr\.\s*/i, "")
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()
                          const isSelected = selectedDoctor.id === doc.id

                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setManualDoctorId(doc.id)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "border-[#cb6440] bg-[#fbf5f2] shadow-xs ring-1 ring-[#cb6440]/20"
                                  : "border-[#e8e2d8] bg-white hover:border-[#cb6440]/50"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {doc.avatar ? (
                                  <img
                                    src={doc.avatar}
                                    alt={doc.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-[#ede5d9] shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[#4a6356]/10 border border-[#4a6356]/20 text-[#4a6356] flex items-center justify-center font-editorial-serif text-lg shrink-0">
                                    {initials}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-bold text-[#1e1815] truncate">{doc.name}</h4>
                                    {doc.isVerified && (
                                      <ShieldCheck className="w-3.5 h-3.5 text-[#4a6356] shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-[#cb6440] font-medium truncate">{doc.specialty}</p>
                                  <p className="text-[11px] text-[#6e6059] truncate">{doc.clinic}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <span className="text-sm font-bold text-[#1e1815]">{formatINR(doc.fee)}</span>
                                <span className="block text-[10px] text-[#8c7e77]">Consultation fee</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-[#8c7e77]">
                        Transparent INR consultation pricing · Follow-up consultations from {formatINR(99)}–{formatINR(199)}
                      </p>
                    </motion.div>
                  )}

                  {/* Step 2: Date Selection */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-4"
                    >
                      <p className="text-xs font-semibold text-[#1e1815]">
                        Choose Appointment Date for {selectedDoctor.name}:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {dateOptions.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={`p-3 rounded-2xl border text-xs font-semibold text-center transition-all duration-200 cursor-pointer ${
                              selectedDate === d
                                ? "border-[#cb6440] bg-[#fbf5f2] text-[#cb6440] shadow-xs ring-1 ring-[#cb6440]/20"
                                : "border-[#e8e2d8] bg-white text-[#4a3e39] hover:border-[#cb6440]/45"
                            }`}
                          >
                            <Calendar className="w-4 h-4 mx-auto mb-1.5 opacity-65" />
                            {d}
                          </button>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#e8e2d8] text-[11px] text-[#6e6059]">
                        Standard clinic hours: Monday – Saturday, 9:00 AM – 6:00 PM IST.
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Time Slot Selection */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#1e1815]">
                          Available 30-min Consultation Slots:
                        </p>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#4a6356]/15 text-[#4a6356]">
                          Real-time Lock
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {TIME_SLOTS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTime(t)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all duration-200 cursor-pointer ${
                              selectedTime === t
                                ? "border-[#cb6440] bg-[#cb6440] text-white shadow-sm"
                                : "border-[#e8e2d8] bg-white text-[#4a3e39] hover:border-[#cb6440]/50"
                            }`}
                          >
                            <Clock
                              className={`w-3.5 h-3.5 mx-auto mb-1 ${
                                selectedTime === t ? "text-white/90" : "opacity-60"
                              }`}
                            />
                            {t}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Details & Mode */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-4"
                    >
                      <p className="text-xs font-semibold text-[#1e1815]">Consultation Delivery Mode:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setConsultType("in-clinic")}
                          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            consultType === "in-clinic"
                              ? "border-[#4a6356] bg-[#f4f7f5] text-[#1e1815] ring-1 ring-[#4a6356]/20"
                              : "border-[#e8e2d8] bg-white text-[#6e6059] hover:border-[#4a6356]/40"
                          }`}
                        >
                          <Building2 className="w-5 h-5 text-[#4a6356] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold">In-Clinic Visit</p>
                            <p className="text-[10px] text-[#6e6059]">At hospital facility</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsultType("video")}
                          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            consultType === "video"
                              ? "border-[#cb6440] bg-[#fbf5f2] text-[#1e1815] ring-1 ring-[#cb6440]/20"
                              : "border-[#e8e2d8] bg-white text-[#6e6059] hover:border-[#cb6440]/40"
                          }`}
                        >
                          <Video className="w-5 h-5 text-[#cb6440] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold">Telehealth Video</p>
                            <p className="text-[10px] text-[#6e6059]">Encrypted consultation room</p>
                          </div>
                        </button>
                      </div>

                      {validationError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{validationError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label htmlFor="preview-patient-name" className="text-xs font-semibold text-[#1e1815]">
                          Patient Full Name
                        </label>
                        <input
                          id="preview-patient-name"
                          value={patientName}
                          onChange={(e) => {
                            setPatientName(e.target.value)
                            if (validationError) setValidationError(null)
                          }}
                          className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white text-xs font-medium focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="preview-chief-concern" className="text-xs font-semibold text-[#1e1815]">
                          Chief Clinical Concern
                        </label>
                        <textarea
                          id="preview-chief-concern"
                          rows={2}
                          value={symptoms}
                          onChange={(e) => {
                            setSymptoms(e.target.value)
                            if (validationError) setValidationError(null)
                          }}
                          className="w-full p-2.5 rounded-xl border border-[#dcd3c6] bg-white text-xs font-medium focus:border-[#cb6440] focus:ring-2 focus:ring-[#cb6440]/15 outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Final Review & Confirmation */}
                  {step === 5 && (
                    <motion.div
                      key="step5"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-4 text-xs"
                    >
                      <p className="font-semibold text-[#1e1815]">Review Consultation Details:</p>

                      <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] space-y-2.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-[#8c7e77]">Physician</span>
                          <span className="font-bold text-[#1e1815] text-right">
                            {selectedDoctor.name} ({selectedDoctor.specialty})
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[#8c7e77]">Facility</span>
                          <span className="text-[#4a3e39] text-right">{selectedDoctor.clinic}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[#8c7e77]">Schedule</span>
                          <span className="font-bold text-[#4a6356] text-right">
                            {selectedDate} • {selectedTime}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[#8c7e77]">Delivery Mode</span>
                          <span className="capitalize font-semibold text-[#1e1815]">
                            {consultType === "video" ? "Telehealth Video" : "In-Clinic Visit"}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[#ece6dd] pt-2.5 font-bold text-sm">
                          <span>Total Amount</span>
                          <span className="text-[#cb6440]">{formatINR(selectedDoctor.fee)}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8c7e77] leading-relaxed">
                        Preview mode: Sign in to the Patient Portal to reserve live slots with transactional row-locking, encrypted health records, and digital prescriptions.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!isCompleted && (
              <div className="flex items-center justify-between pt-4 border-t border-[#ece6dd]">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-full text-xs font-medium text-[#6e6059] hover:text-[#1e1815] hover:bg-[#ede5d9]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:shadow cursor-pointer active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-xs font-semibold shadow-md shadow-[#cb6440]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? "Locking Slot..." : "Confirm & Lock Consultation Slot"}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
