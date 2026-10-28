import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Calendar, Clock, CheckCircle2, 
  ArrowRight, ArrowLeft, Video, Building2
} from "lucide-react"
import { toast } from "sonner"

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
    clinic: "Metropolitan Heart & Vascular Pavilion",
    fee: 85,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, DO",
    specialty: "Neurology & Spine Care",
    clinic: "Apex Brain & Spine Medical Center",
    fee: 110,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel, MBBS",
    specialty: "Clinical Dermatology",
    clinic: "Lumina Academic Health Center",
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
  const [selectedDate, setSelectedDate] = useState("Tomorrow (Oct 29)")
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
    await new Promise(r => setTimeout(r, 900))
    setIsSubmitting(false)
    setIsCompleted(true)
    toast.success("Demonstration appointment reserved successfully")
  }

  const resetAndClose = () => {
    setStep(1)
    setIsCompleted(false)
    onClose()
  }

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-editorial-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={resetAndClose}
        className="fixed inset-0 bg-[#1e1815]/50 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
        className="relative w-full max-w-xl rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-[#1e1815]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ece6dd]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4a6356] animate-pulse" />
              <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                Schedule Clinical Consultation
              </h3>
            </div>
            <p className="text-xs text-[#6e6059] mt-0.5 font-medium">
              Demonstration scheduling engine · Connects to real clinician database
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-full text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ece6dd] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        {!isCompleted && (
          <div className="py-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#8c7e77] uppercase tracking-wider">
              <span className={step >= 1 ? "text-[#cb6440] font-bold" : ""}>1. Physician</span>
              <span className={step >= 2 ? "text-[#cb6440] font-bold" : ""}>2. Date</span>
              <span className={step >= 3 ? "text-[#cb6440] font-bold" : ""}>3. Slot</span>
              <span className={step >= 4 ? "text-[#cb6440] font-bold" : ""}>4. Details</span>
              <span className={step >= 5 ? "text-[#cb6440] font-bold" : ""}>5. Confirm</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-[#ede5d9] h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-[#cb6440] h-full rounded-full"
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
              <div className="w-16 h-16 rounded-full bg-[#4a6356]/10 text-[#4a6356] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                Consultation Confirmed
              </h4>
              <p className="text-xs text-[#6e6059] max-w-sm mx-auto leading-relaxed">
                Your demonstration consultation with <strong className="text-[#1e1815]">{selectedDoctor.name}</strong> is scheduled for <strong className="text-[#1e1815]">{selectedDate}</strong> at <strong className="text-[#1e1815]">{selectedTime}</strong>.
              </p>
              <div className="p-3 rounded-2xl bg-white border border-[#e8e2d8] text-xs text-[#6e6059]">
                Booking Reference: <span className="font-mono font-bold text-[#cb6440]">#SLOT-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="w-full mt-4 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 text-sm font-medium transition-colors cursor-pointer"
              >
                Done & Return
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Step 1: Doctor Selection */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
                  <p className="text-xs font-semibold text-[#1e1815] mb-2">
                    Select a Practicing Physician:
                  </p>
                  {SAMPLE_DOCTORS.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDoctor.id === doc.id
                          ? "border-[#cb6440] bg-[#fbf5f2] shadow-sm"
                          : "border-[#e8e2d8] bg-white hover:border-[#cb6440]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={doc.avatar} alt={doc.name} className="w-12 h-12 rounded-xl object-cover border border-[#ede5d9]" />
                        <div>
                          <h4 className="text-sm font-bold text-[#1e1815]">{doc.name}</h4>
                          <p className="text-xs text-[#cb6440] font-medium">{doc.specialty}</p>
                          <p className="text-[11px] text-[#6e6059]">{doc.clinic}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1e1815]">${doc.fee}</span>
                        <span className="block text-[10px] text-[#8c7e77]">Consultation fee</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 2: Date Selection */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <p className="text-xs font-semibold text-[#1e1815]">
                    Choose Appointment Date:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      "Today (Urgent)",
                      "Tomorrow (Oct 29)",
                      "Thursday (Oct 30)",
                      "Friday (Oct 31)",
                      "Monday (Nov 03)",
                      "Tuesday (Nov 04)"
                    ].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`p-3 rounded-2xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          selectedDate === d
                            ? "border-[#cb6440] bg-[#fbf5f2] text-[#cb6440] shadow-sm"
                            : "border-[#e8e2d8] bg-white text-[#4a3e39] hover:border-[#cb6440]/40"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mx-auto mb-1.5 opacity-60" />
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#e8e2d8] text-[11px] text-[#6e6059]">
                    Clinic operating hours: Monday – Friday, 8:30 AM – 5:30 PM EST.
                  </div>
                </motion.div>
              )}

              {/* Step 3: Time Slot Selection */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#1e1815]">
                      Available 30-min Consultation Slots:
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#4a6356]/15 text-[#4a6356]">
                      Real-time Lock
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          selectedTime === t
                            ? "border-[#cb6440] bg-[#fbf5f2] text-[#cb6440] shadow-sm"
                            : "border-[#e8e2d8] bg-white text-[#4a3e39] hover:border-[#cb6440]/40"
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
                  <p className="text-xs font-semibold text-[#1e1815]">
                    Consultation Delivery Mode:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultType("in-clinic")}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        consultType === "in-clinic"
                          ? "border-[#4a6356] bg-[#f4f7f5] text-[#1e1815]"
                          : "border-[#e8e2d8] bg-white text-[#6e6059]"
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
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        consultType === "video"
                          ? "border-[#cb6440] bg-[#fbf5f2] text-[#1e1815]"
                          : "border-[#e8e2d8] bg-white text-[#6e6059]"
                      }`}
                    >
                      <Video className="w-5 h-5 text-[#cb6440] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Telehealth Video</p>
                        <p className="text-[10px] text-[#6e6059]">Encrypted WebRTC</p>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1e1815]">Patient Full Name</label>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#e8e2d8] bg-white text-xs font-medium focus:border-[#cb6440] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1e1815]">Chief Clinical Concern</label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#e8e2d8] bg-white text-xs font-medium focus:border-[#cb6440] outline-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 5: Final Review & Confirmation */}
              {step === 5 && (
                <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4 text-xs">
                  <p className="font-semibold text-[#1e1815]">
                    Review Consultation Details:
                  </p>

                  <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-[#8c7e77]">Physician:</span>
                      <span className="font-bold text-[#1e1815]">{selectedDoctor.name} ({selectedDoctor.specialty})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c7e77]">Facility:</span>
                      <span className="text-[#4a3e39]">{selectedDoctor.clinic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c7e77]">Schedule:</span>
                      <span className="font-bold text-[#4a6356]">{selectedDate} • {selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c7e77]">Delivery Mode:</span>
                      <span className="capitalize font-semibold text-[#1e1815]">{consultType}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#ece6dd] pt-2 font-bold text-sm">
                      <span>Total Amount:</span>
                      <span className="text-[#cb6440]">${selectedDoctor.fee}.00</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8c7e77]">
                    Demonstration mode: Slot is locked for 10 minutes in transactional state. Full payment gateway and clinical records unlock in patient portal.
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
                className="px-4 py-2 text-xs font-medium text-[#6e6059] hover:text-[#1e1815] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-xs font-medium shadow-md shadow-[#cb6440]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Locking Slot..." : "Confirm & Lock Consultation Slot"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
