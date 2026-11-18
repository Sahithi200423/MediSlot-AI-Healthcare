import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Sparkles,
  ChevronDown,
  Bot,
  HeartPulse,
  Stethoscope,
  Brain,
  Eye,
  Baby,
  Bone,
  Activity,
  FileText,
  ShieldCheck,
  MapPin,
  RotateCcw,
} from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import {
  InteractiveBookingModal,
  type BookingPreviewDoctor,
} from "@/components/booking/InteractiveBookingModal"
import { Skeleton } from "@/components/ui/Skeleton"
import { api, type Doctor } from "@/lib/api"
import { formatINR } from "@/lib/currency"
import {
  EDITORIAL_EASE,
  VIEWPORT_ONCE,
  cardRevealVariants,
  fadeUpVariants,
  staggerContainerVariants,
} from "@/lib/motion"

// Lazy-load the Three.js 3D Bio-Cellular Sculpture
const BioCellSculpture = lazy(() => import("@/components/3d/BioCellSculpture"))

interface DiscoveryDoctor extends BookingPreviewDoctor {
  experience: string
  nextAvailable: string
  city?: string
  isAccepting: boolean
}

function mapLiveDoctorToDiscovery(doc: Doctor): DiscoveryDoctor {
  const first = doc.profile?.firstName?.trim() || "Specialist"
  const last = doc.profile?.lastName?.trim() || ""
  const initials = `${first[0] || "D"}${last[0] || "R"}`.toUpperCase()
  return {
    id: doc.id,
    name: `Dr. ${first}${last ? ` ${last}` : ""}`,
    specialty: doc.specialty || "General Medicine",
    clinic: doc.clinic?.name || "MediSlot Partner Clinic",
    city: doc.clinic ? `${doc.clinic.city}, ${doc.clinic.state}` : undefined,
    experience:
      doc.yearsOfExperience > 0
        ? `${doc.yearsOfExperience} yrs clinical practice`
        : doc.qualifications || "Board Certified Clinician",
    nextAvailable: doc.isAcceptingPatients ? "Accepting Bookings" : "Waitlist Only",
    fee: doc.consultationFee,
    avatar: doc.profile?.avatarUrl || null,
    initials,
    isVerified: Boolean(doc.licenseVerified),
    isAccepting: doc.isAcceptingPatients !== false,
    isLive: true,
  }
}

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL")
  const [showAllDoctors, setShowAllDoctors] = useState(false)
  const [liveDoctors, setLiveDoctors] = useState<DiscoveryDoctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    async function loadDirectory() {
      setLoadingDoctors(true)
      setDirectoryError(null)
      try {
        const doctors = await api.getDoctors()
        if (!cancelled && Array.isArray(doctors)) {
          const sorted = [...doctors].sort(
            (a, b) =>
              Number(Boolean(b.licenseVerified)) - Number(Boolean(a.licenseVerified)) ||
              (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0)
          )
          setLiveDoctors(sorted.map(mapLiveDoctorToDiscovery))
        }
      } catch (err: any) {
        if (!cancelled) {
          setDirectoryError(
            err?.message || "Unable to reach the live physician directory right now."
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingDoctors(false)
        }
      }
    }
    loadDirectory()
    return () => {
      cancelled = true
    }
  }, [reloadNonce])

  const directoryDoctors = liveDoctors

  const specialtyChips = useMemo(() => {
    const unique = Array.from(new Set(directoryDoctors.map((d) => d.specialty).filter(Boolean)))
    return ["ALL", ...unique.slice(0, 6)]
  }, [directoryDoctors])

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return directoryDoctors.filter((d) => {
      const matchesSpec = selectedSpecialty === "ALL" || d.specialty === selectedSpecialty
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinic.toLowerCase().includes(q) ||
        (d.city ? d.city.toLowerCase().includes(q) : false)
      return matchesSpec && matchesQuery
    })
  }, [directoryDoctors, searchQuery, selectedSpecialty])

  const visibleDoctors = showAllDoctors ? filteredDoctors : filteredDoctors.slice(0, 4)

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
      q: "How is patient medical data protected?",
      a: "Yes. MediSlot enforces strict multi-tenant boundaries using Supabase Row-Level Security (RLS), encrypted private object storage for diagnostics, and comprehensive audit logs recording every clinician access event."
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
        doctors={directoryDoctors}
      />

      {/* ========================================================= */}
      {/* 1. HERO COMPOSITION MATCHING APPROVED SCREENSHOT */}
      {/* ========================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-8 sm:pt-12 pb-16">
        
        {/* TOP HERO GRID: Headline & Description + 3D Biological Sculpture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[460px]">
          
          {/* Left Hero Column: Headline, Bio, and Call to Action */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex flex-col justify-center space-y-6 z-10"
          >
            <motion.h1
              variants={fadeUpVariants}
              className="font-editorial-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-normal tracking-tight leading-[1.08] text-[#1e1815]"
            >
              ‘Where clinical excellence<br />
              meets human dignity.’
            </motion.h1>

            <motion.p
              variants={fadeUpVariants}
              className="text-base sm:text-lg leading-relaxed text-[#4a3e39] max-w-lg font-editorial-sans"
            >
              MediSlot is an advanced healthcare coordination platform providing real-time doctor scheduling, encrypted clinical records, and physician-supervised AI assistance.
            </motion.p>

            <motion.div variants={fadeUpVariants}>
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-8 py-3.5 text-sm sm:text-base font-medium shadow-md shadow-[#cb6440]/15 hover:shadow-lg hover:shadow-[#cb6440]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Book Consultation
              </button>
            </motion.div>
          </motion.div>

          {/* Right Hero Column: Interactive Three.js Healthcare Sculpture */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.72, delay: 0.12, ease: EDITORIAL_EASE }}
            className="lg:col-span-6 w-full h-[360px] sm:h-[440px] lg:h-[480px] relative flex items-center justify-center"
          >
            <Suspense 
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#8b7566]">
                  <div className="w-10 h-10 rounded-full border-2 border-[#cb6440] border-t-transparent animate-spin" />
                  <span className="text-xs uppercase tracking-wider font-editorial-sans">Rendering biological model...</span>
                </div>
              }
            >
              <BioCellSculpture />
            </Suspense>
          </motion.div>

        </div>

        {/* LOWER HERO GRID: Stats (Left 2-Cols) + Doctor Search & Doctor Cards (Right) */}
        <motion.div
          id="doctors"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mt-8 pt-8 border-t border-[#ece6dd] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start scroll-mt-24"
        >
          
          {/* Left: 2x2 Hospital Statistics Grid with Explicit Demo Label */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-x-6 gap-y-7 pt-1">
            <div className="col-span-2 text-[10px] uppercase tracking-[1.3px] text-[#8c7e77] font-semibold">
              Simulated Clinical Network (Demo)
            </div>

            <div>
              <p className="font-editorial-serif text-4xl sm:text-5xl text-[#1e1815] font-normal leading-none mb-1.5">
                1,250+
              </p>
              <p className="text-xs text-[#6e6059] font-editorial-sans font-medium">
                Board Certified Doctors
              </p>
            </div>

            <div>
              <p className="font-editorial-serif text-4xl sm:text-5xl text-[#1e1815] font-normal leading-none mb-1.5">
                98.4%
              </p>
              <p className="text-xs text-[#6e6059] font-editorial-sans font-medium">
                Patient Satisfaction
              </p>
            </div>

            <div>
              <p className="font-editorial-serif text-4xl sm:text-5xl text-[#1e1815] font-normal leading-none mb-1.5">
                45+
              </p>
              <p className="text-xs text-[#6e6059] font-editorial-sans font-medium">
                Specialty Clinics
              </p>
            </div>

            <div>
              <p className="font-editorial-serif text-4xl sm:text-5xl text-[#1e1815] font-normal leading-none mb-1.5">
                4.9★
              </p>
              <p className="text-xs text-[#6e6059] font-editorial-sans font-medium">
                Clinical Care Rating
              </p>
            </div>

            <p className="col-span-2 text-[10px] text-[#8c7e77] leading-tight italic pt-1">
              {liveDoctors.length > 0
                ? `* Showcase network metrics · ${liveDoctors.length} physicians loaded live from MediSlot directory`
                : "* Showcase network metrics · Connected to live MediSlot physician directory"}
            </p>
          </div>

          {/* Right: Wide Search Bar Pill + Specialty Filter Chips + Doctor Cards */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Wide Pill Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const match = filteredDoctors[0]
                handleOpenBooking(match?.id)
              }}
              className="w-full bg-white rounded-full border border-[#e4ded5] focus-within:border-[#cb6440] focus-within:ring-2 focus-within:ring-[#cb6440]/15 shadow-xs px-4 sm:px-5 py-2 flex items-center gap-3 transition-all"
            >
              <Search className="w-5 h-5 text-[#8c7e77] shrink-0" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, clinic, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search doctors"
                className="w-full bg-transparent text-sm text-[#1e1815] placeholder:text-[#8c7e77] focus:outline-none font-editorial-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#8c7e77] hover:text-[#1e1815] px-2 py-1 rounded-full transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="shrink-0 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 sm:px-6 py-2 text-sm font-medium transition-all cursor-pointer active:scale-[0.98]"
              >
                Find doctors
              </button>
            </form>

            {/* Specialty Filter Chips + Directory Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter doctors by specialty">
                {specialtyChips.map((chip) => {
                  const active = selectedSpecialty === chip
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSelectedSpecialty(chip)
                        setShowAllDoctors(false)
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${
                        active
                          ? "bg-[#cb6440] text-white border-[#cb6440] shadow-xs"
                          : "bg-white text-[#542f28] border-[#e4ded5] hover:border-[#cb6440]/60 hover:bg-[#fbf5f2]"
                      }`}
                    >
                      {chip === "ALL" ? "All Specialties" : chip}
                    </button>
                  )
                })}
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6e6059]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    directoryError
                      ? "bg-rose-500"
                      : liveDoctors.length > 0
                      ? "bg-[#4a6356]"
                      : "bg-[#c5a880]"
                  }`}
                />
                {loadingDoctors
                  ? "Loading live directory..."
                  : directoryError
                  ? "Directory temporarily unreachable"
                  : `${filteredDoctors.length} Live Specialists`}
              </span>
            </div>

            {/* Doctor Cards Grid: Loading Skeletons / Error Retry / Empty State / Live Doctor Cards */}
            {loadingDoctors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading physicians">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#e8e2d8] p-4 flex items-center gap-4"
                  >
                    <Skeleton rounded="xl" className="w-16 h-16 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex items-center justify-between pt-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : directoryError ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#e8e2d8] p-8 text-center space-y-3"
              >
                <div className="w-11 h-11 rounded-full bg-[#fbf5f2] text-[#cb6440] flex items-center justify-center mx-auto">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-xl text-[#1e1815]">
                    Live physician directory is waking up
                  </h3>
                  <p className="text-xs text-[#6e6059] mt-1 max-w-md mx-auto">
                    {directoryError} Click retry to load verified doctors directly from MediSlot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Live Directory
                </button>
              </motion.div>
            ) : filteredDoctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-dashed border-[#dcd3c6] p-8 text-center space-y-3"
              >
                <div className="w-11 h-11 rounded-full bg-[#f5f1e9] text-[#cb6440] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-xl text-[#1e1815]">
                    No matching physicians found
                  </h3>
                  <p className="text-xs text-[#6e6059] mt-1 max-w-md mx-auto">
                    We could not find specialists matching{" "}
                    {searchQuery ? <strong className="text-[#1e1815]">"{searchQuery}"</strong> : "your current filter"}
                    {selectedSpecialty !== "ALL" ? ` in ${selectedSpecialty}` : ""}. Try broadening your search or clearing filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedSpecialty("ALL")
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Search & Filters
                </button>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleDoctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleOpenBooking(doc.id)}
                      className="text-left bg-white rounded-2xl border border-[#e8e2d8] p-4 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-[#cb6440]/55 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                    >
                      {doc.avatar ? (
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-[#ebe4da] shrink-0 group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-br from-[#4a6356]/15 to-[#cb6440]/12 border border-[#e8e2d8] text-[#4a6356] flex items-center justify-center font-editorial-serif text-2xl shrink-0 group-hover:scale-[1.03] transition-transform duration-200">
                          {doc.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#1e1815] truncate group-hover:text-[#cb6440] transition-colors">
                            {doc.name}
                          </h3>
                          {doc.isVerified && (
                            <span
                              title="Verified Clinician"
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#4a6356] bg-[#4a6356]/10 px-1.5 py-0.5 rounded-full shrink-0"
                            >
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#cb6440] font-medium truncate mt-0.5">
                          {doc.specialty}
                        </p>
                        <p className="text-[11px] text-[#6e6059] truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#a28c7a] shrink-0" />
                          <span className="truncate">
                            {doc.clinic}
                            {doc.city ? ` · ${doc.city}` : ""}
                          </span>
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#f2ede4]">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4a6b5d] truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                doc.isAccepting ? "bg-[#4a6b5d]" : "bg-[#c5a880]"
                              }`}
                            />
                            <span className="truncate">{doc.nextAvailable}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-[#1e1815] bg-[#f5f1e9] px-2.5 py-0.5 rounded-full">
                            {formatINR(doc.fee)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredDoctors.length > 4 && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllDoctors((prev) => !prev)}
                      className="rounded-full border border-[#dcd3c6] bg-white hover:bg-[#f5f1e9] hover:border-[#cb6440]/50 px-5 py-1.5 text-xs font-semibold text-[#2a201e] transition-colors cursor-pointer"
                    >
                      {showAllDoctors
                        ? "Show fewer specialists"
                        : `View all ${filteredDoctors.length} specialists`}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>

        </motion.div>

      </section>

      {/* ========================================================= */}
      {/* 3. HOSPITAL CLINICAL DEPARTMENTS & SPECIALTIES */}
      {/* ========================================================= */}
      <section id="specialties" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-7xl mx-auto w-full scroll-mt-20">
        <div className="space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#e17145] font-bold">
              DEPARTMENTAL SPECIALTIES
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Comprehensive Care Across Fields
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Verified medical care supported by advanced clinical diagnostics and coordinated specialty referrals.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {specialties.map((spec, i) => {
              const Icon = spec.icon
              return (
                <motion.div
                  key={i}
                  variants={cardRevealVariants}
                  onClick={() => handleOpenBooking()}
                  className="p-6 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] hover:border-[#4a6b5d] hover:bg-white dark:hover:bg-[#1a1613] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full border border-[#4a6b5d]/30 bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] mb-4 group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5 text-[#e17145]" />
                    </div>
                    <h3 className="font-bold text-base text-[#2a201e] dark:text-[#fbf9f5] group-hover:text-[#4a6b5d] transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] mt-2 leading-relaxed">
                      {spec.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4a6b5d] dark:text-[#99aa77] mt-4 inline-flex items-center gap-1">
                    <span>{spec.count}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. THREE-STEP APPOINTMENT BOOKING PROCESS */}
      {/* ========================================================= */}
      <section id="about" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#f5f1e9]/60 dark:bg-[#1a1714]/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              EFFORTLESS ACCESS
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              How MediSlot Works
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              A refined three-step booking experience ensuring immediate confirmation with zero double-booking.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                01
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Search & Select</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Filter verified doctors by specialty, medical facility, consultation fee, and patient ratings.
              </p>
            </motion.div>

            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                02
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Real-Time Slot Lock</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Select your preferred 30-minute consultation slot. Our transactional engine prevents double-booking with row-level locks.
              </p>
            </motion.div>

            <motion.div
              variants={cardRevealVariants}
              className="p-8 rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] space-y-4 hover:border-[#c5a880] hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#ede5d9] dark:bg-[#2b2520] text-[#2a201e] dark:text-[#fbf9f5] font-bold flex items-center justify-center text-xs">
                03
              </span>
              <h3 className="font-bold text-lg text-[#2a201e] dark:text-[#fbf9f5]">Attend & Access Care</h3>
              <p className="text-xs text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed">
                Receive instant notifications, upload diagnostic records for physician review, and download signed digital prescriptions.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CLINICAL AI COPILOT & PATIENT HEALTH VAULT */}
      {/* ========================================================= */}
      <section id="ai-features" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#141210] text-[#fbf9f5] scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
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
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            
            {/* AI Document Extraction Card */}
            <motion.div
              variants={cardRevealVariants}
              className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4 hover:border-[#4a6b5d]/70 transition-colors duration-200"
            >
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
            </motion.div>

            {/* Patient AI Term Explainer Preview */}
            <motion.div
              variants={cardRevealVariants}
              className="rounded-2xl border border-[#362f2a] bg-[#1d1916] p-7 space-y-4 hover:border-[#c5a880]/60 transition-colors duration-200"
            >
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
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 px-6 sm:px-12 lg:px-16 border-b border-[#dcd3c6] dark:border-[#362f2a] max-w-4xl mx-auto w-full scroll-mt-20">
        <div className="space-y-10">
          
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center space-y-3"
          >
            <span className="text-[10px] uppercase tracking-[1.4px] text-[#4a6b5d] dark:text-[#99aa77] font-bold">
              HOSPITAL FAQs
            </span>
            <h2 className="font-editorial-serif text-4xl sm:text-5xl text-[#2a201e] dark:text-[#fbf9f5] tracking-[-0.02em]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#8b7566] dark:text-[#c4b5a8]">
              Details on appointment scheduling, medical data isolation, and clinical safety.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="space-y-4"
          >
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                variants={cardRevealVariants}
                className="rounded-2xl border border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] overflow-hidden hover:border-[#c5a880] transition-colors"
              >
                <button
                  type="button"
                  aria-expanded={openFaq === idx}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-sm sm:text-base text-[#2a201e] dark:text-[#fbf9f5] hover:text-[#e17145] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#8b7566] transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-[#e17145]" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#8b7566] dark:text-[#c4b5a8] leading-relaxed border-t border-[#dcd3c6]/60 dark:border-[#362f2a] pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Editorial Hospital Footer */}
      <Footer />

    </div>
  )
}
