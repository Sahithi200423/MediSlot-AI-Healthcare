import { useState, useEffect } from "react"
import { 
  Building2, Users, Calendar, CreditCard, BarChart3, 
  Settings, Stethoscope, FileSpreadsheet, Plus, TrendingUp,
  Mail, ShieldCheck, Copy, Check
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/context/AuthContext"
import { api, type Clinic, type Appointment } from "@/lib/api"

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
  const [staffData, setStaffData] = useState<{
    doctors: any[]
    staff: any[]
    pendingInvitations: any[]
  }>({
    doctors: [],
    staff: [],
    pendingInvitations: [],
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

  const navItems: NavItem[] = [
    { id: "overview", label: "Clinic Overview", icon: Building2 },
    { id: "doctors", label: "Doctors & Providers", icon: Stethoscope, badge: staffData.doctors.length },
    { id: "staff", label: "Clinic Staff & Invitations", icon: Users, badge: staffData.staff.length + staffData.pendingInvitations.length },
    { id: "appointments", label: "Master Appointments", icon: Calendar, badge: 24 },
    { id: "payments", label: "Revenue & Billing", icon: CreditCard },
    { id: "analytics", label: "Operational Analytics", icon: BarChart3 },
    { id: "reports", label: "Clinical Reports", icon: FileSpreadsheet },
    { id: "settings", label: "Clinic Settings", icon: Settings },
  ]

  // Load Clinic Appointments from Live Supabase
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
      toast.success(`Appointment marked as ${status.replace("_", " ")}`)
      if (selectedClinic) await loadClinicAppointments(selectedClinic.id)
    } catch (err: any) {
      toast.error(err.message || "Failed to update appointment status")
    }
  }

  // Fetch Clinics & Staff from Live Supabase
  const loadClinicData = async () => {
    try {
      setLoading(true)
      const list = await api.getClinics()
      setClinics(list)
      if (list.length > 0) {
        const active = list[0]
        setSelectedClinic(active)
        setSettingsForm({
          name: active.name,
          phone: active.phone,
          email: active.email,
          address: active.address,
          city: active.city,
          state: active.state,
          operatingHours: active.operatingHours || "09:00 - 17:00",
          timezone: active.timezone || "America/New_York",
        })

        // Fetch Clinic Appointments
        await loadClinicAppointments(active.id)

        // Fetch staff and roster
        const staffRes = await api.getClinicStaff(active.id)
        if (staffRes) {
          setStaffData({
            doctors: staffRes.doctors || [],
            staff: staffRes.staff || [],
            pendingInvitations: staffRes.pendingInvitations || [],
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

  // Handle Create Clinic
  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreatingClinic(true)
      const created = await api.createClinic(newClinicForm)
      toast.success(`Clinic "${created.name}" created successfully!`)
      await loadClinicData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create clinic")
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
      toast.success("Clinic profile and operating hours updated in Supabase!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update clinic")
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
      // Reload staff data
      const staffRes = await api.getClinicStaff(selectedClinic.id)
      if (staffRes) {
        setStaffData({
          doctors: staffRes.doctors || [],
          staff: staffRes.staff || [],
          pendingInvitations: staffRes.pendingInvitations || [],
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
    toast.success("Invitation token copied to clipboard!")
    setTimeout(() => setHasCopiedToken(false), 2000)
  }

  const adminName = user ? `${user.firstName} ${user.lastName}` : "Elena Rostova"
  const clinicTitle = selectedClinic ? selectedClinic.name : "Metro Heart & Specialty Clinic"

  return (
    <DashboardShell
      roleTitle="Clinic Administrator"
      roleColor="emerald"
      userDisplayName={adminName}
      userSubtitle={`Operations Director • ${clinicTitle}`}
      userAvatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* Onboarding Banner if No Clinic Found */}
      {!loading && clinics.length === 0 && (
        <Card className="p-8 border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Register Your Healthcare Facility
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are signed in as an administrator. Create your clinic profile to start inviting doctors, defining operating hours, and handling patient bookings.
                </p>
              </div>

              <form onSubmit={handleCreateClinic} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.name}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={newClinicForm.email}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newClinicForm.phone}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={newClinicForm.operatingHours}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    placeholder="e.g. 08:00 - 18:00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.address}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.city}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State / Postal Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newClinicForm.state}
                      onChange={(e) => setNewClinicForm({ ...newClinicForm, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      required
                      value={newClinicForm.postalCode}
                      onChange={(e) => setNewClinicForm({ ...newClinicForm, postalCode: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                      placeholder="ZIP"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" variant="teal" size="sm" disabled={isCreatingClinic}>
                    {isCreatingClinic ? "Registering in Supabase..." : "Register Clinic Facility"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{clinicTitle}</h1>
                {selectedClinic?.isVerified ? (
                  <Badge variant="teal" className="gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Verified Facility
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="gap-1 text-amber-600 dark:text-amber-400">
                    Verification In Review
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {selectedClinic?.address}, {selectedClinic?.city}, {selectedClinic?.state} • Hours: {selectedClinic?.operatingHours || "09:00 - 17:00"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="teal" size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
                <Plus className="w-4 h-4" /> Invite Staff / Doctor
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Today's Appointments</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">24</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> 8 completed, 16 remaining
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Revenue (Today)</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">$2,150.00</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 font-medium">
                Collected via Razorpay
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Active Doctors</span>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                {staffData.doctors.length} Registered
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 font-medium">
                In Supabase PostgreSQL
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Staff Members</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {staffData.staff.length} Active
              </p>
              <div className="flex items-center gap-1 text-[11px] text-teal-600 mt-2 font-medium">
                {staffData.pendingInvitations.length} Pending Invites
              </div>
            </Card>
          </div>

          {/* Today's Queue Preview */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Doctor Schedule Utilization</h3>
            <div className="space-y-3 text-xs">
              {staffData.doctors.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-500" />
                  <p>No doctors registered for this clinic yet.</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs gap-1" onClick={() => setShowInviteModal(true)}>
                    <Plus className="w-3.5 h-3.5" /> Invite First Doctor
                  </Button>
                </div>
              ) : (
                staffData.doctors.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          Dr. {d.profile?.firstName} {d.profile?.lastName} ({d.specialty})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Fee: ${Number(d.consultationFee).toFixed(2)} • License: {d.licenseNumber}
                        </span>
                      </div>
                    </div>
                    <Badge variant={d.licenseVerified ? "teal" : "neutral"}>
                      {d.licenseVerified ? "Verified Practitioner" : "License Unverified"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Doctors */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Doctors & Practitioners</h1>
              <p className="text-xs text-slate-500 mt-1">Manage practitioner credentials, commission rates, and room allocations.</p>
            </div>
            <Button variant="teal" size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4" /> Invite Doctor
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Doctor Name</th>
                    <th className="p-4">Specialty</th>
                    <th className="p-4">License Number</th>
                    <th className="p-4">Fee / Visit</th>
                    <th className="p-4">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffData.doctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No doctors currently linked to this facility. Use the Invite button to onboard physicians.
                      </td>
                    </tr>
                  ) : (
                    staffData.doctors.map((d: any) => (
                      <tr key={d.id}>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          Dr. {d.profile?.firstName} {d.profile?.lastName}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{d.specialty}</td>
                        <td className="p-4 font-mono text-slate-400">{d.licenseNumber}</td>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">
                          ${Number(d.consultationFee).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <Badge variant={d.licenseVerified ? "teal" : "neutral"}>
                            {d.licenseVerified ? "Verified" : "Pending Audit"}
                          </Badge>
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

      {/* Tab: Staff & Invitations */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Roster & Secure Invitations</h1>
              <p className="text-xs text-slate-500 mt-1">Manage receptionists, billing personnel, and track invitation tokens.</p>
            </div>
            <Button variant="teal" size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4" /> Invite Staff
            </Button>
          </div>

          {/* Pending Invitations */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm">Active Pending Invitations ({staffData.pendingInvitations.length})</h3>
            {staffData.pendingInvitations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending invitations. All invited members have registered.</p>
            ) : (
              <div className="space-y-2">
                {staffData.pendingInvitations.map((inv: any) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs gap-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{inv.email}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Role: {inv.role} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-[11px] font-mono select-all">
                        {inv.token.substring(0, 16)}...
                      </code>
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => copyToken(inv.token)}>
                        <Copy className="w-3.5 h-3.5" /> Copy Token
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Current Staff Roster */}
          <Card>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm">Active Clinic Staff Roster</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Clinic Role</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffData.staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No additional staff members found.
                      </td>
                    </tr>
                  ) : (
                    staffData.staff.map((m: any) => (
                      <tr key={m.id}>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {m.profile?.firstName} {m.profile?.lastName}
                        </td>
                        <td className="p-4 text-slate-500">{m.profile?.email}</td>
                        <td className="p-4"><Badge variant="teal">{m.clinicRole}</Badge></td>
                        <td className="p-4 text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                        <td className="p-4"><Badge variant="teal">Active</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Master Appointment Ledger</h1>
              <p className="text-xs text-slate-500 mt-1">
                Cross-practitioner booking schedule with instant check-in • {clinicAppointments.length} total consultations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="teal">Real-Time Ledger</Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Doctor:</span>
              <select
                value={appointmentDoctorFilter}
                onChange={(e) => setAppointmentDoctorFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Clinic Doctors</option>
                {staffData.doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.profile?.firstName} {d.profile?.lastName} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={appointmentStatusFilter}
                onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>

          {/* Appointments Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Assigned Doctor</th>
                    <th className="p-4">Scheduled Slot</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Fee / Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingAppointments ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">Loading clinic appointments...</td>
                    </tr>
                  ) : clinicAppointments
                      .filter(a => appointmentDoctorFilter === "ALL" || a.doctorId === appointmentDoctorFilter)
                      .filter(a => appointmentStatusFilter === "ALL" || a.status === appointmentStatusFilter)
                      .length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No appointments found matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    clinicAppointments
                      .filter(a => appointmentDoctorFilter === "ALL" || a.doctorId === appointmentDoctorFilter)
                      .filter(a => appointmentStatusFilter === "ALL" || a.status === appointmentStatusFilter)
                      .map((apt) => {
                        const start = new Date(apt.scheduledStart);
                        const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const dateStr = start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                        const patientName = apt.patient?.profile 
                          ? `${apt.patient.profile.firstName} ${apt.patient.profile.lastName}`
                          : "Patient";
                        const doctorName = apt.doctor?.profile
                          ? `Dr. ${apt.doctor.profile.firstName} ${apt.doctor.profile.lastName}`
                          : "Doctor";

                        return (
                          <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                              {apt.bookingReference || apt.id.substring(0, 8)}
                            </td>
                            <td className="p-4 font-semibold text-slate-900 dark:text-white">
                              {patientName}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">
                              {doctorName}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">
                              <span className="font-medium text-slate-900 dark:text-white block">{timeStr}</span>
                              <span className="text-[10px] text-slate-400">{dateStr}</span>
                            </td>
                            <td className="p-4">
                              <Badge variant={apt.visitType === "VIDEO_VISIT" ? "info" : "teal"}>
                                {apt.visitType === "VIDEO_VISIT" ? "Video Visit" : "In-Clinic"}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold block">${Number(apt.consultationFee || 0).toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400">{apt.paymentStatus}</span>
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                apt.status === "CONFIRMED" ? "teal" :
                                apt.status === "IN_PROGRESS" ? "warning" :
                                apt.status === "COMPLETED" ? "success" :
                                apt.status === "CANCELLED" ? "danger" : "neutral"
                              }>
                                {apt.status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                                  <>
                                    <Button
                                      variant="teal"
                                      size="sm"
                                      className="text-[11px] h-7 px-2.5"
                                      onClick={() => handleUpdateClinicAppointmentStatus(apt.id, "IN_PROGRESS")}
                                    >
                                      Check-In
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50"
                                      onClick={() => handleUpdateClinicAppointmentStatus(apt.id, "NO_SHOW")}
                                    >
                                      No-Show
                                    </Button>
                                  </>
                                )}
                                {apt.status === "IN_PROGRESS" && (
                                  <Button
                                    variant="teal"
                                    size="sm"
                                    className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleUpdateClinicAppointmentStatus(apt.id, "COMPLETED")}
                                  >
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revenue, Invoices & Payouts</h1>
            <p className="text-xs text-slate-500 mt-1">Track patient collections and doctor payout percentages.</p>
          </div>
          <Card className="p-6">
            <p className="text-xs text-slate-500">Integrated Razorpay test transactions and refund workflow.</p>
          </Card>
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Analytics & KPI Engine</h1>
            <p className="text-xs text-slate-500 mt-1">Capacity utilization, patient retention, and peak consultation hours.</p>
          </div>
          <Card className="p-6">
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              Recharts Visualizations will be wired in Phase 8 (Consultation Trends, No-Show Correlation)
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance & Clinical Reports</h1>
            <p className="text-xs text-slate-500 mt-1">Monthly audits, HIPAA access logs, and attendance summaries.</p>
          </div>
          <Card className="p-6">
            <Button variant="outline" size="sm" className="text-xs">Export CSV Audit Trail</Button>
          </Card>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Profile & Operating Hours</h1>
            <p className="text-xs text-slate-500 mt-1">Configure clinic address, phone, and booking cancellation policies in Supabase.</p>
          </div>
          <Card className="p-6 space-y-4">
            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.operatingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    placeholder="e.g. 08:30 - 17:30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.state}
                    onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="teal" size="sm" disabled={isUpdatingSettings || !selectedClinic}>
                  {isUpdatingSettings ? "Saving to Supabase..." : "Save Clinic Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Invite Staff / Doctor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                Invite Practitioner or Staff
              </h3>
              <button 
                onClick={() => {
                  setShowInviteModal(false)
                  setLastInviteToken(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Invitee Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Assigned Clinic Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="DOCTOR">Doctor (Attending Physician)</option>
                  <option value="RECEPTIONIST">Receptionist (Front Desk)</option>
                  <option value="BILLING">Billing / Finance Staff</option>
                  <option value="ADMIN">Clinic Co-Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowInviteModal(false)
                    setLastInviteToken(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" disabled={isInviting}>
                  {isInviting ? "Generating..." : "Generate Secure Invite"}
                </Button>
              </div>
            </form>

            {/* Generated Token Alert */}
            {lastInviteToken && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 text-xs space-y-2 mt-3">
                <span className="font-bold text-teal-800 dark:text-teal-200 block">
                  Invitation Created in Supabase!
                </span>
                <p className="text-[11px] text-slate-500">
                  Share this invitation token with the recipient:
                </p>
                <div className="flex items-center gap-2">
                  <code className="p-1.5 bg-white dark:bg-slate-900 border border-teal-500/20 rounded font-mono text-[11px] flex-1 break-all select-all">
                    {lastInviteToken}
                  </code>
                  <Button variant="teal" size="sm" className="shrink-0 text-xs gap-1" onClick={() => copyToken(lastInviteToken)}>
                    {hasCopiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
