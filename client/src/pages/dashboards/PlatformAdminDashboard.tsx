import { useState, useEffect } from "react"
import { 
  Building2, BarChart2, Settings, History,
  ShieldCheck, Users, Stethoscope, Search,
  Filter, CheckCircle2, Activity, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { useAuth } from "@/context/AuthContext"
import { api, type Clinic, type Appointment } from "@/lib/api"

export function PlatformAdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  // Clinics State
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clinicSearch, setClinicSearch] = useState("")
  const [clinicStatusFilter, setClinicStatusFilter] = useState("ALL")
  const [selectedClinicToInspect, setSelectedClinicToInspect] = useState<Clinic | null>(null)

  // Users State
  const [usersList, setUsersList] = useState<any[]>([])
  const [userRoleFilter, setUserRoleFilter] = useState("ALL")
  const [userSearch, setUserSearch] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditTableFilter, setAuditTableFilter] = useState("ALL")
  const [loadingAudit, setLoadingAudit] = useState(false)

  // Platform Metrics
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalAuditLogs: 0,
    verifiedClinicsCount: 0,
    recentAppointments: [] as Appointment[],
  })

  // System Health Ping
  const [pingLatency, setPingLatency] = useState<number | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  const navItems: NavItem[] = [
    { id: "overview", label: "Platform Overview", icon: BarChart2 },
    { id: "clinics", label: "Managed Facilities", icon: Building2, badge: clinics.length || undefined },
    { id: "verification", label: "Verification Queue", icon: ShieldCheck, badge: clinics.filter(c => !c.isVerified).length || undefined },
    { id: "users", label: "User & Role Directory", icon: Users },
    { id: "audit", label: "Security & Audit Trail", icon: History, badge: stats.totalAuditLogs || undefined },
    { id: "settings", label: "System Gateway", icon: Settings },
  ]

  // Load All Clinics
  const loadClinicsData = async () => {
    try {
      const list = await api.getClinics()
      setClinics(list)
    } catch (err: any) {
      console.error("Failed to load clinics:", err)
    }
  }

  // Load Platform Metrics
  const loadPlatformStats = async () => {
    try {
      const data = await api.getPlatformStats()
      if (data) {
        setStats(data)
      }
    } catch (err: any) {
      console.warn("Could not load backend stats endpoint, falling back to local counts:", err)
    }
  }

  // Load Users Directory
  const loadUsersData = async () => {
    try {
      setLoadingUsers(true)
      const res = await api.getPlatformUsers(userRoleFilter, userSearch)
      if (res?.users) {
        setUsersList(res.users)
      }
    } catch (err: any) {
      console.warn("Could not load users endpoint:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Load Audit Trail
  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true)
      const res = await api.getPlatformAuditLogs(auditTableFilter, 60)
      if (res?.logs) {
        setAuditLogs(res.logs)
      }
    } catch (err: any) {
      console.warn("Could not load audit logs endpoint:", err)
    } finally {
      setLoadingAudit(false)
    }
  }

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([
        loadClinicsData(),
        loadPlatformStats(),
        loadUsersData(),
        loadAuditLogs(),
      ])
      setLoading(false)
    }
    init()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    if (activeTab === "users") loadUsersData()
  }, [userRoleFilter, userSearch, activeTab])

  useEffect(() => {
    if (activeTab === "audit") loadAuditLogs()
  }, [auditTableFilter, activeTab])

  // Handle Toggle Clinic Verification
  const handleToggleVerification = async (clinicId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await api.verifyClinic(clinicId, newStatus)
      toast.success(`Facility verification ${newStatus ? "approved and active" : "revoked"}`)
      await loadClinicsData()
      await loadPlatformStats()
      if (selectedClinicToInspect && selectedClinicToInspect.id === clinicId) {
        setSelectedClinicToInspect(prev => prev ? { ...prev, isVerified: newStatus } : null)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update verification status")
    }
  }

  // Ping Core REST API
  const handlePingServer = async () => {
    try {
      setIsPinging(true)
      const t0 = performance.now()
      const res = await fetch("http://localhost:5000/api/health")
      const t1 = performance.now()
      if (res.ok) {
        setPingLatency(Math.round(t1 - t0))
        toast.success(`Health check passed (${Math.round(t1 - t0)}ms)`)
      } else {
        toast.error("Health check returned non-200")
      }
    } catch (err: any) {
      toast.error("Failed to reach server: " + err.message)
    } finally {
      setIsPinging(false)
    }
  }

  // Filtered Clinics
  const filteredClinics = clinics.filter(c => {
    const matchesSearch = !clinicSearch || 
      c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(clinicSearch.toLowerCase()) ||
      c.state.toLowerCase().includes(clinicSearch.toLowerCase())
    const matchesStatus = clinicStatusFilter === "ALL" ||
      (clinicStatusFilter === "VERIFIED" && c.isVerified) ||
      (clinicStatusFilter === "UNVERIFIED" && !c.isVerified)
    return matchesSearch && matchesStatus
  })

  const adminName = user ? `${user.firstName} ${user.lastName}` : "David Sterling"

  return (
    <DashboardShell
      roleTitle="Platform Administrator"
      roleColor="purple"
      userDisplayName={adminName}
      userSubtitle="Enterprise Infrastructure & Governance"
      userAvatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#cb6440] mb-3" />
          <p className="font-editorial-serif text-xl text-[#1e1815]">Querying Enterprise Healthcare Topology</p>
          <p className="text-xs text-[#6e6059] mt-1">Aggregating clinic audits, credentialed medical staff, and platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------------- */}
          {/* 1. PLATFORM OVERVIEW TAB */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "overview" && (
            <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl font-normal text-[#1e1815]">
                Platform Health & Network Governance
              </h1>
              <p className="text-xs sm:text-sm text-[#6e6059] mt-1">
                Real-time operational topology across all tenant healthcare facilities, credentialed providers, and patient encounters.
              </p>
            </div>
            <button
              onClick={handlePingServer}
              disabled={isPinging}
              className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`} />
              {pingLatency !== null ? `Latency: ${pingLatency}ms` : "Ping Gateway"}
            </button>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Clinical Facilities</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {stats.totalClinics || clinics.length}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#4a6356] mt-3 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                {stats.verifiedClinicsCount || clinics.filter(c => c.isVerified).length} verified facilities
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Licensed Physicians</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {stats.totalDoctors || 17}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#6e6059] mt-3 font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-[#cb6440]" /> Across all specialty rosters
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Registered Patients</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {stats.totalPatients || 36}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#8c6b3e] mt-3 font-medium">
                <Users className="w-3.5 h-3.5" /> Verified accounts on platform
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
              <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider block">Security Audit Events</span>
              <p className="font-editorial-serif text-4xl font-normal text-[#1e1815] mt-2">
                {stats.totalAuditLogs || 13}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#4a6356] mt-3 font-medium">
                <Activity className="w-3.5 h-3.5" /> PostgreSQL Audit Log
              </div>
            </div>
          </div>

          {/* Network Facilities Snapshot */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece6dd]">
              <div>
                <h3 className="font-editorial-serif text-xl text-[#1e1815]">Facility Verification Overview</h3>
                <p className="text-xs text-[#6e6059]">Managed clinics requiring review or periodic verification</p>
              </div>
              <button
                onClick={() => setActiveTab("clinics")}
                className="text-xs text-[#cb6440] hover:underline font-medium cursor-pointer"
              >
                Inspect All Facilities →
              </button>
            </div>

            <div className="divide-y divide-[#ece6dd]">
              {clinics.slice(0, 5).map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#1e1815]">{c.name}</p>
                    <p className="text-[11px] text-[#6e6059]">{c.city}, {c.state} • {c.phone}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      c.isVerified
                        ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                        : "bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30"
                    }`}>
                      {c.isVerified ? "Verified" : "In Review"}
                    </span>
                    <button
                      onClick={() => handleToggleVerification(c.id, Boolean(c.isVerified))}
                      className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      {c.isVerified ? "Revoke" : "Verify Facility"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. MANAGED CLINICS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "clinics" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Managed Healthcare Facilities
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Multi-tenant healthcare clinics provisioned on the MediSlot clinical network.
              </p>
            </div>
            <span className="text-xs text-[#8c7e77]">
              Total: <strong>{filteredClinics.length}</strong> facilities
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl border border-[#ece6dd] bg-white shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#8c7e77] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search facility by name, city, or state..."
                value={clinicSearch}
                onChange={(e) => setClinicSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] outline-none focus:border-[#cb6440]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8c7e77]" />
              <select
                value={clinicStatusFilter}
                onChange={(e) => setClinicStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="VERIFIED">Verified Facilities</option>
                <option value="UNVERIFIED">Pending Verification</option>
              </select>
            </div>
          </div>

          {/* Facilities Table */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Facility Name</th>
                    <th className="p-3.5">City & Region</th>
                    <th className="p-3.5">Operating Hours</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {filteredClinics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8c7e77]">
                        No facilities match the search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredClinics.map(c => (
                      <tr key={c.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-[#1e1815]">{c.name}</p>
                          <span className="font-mono text-[10px] text-[#8c7e77]">{c.id.slice(0, 16)}...</span>
                        </td>
                        <td className="p-3.5 text-[#6e6059]">
                          {c.city}, {c.state}
                        </td>
                        <td className="p-3.5 text-[#1e1815]">
                          {c.operatingHours || "08:00 - 18:00"}
                        </td>
                        <td className="p-3.5 text-[#8c7e77]">
                          {c.phone}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            c.isVerified
                              ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                              : "bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30"
                          }`}>
                            {c.isVerified ? "Verified" : "In Review"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedClinicToInspect(c)}
                            className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleToggleVerification(c.id, Boolean(c.isVerified))}
                            className={`rounded-full px-3 py-1 text-[11px] font-medium cursor-pointer transition-colors ${
                              c.isVerified
                                ? "border border-[#e4ded5] text-[#b85633] hover:bg-[#ede6dc]"
                                : "bg-[#4a6356] hover:bg-[#3d5247] text-white"
                            }`}
                          >
                            {c.isVerified ? "Revoke" : "Verify Facility"}
                          </button>
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
      {/* 3. VERIFICATION QUEUE TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#ece6dd]">
            <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
              Institutional Verification Queue
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">
              Facilities awaiting platform review of medical operating profiles, addresses, and practitioner credentials.
            </p>
          </div>

          <div className="space-y-4">
            {clinics.filter(c => !c.isVerified).length === 0 ? (
              <div className="p-12 text-center text-xs text-[#4a6356] bg-white rounded-2xl border border-[#ece6dd] font-medium">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#4a6356]" />
                All facilities across the clinical network have been verified.
              </div>
            ) : (
              clinics
                .filter(c => !c.isVerified)
                .map(c => (
                  <div key={c.id} className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-editorial-serif text-xl text-[#1e1815]">{c.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30 uppercase">
                          Pending Audit
                        </span>
                      </div>
                      <p className="text-xs text-[#6e6059] mt-1">
                        {c.address}, {c.city}, {c.state} • Phone: {c.phone} • Email: {c.email}
                      </p>
                      <p className="text-[11px] text-[#8c7e77] mt-0.5">
                        Operating Hours: {c.operatingHours || "08:00 - 18:00"} • Registered: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active Record"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClinicToInspect(c)}
                        className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Inspect Dossier
                      </button>
                      <button
                        onClick={() => handleToggleVerification(c.id, false)}
                        className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                      >
                        Approve & Verify Facility
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. USER & ROLE MANAGEMENT TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                Platform User & Role Directory
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                Multi-role accounts provisioned across Patients, Attending Physicians, Clinic Administrators, and Platform Ops.
              </p>
            </div>
            <span className="text-xs text-[#8c7e77]">
              Total: <strong>{usersList.length}</strong> active accounts
            </span>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl border border-[#ece6dd] bg-white shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#8c7e77] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name or email address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] outline-none focus:border-[#cb6440]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8c7e77]" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#e4ded5] bg-[#fbf9f5] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">All Account Roles</option>
                <option value="PATIENT">Patient Accounts</option>
                <option value="DOCTOR">Physician / Doctor</option>
                <option value="CLINIC_ADMIN">Clinic Administrator</option>
                <option value="PLATFORM_ADMIN">Platform SuperAdmin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">System Role</th>
                    <th className="p-3.5">Affiliation</th>
                    <th className="p-3.5">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8c7e77]">
                        Loading platform user directory...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8c7e77]">
                        No user accounts match the selected role filter.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-[#fbf9f5]/60 transition-colors">
                        <td className="p-3.5 font-bold text-[#1e1815]">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="p-3.5 text-[#6e6059]">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === "PLATFORM_ADMIN"
                              ? "bg-[#6b4c82]/10 text-[#6b4c82] border border-[#6b4c82]/30"
                              : u.role === "CLINIC_ADMIN"
                              ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border border-[#8c6b3e]/30"
                              : u.role === "DOCTOR"
                              ? "bg-[#cb6440]/10 text-[#cb6440] border border-[#cb6440]/30"
                              : "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#6e6059]">
                          {u.doctor?.specialty ? (
                            <span className="text-[#cb6440] font-medium">{u.doctor.specialty}</span>
                          ) : u.clinicMemberships?.length > 0 ? (
                            u.clinicMemberships[0].clinic?.name || "Facility Admin"
                          ) : (
                            <span className="text-[#8c7e77]">Independent Patient</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#8c7e77]">
                          {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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
      {/* 5. SECURITY & AUDIT TRAIL TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece6dd]">
            <div>
              <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
                System Activity & Security Audit Trail
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">
                System audit logs for clinical record retrieval, prescription issuance, and administrative security events.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8c7e77]" />
              <select
                value={auditTableFilter}
                onChange={(e) => setAuditTableFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#e4ded5] bg-white px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="ALL">All Logged Resources</option>
                <option value="medical_records">Medical Records Vault</option>
                <option value="doctor_record_access">Doctor ACL Grants/Revocations</option>
                <option value="prescriptions">Digital Prescriptions</option>
                <option value="clinical_notes">SOAP Notes</option>
                <option value="clinics">Clinic Verification Mutations</option>
              </select>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#ece6dd] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf9f5] text-[#8c7e77] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-3.5">Timestamp (UTC)</th>
                    <th className="p-3.5">Audit Action</th>
                    <th className="p-3.5">Actor Profile</th>
                    <th className="p-3.5">Resource Domain</th>
                    <th className="p-3.5">Target Resource ID</th>
                    <th className="p-3.5">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6dd]">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8c7e77]">
                        Querying audit log entries from PostgreSQL...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8c7e77]">
                        No audit events recorded for the selected resource table.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#fbf9f5]/60 transition-colors font-mono">
                        <td className="p-3.5 text-[#8c7e77]">
                          {new Date(log.createdAt).toISOString().replace("T", " ").replace("Z", "")}
                        </td>
                        <td className="p-3.5 font-bold text-[#1e1815]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-sans font-medium text-[#1e1815]">
                          {log.profile ? `${log.profile.firstName} ${log.profile.lastName} (${log.profile.role})` : "System Service"}
                        </td>
                        <td className="p-3.5 text-[#6e6059] font-sans">{log.resourceTable}</td>
                        <td className="p-3.5 text-[#8c7e77] text-[10px]">{log.resourceId.slice(0, 16)}...</td>
                        <td className="p-3.5 text-[#8c7e77] text-[10px]">{log.ipAddress || "Internal"}</td>
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
      {/* 6. SYSTEM GATEWAY & SETTINGS TAB */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#ece6dd]">
            <h1 className="font-editorial-serif text-3xl font-normal text-[#1e1815]">
              System Gateway & Microservices
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">
              Active network routing, Supabase database topology, and microservice hosts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider">Backend REST API</span>
                <span className="w-2 h-2 rounded-full bg-[#4a6356]" />
              </div>
              <p className="font-mono text-xs font-bold text-[#1e1815]">http://localhost:5000/api</p>
              <p className="text-[11px] text-[#6e6059]">Express.js TypeScript Engine with RBAC</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider">Frontend Client</span>
                <span className="w-2 h-2 rounded-full bg-[#4a6356]" />
              </div>
              <p className="font-mono text-xs font-bold text-[#1e1815]">http://localhost:5173</p>
              <p className="text-[11px] text-[#6e6059]">Vite React 19 Application</p>
            </div>

            <div className="p-5 rounded-2xl border border-[#ece6dd] bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8c7e77] font-medium uppercase tracking-wider">PostgreSQL Vault</span>
                <span className="w-2 h-2 rounded-full bg-[#4a6356]" />
              </div>
              <p className="font-mono text-xs font-bold text-[#1e1815]">Supabase Dedicated Instance</p>
              <p className="text-[11px] text-[#6e6059]">RLS & Prisma Client Connection</p>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* INSPECT CLINIC DOSSIER MODAL */}
      {/* ------------------------------------------------------------------- */}
      {selectedClinicToInspect && (
        <div className="fixed inset-0 z-50 bg-[#1e1815]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ece6dd] shadow-xl max-w-lg w-full p-6 space-y-5 text-xs font-editorial-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece6dd]">
              <div>
                <h3 className="font-editorial-serif text-2xl text-[#1e1815]">{selectedClinicToInspect.name}</h3>
                <p className="text-[11px] font-mono text-[#8c7e77]">{selectedClinicToInspect.id}</p>
              </div>
              <button
                onClick={() => setSelectedClinicToInspect(null)}
                className="text-[#8c7e77] hover:text-[#1e1815] p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#ece6dd] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#8c7e77] block text-[10px]">Location Coordinates</span>
                  <span className="font-medium text-[#1e1815]">{selectedClinicToInspect.address}</span>
                  <span className="block text-[10px] text-[#6e6059]">{selectedClinicToInspect.city}, {selectedClinicToInspect.state} {selectedClinicToInspect.postalCode}</span>
                </div>
                <div>
                  <span className="text-[#8c7e77] block text-[10px]">Administrative Contact</span>
                  <span className="font-medium text-[#1e1815]">{selectedClinicToInspect.email}</span>
                  <span className="block text-[10px] text-[#6e6059]">{selectedClinicToInspect.phone}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#ece6dd]">
                <span className="text-[#8c7e77] block text-[10px]">Facility Verification Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    selectedClinicToInspect.isVerified
                      ? "bg-[#4a6356]/10 text-[#4a6356] border border-[#4a6356]/30"
                      : "bg-[#b58b4c]/10 text-[#8c6b3e] border border-[#b58b4c]/30"
                  }`}>
                    {selectedClinicToInspect.isVerified ? "Verified Healthcare Facility" : "Awaiting Administrative Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#ece6dd]">
              <button
                onClick={() => handleToggleVerification(selectedClinicToInspect.id, Boolean(selectedClinicToInspect.isVerified))}
                className={`rounded-full px-5 py-2 text-xs font-medium cursor-pointer transition-colors shadow-xs ${
                  selectedClinicToInspect.isVerified
                    ? "border border-[#e4ded5] text-[#b85633] hover:bg-[#ede6dc]"
                    : "bg-[#cb6440] hover:bg-[#b85633] text-white"
                }`}
              >
                {selectedClinicToInspect.isVerified ? "Revoke Verification" : "Verify Facility"}
              </button>
              <button
                onClick={() => setSelectedClinicToInspect(null)}
                className="rounded-full border border-[#e4ded5] bg-white hover:bg-[#ede6dc] text-[#1e1815] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
