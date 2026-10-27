import { useState, useEffect } from "react"
import { 
  Calendar, Clock, User, Search, CreditCard, FileText, 
  Bell, CheckCircle2, Upload, Plus, Building2, Stethoscope, 
  ChevronRight, Loader2, RefreshCw, XCircle,
  Eye, Check, ShieldCheck, Trash2, Key, Pill, Sparkles
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
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
      console.warn("Medical records load notice:", err.message)
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm("Are you sure you want to delete this medical record? This action permanently purges the file from the secure medical vault.")) {
      return
    }
    try {
      await api.deleteMedicalRecord(recordId)
      toast.success("Medical record deleted permanently.")
      setMedicalRecords((prev) => prev.filter((r) => r.id !== recordId))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete medical record")
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
      console.warn("Appointments notice:", err.message)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications()
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (err: any) {
      console.warn("Notifications notice:", err.message)
    }
  }

  const fetchDoctorsAndClinics = async () => {
    setLoadingProviders(true)
    try {
      const [fetchedDocs, fetchedClinics] = await Promise.all([
        api.getDoctors(selectedSpecialty, searchQuery),
        api.getClinics(),
      ])
      setDoctors(fetchedDocs)
      setClinics(fetchedClinics)
    } catch (err: any) {
      toast.error("Failed to load providers", { description: err.message })
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleInspectSlots = async (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setLoadingSlots(true)
    try {
      const res = await api.getAvailability(doctor.id, selectedDate)
      setAvailability(res)
    } catch (err: any) {
      toast.error("Could not fetch slots", { description: err.message })
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    if (!selectedDoctor) return
    setLoadingSlots(true)
    try {
      const res = await api.getAvailability(selectedDoctor.id, date)
      setAvailability(res)
    } catch (err: any) {
      toast.error("Could not fetch slots", { description: err.message })
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleOpenBooking = (doctor?: Doctor) => {
    setDoctorToBook(doctor || (doctors.length > 0 ? doctors[0] : null))
    setIsBookingOpen(true)
  }

  const handleBookingSuccess = (newApt: Appointment) => {
    setUpcomingAppointments((prev) => [newApt, ...prev])
    loadNotifications()
  }

  const handleRescheduled = (updatedApt: Appointment) => {
    setUpcomingAppointments((prev) =>
      prev.map((apt) => (apt.id === updatedApt.id ? updatedApt : apt))
    )
    loadNotifications()
  }

  const handleCancelled = (cancelledApt: Appointment) => {
    setUpcomingAppointments((prev) =>
      prev.filter((apt) => apt.id !== cancelledApt.id)
    )
    setPastAppointments((prev) => [cancelledApt, ...prev])
    loadNotifications()
  }

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {}
  }

  const navItems: NavItem[] = [
    { id: "upcoming", label: "Upcoming Appointments", icon: Calendar, badge: upcomingAppointments.length || undefined },
    { id: "find-doctors", label: "Find & Book Doctors", icon: Search },
    { id: "history", label: "Appointment History", icon: Clock },
    { id: "documents", label: "Medical Documents", icon: FileText, badge: (medicalRecords.length + prescriptions.length) || undefined },
    { id: "payments", label: "Billing & Payments", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount || undefined },
    { id: "profile", label: "My Medical Profile", icon: User },
  ]

  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "Patient"

  return (
    <DashboardShell
      roleTitle="Patient Portal"
      roleColor="sky"
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upcoming Appointments</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time booking confirmations from Supabase PostgreSQL.
              </p>
            </div>
            <Button 
              variant="teal" 
              size="sm" 
              onClick={() => handleOpenBooking()} 
              className="gap-2 self-start shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" /> Book New Appointment
            </Button>
          </div>

          {loadingAppointments ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span>Fetching confirmed consultations from database...</span>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Calendar className="w-10 h-10 text-teal-600/40 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Upcoming Consultations</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You have no scheduled appointments at this time. Browse our directory of specialist physicians to reserve your slot.
              </p>
              <Button 
                variant="teal" 
                size="sm" 
                className="mt-4 gap-2 text-xs"
                onClick={() => setActiveTab("find-doctors")}
              >
                <Search className="w-4 h-4" /> Browse Doctor Directory
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {upcomingAppointments.map((apt) => {
                const start = new Date(apt.scheduledStart)
                return (
                  <Card key={apt.id} className="border-l-4 border-l-teal-500 shadow-sm hover:border-teal-500 transition-all">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-base shrink-0">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400">
                              {apt.bookingReference}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              Dr. {apt.doctor?.profile.firstName} {apt.doctor?.profile.lastName}
                            </h3>
                            <p className="text-xs text-slate-500">{apt.doctor?.specialty} • {apt.clinic?.name}</p>
                          </div>
                        </div>
                        <Badge variant={apt.status === "CONFIRMED" ? "teal" : "info"}>
                          {apt.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Date & Time</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                            {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="text-[11px] text-teal-600 font-bold">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Consultation Format</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                            {apt.visitType === "VIDEO_VISIT" ? "Telehealth Video" : "In-Clinic Visit"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Fee: ${Number(apt.consultationFee).toFixed(2)} ({apt.paymentMethod === "PAY_AT_CLINIC" ? "Pay at Clinic" : "Pending"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs gap-1.5 px-2 text-slate-500"
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setIsDetailsOpen(true)
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs gap-1"
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setIsRescheduleOpen(true)
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="text-xs gap-1"
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setIsCancelOpen(true)
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Doctors & Book Slots</h1>
              <p className="text-xs text-slate-500 mt-1">Live schedule calculation and atomic double-booking protection.</p>
            </div>
            <Button 
              variant="teal" 
              size="sm" 
              onClick={() => handleOpenBooking()} 
              className="gap-2 self-start"
            >
              <Plus className="w-4 h-4" /> Start 5-Step Booking
            </Button>
          </div>

          {/* Search Bar & Specialty Filter */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDoctorsAndClinics()}
                placeholder="Search doctor by name or clinical specialty..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Neurology">Neurology</option>
              <option value="General Medicine">General Medicine</option>
            </select>

            <Button variant="teal" size="sm" onClick={fetchDoctorsAndClinics} className="gap-2">
              <Search className="w-3.5 h-3.5" /> Filter
            </Button>
          </div>

          {/* Partner Clinics Banner */}
          {clinics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Healthcare Clinics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{clinic.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{clinic.city}, {clinic.state} • {clinic.operatingHours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Grid */}
          {loadingProviders ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span>Fetching verified healthcare providers...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No doctors match this search</p>
              <p className="text-[11px] text-slate-400 mt-1">Try resetting the specialty or search filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <Card key={doc.id} className={`p-5 transition-all ${selectedDoctor?.id === doc.id ? "ring-2 ring-teal-500" : "hover:border-teal-500/50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-base shrink-0">
                        {doc.profile.firstName.charAt(0)}{doc.profile.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Dr. {doc.profile.firstName} {doc.profile.lastName}
                        </h4>
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">{doc.specialty}</p>
                        <p className="text-[11px] text-slate-400">{doc.clinic?.name || "Independent Practitioner"}</p>
                      </div>
                    </div>
                    <Badge variant={doc.licenseVerified ? "teal" : "neutral"} className="text-[10px]">
                      {doc.licenseVerified ? "Verified MD" : "License Pending Audit"}
                    </Badge>
                  </div>

                  {doc.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Consultation Fee</span>
                      <span className="font-bold text-slate-900 dark:text-white">${Number(doc.consultationFee).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspectSlots(doc)}
                        className="text-xs"
                      >
                        Inspect Slots
                      </Button>
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => handleOpenBooking(doc)}
                        className="text-xs font-bold gap-1 shadow-sm"
                      >
                        Book Now <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Live Availability Inspector Panel */}
          {selectedDoctor && (
            <Card className="p-6 border-teal-500 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Booking Slots: Dr. {selectedDoctor.profile.firstName} {selectedDoctor.profile.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDoctor.specialty} • Consultation Duration: 30 mins
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Button 
                    variant="teal" 
                    size="sm" 
                    onClick={() => handleOpenBooking(selectedDoctor)}
                    className="text-xs font-bold gap-1 ml-2"
                  >
                    Book This Doctor
                  </Button>
                </div>
              </div>

              {loadingSlots ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>Calculating real slot availability against working hours and breaks...</span>
                </div>
              ) : availability?.status === "ON_LEAVE" ? (
                <div className="p-6 text-center text-xs">
                  <Badge variant="danger" className="mb-2">Doctor On Leave</Badge>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Dr. {selectedDoctor.profile.firstName} is unavailable on {selectedDate}.
                  </p>
                  <p className="text-slate-400 text-[11px] mt-1">{availability.leaveReason || "Scheduled Leave"}</p>
                </div>
              ) : availability?.status === "OFF_DUTY" ? (
                <div className="p-6 text-center text-xs">
                  <Badge variant="neutral" className="mb-2">No Scheduled Shifts</Badge>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    The doctor does not have working hours configured for this day of the week.
                  </p>
                  <p className="text-slate-400 text-[11px] mt-1">Please select another date on the calendar.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Found <strong className="text-emerald-600">{availability?.availableSlotsCount} available</strong> of {availability?.totalSlots} total generated slots
                    </span>
                    <span className="text-[11px] text-slate-400">Timezone: UTC</span>
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
                            ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 cursor-pointer"
                            : "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed opacity-60"
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
            </Card>
          )}
        </div>
      )}

      {/* Tab: Appointment History */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointment History</h1>
            <p className="text-xs text-slate-500 mt-1">Past completed and cancelled medical consultations in Supabase.</p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Facility</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pastAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No previous appointment history found.
                      </td>
                    </tr>
                  ) : (
                    pastAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td className="p-4 font-mono font-bold text-teal-600">{apt.bookingReference}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          Dr. {apt.doctor?.profile.firstName} {apt.doctor?.profile.lastName}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(apt.scheduledStart).toLocaleDateString()} at {new Date(apt.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{apt.clinic?.name}</td>
                        <td className="p-4">
                          <Badge variant={
                            apt.status === "COMPLETED" ? "teal" :
                            apt.status === "CANCELLED" ? "danger" : "neutral"
                          }>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">
                          ${Number(apt.consultationFee).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Medical Documents */}
      {activeTab === "documents" && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Records & Prescriptions</h1>
                <Badge variant="teal" className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Encrypted Vault
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Upload reports, view lab tests, and access official doctor-issued digital prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPatientAiOpen(true)}
                className="gap-2 text-xs border-indigo-500/40 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Health Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDoctorAccessOpen(true)}
                className="gap-2 text-xs border-slate-300 dark:border-slate-700"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Doctor Permissions
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() => setIsUploadRecordOpen(true)}
                className="gap-2 text-xs shadow-md shadow-teal-600/20"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </Button>
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Uploaded Medical Records ({medicalRecords.length})</span>
              </h2>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "LAB_REPORT", "PRESCRIPTION", "IMAGING_SCAN", "DISCHARGE_SUMMARY", "VACCINATION_RECORD", "OTHER"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setRecordCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                      recordCategoryFilter === cat
                        ? "bg-sky-600 text-white font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750"
                    }`}
                  >
                    {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {loadingRecords ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading your medical records vault...</div>
            ) : medicalRecords.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="p-3.5 w-fit mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Medical Vault is Empty</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload lab tests, doctor prescriptions, or imaging reports. Documents are stored in an encrypted private bucket and accessible only to you and authorized doctors.
                    </p>
                  </div>
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => setIsUploadRecordOpen(true)}
                    className="gap-2 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Your First Document
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicalRecords
                  .filter((rec) => recordCategoryFilter === "ALL" || rec.category === recordCategoryFilter)
                  .map((rec) => (
                    <Card
                      key={rec.id}
                      className="p-4 flex flex-col justify-between hover:border-sky-500/40 transition group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {rec.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">{rec.fileName}</p>
                            </div>
                          </div>
                          <Badge variant="teal" className="text-[10px] shrink-0">
                            {rec.category.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {rec.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {rec.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>{(rec.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(rec.createdAt).toLocaleDateString()}</span>
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Clean
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingRecord(rec)
                              setIsRecordViewerOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAnalyzingRecord(rec)
                              setIsLabAnalyzerOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>AI Analyze</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Delete Medical Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Official Physician Digital Prescriptions */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-500" />
              <span>Doctor Prescriptions ({prescriptions.length})</span>
            </h2>

            {prescriptions.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-500 italic">
                No digital prescriptions issued yet. Consultations with licensed physicians will appear here with official PDF records.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((rx) => (
                  <Card key={rx.id} className="p-4 flex flex-col justify-between space-y-3 border-purple-500/20 hover:border-purple-500/40 transition">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                              {rx.prescriptionNumber}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Dr. {rx.doctor?.profile.firstName} {rx.doctor?.profile.lastName}
                            </h4>
                          </div>
                        </div>
                        <Badge variant="teal" className="text-[10px]">
                          {new Date(rx.issuedAt).toLocaleDateString()}
                        </Badge>
                      </div>

                      {rx.diagnosis && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-400">Diagnosis:</span> {rx.diagnosis}
                        </p>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">Medications ({rx.items.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rx.items.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px]">
                              {item.medicineName} ({item.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">
                        {rx.clinic?.name || "MediSlot Clinic Network"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingPrescription(rx)
                          setIsPrescriptionViewerOpen(true)
                        }}
                        className="text-xs text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Official PDF</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Billing & Payments */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Payments</h1>
            <p className="text-xs text-slate-500 mt-1">Transaction receipts and payment breakdown.</p>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="font-bold text-sm mb-4">Payment Invoices</h3>
              <div className="space-y-3">
                {upcomingAppointments.concat(pastAppointments).slice(0, 4).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Consultation with Dr. {apt.doctor?.profile.firstName} {apt.doctor?.profile.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Reference: {apt.bookingReference} • {apt.paymentMethod === "PAY_AT_CLINIC" ? "Pay at Clinic Reception" : "Online Checkout"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">${Number(apt.consultationFee).toFixed(2)}</p>
                      <span className={`text-[10px] font-semibold ${apt.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-500"}`}>
                        {apt.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Notifications</h1>
              <p className="text-xs text-slate-500 mt-1">Real-time alerts stored in Supabase PostgreSQL.</p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="teal">{unreadCount} Unread</Badge>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No notifications at this time.</p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                    n.isRead 
                      ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" 
                      : "border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${n.isRead ? "text-slate-400" : "text-teal-600"}`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[11px] h-7 gap-1"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600" /> Mark Read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Medical Profile</h1>
            <p className="text-xs text-slate-500 mt-1">Manage personal health metrics and emergency contacts.</p>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Contact Email</label>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Assigned Role</label>
                <Badge variant="teal">{user?.role}</Badge>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Blood Group</label>
                <p className="font-semibold text-slate-800 dark:text-slate-200">O Positive (O+)</p>
              </div>
            </div>
          </Card>
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
