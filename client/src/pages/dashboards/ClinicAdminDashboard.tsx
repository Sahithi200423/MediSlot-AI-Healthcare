import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { 
  Building2, Users, Calendar, BarChart3, 
  Settings, Stethoscope, Clock, Plus,
  ShieldCheck, Copy, Check, Filter, Search,
  Phone, MapPin, CheckCircle2, AlertCircle, RefreshCw, X
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAuth } from "@/context/AuthContext"
import { api, type Clinic, type Appointment } from "@/lib/api"
import { formatINR } from "@/lib/currency"
import { EDITORIAL_EASE } from "@/lib/motion"

export function ClinicAdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [clinicAppointments, setClinicAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentDoctorFilter, setAppointmentDoctorFilter] = useState<string>("ALL")
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>("ALL")
  const [appointmentSearch, setAppointmentSearch] = useState<string>("")
  
  const [staffData, setStaffData] = useState<{
    doctors: any[]
    memberships: any[]
    invitations: any[]
  }>({
    doctors: [],
    memberships: [],
    invitations: [],
  })

  // Create Clinic Form State
  const [isCreatingClinic, setIsCreatingClinic] = useState(false)
  const [newClinicForm, setNewClinicForm] = useState({
    name: "St. Jude Premier Clinic",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    state: "OR",
    postalCode: "97477",
    phone: "+1 (555) 382-9901",
    email: "admin@stjude-clinic.com",
    operatingHours: "08:00 - 18:00",
    timezone: "America/Los_Angeles",
  })

  // Clinic Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    operatingHours: "",
    timezone: "",
  })
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("DOCTOR")
  const [isInviting, setIsInviting] = useState(false)
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null)
  const [hasCopiedToken, setHasCopiedToken] = useState(false)

  // Appointment Details Modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const navItems: NavItem[] = [
    { id: "overview", label: "Clinic Overview", icon: Building2 },
    { id: "queue", label: "Consultation Queue", icon: Clock, badge: clinicAppointments.filter(a => a.status === "IN_PROGRESS" || a.status === "CONFIRMED").length || undefined },
    { id: "appointments", label: "Master Appointments", icon: Calendar, badge: clinicAppointments.length || undefined },
    { id: "doctors", label: "Doctors & Providers", icon: Stethoscope, badge: staffData.doctors.length || undefined },
    { id: "patients", label: "Patient Directory", icon: Users },
    { id: "staff", label: "Staff & Invitations", icon: Users, badge: staffData.invitations.length || undefined },
    { id: "hours", label: "Hours & Availability", icon: Clock },
    { id: "settings", label: "Clinic Settings", icon: Settings },
  ]

  // Load Clinic Appointments from Live Database
  const loadClinicAppointments = async (clinicId: string) => {
    try {
      setLoadingAppointments(true)
      const list = await api.getClinicAppointments(clinicId)
      setClinicAppointments(list)
    } catch (err: any) {
      console.error("Failed to load clinic appointments:", err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  // Handle Clinic Appointment Status Update
  const handleUpdateClinicAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status)
      toast.success(`Appointment status updated to ${status.replace("_", " ")}`)
      if (selectedClinic) await loadClinicAppointments(selectedClinic.id)
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: status as any } : null)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update appointment status")
    }
  }

  // Fetch Clinics & Staff from Database
  const loadClinicData = async () => {
    try {
      setLoading(true)
      const list = await api.getClinics()
      setClinics(list)
      if (list.length > 0) {
        const preferred = list.find(c => c.id === "bf27f9e6-5410-4dd7-8332-26493b0d1127") || list[0]
        const active = preferred
        setSelectedClinic(active)
        setSettingsForm({
          name: active.name,
          phone: active.phone,
          email: active.email,
          address: active.address,
          city: active.city,
          state: active.state,
          operatingHours: active.operatingHours || "08:00 - 18:00",
          timezone: active.timezone || "America/New_York",
        })

        // Fetch Clinic Appointments
        await loadClinicAppointments(active.id)

        // Fetch staff and roster
        const staffRes = await api.getClinicStaff(active.id)
        if (staffRes) {
          setStaffData({
            doctors: staffRes.doctors || [],
            memberships: staffRes.memberships || [],
            invitations: staffRes.invitations || [],
          })
        }
      }
    } catch (err: any) {
      console.error("Failed to load clinic data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClinicData()
  }, [])

  useEffect(() => {
    if (!selectedAppointment && !showInviteModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAppointment(null)
        setShowInviteModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedAppointment, showInviteModal])

  // Handle Switch Selected Clinic
  const handleSelectClinic = async (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setSettingsForm({
      name: clinic.name,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      operatingHours: clinic.operatingHours || "08:00 - 18:00",
      timezone: clinic.timezone || "America/New_York",
    })
    await loadClinicAppointments(clinic.id)
    const staffRes = await api.getClinicStaff(clinic.id)
    if (staffRes) {
      setStaffData({
        doctors: staffRes.doctors || [],
        memberships: staffRes.memberships || [],
        invitations: staffRes.invitations || [],
      })
    }
  }

  // Handle Create Clinic
  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreatingClinic(true)
      const created = await api.createClinic(newClinicForm)
      toast.success(`Facility "${created.name}" created successfully!`)
      await loadClinicData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create clinic facility")
    } finally {
      setIsCreatingClinic(false)
    }
  }

  // Handle Update Clinic Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClinic) return
    try {
      setIsUpdatingSettings(true)
      const updated = await api.updateClinic(selectedClinic.id, settingsForm)
      setSelectedClinic(updated)
      toast.success("Clinic profile and operating parameters updated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update clinic profile")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  // Handle Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClinic) return
    try {
      setIsInviting(true)
      const invitation = await api.inviteStaff(selectedClinic.id, inviteEmail, inviteRole)
      setLastInviteToken(invitation.token)
      toast.success(`Invitation generated for ${inviteEmail}!`)
      setInviteEmail("")
      const staffRes = await api.getClinicStaff(selectedClinic.id)
      if (staffRes) {
        setStaffData({
          doctors: staffRes.doctors || [],
          memberships: staffRes.memberships || [],
          invitations: staffRes.invitations || [],
        })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setHasCopiedToken(true)
    toast.success("Invitation link copied to clipboard!")
    setTimeout(() => setHasCopiedToken(false), 2000)
  }

  // Extract unique patients from appointments
  const uniquePatients = Array.from(
    new Map(
      clinicAppointments
        .filter(a => a.patient?.profile)
        .map(a => [a.patientId, {
          patientId: a.patientId,
          name: `${a.patient!.profile.firstName} ${a.patient!.profile.lastName}`,
          email: a.patient!.profile.email,
          phone: a.patient!.profile.phone || "On File",
          lastVisit: a.scheduledStart,
          status: a.status,
          visitType: a.visitType,
        }])
    ).values()
  )

  // Filtered appointments
  const filteredAppointments = clinicAppointments.filter(app => {
    const matchesDoctor = appointmentDoctorFilter === "ALL" || app.doctorId === appointmentDoctorFilter
    const matchesStatus = appointmentStatusFilter === "ALL" || app.status === appointmentStatusFilter
    const patientName = app.patient?.profile ? `${app.patient.profile.firstName} ${app.patient.profile.lastName}`.toLowerCase() : ""
    const doctorName = app.doctor?.profile ? `${app.doctor.profile.firstName} ${app.doctor.profile.lastName}`.toLowerCase() : ""
    const matchesSearch = !appointmentSearch || 
      patientName.includes(appointmentSearch.toLowerCase()) || 
      doctorName.includes(appointmentSearch.toLowerCase()) ||
      app.bookingReference.toLowerCase().includes(appointmentSearch.toLowerCase())
    return matchesDoctor && matchesStatus && matchesSearch
  })

  const adminName = user ? `${user.firstName} ${user.lastName}` : "Elena Rostova"
  const clinicTitle = selectedClinic ? selectedClinic.name : "Metro Specialty Healthcare Facility"

  return (
    <DashboardShell
      roleTitle="Clinic Administrator"
      roleColor="emerald"
      userDisplayName={adminName}
      userSubtitle={`Director of Clinical Operations • ${clinicTitle}`}
      userAvatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {loading ? (
        <div className="space-y-8" aria-label="Loading clinic dashboard">
          <div className="space-y-2 pb-6 border-b border-[#ece6dd]">
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-[#ece6dd] bg-white space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white space-y-4">
            <Skeleton className="h-6 w-56" />
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-2 border-t border-[#f2ede4]">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton rounded="full" className="w-8 h-8 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
                <Skeleton rounded="full" className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------------- */}
          {/* ONBOARDING BANNER IF NO CLINIC REGISTERED */}
          {/* ------------------------------------------------------------------- */}
          {clinics.length === 0 && (
        <div className="p-8 rounded-2xl border border-[#cb6440]/30 bg-[#fbf5f2] mb-8">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#cb6440]/15 text-[#cb6440] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                  Register Your Healthcare Facility
                </h3>
                <p className="text-xs text-[#6e6059] mt-1 font-editorial-sans">
                  You are signed in with clinic administration privileges. Create your clinical facility profile to start credentialing practitioners, configuring consultation hours, and receiving patient bookings.
                </p>
              </div>

              <form onSubmit={handleCreateClinic} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-editorial-sans">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Facility Name</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.name}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Administrative Email</label>
                  <input
                    type="email"
                    required
                    value={newClinicForm.email}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={newClinicForm.phone}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Standard Operating Hours</label>
                  <input
                    type="text"
                    value={newClinicForm.operatingHours}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. 08:00 - 18:00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[#8c7e77] block mb-1">Clinical Campus Address</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.address}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.city}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">State / Postal Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newClinicForm.state}
                      onChange={(e) => setNewClinicForm({ ...newClinicForm, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      required
                      value={newClinicForm.postalCode}
                      onChange={(e) => setNewClinicForm({ ...newClinicForm, postalCode: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                      placeholder="ZIP"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingClinic}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                  >
                    {isCreatingClinic ? "Registering Facility..." : "Register Clinic Facility"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 1. CLINIC OVERVIEW TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top Banner with Facility Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#ece6dd]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-editorial-serif text-3xl sm:text-4xl font-normal text-[#1e1815]">
                  {clinicTitle}
                </h1>
                {selectedClinic?.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Facility
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30">
                    <AlertCircle className="w-3.5 h-3.5" /> Verification In Review
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#6e6059] mt-2 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#cb6440]" />
                  {selectedClinic?.address}, {selectedClinic?.city}, {selectedClinic?.state}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4a6356]" />
                  Hours: {selectedClinic?.operatingHours || "08:00 - 18:00"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#8c7e77]" />
                  {selectedClinic?.phone}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {clinics.length > 1 && (
                <select
                  value={selectedClinic?.id}
                  onChange={(e) => {
                    const found = clinics.find(c => c.id === e.target.value)
                    if (found) handleSelectClinic(found)
                  }}
                  className="rounded-full border border-[#e4ded5] bg-white px-4 py-2 text-xs font-medium text-[#1e1815] outline-none cursor-pointer hover:bg-[#fbf9f5]"
                >
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2.5 text-xs font-medium cursor-pointer transition-colors shadow-xs flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Invite Practitioner
              </button>
            </div>
          </div>

          {/* Real Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Total Consultations</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {clinicAppointments.length}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#4a6356] mt-3 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{clinicAppointments.filter(a => a.status === "COMPLETED").length} completed, {clinicAppointments.filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS").length} scheduled</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Credentialed Doctors</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {staffData.doctors.length}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#6e6059] mt-3 font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-[#cb6440] shrink-0" /> Active Clinical Roster
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Clinical Staff Members</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {staffData.memberships.length}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#8c6b3e] mt-3 font-medium">
                <Users className="w-3.5 h-3.5 shrink-0" /> {staffData.invitations.length} Pending Invitations
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Estimated Fee Volume</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {formatINR(clinicAppointments.reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0))}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#4a6356] mt-3 font-medium">
                <BarChart3 className="w-3.5 h-3.5 shrink-0" /> Live Encounters Data
              </div>
            </div>
          </div>

          {/* Quick Encounter Pipeline: Active Queue Snapshot */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece6dd]">
              <div>
                <h3 className="font-editorial-serif text-xl text-[#1e1815]">Immediate Consultation Queue</h3>
                <p className="text-xs text-[#6e6059]">Active and upcoming appointments scheduled at this facility</p>
              </div>
              <button
                onClick={() => setActiveTab("queue")}
                className="text-xs text-[#cb6440] hover:underline font-medium cursor-pointer"
              >
                View Full Queue →
              </button>
            </div>

            {clinicAppointments.filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS").length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8c7e77]">
                No patients currently waiting in consultation queue.
              </div>
            ) : (
              <div className="divide-y divide-[#ece6dd]">
                {clinicAppointments
                  .filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS")
                  .slice(0, 4)
                  .map(app => (
                    <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#fbf5f2] border border-[#ece6dd] flex items-center justify-center text-xs font-bold text-[#cb6440]">
                          {app.patient?.profile.firstName?.[0] || "P"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1e1815]">
                            {app.patient?.profile.firstName} {app.patient?.profile.lastName}
                          </p>
                          <p className="text-[11px] text-[#6e6059]">
                            Dr. {app.doctor?.profile.firstName} {app.doctor?.profile.lastName} • {new Date(app.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          app.status === "IN_PROGRESS"
                            ? "bg-[#cb6440]/10 text-[#cb6440] border border-[#cb6440]/30"
                            : "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                        }`}>
                          {app.status.replace("_", " ")}
                        </span>
                        <button
                          onClick={() => handleUpdateClinicAppointmentStatus(app.id, "COMPLETED")}
                          className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. CONSULTATION QUEUE TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Real-Time Consultation Queue
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Monitor patient arrivals, check-in status, and examination room progression across all facility providers.
              </p>
            </div>
            <button
              onClick={() => selectedClinic && loadClinicAppointments(selectedClinic.id)}
              className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
            >
              Refresh Queue
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Ref / Time</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Attending Practitioner</th>
                    <th className="p-3.5">Encounter Mode</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Queue Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {clinicAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8c7e77]">
                        No consultations currently logged in database for this facility.
                      </td>
                    </tr>
                  ) : (
                    clinicAppointments.map(app => (
                      <tr key={app.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-semibold text-[#1e1815]">{app.bookingReference}</span>
                          <span className="block text-[10px] text-[#8c7e77]">
                            {new Date(app.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-[#1e1815]">
                            {app.patient?.profile.firstName} {app.patient?.profile.lastName}
                          </p>
                          <p className="text-[10px] text-[#8c7e77]">{app.patient?.profile.email}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-[#1e1815]">
                            Dr. {app.doctor?.profile.firstName} {app.doctor?.profile.lastName}
                          </p>
                          <p className="text-[10px] text-[#8c7e77]">{app.doctor?.specialty}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fbf5f2] border border-[#ece6dd] text-[#6e6059]">
                            {app.visitType}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            app.status === "COMPLETED"
                              ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                              : app.status === "IN_PROGRESS"
                              ? "bg-[#cb6440]/10 text-[#cb6440] border border-[#cb6440]/30"
                              : app.status === "CONFIRMED"
                              ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border border-[#8c6b3e]/30"
                              : "bg-[#e4ded5] text-[#6e6059]"
                          }`}>
                            {app.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {app.status !== "IN_PROGRESS" && app.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateClinicAppointmentStatus(app.id, "IN_PROGRESS")}
                              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                            >
                              Check-In
                            </button>
                          )}
                          {app.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleUpdateClinicAppointmentStatus(app.id, "COMPLETED")}
                              className="rounded-full bg-[#4a6356] hover:bg-[#3d5247] text-white px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {app.status !== "CANCELLED" && app.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateClinicAppointmentStatus(app.id, "CANCELLED")}
                              className="rounded-full border border-[#e4ded5] text-[#b85633] hover:bg-[#ede6dc] px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          )}
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

      {/* ------------------------------------------------------------------- */}
      {/* 3. MASTER APPOINTMENTS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Master Clinical Appointments
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Centralized registry of patient bookings, encounter types, and fee settlement status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectedClinic && loadClinicAppointments(selectedClinic.id)}
                disabled={loadingAppointments}
                className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <span className="text-xs text-[#8c7e77]">
                Total: <strong>{filteredAppointments.length}</strong> records
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl border border-[#ece6dd] bg-white shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#8c7e77] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, doctor, or booking reference..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] outline-none focus:border-[#cb6440]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8c7e77]" />
              <select
                value={appointmentDoctorFilter}
                onChange={(e) => setAppointmentDoctorFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">All Practitioners</option>
                {staffData.doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.profile.firstName} {d.profile.lastName} ({d.specialty})
                  </option>
                ))}
              </select>

              <select
                value={appointmentStatusFilter}
                onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Master Appointments: Mobile Cards + Desktop Table */}
          {loadingAppointments ? (
            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white space-y-3" aria-label="Loading appointments">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-[#f2ede4] last:border-b-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28 hidden sm:block" />
                  <Skeleton rounded="full" className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-[#e4ded5] bg-white rounded-3xl space-y-3">
              <Calendar className="w-8 h-8 text-[#c5a880] mx-auto" />
              <div>
                <p className="font-editorial-serif text-xl text-[#1e1815]">No appointments match these filters</p>
                <p className="text-xs text-[#6e6059] mt-1">Adjust your doctor, status, or search filter to view encounters.</p>
              </div>
              {(appointmentDoctorFilter !== "ALL" || appointmentStatusFilter !== "ALL" || appointmentSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentDoctorFilter("ALL")
                    setAppointmentStatusFilter("ALL")
                    setAppointmentSearch("")
                  }}
                  className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile stacked encounter cards */}
              <div className="space-y-3 md:hidden">
                {filteredAppointments.map(app => (
                  <div key={app.id} className="p-4 rounded-2xl border border-[#ece6dd] bg-white shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-[#cb6440] text-[11px]">{app.bookingReference}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        app.status === "COMPLETED"
                          ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                          : app.status === "IN_PROGRESS"
                          ? "bg-[#cb6440]/10 text-[#cb6440] border border-[#cb6440]/30"
                          : app.status === "CONFIRMED"
                          ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border border-[#8c6b3e]/30"
                          : "bg-[#e4ded5] text-[#6e6059]"
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[#1e1815]">
                        {app.patient?.profile.firstName} {app.patient?.profile.lastName}
                      </p>
                      <p className="text-[11px] text-[#6e6059]">
                        Dr. {app.doctor?.profile.firstName} {app.doctor?.profile.lastName} • {app.doctor?.specialty}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#f2ede4]">
                      <div className="text-[11px] text-[#8c7e77]">
                        {new Date(app.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{" "}
                        <strong className="text-[#1e1815]">{formatINR(app.consultationFee)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAppointment(app)}
                        className="rounded-full border border-[#e4ded5] bg-[#fbf9f5] hover:border-[#cb6440] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Master Table */}
              <div className="hidden md:block p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                      <tr>
                        <th className="p-3.5">Reference</th>
                        <th className="p-3.5">Patient</th>
                        <th className="p-3.5">Doctor</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5">Fee</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece6dd]">
                      {filteredAppointments.map(app => (
                        <tr key={app.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                          <td className="p-3.5 font-mono font-medium text-[#1e1815]">
                            {app.bookingReference}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-[#1e1815]">
                              {app.patient?.profile.firstName} {app.patient?.profile.lastName}
                            </p>
                            <p className="text-[10px] text-[#8c7e77]">{app.patient?.profile.email}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-medium text-[#1e1815]">
                              Dr. {app.doctor?.profile.firstName} {app.doctor?.profile.lastName}
                            </p>
                            <p className="text-[10px] text-[#8c7e77]">{app.doctor?.specialty}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="text-[#1e1815] font-medium">
                              {new Date(app.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-[#8c7e77]">
                              {new Date(app.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="p-3.5 font-medium text-[#1e1815]">
                            {formatINR(app.consultationFee)}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              app.status === "COMPLETED"
                                ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                                : app.status === "IN_PROGRESS"
                                ? "bg-[#cb6440]/10 text-[#cb6440] border border-[#cb6440]/30"
                                : app.status === "CONFIRMED"
                                ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border border-[#8c6b3e]/30"
                                : "bg-[#e4ded5] text-[#6e6059]"
                            }`}>
                              {app.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(app)}
                              className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. DOCTORS & PROVIDERS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Practitioners & Medical Staff
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Credentialed healthcare specialists licensed to accept patient consultations at this facility.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffData.doctors.length === 0 ? (
              <div className="col-span-full p-10 text-center text-xs text-[#8c7e77] bg-white rounded-3xl border-2 border-dashed border-[#e4ded5] space-y-2">
                <Stethoscope className="w-8 h-8 text-[#c5a880] mx-auto" />
                <p className="font-editorial-serif text-xl text-[#1e1815]">No doctors affiliated yet</p>
                <p className="text-[#6e6059]">Use the Invite Doctor button above to onboard practitioners to this facility.</p>
              </div>
            ) : (
              staffData.doctors.map(doc => (
                <div key={doc.id} className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#cb6440]/40 transition-all duration-200 space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.profile.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150"}
                      alt={doc.profile.firstName}
                      className="w-12 h-12 rounded-full object-cover border border-[#ece6dd]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-editorial-serif text-lg text-[#1e1815] truncate">
                        Dr. {doc.profile.firstName} {doc.profile.lastName}
                      </h4>
                      <p className="text-xs text-[#cb6440] font-medium">{doc.specialty}</p>
                      <p className="text-[11px] text-[#8c7e77] mt-0.5 truncate">{doc.profile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#ece6dd] text-[11px]">
                    <div>
                      <span className="text-[#8c7e77] block">License</span>
                      <span className="font-mono font-medium text-[#1e1815]">{doc.licenseNumber || "VERIFIED"}</span>
                    </div>
                    <div>
                      <span className="text-[#8c7e77] block">Fee</span>
                      <span className="font-medium text-[#1e1815]">{formatINR(doc.consultationFee)}/session</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#4a6356] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Credentialed
                    </span>
                    <button
                      onClick={() => {
                        setAppointmentDoctorFilter(doc.id)
                        setActiveTab("appointments")
                      }}
                      className="text-[#cb6440] hover:underline font-medium text-[11px] cursor-pointer"
                    >
                      View Schedule →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5. PATIENT DIRECTORY TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Facility Patient Administration
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Patients who have booked consultations at this facility. Access governed by authorized clinical permissions.
              </p>
            </div>
            <span className="text-xs text-[#8c7e77]">
              Total: <strong>{uniquePatients.length}</strong> registered patients
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Account Email</th>
                    <th className="p-3.5">Telephone</th>
                    <th className="p-3.5">Recent Visit</th>
                    <th className="p-3.5">Last Encounter Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {uniquePatients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8c7e77]">
                        No patient records logged yet for this facility.
                      </td>
                    </tr>
                  ) : (
                    uniquePatients.map(pat => (
                      <tr key={pat.patientId} className="hover:bg-[#fbf9f5]/60 transition-colors">
                        <td className="p-3.5 font-bold text-[#1e1815]">{pat.name}</td>
                        <td className="p-3.5 text-[#6e6059]">{pat.email}</td>
                        <td className="p-3.5 text-[#8c7e77]">{pat.phone}</td>
                        <td className="p-3.5 text-[#1e1815]">
                          {new Date(pat.lastVisit).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30">
                            {pat.status.replace("_", " ")}
                          </span>
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

      {/* ------------------------------------------------------------------- */}
      {/* 6. STAFF & INVITATIONS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "staff" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Facility Staff & Invitations
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Manage clinic owners, administrators, reception staff, and issue secure invitation tokens.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Staff
            </button>
          </div>

          {/* Active Memberships */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
            <h3 className="font-editorial-serif text-xl text-[#1e1815]">Active Facility Personnel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">System Role</th>
                    <th className="p-3.5">Clinic Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {staffData.memberships.map((m: any) => (
                    <tr key={m.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                      <td className="p-3.5 font-bold text-[#1e1815]">
                        {m.profile?.firstName} {m.profile?.lastName}
                      </td>
                      <td className="p-3.5 text-[#6e6059]">{m.profile?.email}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30">
                          {m.profile?.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-[#8c6b3e]">{m.clinicRole || "ADMIN"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
            <h3 className="font-editorial-serif text-xl text-[#1e1815]">Pending Token Invitations</h3>
            {staffData.invitations.length === 0 ? (
              <p className="text-xs text-[#8c7e77] py-4">No pending invitations. All invitations have been claimed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                    <tr>
                      <th className="p-3.5">Invited Recipient</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Invitation Token</th>
                      <th className="p-3.5">Expiration</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece6dd]">
                    {staffData.invitations.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                        <td className="p-3.5 font-bold text-[#1e1815]">{inv.email}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30">
                            {inv.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[#6e6059]">
                          {inv.token.slice(0, 16)}...
                        </td>
                        <td className="p-3.5 text-[#8c7e77]">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => copyToken(inv.token)}
                            className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors inline-flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 7. HOURS & AVAILABILITY TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "hours" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#ece6dd]">
            <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
              Operating Hours & Coverage
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">
              Standard clinic operational windows, reception desk shifts, and emergency triage hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
              <h3 className="font-editorial-serif text-xl text-[#1e1815]">Standard Operating Schedule</h3>
              <div className="divide-y divide-[#ece6dd] text-xs">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                  <div key={day} className="py-3 flex items-center justify-between">
                    <span className="font-medium text-[#1e1815]">{day}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#4a6356] font-medium">{selectedClinic?.operatingHours || "08:00 - 18:00"}</span>
                      <span className="w-2 h-2 rounded-full bg-[#4a6356]" />
                    </div>
                  </div>
                ))}
                <div className="py-3 flex items-center justify-between">
                  <span className="font-medium text-[#1e1815]">Saturday</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8c6b3e] font-medium">09:00 - 14:00 (Urgent Consults)</span>
                    <span className="w-2 h-2 rounded-full bg-[#8c6b3e]" />
                  </div>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="font-medium text-[#1e1815]">Sunday</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8c7e77]">Closed (On-Call Only)</span>
                    <span className="w-2 h-2 rounded-full bg-[#e4ded5]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
              <h3 className="font-editorial-serif text-xl text-[#1e1815]">Update Operating Window</h3>
              <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs font-editorial-sans">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Standard Operating Hours</label>
                  <input
                    type="text"
                    value={settingsForm.operatingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. 08:00 - 18:00"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Timezone</label>
                  <input
                    type="text"
                    value={settingsForm.timezone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. America/New_York"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="w-full rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 text-xs font-medium cursor-pointer transition-colors"
                >
                  {isUpdatingSettings ? "Saving..." : "Save Operating Window"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 8. CLINIC SETTINGS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#ece6dd]">
            <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
              Clinic Profile & Configuration
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">
              Maintain institutional credentials, official phone numbers, and physical location coordinates.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[#ece6dd] bg-white shadow-xs max-w-3xl">
            <form onSubmit={handleUpdateSettings} className="space-y-5 text-xs font-editorial-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Facility Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Official Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[#8c7e77] block mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.state}
                    onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={settingsForm.operatingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-8 py-2.5 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  {isUpdatingSettings ? "Saving Changes..." : "Save Clinic Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* INVITATION MODAL */}
      {/* ------------------------------------------------------------------- */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-[#1e1815]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ece6dd] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece6dd]">
              <h3 className="font-editorial-serif text-2xl text-[#1e1815]">Invite Practitioner / Staff</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setLastInviteToken(null)
                }}
                className="text-[#8c7e77] hover:text-[#1e1815] p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {lastInviteToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#4a6356]/10 border border-[#4a6356]/30 text-xs">
                  <p className="font-bold text-[#4a6356] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Invitation Token Generated!
                  </p>
                  <p className="text-[#6e6059] mt-1">
                    Share this secure invitation token with the practitioner or administrative colleague:
                  </p>
                  <div className="mt-3 p-2 bg-white rounded-lg border border-[#e4ded5] font-mono text-[11px] break-all select-all">
                    {lastInviteToken}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => copyToken(lastInviteToken)}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {hasCopiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {hasCopiedToken ? "Copied!" : "Copy Token"}
                  </button>
                  <button
                    onClick={() => setLastInviteToken(null)}
                    className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Invite Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs font-editorial-sans">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Recipient Professional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.org"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#8c7e77] block mb-1">Institutional Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-medium focus:border-[#cb6440] outline-none cursor-pointer"
                  >
                    <option value="DOCTOR">Medical Doctor / Physician</option>
                    <option value="CLINIC_ADMIN">Clinical Operations Administrator</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    {isInviting ? "Issuing Token..." : "Issue Invitation Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RESPONSIVE APPOINTMENT DETAILS DRAWER */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedAppointment && (
          <div
            className="fixed inset-0 z-50 flex justify-end font-editorial-sans"
            role="dialog"
            aria-modal="true"
            aria-label="Encounter Record Details"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedAppointment(null)}
              className="fixed inset-0 bg-[#1e1815]/45 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
              className="relative z-10 w-full max-w-md h-full bg-[#fbf9f5] border-l border-[#ece6dd] shadow-2xl flex flex-col justify-between overflow-y-auto text-xs"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#ece6dd]">
                  <div>
                    <h3 className="font-editorial-serif text-2xl text-[#1e1815]">Encounter Record</h3>
                    <p className="text-[11px] font-mono text-[#cb6440] font-semibold mt-0.5">
                      {selectedAppointment.bookingReference}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    aria-label="Close encounter drawer"
                    className="text-[#8c7e77] hover:text-[#1e1815] hover:bg-[#ede5d9] p-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-[#ece6dd] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">Patient</span>
                      <span className="font-bold text-[#1e1815] block mt-0.5">
                        {selectedAppointment.patient?.profile.firstName} {selectedAppointment.patient?.profile.lastName}
                      </span>
                      <span className="block text-[10px] text-[#6e6059] truncate">{selectedAppointment.patient?.profile.email}</span>
                    </div>
                    <div>
                      <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">Attending Physician</span>
                      <span className="font-bold text-[#1e1815] block mt-0.5">
                        Dr. {selectedAppointment.doctor?.profile.firstName} {selectedAppointment.doctor?.profile.lastName}
                      </span>
                      <span className="block text-[10px] text-[#cb6440] font-medium">{selectedAppointment.doctor?.specialty}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#ece6dd]">
                      <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">Scheduled Time</span>
                      <span className="font-medium text-[#1e1815] block mt-0.5">
                        {new Date(selectedAppointment.scheduledStart).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-[#ece6dd]">
                      <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">Visit Type & Fee</span>
                      <span className="font-medium text-[#1e1815] block mt-0.5">
                        {selectedAppointment.visitType} • {formatINR(selectedAppointment.consultationFee)}
                      </span>
                    </div>
                  </div>

                  {selectedAppointment.reasonForVisit && (
                    <div className="p-4 rounded-2xl bg-white border border-[#ece6dd]">
                      <span className="text-[#8c7e77] block text-[10px] uppercase tracking-wider font-semibold">Reported Chief Complaint</span>
                      <p className="text-[#1e1815] mt-1 leading-relaxed">{selectedAppointment.reasonForVisit}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white border-t border-[#ece6dd] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {selectedAppointment.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateClinicAppointmentStatus(selectedAppointment.id, "COMPLETED")}
                      className="rounded-full bg-[#4a6356] hover:bg-[#3d5247] text-white px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Mark Completed
                    </button>
                  )}
                  {selectedAppointment.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateClinicAppointmentStatus(selectedAppointment.id, "CANCELLED")}
                      className="rounded-full border border-[#e4ded5] text-[#b85633] hover:bg-[#ede6dc] px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}
