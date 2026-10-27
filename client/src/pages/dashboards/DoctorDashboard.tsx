import { useState, useEffect } from "react"
import { 
  Calendar, Clock, Users, FileText, 
  Sparkles, Bot, Stethoscope, Save,
  CheckCircle2, Coffee, ShieldAlert,
  Edit3, Pill
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/context/AuthContext"
import { api, type Doctor, type Appointment } from "@/lib/api"
import { SoapNoteEditorModal } from "@/components/medical/SoapNoteEditorModal"
import { PrescriptionBuilderModal } from "@/components/medical/PrescriptionBuilderModal"
import { AiCopilotModal } from "@/components/ai/AiCopilotModal"

const DAYS_OF_WEEK = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
  { index: 0, name: "Sunday" },
]

export function DoctorDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("today")
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentFilter, setAppointmentFilter] = useState<string>("ALL")
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([])
  const [breaks, setBreaks] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  // Phase Five Medical Modals State
  const [soapModalAppointment, setSoapModalAppointment] = useState<Appointment | null>(null)
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false)
  const [rxModalAppointment, setRxModalAppointment] = useState<Appointment | null>(null)
  const [isRxModalOpen, setIsRxModalOpen] = useState(false)

  // Phase Six Clinical AI Copilot State
  const [copilotAppointment, setCopilotAppointment] = useState<Appointment | null>(null)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [initialSoapDraft, setInitialSoapDraft] = useState<{
    subjective: string
    objective: string
    assessment: string
    plan: string
  } | null>(null)

  // Onboarding state for non-onboarded doctors
  const [onboardForm, setOnboardForm] = useState({
    specialty: "General Medicine",
    licenseNumber: "",
    qualifications: "MBBS, MD",
    yearsOfExperience: 5,
    consultationFee: 75,
    bio: "",
  })
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Break form state
  const [breakForm, setBreakForm] = useState({
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    title: "Lunch Break",
  })
  const [isAddingBreak, setIsAddingBreak] = useState(false)

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    reason: "Medical Conference / Annual Leave",
  })
  const [isAddingLeave, setIsAddingLeave] = useState(false)

  // Profile Edit state
  const [editProfile, setEditProfile] = useState({
    specialty: "",
    consultationFee: 0,
    bio: "",
    yearsOfExperience: 0,
    qualifications: "",
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const navItems: NavItem[] = [
    { id: "today", label: "Consultation Queue", icon: Clock, badge: appointments.filter(a => a.status === "CONFIRMED" || a.status === "IN_PROGRESS").length || undefined },
    { id: "schedule", label: "Weekly Schedule", icon: Calendar },
    { id: "breaks", label: "Breaks & Leaves", icon: Coffee },
    { id: "profile", label: "Doctor Profile", icon: Stethoscope },
    { id: "patients", label: "Assigned Patients", icon: Users },
    { id: "notes", label: "Consultation Notes", icon: FileText },
    { id: "ai-summaries", label: "AI Clinical Summaries", icon: Bot, badge: "AI" },
  ]

  // Load Doctor Appointments
  const loadDoctorAppointments = async (doctorId: string) => {
    try {
      setLoadingAppointments(true)
      const data = await api.getDoctorAppointments(doctorId)
      setAppointments(data)
    } catch (err: any) {
      console.error("Failed to load doctor appointments:", err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  // Handle status update
  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status)
      toast.success(`Appointment marked as ${status}`)
      if (doctor) await loadDoctorAppointments(doctor.id)
    } catch (err: any) {
      toast.error(err.message || "Failed to update appointment status")
    }
  }

  // Load Doctor Profile and Schedules from Live Supabase
  const loadDoctorData = async () => {
    try {
      setLoading(true)
      const doc = await api.getMyDoctorProfile()
      if (doc) {
        setDoctor(doc)
        setEditProfile({
          specialty: doc.specialty || "",
          consultationFee: Number(doc.consultationFee) || 50,
          bio: doc.bio || "",
          yearsOfExperience: doc.yearsOfExperience || 0,
          qualifications: doc.qualifications || "",
        })

        // Fetch Live Appointments
        await loadDoctorAppointments(doc.id)

        // Fetch Schedule, Breaks & Leaves
        const sched = await api.getDoctorSchedule(doc.id)
        if (sched) {
          // Initialize slots for all 7 days if empty
          const existingSlots = sched.availability || []
          const initialized = DAYS_OF_WEEK.map((d) => {
            const found = existingSlots.find((s: any) => s.dayOfWeek === d.index)
            return (
              found || {
                dayOfWeek: d.index,
                startTime: "09:00",
                endTime: "17:00",
                slotDurationMinutes: 30,
                isActive: d.index >= 1 && d.index <= 5,
              }
            )
          })
          setScheduleSlots(initialized)
          setBreaks(sched.breaks || [])
          setLeaves(sched.leaves || [])
        }
      }
    } catch (err: any) {
      console.error("Failed to load doctor details:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorData()
  }, [])

  // Handle Onboarding
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onboardForm.licenseNumber.trim()) {
      toast.error("Medical license number is required")
      return
    }

    try {
      setIsOnboarding(true)
      const newDoc = await api.onboardDoctor(onboardForm)
      toast.success("Doctor profile onboarded successfully!")
      setDoctor(newDoc)
      await loadDoctorData()
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard doctor")
    } finally {
      setIsOnboarding(false)
    }
  }

  // Handle Save Weekly Schedule
  const handleSaveSchedule = async () => {
    if (!doctor) return
    try {
      setIsSavingSchedule(true)
      await api.setDoctorSchedule(doctor.id, scheduleSlots)
      toast.success("Weekly recurring working hours saved to Supabase!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update weekly schedule")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  // Handle Add Break
  const handleAddBreak = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return
    try {
      setIsAddingBreak(true)
      const newBreak = await api.addDoctorBreak(doctor.id, breakForm)
      setBreaks((prev) => [...prev, newBreak])
      toast.success("Break scheduled successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to add break")
    } finally {
      setIsAddingBreak(false)
    }
  }

  // Handle Add Leave
  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return
    try {
      setIsAddingLeave(true)
      const newLeave = await api.addDoctorLeave(doctor.id, leaveForm)
      setLeaves((prev) => [...prev, newLeave])
      toast.success("Leave registered and slots blocked!")
    } catch (err: any) {
      toast.error(err.message || "Failed to record leave")
    } finally {
      setIsAddingLeave(false)
    }
  }

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return
    try {
      setIsUpdatingProfile(true)
      const token = localStorage.getItem("medislot_token")
      const res = await fetch(`http://localhost:5000/api/doctors/${doctor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editProfile),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || "Failed to update profile")
      toast.success("Doctor profile updated successfully!")
      setDoctor(json.data?.doctor)
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const displayName = doctor 
    ? `Dr. ${doctor.profile?.firstName} ${doctor.profile?.lastName}`
    : user 
    ? `Dr. ${user.firstName} ${user.lastName}` 
    : "Dr. Sarah Jenkins, MD"

  const subtitle = doctor 
    ? `${doctor.specialty} • ${doctor.clinic?.name || "Independent Practice"}`
    : "Cardiology • Metro Health"

  return (
    <DashboardShell
      roleTitle="Doctor Workspace"
      roleColor="teal"
      userDisplayName={displayName}
      userSubtitle={subtitle}
      userAvatar="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* If Doctor Profile is Not Found / Onboarding Needed */}
      {!loading && !doctor && (
        <Card className="p-8 border-teal-500/50 bg-teal-50/10 dark:bg-teal-950/20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/15 text-teal-600 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Complete Your Doctor Profile
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are signed in as a physician account. Provide your clinical credentials and specialty to start offering bookable appointments.
                </p>
              </div>

              <form onSubmit={handleOnboard} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.specialty}
                    onChange={(e) => setOnboardForm({ ...onboardForm, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    placeholder="e.g. Cardiology, Pediatrics"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Medical License Number</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.licenseNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, licenseNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    placeholder="e.g. MD-LIC-9921"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Security: License will be subject to administrator verification before being listed as verified.
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Qualifications / Degrees</label>
                  <input
                    type="text"
                    value={onboardForm.qualifications}
                    onChange={(e) => setOnboardForm({ ...onboardForm, qualifications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    placeholder="e.g. MBBS, MD (Cardiology)"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Consultation Fee ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={onboardForm.consultationFee}
                    onChange={(e) => setOnboardForm({ ...onboardForm, consultationFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">Professional Bio & Experience</label>
                  <textarea
                    rows={2}
                    value={onboardForm.bio}
                    onChange={(e) => setOnboardForm({ ...onboardForm, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    placeholder="Brief description of clinical training, clinical interests, and patient care approach..."
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" variant="teal" size="sm" disabled={isOnboarding}>
                    {isOnboarding ? "Saving to Supabase..." : "Submit Doctor Credentials"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Consultations Queue */}
      {activeTab === "today" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Consultation Queue</h1>
              <p className="text-xs text-slate-500 mt-1">
                {appointments.length} total scheduled consultations • Live Supabase Ledger
              </p>
            </div>
            <div className="flex items-center gap-2">
              {doctor && (
                <Badge variant={doctor.licenseVerified ? "teal" : "neutral"} className="gap-1">
                  {doctor.licenseVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-teal-500" />
                      License Verified
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                      License Pending Audit ({doctor.licenseNumber})
                    </>
                  )}
                </Badge>
              )}
              <Badge variant="teal">Room 304</Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {["ALL", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setAppointmentFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  appointmentFilter === st
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {loadingAppointments ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading appointments from Supabase...</div>
          ) : appointments.filter(a => appointmentFilter === "ALL" || a.status === appointmentFilter).length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No appointments matching this filter.</p>
              <p className="text-slate-400">When patients book your slots, their consultations will appear here in real time.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments
                .filter(a => appointmentFilter === "ALL" || a.status === appointmentFilter)
                .map((apt) => {
                  const startTime = new Date(apt.scheduledStart);
                  const timeStr = startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const dateStr = startTime.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                  const patientName = apt.patient?.profile 
                    ? `${apt.patient.profile.firstName} ${apt.patient.profile.lastName}`
                    : "Patient";

                  const isBorderHighlight = 
                    apt.status === "IN_PROGRESS" ? "border-l-4 border-l-amber-500" :
                    apt.status === "COMPLETED" ? "border-l-4 border-l-emerald-500" :
                    apt.status === "CANCELLED" ? "border-l-4 border-l-rose-500 opacity-60" :
                    "border-l-4 border-l-teal-500";

                  return (
                    <Card key={apt.id} className={`hover:border-teal-500 transition-all ${isBorderHighlight}`}>
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 min-w-[70px]">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{timeStr}</span>
                            <span className="text-[10px] text-slate-400">{dateStr}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{patientName}</h4>
                              <Badge variant={apt.visitType === "VIDEO_VISIT" ? "info" : "teal"}>
                                {apt.visitType === "VIDEO_VISIT" ? "Video Visit" : "In-Clinic"}
                              </Badge>
                              <Badge variant={
                                apt.status === "CONFIRMED" ? "teal" :
                                apt.status === "IN_PROGRESS" ? "warning" :
                                apt.status === "COMPLETED" ? "success" :
                                apt.status === "CANCELLED" ? "danger" : "neutral"
                              }>
                                {apt.status.replace("_", " ")}
                              </Badge>
                              <span className="text-[10px] font-mono text-slate-400">
                                {apt.bookingReference || apt.id.substring(0, 8)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Reason:</span> {apt.reasonForVisit || apt.reason || "Routine Consultation"}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Fee: ${Number(apt.consultationFee || 0).toFixed(2)}</span>
                              <span>• Payment: <span className="font-medium text-slate-600 dark:text-slate-300">{apt.paymentStatus}</span> ({apt.paymentMethod?.replace("_", " ")})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => setActiveTab("ai-summaries")} className="text-xs gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-teal-600" /> AI Notes
                          </Button>
                          
                          {/* Status Actions */}
                          {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                            <>
                              <Button
                                variant="teal"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleUpdateStatus(apt.id, "IN_PROGRESS")}
                              >
                                Check-In / Start
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                onClick={() => handleUpdateStatus(apt.id, "NO_SHOW")}
                              >
                                No-Show
                              </Button>
                            </>
                          )}

                          {apt.status === "IN_PROGRESS" && (
                            <Button
                              variant="teal"
                              size="sm"
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                            >
                              Mark Completed
                            </Button>
                          )}

                          {apt.status !== "CANCELLED" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-indigo-400 border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                                onClick={() => {
                                  setCopilotAppointment(apt)
                                  setIsCopilotOpen(true)
                                }}
                              >
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                AI Copilot
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-sky-600 border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-950/20"
                                onClick={() => {
                                  setSoapModalAppointment(apt)
                                  setIsSoapModalOpen(true)
                                }}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                SOAP Note
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-purple-600 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                onClick={() => {
                                  setRxModalAppointment(apt)
                                  setIsRxModalOpen(true)
                                }}
                              >
                                <Pill className="w-3.5 h-3.5 mr-1" />
                                Issue Rx
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Weekly Schedule */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Recurring Working Hours</h1>
              <p className="text-xs text-slate-500 mt-1">Configure your clinical shifts. MediSlot generates 30-minute bookable slots automatically.</p>
            </div>
            <Button 
              variant="teal" 
              size="sm" 
              className="gap-2"
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule || !doctor}
            >
              <Save className="w-4 h-4" />
              {isSavingSchedule ? "Saving to Supabase..." : "Save Schedule Changes"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {scheduleSlots.map((slot, idx) => {
              const dayMeta = DAYS_OF_WEEK.find((d) => d.index === slot.dayOfWeek)
              return (
                <Card key={slot.dayOfWeek} className={`p-4 transition-all ${slot.isActive ? "border-teal-500/40 bg-teal-50/5" : "opacity-60 bg-slate-50/50 dark:bg-slate-900/40"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={slot.isActive}
                        onChange={(e) => {
                          const updated = [...scheduleSlots]
                          updated[idx].isActive = e.target.checked
                          setScheduleSlots(updated)
                        }}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {dayMeta?.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {slot.isActive ? "Active Working Shift" : "Day Off (No slots generated)"}
                        </span>
                      </div>
                    </div>

                    {slot.isActive && (
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Start:</span>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updated = [...scheduleSlots]
                              updated[idx].startTime = e.target.value
                              setScheduleSlots(updated)
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">End:</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updated = [...scheduleSlots]
                              updated[idx].endTime = e.target.value
                              setScheduleSlots(updated)
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                          />
                        </div>
                        <Badge variant="teal">30 min slots</Badge>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Breaks & Leaves */}
      {activeTab === "breaks" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Breaks & Scheduled Leaves</h1>
            <p className="text-xs text-slate-500 mt-1">
              Add recurring lunch/admin breaks and vacation blocks. The MediSlot availability engine automatically removes overlapping appointment slots.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Break Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm">Add Recurring Daily Break</h3>
              </div>
              <form onSubmit={handleAddBreak} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Day of Week</label>
                  <select
                    value={breakForm.dayOfWeek}
                    onChange={(e) => setBreakForm({ ...breakForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.index} value={d.index}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={breakForm.startTime}
                      onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={breakForm.endTime}
                      onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Break Description</label>
                  <input
                    type="text"
                    value={breakForm.title}
                    onChange={(e) => setBreakForm({ ...breakForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    placeholder="e.g. Lunch Break, Clinical Rounds"
                  />
                </div>
                <Button type="submit" variant="teal" size="sm" disabled={isAddingBreak || !doctor} className="w-full">
                  {isAddingBreak ? "Saving..." : "Add Recurring Break"}
                </Button>
              </form>

              {/* List of active breaks */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Breaks</h4>
                {breaks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recurring breaks scheduled.</p>
                ) : (
                  breaks.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{b.title || "Break"}</span>
                        <span className="text-[11px] text-slate-400">{DAYS_OF_WEEK.find(d => d.index === b.dayOfWeek)?.name}: {b.startTime} - {b.endTime}</span>
                      </div>
                      <Badge variant="neutral">Recurring</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Add Leave Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm">Register Approved Leave / Vacation</h3>
              </div>
              <form onSubmit={handleAddLeave} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    placeholder="e.g. Annual Vacation, CME Training"
                  />
                </div>
                <Button type="submit" variant="teal" size="sm" disabled={isAddingLeave || !doctor} className="w-full">
                  {isAddingLeave ? "Saving..." : "Record Leave Block"}
                </Button>
              </form>

              {/* List of active leaves */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Leaves</h4>
                {leaves.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No leaves registered.</p>
                ) : (
                  leaves.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{l.reason || "Approved Leave"}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="danger">Slots Blocked</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Doctor Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Professional Profile & Bio</h1>
            <p className="text-xs text-slate-500 mt-1">Manage public directory credentials, consultation pricing, and medical qualifications.</p>
          </div>

          <Card className="p-6 space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    value={editProfile.specialty}
                    onChange={(e) => setEditProfile({ ...editProfile, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Consultation Fee ($ USD)</label>
                  <input
                    type="number"
                    value={editProfile.consultationFee}
                    onChange={(e) => setEditProfile({ ...editProfile, consultationFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Qualifications / Board Certifications</label>
                  <input
                    type="text"
                    value={editProfile.qualifications}
                    onChange={(e) => setEditProfile({ ...editProfile, qualifications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Years in Practice</label>
                  <input
                    type="number"
                    value={editProfile.yearsOfExperience}
                    onChange={(e) => setEditProfile({ ...editProfile, yearsOfExperience: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">Clinical Bio</label>
                  <textarea
                    rows={3}
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="teal" size="sm" disabled={isUpdatingProfile || !doctor} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  {isUpdatingProfile ? "Updating..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab: Assigned Patients */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assigned Patient Panel</h1>
            <p className="text-xs text-slate-500 mt-1">Active patients under primary or consultative cardiology care.</p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Age / Sex</th>
                    <th className="p-4">Primary Condition</th>
                    <th className="p-4">Last Visit</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Alex Turner</td>
                    <td className="p-4 text-slate-500">34 / M</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Hypertension Stage 1</td>
                    <td className="p-4 text-slate-500">Sep 28, 2026</td>
                    <td className="p-4"><button className="text-teal-600 hover:underline font-semibold">Open Chart</button></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Maria Gonzales</td>
                    <td className="p-4 text-slate-500">42 / F</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Benign Arrhythmia</td>
                    <td className="p-4 text-slate-500">Aug 12, 2026</td>
                    <td className="p-4"><button className="text-teal-600 hover:underline font-semibold">Open Chart</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Consultation Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Consultation Notes & EHR</h1>
            <p className="text-xs text-slate-500 mt-1">SOAP notes and electronic medical records.</p>
          </div>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm">Create New SOAP Note</h3>
            <textarea
              rows={4}
              placeholder="Subjective, Objective, Assessment, Plan..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <Button variant="teal" size="sm" onClick={() => toast.success("SOAP note synced to clinical record")}>
              Save Note & Sync to Patient Portal
            </Button>
          </Card>
        </div>
      )}

      {/* Tab: AI Clinical Summaries */}
      {activeTab === "ai-summaries" && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Document Summaries</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Pre-consultation clinical digest generated from patient uploaded files.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Active Patient Consultations with AI Assistance ({appointments.length})
            </h2>

            {appointments.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400">
                No active patient appointments found in your queue. AI summaries will become available when appointments are confirmed.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="p-4 border-indigo-500/20 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {apt.patient ? `${apt.patient.profile.firstName} ${apt.patient.profile.lastName}` : "Patient"}
                        </span>
                        <Badge variant="teal" className="text-[10px]">
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Visit: <span className="text-slate-200">{apt.reasonForVisit || "Routine Clinical Consultation"}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Ref: {apt.bookingReference} • {new Date(apt.scheduledStart).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Supervised
                      </span>
                      <Button
                        variant="teal"
                        size="sm"
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-md shadow-indigo-600/30"
                        onClick={() => {
                          setCopilotAppointment(apt)
                          setIsCopilotOpen(true)
                        }}
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Launch AI Copilot
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase Five Modals */}
      <SoapNoteEditorModal
        isOpen={isSoapModalOpen}
        appointment={soapModalAppointment}
        initialDraft={initialSoapDraft}
        onClose={() => {
          setIsSoapModalOpen(false)
          setSoapModalAppointment(null)
          setInitialSoapDraft(null)
        }}
      />

      <PrescriptionBuilderModal
        isOpen={isRxModalOpen}
        appointment={rxModalAppointment}
        onClose={() => {
          setIsRxModalOpen(false)
          setRxModalAppointment(null)
        }}
      />

      {/* Phase Six AI Copilot Modal */}
      <AiCopilotModal
        isOpen={isCopilotOpen}
        appointment={copilotAppointment}
        onClose={() => {
          setIsCopilotOpen(false)
          setCopilotAppointment(null)
        }}
        onAdoptSoapDraft={(draft) => {
          setInitialSoapDraft(draft)
          setSoapModalAppointment(copilotAppointment)
          setIsSoapModalOpen(true)
        }}
      />
    </DashboardShell>
  )
}
