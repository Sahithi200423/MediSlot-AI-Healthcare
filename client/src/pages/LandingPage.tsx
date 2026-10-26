import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Clock, Star, Sparkles, CheckCircle2, 
  ArrowRight, Users, ChevronDown, Bot, HeartPulse, Building2,
  Stethoscope, Brain, Eye, Baby, Bone, Activity, FileText, Zap, CalendarCheck
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { InteractiveBookingModal } from "@/components/booking/InteractiveBookingModal"

export function LandingPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined)

  const specialties = [
    { name: "General Medicine", icon: Stethoscope, count: "128 Doctors", color: "from-blue-500 to-sky-600" },
    { name: "Cardiology", icon: HeartPulse, count: "45 Doctors", color: "from-rose-500 to-red-600" },
    { name: "Neurology", icon: Brain, count: "32 Doctors", color: "from-indigo-500 to-purple-600" },
    { name: "Pediatrics", icon: Baby, count: "54 Doctors", color: "from-amber-500 to-orange-600" },
    { name: "Dermatology", icon: Sparkles, count: "39 Doctors", color: "from-teal-500 to-emerald-600" },
    { name: "Orthopedics", icon: Bone, count: "41 Doctors", color: "from-cyan-500 to-blue-600" },
    { name: "Ophthalmology", icon: Eye, count: "29 Doctors", color: "from-violet-500 to-purple-600" },
    { name: "Psychiatry", icon: Activity, count: "36 Doctors", color: "from-pink-500 to-rose-600" },
  ]

  const featuredDoctors = [
    {
      id: "doc-1",
      name: "Dr. Sarah Jenkins, MD",
      specialty: "Cardiology",
      clinic: "Metro Heart & Vascular Center",
      rating: 4.9,
      reviews: 142,
      experience: "14 yrs exp",
      nextAvailable: "Today, 4:30 PM",
      fee: "$85",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250",
    },
    {
      id: "doc-2",
      name: "Dr. Marcus Vance, DO",
      specialty: "Neurology",
      clinic: "Apex Brain & Spine Institute",
      rating: 4.95,
      reviews: 98,
      experience: "11 yrs exp",
      nextAvailable: "Tomorrow, 10:00 AM",
      fee: "$110",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250",
    },
    {
      id: "doc-3",
      name: "Dr. Priya Patel, MBBS",
      specialty: "Dermatology",
      clinic: "Lumina Clinical Dermatology",
      rating: 4.88,
      reviews: 215,
      experience: "9 yrs exp",
      nextAvailable: "Tomorrow, 2:15 PM",
      fee: "$75",
      avatar: "https://images.unsplash.com/photo-1594824813511-2090432c74d8?auto=format&fit=crop&q=80&w=250",
    },
  ]

  const faqs = [
    {
      q: "How does MediSlot prevent double-booking?",
      a: "MediSlot uses an ACID-compliant transactional scheduling engine with database-level row locking. Once a patient selects an available slot, it is temporarily reserved for 10 minutes during checkout to guarantee that no two patients can claim the same time window."
    },
    {
      q: "How does the AI Document Summary assist doctors?",
      a: "Uploaded diagnostic reports and patient histories are securely parsed by our OCR and LLM pipeline. The AI extracts key clinical highlights, flags potential drug-allergy interactions, and summarizes chronic conditions in bullet points so doctors can review cases in under 60 seconds."
    },
    {
      q: "What is Machine Learning No-Show Prediction?",
      a: "Our scikit-learn model evaluates historical booking patterns, lead time, time of day, weather signals, and patient history to predict the probability of a missed visit. Staff can send smart automated reminders or offer standby slots to optimize doctor time."
    },
    {
      q: "Can multiple clinics and staff members use one platform?",
      a: "Yes. MediSlot features full multi-tenancy. Clinic admins can invite doctors, manage front desk receptionists, set individual consultation fees, configure custom clinic hours, and view unified financial reports."
    },
    {
      q: "Is patient medical data secure?",
      a: "Yes. MediSlot is architected with HIPAA-aligned safeguards, including encrypted storage buckets on Supabase, granular Row Level Security (RLS), and comprehensive immutable audit logging for all record views."
    }
  ]

  const handleOpenBooking = (docId?: string) => {
    setSelectedDoctorId(docId)
    setIsBookingModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F1F5F9]">
      <Navbar />

      {/* 5-Step Interactive Booking Engine Modal */}
      <InteractiveBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDoctorId={selectedDoctorId}
      />

      {/* Animated Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        {/* Soft floating background glow spheres */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-sky-300/40 via-teal-300/30 to-transparent blur-3xl pointer-events-none dark:from-sky-950/25 dark:via-teal-950/20"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Staggered Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:border-teal-800/80 dark:bg-teal-950/60 dark:text-teal-300 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Next-Gen Healthcare Management & AI Scheduling</span>
            </motion.div>

            {/* Hero Main Heading with Motion Reveal */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102A43] dark:text-white leading-[1.12]"
            >
              Smarter Appointments. <br />
              <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Better Clinic Management.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
            >
              The unified SaaS ecosystem for modern practices. Patients enjoy effortless online booking, clinicians streamline consultation queues, and clinic managers automate operations with AI.
            </motion.p>

            {/* Hero Interactive CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <Button
                variant="teal"
                size="lg"
                onClick={() => handleOpenBooking()}
                className="w-full sm:w-auto gap-2 text-sm sm:text-base font-semibold shadow-lg shadow-teal-600/25 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <CalendarCheck className="w-4 h-4" /> Book an Appointment <ArrowRight className="w-4 h-4" />
              </Button>

              <Link to="/dashboard/clinic" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full gap-2 text-sm sm:text-base font-semibold hover:scale-[1.02] transition-transform">
                  <Building2 className="w-4 h-4 text-sky-600" /> Clinic Admin Demo
                </Button>
              </Link>
            </motion.div>

            {/* Animated Trust Metrics Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-slate-200/80 dark:border-slate-800/80"
            >
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#102A43] dark:text-white">99.8%</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Uptime SLA</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">15,000+</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Appointments Booked</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">42%</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Fewer No-Shows (ML)</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#102A43] dark:text-white">4.9/5</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Patient Satisfaction</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Search Doctors Section */}
      <section className="py-14 bg-white dark:bg-[#101726]/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A43] dark:text-white">
              Find Verified Doctors Near You
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Filter by specialty, doctor name, clinic name, or next available slot.
            </p>
          </div>

          {/* Search Bar Container */}
          <div className="bg-[#F8FAFC] dark:bg-[#0B1321] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-4xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Doctor, clinic, or symptom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="relative flex items-center">
                <Stethoscope className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                >
                  <option>All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div>
                <Button
                  variant="teal"
                  onClick={() => handleOpenBooking()}
                  className="w-full h-full py-2.5 rounded-xl font-semibold gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" /> Search Availability
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Doctors Preview Cards with Animated Hover Lift */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDoctors.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-slate-200 dark:border-slate-800 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500/20 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{doc.rating}</span>
                          <span className="text-slate-400 font-normal">({doc.reviews})</span>
                        </div>
                        <h3 className="text-base font-bold text-[#102A43] dark:text-white truncate group-hover:text-teal-600 transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">{doc.specialty}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{doc.clinic}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">Experience</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{doc.experience}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Fee</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{doc.fee} / visit</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{doc.nextAvailable}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBooking(doc.id)}
                        className="rounded-lg text-xs hover:border-teal-500 hover:text-teal-600"
                      >
                        Book Slot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Specialties Section */}
      <section id="specialties" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="teal" className="mb-2">Comprehensive Care</Badge>
          <h2 className="text-3xl font-extrabold text-[#102A43] dark:text-white">
            Explore Medical Specialties
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Access board-certified practitioners across multiple clinical domains.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {specialties.map((spec, i) => {
            const Icon = spec.icon
            return (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => handleOpenBooking()}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#101726] hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${spec.color} flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-[#102A43] dark:text-white group-hover:text-teal-600 transition-colors">
                  {spec.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{spec.count}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-2">Frictionless Experience</Badge>
            <h2 className="text-3xl font-extrabold text-[#102A43] dark:text-white">
              How MediSlot Works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Designed from the ground up for both patients seeking care and clinics delivering it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#101726] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-sm mb-4">
                01
              </span>
              <h3 className="text-lg font-bold text-[#102A43] dark:text-white mb-2">Search & Select</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Filter accredited doctors by medical domain, clinic location, consultation charges, and patient reviews.
              </p>
            </div>

            <div className="bg-white dark:bg-[#101726] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center text-sm mb-4">
                02
              </span>
              <h3 className="text-lg font-bold text-[#102A43] dark:text-white mb-2">Real-Time Slot Lock</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Pick your preferred 30-minute consultation window. Zero double-booking with ACID-isolated reservations.
              </p>
            </div>

            <div className="bg-white dark:bg-[#101726] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm mb-4">
                03
              </span>
              <h3 className="text-lg font-bold text-[#102A43] dark:text-white mb-2">Attend & Access Care</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Receive SMS/email reminders, upload medical records for AI pre-summaries, and access digital prescriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Way Stakeholder Benefits */}
      <section id="benefits" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="teal" className="mb-2">Value for Everyone</Badge>
          <h2 className="text-3xl font-extrabold text-[#102A43] dark:text-white">
            Built for Every Healthcare Role
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Eliminating administrative drag across patients, doctors, and clinic operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Card */}
          <div className="rounded-3xl border border-sky-100 dark:border-slate-800 bg-gradient-to-b from-sky-50/50 to-transparent dark:from-sky-950/20 p-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#102A43] dark:text-white">For Patients</h3>
              <p className="text-xs text-slate-500 mt-1">Effortless access to reliable healthcare</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Zero waiting phone calls; book anytime 24/7.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Instant confirmation with calendar syncing.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Centralized vault for lab reports & medical files.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Transparent consultation fees and simple payments.</span>
              </li>
            </ul>
            <Link to="/dashboard/patient">
              <Button variant="outline" className="w-full text-xs mt-2 border-sky-300 dark:border-sky-800">
                Preview Patient Portal
              </Button>
            </Link>
          </div>

          {/* Doctor Card */}
          <div className="rounded-3xl border border-teal-200 dark:border-slate-800 bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-950/20 p-8 space-y-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#102A43] dark:text-white">For Doctors</h3>
              <p className="text-xs text-slate-500 mt-1">Focused clinical consultations, zero hassle</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Custom availability schedules and recurring hours.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>AI summaries of patient records before every consult.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Real-time queue tracking & instant visit completion.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Protected consultation notes and patient history.</span>
              </li>
            </ul>
            <Link to="/dashboard/doctor">
              <Button variant="teal" className="w-full text-xs mt-2">
                Preview Doctor Workspace
              </Button>
            </Link>
          </div>

          {/* Clinic Admin Card */}
          <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20 p-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#102A43] dark:text-white">For Clinics</h3>
              <p className="text-xs text-slate-500 mt-1">Full operational command and revenue insights</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Multi-provider scheduling across multiple rooms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ML-powered no-show predictions to safeguard revenue.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Unified payment tracking and daily financial summaries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Staff permission roles and compliance audit trail.</span>
              </li>
            </ul>
            <Link to="/dashboard/clinic">
              <Button variant="outline" className="w-full text-xs mt-2 border-emerald-300 dark:border-emerald-800">
                Preview Clinic Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Features Preview Section */}
      <section id="ai-features" className="py-20 bg-[#102A43] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3">
              <Bot className="w-3.5 h-3.5" /> Intelligent Clinical Intelligence
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              AI Built to Assist Clinicians, Never Replace Them
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Compliant clinical summaries, proactive risk detection, and no-show mitigation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* AI Document Summarizer Preview */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-base text-white">AI Clinical Document Summary</h3>
                </div>
                <Badge variant="teal">FastAPI + LLM</Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                  <span>Document: Complete_Blood_Count_Lab.pdf</span>
                  <span className="text-teal-400">Processed in 1.4s</span>
                </div>
                <div className="space-y-1.5 text-slate-200">
                  <p className="text-teal-300 font-semibold font-sans">🩺 Key Clinical Highlights:</p>
                  <p className="text-slate-300 font-sans pl-2">• Patient presents with 2-week persistent fatigue and mild dizziness.</p>
                  <p className="text-slate-300 font-sans pl-2">• Hemoglobin: 10.4 g/dL (low-normal), Ferritin: 18 ng/mL (depleted iron stores).</p>
                  <p className="text-amber-400 font-sans pl-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Flagged: Documented penicillin allergy in secondary notes.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Clinicians receive a concise 60-second synthesized brief before walking into the consultation room.
              </p>
            </div>

            {/* ML No-Show Prediction Preview */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-base text-white">ML Appointment No-Show Estimation</h3>
                </div>
                <Badge variant="info">scikit-learn</Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Estimated No-Show Risk</span>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    Low Risk (12%)
                  </span>
                </div>
                {/* Progress bar indicator */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full w-[12%] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>• Booking Lead Time: 2 days (low)</div>
                  <div>• Prior Attendance: 95% rate</div>
                  <div>• Day/Time: Monday 10:00 AM</div>
                  <div>• Channel: Verified SMS Confirmed</div>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Predictive risk models help clinics overbook prudently or send targeted WhatsApp/SMS reconfirmations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Animated Accordions */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="neutral" className="mb-2">Got Questions?</Badge>
          <h2 className="text-3xl font-extrabold text-[#102A43] dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Everything you need to know about MediSlot's architecture and capabilities.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101726] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-[#102A43] dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180 text-teal-600" : ""}`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
