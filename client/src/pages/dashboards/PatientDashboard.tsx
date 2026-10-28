import { useState, useEffect } from "react"
import { 
  Calendar, Clock, Search, FileText, 
  CheckCircle2, Upload, Plus, Building2, Stethoscope, 
  ChevronRight, Loader2, RefreshCw, XCircle,
  Eye, Check, ShieldCheck, Trash2, Key, Pill, Sparkles
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { useAuth } from "@/context/AuthContext"
import { 
  api, 
  type Doctor, 
  type Clinic, 
  type DoctorAvailabilityResult, 
  type Appointment, 
  type NotificationItem,
  type MedicalRecord,
  type Prescription
} from "@/lib/api"
import { toast } from "sonner"
import { BookingModal } from "@/components/booking/BookingModal"
import { AppointmentDetailsModal } from "@/components/booking/AppointmentDetailsModal"
import { RescheduleModal } from "@/components/booking/RescheduleModal"
import { CancelModal } from "@/components/booking/CancelModal"
import { UploadRecordModal } from "@/components/medical/UploadRecordModal"
import { RecordViewerModal } from "@/components/medical/RecordViewerModal"
import { DoctorAccessModal } from "@/components/medical/DoctorAccessModal"
import { PrescriptionViewerModal } from "@/components/medical/PrescriptionViewerModal"
import { AiConsentBanner } from "@/components/ai/AiConsentBanner"
import { LabReportAnalyzerModal } from "@/components/ai/LabReportAnalyzerModal"
import { PatientAiExplainerModal } from "@/components/ai/PatientAiExplainerModal"
import type { PatientAiConsentStatus } from "@/lib/api"

export function PatientDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("upcoming")

  // Real Medical Records & Prescriptions State (Phase Five)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordCategoryFilter, setRecordCategoryFilter] = useState<string>("ALL")

  const [isUploadRecordOpen, setIsUploadRecordOpen] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null)
  const [isRecordViewerOpen, setIsRecordViewerOpen] = useState(false)
  const [isDoctorAccessOpen, setIsDoctorAccessOpen] = useState(false)
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null)
  const [isPrescriptionViewerOpen, setIsPrescriptionViewerOpen] = useState(false)

  // Phase Six AI State
  const [aiConsent, setAiConsent] = useState<PatientAiConsentStatus | null>(null)
  const [isLabAnalyzerOpen, setIsLabAnalyzerOpen] = useState(false)
  const [analyzingRecord, setAnalyzingRecord] = useState<MedicalRecord | null>(null)
  const [isPatientAiOpen, setIsPatientAiOpen] = useState(false)

  // Real Appointments State
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [doctorToBook, setDoctorToBook] = useState<Doctor | null>(null)
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  // Real Providers State
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")

  // Real Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Real slot inspector state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [availability, setAvailability] = useState<DoctorAvailabilityResult | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Load appointments on mount and tab switch
  useEffect(() => {
    if (activeTab === "upcoming" || activeTab === "history") {
      loadAppointments()
    } else if (activeTab === "find-doctors") {
      fetchDoctorsAndClinics()
    } else if (activeTab === "notifications") {
      loadNotifications()
    } else if (activeTab === "documents") {
      loadMedicalRecordsAndPrescriptions()
    }
  }, [activeTab, selectedSpecialty])

  const loadMedicalRecordsAndPrescriptions = async () => {
    setLoadingRecords(true)
    try {
      const [records, rxList] = await Promise.all([
        api.getMyMedicalRecords(),
        api.getMyPrescriptions(),
      ])
      setMedicalRecords(records)
      setPrescriptions(rxList)

      if (user?.id) {
        api.getAiConsent(user.id).then(setAiConsent).catch(() => {})
      }
    } catch (err: any) {
      console.error("Failed to load records/prescriptions:", err)
      toast.error(err.message || "Failed to load medical records")
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm("Are you sure you want to delete this medical record? This cannot be undone.")) return
    try {
      await api.deleteMedicalRecord(recordId)
      setMedicalRecords((prev) => prev.filter((r) => r.id !== recordId))
      toast.success("Medical record deleted.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record")
    }
  }

  const loadAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const [upcoming, past] = await Promise.all([
        api.getMyAppointments("upcoming"),
        api.getMyAppointments("past"),
      ])
      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
    } catch (err: any) {
      console.error("Failed to load appointments:", err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const fetchDoctorsAndClinics = async () => {
    setLoadingProviders(true)
    try {
      const [docs, cls] = await Promise.all([
        api.getDoctors(selectedSpecialty === "all" ? undefined : selectedSpecialty, searchQuery || undefined),
        api.getClinics(),
      ])
      setDoctors(docs)
      setClinics(cls)
    } catch (err: any) {
      console.error("Failed to load doctors:", err)
    } finally {
      setLoadingProviders(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err: any) {
      console.error("Failed to load notifications:", err)
    }
  }

  const handleInspectSlots = async (doc: Doctor) => {
    setSelectedDoctor(doc)
    setLoadingSlots(true)
    try {
      const data = await api.getAvailability(doc.id, selectedDate)
      setAvailability(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate slots")
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    if (selectedDoctor) {
      setLoadingSlots(true)
      try {
        const data = await api.getAvailability(selectedDoctor.id, date)
        setAvailability(data)
      } catch (err: any) {
        toast.error(err.message || "Failed to calculate slots")
      } finally {
        setLoadingSlots(false)
      }
    }
  }

  const handleOpenBooking = (doc?: Doctor) => {
    setDoctorToBook(doc || null)
    setIsBookingOpen(true)
  }

  const handleBookingSuccess = () => {
    toast.success("Appointment reserved successfully!")
    loadAppointments()
    setActiveTab("upcoming")
  }

  const handleRescheduled = () => {
    toast.success("Appointment rescheduled successfully")
    loadAppointments()
  }

  const handleCancelled = () => {
    toast.success("Appointment cancelled")
    loadAppointments()
  }

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch {
      // silent
    }
  }

  const navItems: NavItem[] = [
    { id: "upcoming", label: "Upcoming Appointments", icon: Calendar, badge: upcomingAppointments.length || undefined },
    { id: "find-doctors", label: "Find Doctors & Book", icon: Search },
    { id: "history", label: "Appointment History", icon: Clock },
    { id: "documents", label: "Medical Records & Prescriptions", icon: FileText, badge: medicalRecords.length + prescriptions.length || undefined },
    { id: "notifications", label: "Notifications", icon: CheckCircle2, badge: unreadCount || undefined },
  ]

  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "Patient"

  return (
    <DashboardShell
      roleTitle="Patient Portal"
      roleColor="teal"
      userDisplayName={userDisplayName}
      userSubtitle={user?.email || "Authenticated Patient"}
      userAvatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* Tab: Upcoming Appointments */}
      {activeTab === "upcoming" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                Upcoming Appointments
              </h1>
              <p className="text-xs text-[#6e6059] mt-1 font-editorial-sans">
                Real-time booking confirmations from Supabase PostgreSQL.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => handleOpenBooking()} 
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2.5 text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" /> Book New Appointment
            </button>
          </div>

          {loadingAppointments ? (
            <div className="p-16 text-center text-[#8c7e77] text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#cb6440]" />
              <span>Fetching confirmed consultations from database...</span>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-[#e4ded5] bg-white rounded-3xl">
              <Calendar className="w-10 h-10 text-[#cb6440]/40 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-[#1e1815]">No Upcoming Consultations</h3>
              <p className="text-xs text-[#6e6059] mt-1 max-w-sm mx-auto">
                You have no scheduled appointments at this time. Browse our directory of specialist physicians to reserve your slot.
              </p>
              <button 
                type="button"
                className="mt-4 rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-2"
                onClick={() => setActiveTab("find-doctors")}
              >
                <Search className="w-4 h-4" /> Browse Doctor Directory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {upcomingAppointments.map((apt) => {
                const start = new Date(apt.scheduledStart)
                return (
                  <div key={apt.id} className="bg-white rounded-2xl border border-[#e8e2d8] border-l-4 border-l-[#4a6356] p-5 space-y-4 shadow-2xs hover:border-[#cb6440]/40 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#4a6356]/10 text-[#4a6356] flex items-center justify-center font-bold text-base shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-semibold text-[#cb6440]">
                            {apt.bookingReference}
                          </span>
                          <h3 className="font-bold text-sm text-[#1e1815]">
                            Dr. {apt.doctor?.profile.firstName} {apt.doctor?.profile.lastName}
                          </h3>
                          <p className="text-xs text-[#6e6059]">{apt.doctor?.specialty} • {apt.clinic?.name}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        apt.status === "CONFIRMED" 
                          ? "bg-[#4a6356]/15 text-[#4a6356] border border-[#4a6356]/30" 
                          : "bg-[#cb6440]/15 text-[#cb6440] border border-[#cb6440]/30"
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f8f5ee] border border-[#ece6dd] text-xs">
                      <div>
                        <span className="text-[#8c7e77] block text-[11px]">Date & Time</span>
                        <span className="font-semibold text-[#1e1815] block mt-0.5">
                          {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[11px] text-[#4a6356] font-bold">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8c7e77] block text-[11px]">Consultation Format</span>
                        <span className="font-semibold text-[#1e1815] block mt-0.5">
                          {apt.visitType === "VIDEO_VISIT" ? "Telehealth Video" : "In-Clinic Visit"}
                        </span>
                        <span className="text-[11px] text-[#8c7e77]">
                          Fee: ${Number(apt.consultationFee).toFixed(2)} ({apt.paymentMethod === "PAY_AT_CLINIC" ? "Pay at Clinic" : "Pending"})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f2ede4]">
                      <button 
                        type="button"
                        className="text-xs font-medium text-[#6e6059] hover:text-[#1e1815] flex items-center gap-1.5 cursor-pointer"
                        onClick={() => {
                          setSelectedAppointment(apt)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          className="rounded-full border border-[#dcd3c6] bg-white px-3 py-1 text-xs font-medium text-[#1e1815] hover:border-[#cb6440] transition-colors flex items-center gap-1 cursor-pointer"
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setIsRescheduleOpen(true)
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                        </button>
                        <button 
                          type="button"
                          className="rounded-full border border-rose-200 bg-rose-50/50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setIsCancelOpen(true)
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Find Doctors & Book */}
      {activeTab === "find-doctors" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                Find Doctors & Book Slots
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">Live schedule calculation and atomic double-booking protection.</p>
            </div>
            <button 
              type="button"
              onClick={() => handleOpenBooking()} 
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2.5 text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" /> Start 5-Step Booking
            </button>
          </div>

          {/* Search Bar & Specialty Filter */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8e2d8] shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#8c7e77] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDoctorsAndClinics()}
                placeholder="Search doctor by name or clinical specialty..."
                className="w-full rounded-full border border-[#e4ded5] bg-[#fbf9f5] pl-9 pr-4 py-2 text-xs text-[#1e1815] focus:outline-none focus:border-[#cb6440]"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-full border border-[#e4ded5] bg-white px-4 py-2 text-xs text-[#1e1815] focus:outline-none focus:border-[#cb6440]"
            >
              <option value="all">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Neurology">Neurology</option>
              <option value="General Medicine">General Medicine</option>
            </select>

            <button 
              type="button"
              onClick={fetchDoctorsAndClinics} 
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> Filter
            </button>
          </div>

          {/* Partner Clinics Banner */}
          {clinics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#8c7e77] uppercase tracking-wider">Partner Healthcare Clinics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="p-3.5 rounded-xl border border-[#e8e2d8] bg-white flex items-center gap-3 shadow-2xs">
                    <div className="w-9 h-9 rounded-lg bg-[#4a6356]/10 text-[#4a6356] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#1e1815] truncate">{clinic.name}</p>
                      <p className="text-[11px] text-[#6e6059] truncate">{clinic.city}, {clinic.state} • {clinic.operatingHours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Grid */}
          {loadingProviders ? (
            <div className="p-12 text-center text-[#8c7e77] text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#cb6440]" />
              <span>Fetching verified healthcare providers...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-[#e4ded5] bg-white rounded-2xl">
              <Stethoscope className="w-8 h-8 text-[#8c7e77] mx-auto mb-2" />
              <p className="font-semibold text-xs text-[#1e1815]">No doctors match this search</p>
              <p className="text-[11px] text-[#6e6059] mt-1">Try resetting the specialty or search filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className={`p-5 bg-white rounded-2xl border transition-all shadow-2xs ${selectedDoctor?.id === doc.id ? "border-[#cb6440] ring-1 ring-[#cb6440]" : "border-[#e8e2d8] hover:border-[#cb6440]/50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#f5f1e9] text-[#1e1815] flex items-center justify-center font-bold text-base shrink-0 border border-[#e8e2d8]">
                        {doc.profile.firstName.charAt(0)}{doc.profile.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1e1815]">
                          Dr. {doc.profile.firstName} {doc.profile.lastName}
                        </h4>
                        <p className="text-xs font-medium text-[#cb6440]">{doc.specialty}</p>
                        <p className="text-[11px] text-[#6e6059]">{doc.clinic?.name || "Independent Practitioner"}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      doc.licenseVerified ? "bg-[#4a6356]/15 text-[#4a6356]" : "bg-[#ede5d9] text-[#6e6059]"
                    }`}>
                      {doc.licenseVerified ? "Verified MD" : "Audit Pending"}
                    </span>
                  </div>

                  {doc.bio && (
                    <p className="text-xs text-[#6e6059] mt-3 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-[#f2ede4]">
                    <div>
                      <span className="text-[#8c7e77] text-[10px] block font-medium">Consultation Fee</span>
                      <span className="font-bold text-[#1e1815]">${Number(doc.consultationFee).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectSlots(doc)}
                        className="rounded-full border border-[#dcd3c6] bg-white px-3.5 py-1.5 text-xs text-[#1e1815] hover:border-[#cb6440] transition-colors cursor-pointer"
                      >
                        Inspect Slots
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBooking(doc)}
                        className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-1.5 text-xs font-semibold gap-1 inline-flex items-center shadow-xs cursor-pointer transition-colors"
                      >
                        Book Now <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Availability Inspector Panel */}
          {selectedDoctor && (
            <div className="p-6 rounded-2xl border border-[#cb6440]/30 bg-white shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
                <div>
                  <h3 className="font-bold text-sm text-[#1e1815]">
                    Live Booking Slots: Dr. {selectedDoctor.profile.firstName} {selectedDoctor.profile.lastName}
                  </h3>
                  <p className="text-xs text-[#6e6059] mt-0.5">
                    {selectedDoctor.specialty} • Consultation Duration: 30 mins
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6e6059] font-medium">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="rounded-full border border-[#e4ded5] bg-[#fbf9f5] px-3.5 py-1.5 text-xs font-semibold text-[#1e1815] focus:outline-none focus:border-[#cb6440]"
                  />
                  <button 
                    type="button"
                    onClick={() => handleOpenBooking(selectedDoctor)}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ml-2"
                  >
                    Book This Doctor
                  </button>
                </div>
              </div>

              {loadingSlots ? (
                <div className="p-8 text-center text-xs text-[#8c7e77] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#cb6440]" />
                  <span>Calculating real slot availability against working hours and breaks...</span>
                </div>
              ) : availability?.status === "ON_LEAVE" ? (
                <div className="p-6 text-center text-xs">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-2 inline-block">Doctor On Leave</span>
                  <p className="font-semibold text-[#1e1815]">
                    Dr. {selectedDoctor.profile.firstName} is unavailable on {selectedDate}.
                  </p>
                  <p className="text-[#8c7e77] text-[11px] mt-1">{availability.leaveReason || "Scheduled Leave"}</p>
                </div>
              ) : availability?.status === "OFF_DUTY" ? (
                <div className="p-6 text-center text-xs">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ede5d9] text-[#6e6059] mb-2 inline-block">No Scheduled Shifts</span>
                  <p className="font-semibold text-[#1e1815]">
                    The doctor does not have working hours configured for this day of the week.
                  </p>
                  <p className="text-[#8c7e77] text-[11px] mt-1">Please select another date on the calendar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6e6059]">
                      Found <strong className="text-[#4a6356]">{availability?.availableSlotsCount} available</strong> of {availability?.totalSlots} total generated slots
                    </span>
                    <span className="text-[11px] text-[#8c7e77]">Timezone: UTC</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {availability?.slots?.map((slot, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (slot.available) {
                            handleOpenBooking(selectedDoctor)
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          slot.available
                            ? "border-[#4a6356]/40 bg-[#4a6356]/10 text-[#4a6356] hover:bg-[#4a6356] hover:text-white cursor-pointer"
                            : "border-[#e8e2d8] bg-[#f8f5ee] text-[#8c7e77] cursor-not-allowed opacity-60"
                        }`}
                      >
                        <span className="font-bold text-xs block">{slot.time}</span>
                        <span className="text-[10px] block mt-0.5">
                          {slot.available ? "Open" : slot.reason || "Booked"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Appointment History */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
              Appointment History
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">Past completed and cancelled medical consultations in Supabase.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8f5ee] text-[#6e6059] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Physician</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Facility</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ede4]">
                  {pastAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8c7e77] italic">
                        No previous appointment history found.
                      </td>
                    </tr>
                  ) : (
                    pastAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-[#fbf9f5]">
                        <td className="p-4 font-mono font-bold text-[#cb6440]">{apt.bookingReference}</td>
                        <td className="p-4 font-bold text-[#1e1815]">
                          Dr. {apt.doctor?.profile.firstName} {apt.doctor?.profile.lastName}
                        </td>
                        <td className="p-4 text-[#6e6059]">
                          {new Date(apt.scheduledStart).toLocaleDateString()} at {new Date(apt.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-[#4a3e39]">{apt.clinic?.name}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            apt.status === "COMPLETED" 
                              ? "bg-[#4a6356]/15 text-[#4a6356]" 
                              : "bg-[#ede5d9] text-[#6e6059]"
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-[#1e1815]">
                          ${Number(apt.consultationFee).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Medical Documents */}
      {activeTab === "documents" && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                  Medical Records & Prescriptions
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4a6356]/15 text-[#4a6356] border border-[#4a6356]/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Encrypted Vault
                </span>
              </div>
              <p className="text-xs text-[#6e6059] mt-1">
                Upload reports, view lab tests, and access official doctor-issued digital prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start flex-wrap">
              <button
                type="button"
                onClick={() => setIsPatientAiOpen(true)}
                className="rounded-full border border-[#8c6b3e]/40 bg-[#fbf5ee] text-[#8c6b3e] hover:bg-[#f5ece0] px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8c6b3e]" />
                AI Health Explainer
              </button>
              <button
                type="button"
                onClick={() => setIsDoctorAccessOpen(true)}
                className="rounded-full border border-[#dcd3c6] bg-white text-[#1e1815] hover:border-[#cb6440] px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-[#cb6440]" />
                Doctor Permissions
              </button>
              <button
                type="button"
                onClick={() => setIsUploadRecordOpen(true)}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
            </div>
          </div>

          {/* AI Consent & Safety Status Banner */}
          <AiConsentBanner
            patientId={user?.id || ""}
            consentStatus={aiConsent}
            onConsentChange={setAiConsent}
          />

          {/* SECTION 1: Patient Medical Documents */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1e1815] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#cb6440]" />
                <span>Uploaded Medical Records ({medicalRecords.length})</span>
              </h2>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "LAB_REPORT", "PRESCRIPTION", "IMAGING_SCAN", "DISCHARGE_SUMMARY", "VACCINATION_RECORD", "OTHER"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setRecordCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                      recordCategoryFilter === cat
                        ? "bg-[#cb6440] text-white font-semibold"
                        : "bg-white border border-[#e8e2d8] text-[#6e6059] hover:bg-[#f8f5ee]"
                    }`}
                  >
                    {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {loadingRecords ? (
              <div className="py-12 text-center text-xs text-[#8c7e77]">Loading your medical records vault...</div>
            ) : medicalRecords.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#e4ded5] bg-white rounded-2xl">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="p-3.5 w-fit mx-auto rounded-2xl bg-[#4a6356]/10 text-[#4a6356]">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1e1815]">Your Medical Vault is Empty</h3>
                    <p className="text-xs text-[#6e6059] mt-1">
                      Upload lab tests, doctor prescriptions, or imaging reports. Documents are stored in an encrypted private bucket and accessible only to you and authorized doctors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUploadRecordOpen(true)}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Your First Document
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicalRecords
                  .filter((rec) => recordCategoryFilter === "ALL" || rec.category === recordCategoryFilter)
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-2xl border border-[#e8e2d8] p-4.5 flex flex-col justify-between hover:border-[#cb6440]/50 transition-all shadow-2xs group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-[#f8f5ee] text-[#cb6440] border border-[#ece6dd] shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-[#1e1815] truncate">
                                {rec.title}
                              </h4>
                              <p className="text-[10px] text-[#8c7e77] truncate">{rec.fileName}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#f5f1e9] text-[#6e6059] shrink-0">
                            {rec.category.replace(/_/g, " ")}
                          </span>
                        </div>

                        {rec.description && (
                          <p className="text-[11px] text-[#6e6059] line-clamp-2">
                            {rec.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-[#8c7e77] pt-1 border-t border-[#f2ede4]">
                          <span>{(rec.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(rec.createdAt).toLocaleDateString()}</span>
                          <span className="text-[#4a6356] font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Clean
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#f2ede4]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingRecord(rec)
                              setIsRecordViewerOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#1e1815] hover:bg-[#f8f5ee] border border-[#e8e2d8] transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8c7e77]" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAnalyzingRecord(rec)
                              setIsLabAnalyzerOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#cb6440] hover:bg-[#fbf5f2] border border-[#cb6440]/30 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#cb6440]" />
                            <span>AI Analyze</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 text-[#8c7e77] hover:text-rose-600 rounded-full transition cursor-pointer"
                          title="Delete Medical Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Official Physician Digital Prescriptions */}
          <div className="space-y-4 pt-4 border-t border-[#ece6dd]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1e1815] flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#4a6356]" />
              <span>Doctor Prescriptions ({prescriptions.length})</span>
            </h2>

            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8c7e77] italic bg-white rounded-2xl border border-[#e8e2d8]">
                No digital prescriptions issued yet. Consultations with licensed physicians will appear here with official PDF records.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-white rounded-2xl border border-[#e8e2d8] p-5 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#4a6356]/40 transition">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/20">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#cb6440]">
                              {rx.prescriptionNumber}
                            </span>
                            <h4 className="text-xs font-bold text-[#1e1815]">
                              Dr. {rx.doctor?.profile.firstName} {rx.doctor?.profile.lastName}
                            </h4>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f8f5ee] text-[#6e6059]">
                          {new Date(rx.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {rx.diagnosis && (
                        <p className="text-xs text-[#4a3e39]">
                          <span className="font-semibold text-[#8c7e77]">Diagnosis:</span> {rx.diagnosis}
                        </p>
                      )}

                      <div className="p-3 rounded-xl bg-[#f8f5ee] border border-[#ece6dd] text-[11px] text-[#6e6059] space-y-1">
                        <p className="font-semibold text-[#1e1815]">Medications ({rx.items.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rx.items.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#e4ded5] text-[#1e1815] text-[10px]">
                              {item.medicineName} ({item.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#f2ede4]">
                      <span className="text-[10px] text-[#8c7e77]">
                        {rx.clinic?.name || "MediSlot Hospital Network"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setViewingPrescription(rx)
                          setIsPrescriptionViewerOpen(true)
                        }}
                        className="rounded-full border border-[#dcd3c6] bg-white px-4 py-1.5 text-xs text-[#1e1815] hover:border-[#cb6440] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#cb6440]" />
                        <span>View Official PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                Patient Notifications
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">Real-time alerts stored in Supabase PostgreSQL.</p>
            </div>
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#cb6440]/15 text-[#cb6440]">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-[#8c7e77] italic py-4">No notifications at this time.</p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4.5 rounded-2xl border flex items-start justify-between gap-3 transition-all ${
                    n.isRead 
                      ? "border-[#e8e2d8] bg-white" 
                      : "border-[#cb6440]/30 bg-[#fbf5f2]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${n.isRead ? "text-[#8c7e77]" : "text-[#cb6440]"}`} />
                    <div>
                      <h4 className="text-xs font-bold text-[#1e1815]">{n.title}</h4>
                      <p className="text-xs text-[#6e6059] mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-[#8c7e77] mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button 
                      type="button"
                      className="text-[11px] text-[#cb6440] hover:underline flex items-center gap-1 cursor-pointer"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctor={doctorToBook}
        clinics={clinics}
        onBookingSuccess={handleBookingSuccess}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        appointment={selectedAppointment}
        onOpenReschedule={(apt) => {
          setSelectedAppointment(apt)
          setIsRescheduleOpen(true)
        }}
        onOpenCancel={(apt) => {
          setSelectedAppointment(apt)
          setIsCancelOpen(true)
        }}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        appointment={selectedAppointment}
        onRescheduled={handleRescheduled}
      />

      <CancelModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        appointment={selectedAppointment}
        onCancelled={handleCancelled}
      />

      {/* Phase Five Modals */}
      <UploadRecordModal
        isOpen={isUploadRecordOpen}
        onClose={() => setIsUploadRecordOpen(false)}
        onSuccess={(rec) => {
          setMedicalRecords((prev) => [rec, ...prev])
          toast.success("Medical record encrypted and saved to your vault.")
        }}
      />

      <RecordViewerModal
        isOpen={isRecordViewerOpen}
        record={viewingRecord}
        onClose={() => {
          setIsRecordViewerOpen(false)
          setViewingRecord(null)
        }}
      />

      <DoctorAccessModal
        isOpen={isDoctorAccessOpen}
        onClose={() => setIsDoctorAccessOpen(false)}
      />

      <PrescriptionViewerModal
        isOpen={isPrescriptionViewerOpen}
        prescription={viewingPrescription}
        onClose={() => {
          setIsPrescriptionViewerOpen(false)
          setViewingPrescription(null)
        }}
      />

      <LabReportAnalyzerModal
        isOpen={isLabAnalyzerOpen}
        record={analyzingRecord}
        onClose={() => {
          setIsLabAnalyzerOpen(false)
          setAnalyzingRecord(null)
        }}
      />

      <PatientAiExplainerModal
        isOpen={isPatientAiOpen}
        patientId={user?.id || ""}
        onClose={() => setIsPatientAiOpen(false)}
      />
    </DashboardShell>
  )
}
