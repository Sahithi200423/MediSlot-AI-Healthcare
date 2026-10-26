import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Calendar, Clock, CheckCircle2, 
  ArrowRight, ArrowLeft, Video, Building2
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

interface Doctor {
  id: string
  name: string
  specialty: string
  clinic: string
  fee: number
  avatar: string
}

const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Jenkins, MD",
    specialty: "Cardiology",
    clinic: "Metro Heart & Vascular Center",
    fee: 85,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, DO",
    specialty: "Neurology",
    clinic: "Apex Brain & Spine Institute",
    fee: 110,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel, MBBS",
    specialty: "Dermatology",
    clinic: "Lumina Clinical Dermatology",
    fee: 75,
    avatar: "https://images.unsplash.com/photo-1594824813511-2090432c74d8?auto=format&fit=crop&q=80&w=200",
  },
]

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:30 AM", "11:15 AM", 
  "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM"
]

export function InteractiveBookingModal({
  isOpen,
  onClose,
  initialDoctorId
}: {
  isOpen: boolean
  onClose: () => void
  initialDoctorId?: string
}) {
  const [step, setStep] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(() => {
    return SAMPLE_DOCTORS.find(d => d.id === initialDoctorId) || SAMPLE_DOCTORS[0]
  })
  const [selectedDate, setSelectedDate] = useState("Tomorrow (Oct 27)")
  const [selectedTime, setSelectedTime] = useState("10:30 AM")
  const [consultType, setConsultType] = useState<"in-clinic" | "video">("in-clinic")
  const [patientName, setPatientName] = useState("Alex Turner")
  const [symptoms, setSymptoms] = useState("Follow-up consultation and lab review")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    // Simulate transactional verification
    await new Promise((res) => setTimeout(res, 800))
    setIsSubmitting(false)
    setIsCompleted(true)
    toast.success("Appointment Confirmed!", {
      description: `Booked with ${selectedDoctor.name} for ${selectedDate} at ${selectedTime}.`,
    })
  }

  const resetAndClose = () => {
    setIsCompleted(false)
    setStep(1)
    onClose()
  }

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={resetAndClose}
        className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
        className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h3 className="text-lg font-bold text-[#102A43] dark:text-white">
                Schedule Appointment
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive Scheduling Preview (Live transactional engine in Phase 4)
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        {!isCompleted && (
          <div className="py-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className={step >= 1 ? "text-teal-600 dark:text-teal-400 font-bold" : ""}>1. Doctor</span>
              <span className={step >= 2 ? "text-teal-600 dark:text-teal-400 font-bold" : ""}>2. Date</span>
              <span className={step >= 3 ? "text-teal-600 dark:text-teal-400 font-bold" : ""}>3. Slot</span>
              <span className={step >= 4 ? "text-teal-600 dark:text-teal-400 font-bold" : ""}>4. Details</span>
              <span className={step >= 5 ? "text-teal-600 dark:text-teal-400 font-bold" : ""}>5. Confirm</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full"
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Modal Body with Animated Step Switcher */}
        <div className="py-2 min-h-[280px]">
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-extrabold text-[#102A43] dark:text-white">
                Booking Confirmed!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your appointment with <strong className="text-slate-800 dark:text-slate-200">{selectedDoctor.name}</strong> is confirmed for <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong> at <strong className="text-slate-800 dark:text-slate-200">{selectedTime}</strong>.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                Booking Reference: <span className="font-mono font-bold text-teal-600">#SLOT-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <Button variant="teal" onClick={resetAndClose} className="w-full mt-4">
                Done & Close
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Step 1: Doctor Selection */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select a Healthcare Practitioner:
                  </p>
                  {SAMPLE_DOCTORS.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDoctor.id === doc.id
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={doc.avatar} alt={doc.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</h4>
                          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{doc.specialty}</p>
                          <p className="text-[11px] text-slate-400">{doc.clinic}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">${doc.fee}</span>
                        <span className="block text-[10px] text-slate-400">Consultation fee</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 2: Date Selection */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Choose Appointment Date:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      "Today (Urgent)",
                      "Tomorrow (Oct 27)",
                      "Wednesday (Oct 28)",
                      "Thursday (Oct 29)",
                      "Friday (Oct 30)",
                      "Monday (Nov 02)"
                    ].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`p-3 rounded-2xl border text-xs font-semibold text-center transition-all ${
                          selectedDate === d
                            ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mx-auto mb-1.5 opacity-60" />
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500">
                    Clinic hours: Mon–Fri, 9:00 AM – 5:00 PM EST.
                  </div>
                </motion.div>
              )}

              {/* Step 3: Time Slot Selection */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Available 30-min Consultation Slots:
                    </p>
                    <Badge variant="teal">Real-time Lock</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                          selectedTime === t
                            ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-60" />
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Details & Mode */}
              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Consultation Type:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultType("in-clinic")}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        consultType === "in-clinic"
                          ? "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">In-Clinic Visit</p>
                        <p className="text-[10px] text-slate-400">At practitioner facility</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultType("video")}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        consultType === "video"
                          ? "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Video className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Telehealth Video</p>
                        <p className="text-[10px] text-slate-400">Secure WebRTC room</p>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Patient Full Name</label>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chief Symptoms / Reason</label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 5: Final Review & Confirmation */}
              {step === 5 && (
                <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Review Appointment Summary Before Lock:
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Doctor:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedDoctor.name} ({selectedDoctor.specialty})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Facility:</span>
                      <span className="text-slate-700 dark:text-slate-300">{selectedDoctor.clinic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Schedule:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{selectedDate} • {selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consultation Mode:</span>
                      <span className="capitalize font-semibold">{consultType}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm">
                      <span>Total Amount:</span>
                      <span className="text-teal-600 dark:text-teal-400">${selectedDoctor.fee}.00</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    By confirming, the slot is locked for 10 minutes in PostgreSQL. Razorpay test mode payment will be handled upon confirmation.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isCompleted && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button variant="teal" size="sm" onClick={handleNext} className="gap-1.5 text-xs font-semibold">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="teal"
                size="sm"
                onClick={handleConfirm}
                isLoading={isSubmitting}
                className="gap-1.5 text-xs font-semibold shadow-md shadow-teal-500/20"
              >
                Confirm Appointment & Lock Slot
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
