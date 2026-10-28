import { useState, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Clock, Star, Sparkles,
  ChevronDown, Bot, HeartPulse,
  Stethoscope, Brain, Eye, Baby, Bone, Activity, FileText, CalendarCheck
} from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { InteractiveBookingModal } from "@/components/booking/InteractiveBookingModal"

// Lazy-load the Three.js 3D Bio-Cellular Sculpture
const BioCellSculpture = lazy(() => import("@/components/3d/BioCellSculpture"))

export function LandingPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined)

  const specialties = [
    { name: "General Medicine", icon: Stethoscope, count: "128 Practitioners", desc: "Primary care, preventative wellness, and acute health management" },
    { name: "Cardiology", icon: HeartPulse, count: "45 Cardiologists", desc: "Cardiac evaluations, rhythm telemetry, and vascular prevention" },
    { name: "Neurology", icon: Brain, count: "32 Neurologists", desc: "Neuro-cognitive diagnostics, migraine care, and spinal health" },
    { name: "Pediatrics", icon: Baby, count: "54 Pediatricians", desc: "Newborn screenings, developmental milestones, and adolescent care" },
    { name: "Dermatology", icon: Sparkles, count: "39 Dermatologists", desc: "Clinical dermatology, skin barrier pathology, and biopsies" },
    { name: "Orthopedics", icon: Bone, count: "41 Specialists", desc: "Joint reconstruction, sports medicine, and bone density analysis" },
    { name: "Ophthalmology", icon: Eye, count: "29 Eye Surgeons", desc: "Corneal health, retinal assessments, and optical diagnostics" },
    { name: "Psychiatry", icon: Activity, count: "36 Clinicians", desc: "Behavioral health, neuro-psychological assessments, and therapy" },
  ]

  const featuredDoctors = [
    {
      id: "doc-1",
      name: "Dr. Sarah Jenkins, MD",
      specialty: "Cardiology & Internal Medicine",
      clinic: "Metropolitan Heart & Vascular Pavilion",
      rating: 4.95,
      reviews: 142,
      experience: "14 yrs clinical practice",
      nextAvailable: "Today, 4:30 PM",
      fee: "$85",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350",
    },
    {
      id: "doc-2",
      name: "Dr. Marcus Vance, DO",
      specialty: "Neurology & Spine Care",
      clinic: "Apex Brain & Spine Medical Center",
      rating: 4.98,
      reviews: 98,
      experience: "11 yrs clinical practice",
      nextAvailable: "Tomorrow, 10:00 AM",
      fee: "$110",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350",
    },
    {
      id: "doc-3",
      name: "Dr. Priya Patel, MBBS",
      specialty: "Clinical Dermatology",
      clinic: "Lumina Academic Health Center",
      rating: 4.89,
      reviews: 215,
      experience: "9 yrs clinical practice",
      nextAvailable: "Tomorrow, 2:15 PM",
      fee: "$75",
      avatar: "https://images.unsplash.com/photo-1594824813511-2090432c74d8?auto=format&fit=crop&q=80&w=350",
    },
  ]

  const faqs = [
    {
      q: "How does MediSlot prevent appointment double-booking?",
      a: "MediSlot uses an ACID-compliant transactional scheduling engine with database-level row locking. Once a patient selects an available slot, it is temporarily reserved for 10 minutes during checkout to guarantee that no two patients can claim the same time window."
    },
    {
      q: "How does the Physician-Supervised AI Copilot assist doctors?",
      a: "Uploaded diagnostic reports and patient histories are parsed by our OCR and clinical AI pipeline. The system extracts structured analyte ranges, highlights abnormal thresholds, and summarizes findings into concise SOAP drafts. All AI outputs require explicit physician review and attestation before clinical acceptance."
    },
    {
      q: "How can patients understand complex medical lab results?",
      a: "The Patient Health Vault includes an educational AI translation feature that converts high-complexity clinical metrics (like HbA1c, eGFR, Dyslipidemia) into 6th-grade simple English, with explanations of why doctors check them and lifestyle questions to ask at consultations."
    },
    {
      q: "Is patient medical data secure and HIPAA-aligned?",
      a: "Yes. MediSlot enforces strict multi-tenant boundaries using Supabase Row-Level Security (RLS), encrypted object storage for diagnostics, and immutable cryptographic audit trails recording every clinician access event."
    },
    {
      q: "Can hospital administrators manage multiple clinics and staff?",
      a: "Yes. Clinic administrators can invite practitioners, manage front desk receptionists, set individual consultation fees, configure custom clinic hours, approve doctor leaves, and view consolidated operational analytics."
    }
  ]

  const handleOpenBooking = (docId?: string) => {
    setSelectedDoctorId(docId)
    setIsBookingModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] dark:bg-[#141210] text-[#542f28] dark:text-[#f5f1e9] font-editorial-sans transition-colors selection:bg-[#ede4d5] selection:text-[#2a201e]">
      
      {/* Editorial Navigation with Topline Identity */}
      <Navbar onOpenBooking={() => handleOpenBooking()} />

      {/* 5-Step Interactive Booking Engine Modal */}
      <InteractiveBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDoctorId={selectedDoctorId}
      />

      {/* ========================================================= */}
      {/* 1. EDITORIAL TWO-COLUMN HERO WITH 3D BIO-SCULPTURE */}
      {/* ========================================================= */}
      <section className="relative w-full max-w-[1920px] mx-auto px-6 sm:px-12 lg:px-16 pt-8 pb-16 lg:py-20 overflow-hidden border-b border-[#dcd3c6] dark:border-[#362f2a]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_1fr] items-center gap-12 lg:gap-8 min-h-[580px]">
          
          {/* Left Column: Hospital Editorial Story */}
          <div className="flex flex-col justify-center space-y-7 z-10">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[1.4px] text-[#8b7566] dark:text-[#c4b5a8] font-semibold">
              <span className="w-6 h-[1px] bg-[#b58368]"></span>
              <span>A CLINICAL PLATFORM WITH A HUMAN TOUCH</span>
            </div>

            {/* Oversized Instrument Serif Headline */}
            <h1 className="font-editorial-serif text-5xl sm:text-6xl lg:text-[76px] font-normal tracking-[-0.035em] leading-[0.98] text-[#2a201e] dark:text-[#fbf9f5] m-0">
              A little care.<br />
              A big <em className="text-[#b66143] dark:text-[#f07e54] italic font-editorial-serif font-normal">possibility.</em>
            </h1>

            {/* Introduction Copy */}
            <p className="text-sm sm:text-base text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed max-w-xl font-editorial-sans">
              We turn clinical complexity into clarity. Thoughtful medicine, digital patient experiences, and physician-supervised diagnostic intelligence designed for modern healthcare pavilions.
            </p>

            {/* Conversation Callout (Soft Spot Inspired) */}
            <div className="flex items-center gap-4 pt-2">
              <span className="w-11 h-11 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] flex items-center justify-center text-xl shrink-0 font-sans shadow-xs">
                ↗
              </span>
              <div>
                <span className="text-[9px] uppercase tracking-[1.3px] text-[#8b7566] dark:text-[#c4b5a8] font-bold block">
                  GOT HEALTH QUESTIONS?
                </span>
                <p className="text-sm sm:text-base font-semibold text-[#2a201e] dark:text-[#fbf9f5] m-0">
                  Let’s connect with an accredited specialist.
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="pill-button !bg-[#e17145] !text-white !border-[#b66143] hover:!bg-[#b66143] text-sm !px-6 !py-3 font-semibold shadow-sm"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book an Appointment</span>
              </button>

              <a href="#doctors">
                <button
                  type="button"
                  className="pill-button text-sm !px-6 !py-3 font-semibold text-[#4a6b5d] dark:text-[#99aa77] border-[#4a6b5d]/40 hover:border-[#4a6b5d]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Hospital Faculty</span>
                </button>
              </a>
            </div>

          </div>

          {/* Right Column: Interactive 3D Bio-Cellular Sculpture */}
          <div className="w-full h-full min-h-[460px] lg:min-h-[560px] relative flex items-center justify-center">
            <Suspense 
              fallback={
                <div className="w-full h-[460px] flex flex-col items-center justify-center gap-3 text-[#8b7566]">
                  <div className="w-12 h-12 rounded-full border-2 border-[#4a6b5d] border-t-transparent animate-spin" />
                  <span className="text-xs uppercase tracking-wider font-editorial-sans">Initializing Cellular Model...</span>
                </div>
              }
            >
              <BioCellSculpture />
            </Suspense>
          </div>

        </div>

        {/* ========================================================= */}
        {/* EDITORIAL TRUST NUMBERS STRIP */}
        {/* ========================================================= */}
        <div className="pt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center border-t border-[#dcd3c6] dark:border-[#362f2a] mt-12">
          <div className="space-y-1">
            <p className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-tight">99.8%</p>
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#8b7566] dark:text-[#c4b5a8] font-medium">Uptime & Scheduling SLA</p>
          </div>
          <div className="space-y-1">
            <p className="font-editorial-serif text-4xl sm:text-5xl text-[#4a6b5d] dark:text-[#99aa77] tracking-tight">15,000+</p>
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#8b7566] dark:text-[#c4b5a8] font-medium">Consultations Reserved</p>
          </div>
          <div className="space-y-1">
            <p className="font-editorial-serif text-4xl sm:text-5xl text-[#e17145] tracking-tight">42%</p>
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#8b7566] dark:text-[#c4b5a8] font-medium">Fewer Missed Visits (ML)</p>
          </div>
          <div className="space-y-1">
            <p className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-tight">4.95 / 5</p>
            <p className="text-[11px] uppercase tracking-[1.2px] text-[#8b7566] dark:text-[#c4b5a8] font-medium">Verified Patient Rating</p>
          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* 2. FIND ACCREDITED DOCTORS & CLINIC SEARCH */}
      {/* ========================================================= */}
      <section id="doctors" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#f5f1e9]/60 dark:bg-[#1a1714]/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              ACCREDITED PRACTITIONER DIRECTORY
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Find Board-Certified Specialists
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Reserve verified consultation hours across medical specialties and hospital pavilions.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#fbf9f5] dark:bg-[#141210] p-4 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] shadow-xs max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-[#8b7566]" />
                <input
                  type="text"
                  placeholder="Doctor, pavilion, or condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1a16] rounded-xl pl-10 pr-3 py-2.5 text-xs font-editorial-sans border border-[#dcd3c6] dark:border-[#362f2a] focus:outline-none focus:border-[#4a6b5d] text-[#2a201e] dark:text-[#f5f1e9]"
                />
              </div>

              <div className="relative flex items-center">
                <Stethoscope className="absolute left-3.5 w-4 h-4 text-[#8b7566]" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1a16] rounded-xl pl-10 pr-8 py-2.5 text-xs font-editorial-sans border border-[#dcd3c6] dark:border-[#362f2a] focus:outline-none focus:border-[#4a6b5d] text-[#2a201e] dark:text-[#f5f1e9] appearance-none cursor-pointer"
                >
                  <option>All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#8b7566] pointer-events-none" />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleOpenBooking()}
                  className="pill-button w-full !bg-[#4a6b5d] !text-white !border-[#365246] hover:!bg-[#365246] text-xs font-semibold justify-center shadow-xs"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Search Availability</span>
                </button>
              </div>

            </div>
          </div>

          {/* Featured Doctors Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#fbf9f5] dark:bg-[#141210] rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] p-6 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#dcd3c6] dark:border-[#362f2a] shadow-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[#c5a880] text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-[#c5a880]" />
                        <span>{doc.rating}</span>
                        <span className="text-[#8b7566] font-normal">({doc.reviews})</span>
                      </div>
                      <h3 className="text-base font-bold text-[#2a201e] dark:text-[#fbf9f5] truncate mt-0.5 group-hover:text-[#e17145] transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-medium text-[#4a6b5d] dark:text-[#99aa77]">{doc.specialty}</p>
                      <p className="text-[11px] text-[#8b7566] truncate mt-0.5">{doc.clinic}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#dcd3c6]/60 dark:border-[#362f2a] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase text-[#8b7566] font-medium tracking-wider">Experience</p>
                      <p className="font-semibold text-[#2a201e] dark:text-[#fbf9f5] mt-0.5">{doc.experience}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#8b7566] font-medium tracking-wider">Consultation</p>
                      <p className="font-semibold text-[#2a201e] dark:text-[#fbf9f5] mt-0.5">{doc.fee} / visit</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#dcd3c6]/60 dark:border-[#362f2a] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#4a6b5d] dark:text-[#99aa77] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{doc.nextAvailable}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(doc.id)}
                    className="pill-button !py-1.5 !px-3.5 text-xs font-semibold !border-[#4a6b5d]/40 text-[#4a6b5d] dark:text-[#99aa77] hover:!bg-[#4a6b5d]/10"
                  >
                    Reserve Slot
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. HOSPITAL CLINICAL DEPARTMENTS & SPECIALTIES */}
      {/* ========================================================= */}
      <section id="specialties" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#e17145] font-bold">
              DEPARTMENTAL SPECIALTIES
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Comprehensive Care Across Fields
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Verified medical care supported by advanced clinical diagnostics and coordinated specialty referrals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((spec, i) => {
              const Icon = spec.icon
              return (
                <div
                  key={i}
                  onClick={() => handleOpenBooking()}
                  className="p-6 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] hover:border-[#4a6b5d] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full border border-[#4a6b5d]/30 bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-[#e17145]" />
                    </div>
                    <h3 className="font-bold text-base text-[#2a201e] dark:text-[#fbf9f5] group-hover:text-[#4a6b5d] transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] mt-2 leading-relaxed">
                      {spec.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4a6b5d] dark:text-[#99aa77] mt-4 block">
                    {spec.count} →
                  </span>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. THREE-STEP APPOINTMENT BOOKING PROCESS */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#f5f1e9]/60 dark:bg-[#1a1714]/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              EFFORTLESS ACCESS
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              How MediSlot Works
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              A refined three-step booking experience ensuring immediate confirmation with zero double-booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4">
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                01
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Search & Select</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Filter accredited doctors by specialty, medical facility, consultation fee, and verified patient ratings.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4">
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                02
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Real-Time Slot Lock</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Select your preferred 30-minute consultation slot. Our transactional engine prevents double-booking with row-level locks.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4">
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                03
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Attend & Access Care</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Receive instant notifications, upload diagnostic records for physician review, and download signed digital prescriptions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CLINICAL AI COPILOT & PATIENT HEALTH VAULT */}
      {/* ========================================================= */}
      <section id="ai-features" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#141210] text-[#fbf9f5]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4a6b5d]/30 text-[#99aa77] text-xs font-semibold border border-[#4a6b5d]/40">
              <Bot className="w-3.5 h-3.5" />
              <span>Physician-Supervised Healthcare Intelligence</span>
            </div>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#fbf9f5] tracking-[-0.02em]">
              AI Built to Assist Clinicians, Never Replace Them
            </h2>
            <p className="text-sm text-[#c4b5a8]">
              Automated document OCR, grounded laboratory extractions, and patient-friendly medical term explainers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* AI Document Extraction Card */}
            <div className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#362f2a] pb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#e17145]" />
                  <h3 className="font-bold text-base text-[#fbf9f5]">Clinical Lab Report Analyzer</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#4a6b5d]/30 text-[#99aa77] border border-[#4a6b5d]/40">
                  FastAPI OCR
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#141210] border border-[#362f2a] space-y-2.5 font-editorial-sans text-xs">
                <div className="flex items-center justify-between text-[#8b7566] text-[11px] pb-2 border-b border-[#2b2520]">
                  <span>Specimen: Metabolic_Blood_Count.pdf</span>
                  <span className="text-[#99aa77]">Processed in 1.2s</span>
                </div>
                <p className="text-[#e17145] font-semibold text-xs">🩺 Physician Decision Support Highlights:</p>
                <p className="text-[#c4b5a8]">• Fasting Glucose: 142 mg/dL (Reference: 70 - 99 mg/dL) — <span className="text-rose-400 font-semibold">[HIGH]</span></p>
                <p className="text-[#c4b5a8]">• Hemoglobin A1c: 6.7% (Reference: &lt; 5.7%) — <span className="text-rose-400 font-semibold">[HIGH]</span></p>
                <p className="text-[#c4b5a8]">• Serum Creatinine: 1.05 mg/dL (Normal renal filtration)</p>
              </div>

              <p className="text-xs text-[#8b7566]">
                Clinicians receive a verified, grounded diagnostic brief citing exact source pages before starting consultations.
              </p>
            </div>

            {/* Patient AI Term Explainer Preview */}
            <div className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#362f2a] pb-4">
                <div className="flex items-center gap-2.5">
                  <Brain className="w-5 h-5 text-[#c5a880]" />
                  <h3 className="font-bold text-base text-[#fbf9f5]">Patient Plain-Language Explainer</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#c5a880]/20 text-[#d8c29d] border border-[#c5a880]/30">
                  Patient Vault
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#141210] border border-[#362f2a] space-y-3 font-editorial-sans text-xs">
                <div className="flex items-center justify-between text-[#8b7566] text-[11px] pb-2 border-b border-[#2b2520]">
                  <span>Query: "What does Dyslipidemia mean?"</span>
                  <span className="text-[#c5a880]">6th-Grade Reading Level</span>
                </div>
                <p className="text-[#fbf9f5] leading-relaxed">
                  <strong>What it means:</strong> An imbalance of fats (like cholesterol) in your bloodstream.
                </p>
                <p className="text-[#c4b5a8] leading-relaxed">
                  <strong>Why doctors look at it:</strong> Certain fats can stick to blood vessel walls over time, making it harder for your heart to pump smoothly.
                </p>
              </div>

              <p className="text-xs text-[#8b7566]">
                Educates patients on laboratory metrics without jargon, empowering meaningful conversations with their physicians.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-4xl mx-auto w-full">
        <div className="space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              HOSPITAL FAQs
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Details on appointment scheduling, medical data isolation, and clinical safety.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-[#2a201e] dark:text-[#fbf9f5] hover:text-[#e17145] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#8b7566] transition-transform ${openFaq === idx ? "rotate-180 text-[#e17145]" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed border-t border-[#dcd3c6]/60 dark:border-[#362f2a] pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Editorial Hospital Footer */}
      <Footer />

    </div>
  )
}
