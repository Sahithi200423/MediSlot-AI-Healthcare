import { useState, useEffect, useMemo, useDeferredValue, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import {
  Search,
  RotateCcw,
} from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import {
  DoctorDirectoryCard,
  type DiscoveryDoctor,
} from "@/components/landing/DoctorDirectoryCard"
import { processDoctorDirectory } from "@/lib/doctorDirectory"

// Lazy-load below-the-fold content to slash initial client DOM creation task
const BelowTheFoldLanding = lazy(() => import("@/components/landing/BelowTheFoldLanding"))

// Intent-based prefetching for 5-Step Interactive Booking Engine Modal
let bookingModalPromise: Promise<typeof import("@/components/booking/InteractiveBookingModal")> | null = null
export function prefetchBookingModal() {
  if (!bookingModalPromise) {
    bookingModalPromise = import("@/components/booking/InteractiveBookingModal")
  }
  return bookingModalPromise
}

const InteractiveBookingModal = lazy(() =>
  prefetchBookingModal().then((m) => ({
    default: m.InteractiveBookingModal,
  }))
)

function BookingModalSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1815]/50 backdrop-blur-xs font-editorial-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Loading Booking Wizard"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#fbf9f5] border border-[#e8e2d8] shadow-2xl p-6 sm:p-8 space-y-4 animate-pulse">
        <div className="h-6 w-1/2 bg-[#e8e2d8] rounded-md" />
        <div className="h-4 w-3/4 bg-[#ece6dd] rounded-md" />
        <div className="h-32 bg-[#f0eae1] rounded-2xl" />
        <div className="flex justify-between items-center pt-4">
          <div className="h-9 w-24 bg-[#e8e2d8] rounded-full" />
          <div className="h-9 w-32 bg-[#cb6440]/30 rounded-full" />
        </div>
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/Skeleton"
import { api, type Doctor } from "@/lib/api"
import {
  VIEWPORT_ONCE,
  fadeUpVariants,
} from "@/lib/motion"

// Lazy-load the Three.js 3D Bio-Cellular Sculpture
import { SculptureStaticFallback } from "@/components/3d/SculptureStaticFallback"
const BioCellSculpture = lazy(() => import("@/components/3d/BioCellSculpture"))

function mapLiveDoctorToDiscovery(doc: Doctor, affiliatedClinics: string[] = []): DiscoveryDoctor {
  const first = doc.profile?.firstName?.trim() || "Specialist"
  const last = doc.profile?.lastName?.trim() || ""
  const initials = `${first[0] || "D"}${last[0] || "R"}`.toUpperCase()

  const clinicSet = new Set<string>()
  if (doc.clinic?.name) clinicSet.add(doc.clinic.name)
  for (const c of affiliatedClinics) {
    if (c) clinicSet.add(c)
  }
  const clinics = Array.from(clinicSet)
  const primaryClinic = doc.clinic?.name || clinics[0] || "MediSlot Partner Clinic"
  const affiliatedCount = Math.max(0, clinics.length - 1)
  const clinicDisplay = affiliatedCount > 0
    ? `${primaryClinic} (+${affiliatedCount} affiliated clinic${affiliatedCount > 1 ? 's' : ''})`
    : primaryClinic

  return {
    id: doc.id,
    name: `Dr. ${first}${last ? ` ${last}` : ""}`,
    specialty: doc.specialty || "General Medicine",
    clinic: primaryClinic,
    city: doc.clinic ? `${doc.clinic.city}, ${doc.clinic.state}` : undefined,
    clinics,
    clinicDisplay,
    affiliatedCount,
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
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768)
    let ticking = false
    const handleResize = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsDesktop(window.innerWidth >= 768)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL")

  // Debounce search query to prevent main-thread lag during fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Deferred value ensures non-blocking UI response during rapid typing
  const deferredSearch = useDeferredValue(debouncedSearch)

  const [showAllDoctors, setShowAllDoctors] = useState(false)
  const [liveDoctors, setLiveDoctors] = useState<DiscoveryDoctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)

  // Booking modal lifecycle and prefetching state
  const [hasOpenedBookingModal, setHasOpenedBookingModal] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined)

  // Warm booking wizard chunk during idle period so first click is instantaneous
  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(() => {
        prefetchBookingModal()
      })
      return () => (window as any).cancelIdleCallback(handle)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadDirectory() {
      setLoadingDoctors(true)
      setDirectoryError(null)
      try {
        const rawDoctors = await api.getDoctors()
        if (!cancelled && Array.isArray(rawDoctors)) {
          // Process directory: presentation-layer synthetic filter + stable identity deduplication
          const processed = processDoctorDirectory(rawDoctors)
          const uniqueList: DiscoveryDoctor[] = processed.map((doc) => {
            const extraClinics = (doc.affiliatedClinics || []).map((c) => c.name).filter(Boolean)
            return mapLiveDoctorToDiscovery(doc, extraClinics)
          })

          const sorted = uniqueList.sort(
            (a, b) =>
              Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified)) ||
              (b.experience ? 0 : 1)
          )
          setLiveDoctors(sorted)
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
    const q = deferredSearch.trim().toLowerCase()
    return directoryDoctors.filter((d) => {
      const matchesSpec =
        selectedSpecialty === "ALL" ||
        d.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      const matchesClinic = d.clinics.some((c) => c.toLowerCase().includes(q))
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinic.toLowerCase().includes(q) ||
        matchesClinic ||
        (d.city ? d.city.toLowerCase().includes(q) : false)
      return matchesSpec && matchesQuery
    })
  }, [directoryDoctors, deferredSearch, selectedSpecialty])

  const visibleDoctors = showAllDoctors ? filteredDoctors : filteredDoctors.slice(0, 4)

  const handleOpenBooking = (docId?: string) => {
    setSelectedDoctorId(docId)
    setHasOpenedBookingModal(true)
    setIsBookingModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] dark:bg-[#141210] text-[#542f28] dark:text-[#f5f1e9] font-editorial-sans transition-colors selection:bg-[#ede4d5] selection:text-[#2a201e]">
      
      {/* Editorial Navigation with Topline Identity */}
      <Navbar onOpenBooking={() => handleOpenBooking()} onPrefetchBooking={prefetchBookingModal} />

      {/* 5-Step Interactive Booking Engine Modal (Lazy-Loaded with Intent Prefetch & Fallback) */}
      {hasOpenedBookingModal && (
        <Suspense fallback={<BookingModalSkeleton />}>
          <InteractiveBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            initialDoctorId={selectedDoctorId}
            doctors={directoryDoctors}
          />
        </Suspense>
      )}

      {/* ========================================================= */}
      {/* 1. HERO COMPOSITION MATCHING APPROVED SCREENSHOT */}
      {/* ========================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-8 sm:pt-12 pb-16">
        
        {/* TOP HERO GRID: Headline & Description + 3D Biological Sculpture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[460px]">
          
          {/* Left Hero Column: Headline, Bio, and Call to Action */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 z-10">
            <h1 className="font-editorial-serif text-5xl sm:text-6xl lg:text-[4.2rem] font-normal tracking-tight leading-[1.08] text-[#1e1815]">
              ‘Where clinical excellence<br />
              meets human dignity.’
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#4a3e39] max-w-lg font-editorial-sans">
              MediSlot is an advanced healthcare coordination platform providing real-time doctor scheduling, encrypted clinical records, and physician-supervised AI assistance.
            </p>

            <div>
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                onPointerEnter={prefetchBookingModal}
                onFocus={prefetchBookingModal}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-8 py-3.5 text-sm sm:text-base font-medium shadow-md shadow-[#cb6440]/15 hover:shadow-lg hover:shadow-[#cb6440]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Book Consultation
              </button>
            </div>
          </div>

          {/* Right Hero Column: Interactive Three.js Healthcare Sculpture on Desktop, High-Fidelity Static Sculpture on Mobile */}
          <div className="lg:col-span-6 w-full h-[360px] sm:h-[440px] lg:h-[480px] relative flex items-center justify-center">
            {isDesktop ? (
              <Suspense fallback={<SculptureStaticFallback />}>
                <BioCellSculpture />
              </Suspense>
            ) : (
              <SculptureStaticFallback />
            )}
          </div>

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
                    <DoctorDirectoryCard
                      key={doc.id}
                      doctor={doc}
                      onSelect={(id) => handleOpenBooking(id)}
                      onPrefetchBooking={prefetchBookingModal}
                    />
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

      {/* Below-the-fold content lazy-loaded to cut initial client DOM mounting task */}
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <BelowTheFoldLanding onOpenBooking={handleOpenBooking} />
      </Suspense>

    </div>
  )
}
