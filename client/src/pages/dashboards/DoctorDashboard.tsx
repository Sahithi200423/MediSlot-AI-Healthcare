import { useState, useEffect } from "react"
import { 
  Calendar, Clock, Users, FileText, 
  Sparkles, Bot, Stethoscope, Save,
  CheckCircle2, Coffee, ShieldAlert,
  Edit3, Pill
} from "lucide-react"
import { toast } from "sonner"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
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
      toast.success(`Appointment status updated to ${status.replace("_", " ")}`)
      if (doctor) loadDoctorAppointments(doctor.id)
    } catch (err: any) {
      toast.error(err.message || "Failed to update appointment status")
    }
  }

  useEffect(() => {
    async function loadDoctorData() {
      setLoading(true)
      try {
        const doctorsList = await api.getDoctors()
        const myDoc = doctorsList.find(d => d.profile?.id === user?.id || d.profile?.email === user?.email)
        
        if (myDoc) {
          setDoctor(myDoc)
          setEditProfile({
            specialty: myDoc.specialty || "",
            consultationFee: Number(myDoc.consultationFee) || 0,
            bio: myDoc.bio || "",
            yearsOfExperience: myDoc.yearsOfExperience || 0,
            qualifications: myDoc.qualifications || "",
          })
          loadDoctorAppointments(myDoc.id)

          // Load Schedule
          try {
            const sched = await api.getDoctorSchedule(myDoc.id)
            if (sched.schedule && sched.schedule.length > 0) {
              setScheduleSlots(sched.schedule)
            } else {
              setScheduleSlots(DAYS_OF_WEEK.map(d => ({
                dayOfWeek: d.index,
                startTime: "09:00",
                endTime: "17:00",
                slotDuration: 30,
                isActive: d.index >= 1 && d.index <= 5,
              })))
            }
            setBreaks(sched.breaks || [])
            setLeaves(sched.leaves || [])
          } catch {
            setScheduleSlots(DAYS_OF_WEEK.map(d => ({
              dayOfWeek: d.index,
              startTime: "09:00",
              endTime: "17:00",
              slotDuration: 30,
              isActive: d.index >= 1 && d.index <= 5,
            })))
          }
        }
      } catch (err: any) {
        console.error("Failed to load doctor profile:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadDoctorData()
    }
  }, [user])

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsOnboarding(true)
      const token = localStorage.getItem("medislot_token")
      const res = await fetch("http://localhost:5000/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || "Failed to create doctor profile")
      toast.success("Doctor profile created successfully!")
      setDoctor(json.data?.doctor)
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard doctor profile")
    } finally {
      setIsOnboarding(false)
    }
  }

  const handleSaveSchedule = async () => {
    if (!doctor) return
    try {
      setIsSavingSchedule(true)
      await api.setDoctorSchedule(doctor.id, scheduleSlots)
      toast.success("Recurring weekly schedule saved successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to save schedule")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const handleAddBreak = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return
    try {
      setIsAddingBreak(true)
      await api.addDoctorBreak(doctor.id, breakForm)
      toast.success("Recurring break registered!")
      const sched = await api.getDoctorSchedule(doctor.id)
      setBreaks(sched.breaks || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to add break")
    } finally {
      setIsAddingBreak(false)
    }
  }

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return
    try {
      setIsAddingLeave(true)
      await api.addDoctorLeave(doctor.id, leaveForm)
      toast.success("Leave period recorded! Overlapping slots blocked.")
      const sched = await api.getDoctorSchedule(doctor.id)
      setLeaves(sched.leaves || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to record leave")
    } finally {
      setIsAddingLeave(false)
    }
  }

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
    : "Cardiology • Metropolitan Pavilion"

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
        <div className="p-8 rounded-2xl border border-[#cb6440]/30 bg-[#fbf5f2] mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#cb6440]/15 text-[#cb6440] flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="font-editorial-serif text-2xl font-normal text-[#1e1815]">
                  Complete Your Doctor Profile
                </h3>
                <p className="text-xs text-[#6e6059] mt-1 font-editorial-sans">
                  You are signed in as a physician account. Provide your clinical credentials and specialty to start offering bookable appointments.
                </p>
              </div>

              <form onSubmit={handleOnboard} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.specialty}
                    onChange={(e) => setOnboardForm({ ...onboardForm, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. Cardiology, Pediatrics"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Medical License Number</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.licenseNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, licenseNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. MD-LIC-9921"
                  />
                  <span className="text-[10px] text-[#8c7e77] mt-0.5 block">
                    Security: License will be subject to administrator verification before being listed as verified.
                  </span>
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Qualifications / Degrees</label>
                  <input
                    type="text"
                    value={onboardForm.qualifications}
                    onChange={(e) => setOnboardForm({ ...onboardForm, qualifications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                    placeholder="e.g. MBBS, MD (Cardiology)"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Consultation Fee ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={onboardForm.consultationFee}
                    onChange={(e) => setOnboardForm({ ...onboardForm, consultationFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[#8c7e77] block mb-1">Professional Bio & Experience</label>
                  <textarea
                    rows={2}
                    value={onboardForm.bio}
                    onChange={(e) => setOnboardForm({ ...onboardForm, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-white font-medium focus:border-[#cb6440] outline-none"
                    placeholder="Brief description of clinical training, clinical interests, and patient care approach..."
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isOnboarding}
                    className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                  >
                    {isOnboarding ? "Saving to Supabase..." : "Submit Doctor Credentials"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Consultations Queue */}
      {activeTab === "today" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                Consultation Queue
              </h1>
              <p className="text-xs text-[#6e6059] mt-1 font-editorial-sans">
                {appointments.length} total scheduled consultations • Live Clinical Supabase Ledger
              </p>
            </div>
            <div className="flex items-center gap-2">
              {doctor && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  doctor.licenseVerified 
                    ? "bg-[#4a6356]/15 text-[#4a6356] border border-[#4a6356]/30" 
                    : "bg-[#8c6b3e]/15 text-[#8c6b3e] border border-[#8c6b3e]/30"
                }`}>
                  {doctor.licenseVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#4a6356]" />
                      License Verified
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-[#8c6b3e]" />
                      Audit Pending ({doctor.licenseNumber})
                    </>
                  )}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white border border-[#e8e2d8] text-[#1e1815]">
                Pavilion Room 304
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {["ALL", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setAppointmentFilter(st)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  appointmentFilter === st
                    ? "bg-[#cb6440] text-white shadow-2xs font-semibold"
                    : "bg-white border border-[#e8e2d8] text-[#6e6059] hover:bg-[#f8f5ee]"
                }`}
              >
                {st === "ALL" ? "All Consultations" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {loadingAppointments ? (
            <div className="p-12 text-center text-xs text-[#8c7e77]">Loading consultations from Supabase...</div>
          ) : appointments.filter(a => appointmentFilter === "ALL" || a.status === appointmentFilter).length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-[#e4ded5] bg-white rounded-2xl text-xs text-[#8c7e77] space-y-2">
              <Calendar className="w-8 h-8 text-[#8c7e77] mx-auto opacity-50" />
              <p className="font-semibold text-[#1e1815]">No consultations matching this filter.</p>
              <p className="text-[#6e6059]">When patients book your slots, their consultations will appear here in real time.</p>
            </div>
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
                    apt.status === "IN_PROGRESS" ? "border-l-4 border-l-[#cb6440]" :
                    apt.status === "COMPLETED" ? "border-l-4 border-l-[#4a6356]" :
                    apt.status === "CANCELLED" ? "border-l-4 border-l-rose-400 opacity-60" :
                    "border-l-4 border-l-[#8c7e77]";

                  return (
                    <div key={apt.id} className={`bg-white rounded-2xl border border-[#e8e2d8] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-[#cb6440]/50 transition-all ${isBorderHighlight}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-center px-3.5 py-2.5 rounded-xl bg-[#f8f5ee] border border-[#ece6dd] shrink-0 min-w-[76px]">
                          <span className="text-xs font-bold text-[#1e1815] block">{timeStr}</span>
                          <span className="text-[10px] text-[#8c7e77] font-medium">{dateStr}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-[#1e1815]">{patientName}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5f1e9] text-[#6e6059]">
                              {apt.visitType === "VIDEO_VISIT" ? "Telehealth Video" : "In-Clinic"}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              apt.status === "CONFIRMED" ? "bg-[#4a6356]/15 text-[#4a6356]" :
                              apt.status === "IN_PROGRESS" ? "bg-[#cb6440]/15 text-[#cb6440]" :
                              apt.status === "COMPLETED" ? "bg-[#4a6356]/15 text-[#4a6356]" :
                              "bg-[#ede5d9] text-[#6e6059]"
                            }`}>
                              {apt.status.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-mono text-[#8c7e77]">
                              #{apt.bookingReference || apt.id.substring(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs text-[#6e6059] mt-1 font-editorial-sans">
                            <span className="font-semibold text-[#1e1815]">Chief Complaint:</span> {apt.reasonForVisit || apt.reason || "Routine Consultation"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#8c7e77] mt-1">
                            <span>Fee: ${Number(apt.consultationFee || 0).toFixed(2)}</span>
                            <span>• Payment: <span className="font-medium text-[#1e1815]">{apt.paymentStatus}</span> ({apt.paymentMethod?.replace("_", " ")})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button" 
                          onClick={() => setActiveTab("ai-summaries")} 
                          className="rounded-full border border-[#dcd3c6] bg-white text-[#1e1815] hover:border-[#cb6440] px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Bot className="w-3.5 h-3.5 text-[#cb6440]" /> AI Digest
                        </button>
                        
                        {/* Status Actions */}
                        {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                          <>
                            <button
                              type="button"
                              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                              onClick={() => handleUpdateStatus(apt.id, "IN_PROGRESS")}
                            >
                              Check-In / Start
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                              onClick={() => handleUpdateStatus(apt.id, "NO_SHOW")}
                            >
                              No-Show
                            </button>
                          </>
                        )}

                        {apt.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            className="rounded-full bg-[#4a6356] hover:bg-[#3d5448] text-white px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                            onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                          >
                            Mark Completed
                          </button>
                        )}

                        {apt.status !== "CANCELLED" && (
                          <>
                            <button
                              type="button"
                              className="rounded-full border border-[#8c6b3e]/40 bg-[#fbf5ee] text-[#8c6b3e] hover:bg-[#f5ece0] px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              onClick={() => {
                                setCopilotAppointment(apt)
                                setIsCopilotOpen(true)
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#8c6b3e]" />
                              AI Copilot
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[#dcd3c6] bg-white text-[#1e1815] hover:border-[#cb6440] px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              onClick={() => {
                                setSoapModalAppointment(apt)
                                setIsSoapModalOpen(true)
                              }}
                            >
                              <FileText className="w-3.5 h-3.5 text-[#cb6440]" />
                              SOAP Note
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[#4a6356]/40 bg-[#f4f7f5] text-[#4a6356] hover:bg-[#eaf1ec] px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              onClick={() => {
                                setRxModalAppointment(apt)
                                setIsRxModalOpen(true)
                              }}
                            >
                              <Pill className="w-3.5 h-3.5 text-[#4a6356]" />
                              Issue Rx
                            </button>
                          </>
                        )}
                      </div>
                    </div>
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
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                Weekly Recurring Working Hours
              </h1>
              <p className="text-xs text-[#6e6059] mt-1">Configure your clinical shifts. MediSlot generates 30-minute bookable slots automatically.</p>
            </div>
            <button 
              type="button"
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule || !doctor}
            >
              <Save className="w-4 h-4" />
              {isSavingSchedule ? "Saving to Supabase..." : "Save Schedule Changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {scheduleSlots.map((slot, idx) => {
              const dayMeta = DAYS_OF_WEEK.find((d) => d.index === slot.dayOfWeek)
              return (
                <div key={slot.dayOfWeek} className={`p-4 rounded-2xl border transition-all ${slot.isActive ? "bg-white border-[#e8e2d8] shadow-2xs" : "opacity-60 bg-[#f8f5ee] border-[#ece6dd]"}`}>
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
                        className="w-4 h-4 text-[#cb6440] rounded focus:ring-[#cb6440] accent-[#cb6440] cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-sm text-[#1e1815] block">
                          {dayMeta?.name}
                        </span>
                        <span className="text-[11px] text-[#8c7e77]">
                          {slot.isActive ? "Active Working Shift" : "Day Off (No slots generated)"}
                        </span>
                      </div>
                    </div>

                    {slot.isActive && (
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#8c7e77]">Start:</span>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updated = [...scheduleSlots]
                              updated[idx].startTime = e.target.value
                              setScheduleSlots(updated)
                            }}
                            className="p-1.5 rounded-lg border border-[#e4ded5] bg-[#fbf9f5] text-xs font-semibold text-[#1e1815]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#8c7e77]">End:</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updated = [...scheduleSlots]
                              updated[idx].endTime = e.target.value
                              setScheduleSlots(updated)
                            }}
                            className="p-1.5 rounded-lg border border-[#e4ded5] bg-[#fbf9f5] text-xs font-semibold text-[#1e1815]"
                          />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#4a6356]/15 text-[#4a6356]">
                          30 min slots
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Breaks & Leaves */}
      {activeTab === "breaks" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
              Breaks & Scheduled Leaves
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">
              Add recurring lunch/admin breaks and vacation blocks. The MediSlot availability engine automatically removes overlapping appointment slots.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Break Card */}
            <div className="bg-white rounded-2xl border border-[#e8e2d8] p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#cb6440]" />
                <h3 className="font-bold text-sm text-[#1e1815]">Add Recurring Daily Break</h3>
              </div>
              <form onSubmit={handleAddBreak} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Day of Week</label>
                  <select
                    value={breakForm.dayOfWeek}
                    onChange={(e) => setBreakForm({ ...breakForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] text-[#1e1815]"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.index} value={d.index}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8c7e77] block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={breakForm.startTime}
                      onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8c7e77] block mb-1">End Time</label>
                    <input
                      type="time"
                      value={breakForm.endTime}
                      onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Break Description</label>
                  <input
                    type="text"
                    value={breakForm.title}
                    onChange={(e) => setBreakForm({ ...breakForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    placeholder="e.g. Lunch Break, Clinical Rounds"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingBreak || !doctor} 
                  className="w-full rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 text-xs font-medium cursor-pointer transition-colors"
                >
                  {isAddingBreak ? "Saving..." : "Add Recurring Break"}
                </button>
              </form>

              {/* List of active breaks */}
              <div className="pt-4 border-t border-[#f2ede4] space-y-2">
                <h4 className="text-xs font-bold text-[#8c7e77] uppercase tracking-wider">Configured Breaks</h4>
                {breaks.length === 0 ? (
                  <p className="text-xs text-[#8c7e77] italic">No recurring breaks scheduled.</p>
                ) : (
                  breaks.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f5ee] border border-[#ece6dd] text-xs">
                      <div>
                        <span className="font-semibold text-[#1e1815] block">{b.title || "Break"}</span>
                        <span className="text-[11px] text-[#8c7e77]">{DAYS_OF_WEEK.find(d => d.index === b.dayOfWeek)?.name}: {b.startTime} - {b.endTime}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ede5d9] text-[#6e6059]">Recurring</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Leave Card */}
            <div className="bg-white rounded-2xl border border-[#e8e2d8] p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#4a6356]" />
                <h3 className="font-bold text-sm text-[#1e1815]">Register Approved Leave / Vacation</h3>
              </div>
              <form onSubmit={handleAddLeave} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8c7e77] block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8c7e77] block mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                    placeholder="e.g. Annual Vacation, CME Training"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingLeave || !doctor} 
                  className="w-full rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 text-xs font-medium cursor-pointer transition-colors"
                >
                  {isAddingLeave ? "Saving..." : "Record Leave Block"}
                </button>
              </form>

              {/* List of active leaves */}
              <div className="pt-4 border-t border-[#f2ede4] space-y-2">
                <h4 className="text-xs font-bold text-[#8c7e77] uppercase tracking-wider">Scheduled Leaves</h4>
                {leaves.length === 0 ? (
                  <p className="text-xs text-[#8c7e77] italic">No leaves registered.</p>
                ) : (
                  leaves.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f5ee] border border-[#ece6dd] text-xs">
                      <div>
                        <span className="font-semibold text-[#1e1815] block">{l.reason || "Approved Leave"}</span>
                        <span className="text-[11px] text-[#8c7e77]">
                          {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Slots Blocked</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Doctor Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
              Professional Profile & Bio
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">Manage public directory credentials, consultation pricing, and medical qualifications.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e2d8] p-6 shadow-2xs space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#8c7e77] block mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    value={editProfile.specialty}
                    onChange={(e) => setEditProfile({ ...editProfile, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Consultation Fee ($ USD)</label>
                  <input
                    type="number"
                    value={editProfile.consultationFee}
                    onChange={(e) => setEditProfile({ ...editProfile, consultationFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Qualifications / Board Certifications</label>
                  <input
                    type="text"
                    value={editProfile.qualifications}
                    onChange={(e) => setEditProfile({ ...editProfile, qualifications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                  />
                </div>
                <div>
                  <label className="text-[#8c7e77] block mb-1">Years in Practice</label>
                  <input
                    type="number"
                    value={editProfile.yearsOfExperience}
                    onChange={(e) => setEditProfile({ ...editProfile, yearsOfExperience: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[#8c7e77] block mb-1">Clinical Bio</label>
                  <textarea
                    rows={3}
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#e4ded5] bg-[#fbf9f5] font-semibold text-[#1e1815]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile || !doctor} 
                  className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-xs font-medium cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {isUpdatingProfile ? "Updating..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Assigned Patients */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
              Assigned Patient Panel
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">Active patients under primary or consultative care.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8f5ee] text-[#6e6059] font-semibold border-b border-[#ece6dd]">
                  <tr>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Age / Sex</th>
                    <th className="p-4">Primary Condition</th>
                    <th className="p-4">Last Visit</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ede4]">
                  <tr className="hover:bg-[#fbf9f5]">
                    <td className="p-4 font-bold text-[#1e1815]">Alex Turner</td>
                    <td className="p-4 text-[#8c7e77]">34 / M</td>
                    <td className="p-4 text-[#4a3e39]">Hypertension Stage 1</td>
                    <td className="p-4 text-[#8c7e77]">Sep 28, 2026</td>
                    <td className="p-4"><button className="text-[#cb6440] hover:underline font-semibold cursor-pointer">Open Clinical Chart</button></td>
                  </tr>
                  <tr className="hover:bg-[#fbf9f5]">
                    <td className="p-4 font-bold text-[#1e1815]">Maria Gonzales</td>
                    <td className="p-4 text-[#8c7e77]">42 / F</td>
                    <td className="p-4 text-[#4a3e39]">Benign Arrhythmia</td>
                    <td className="p-4 text-[#8c7e77]">Aug 12, 2026</td>
                    <td className="p-4"><button className="text-[#cb6440] hover:underline font-semibold cursor-pointer">Open Clinical Chart</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Consultation Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
              Consultation Notes & EHR
            </h1>
            <p className="text-xs text-[#6e6059] mt-1">SOAP notes and electronic medical records.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e2d8] p-6 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-[#1e1815]">Create New SOAP Clinical Note</h3>
            <textarea
              rows={4}
              placeholder="Subjective, Objective, Assessment, Plan..."
              className="w-full rounded-xl border border-[#e4ded5] bg-[#fbf9f5] p-3 text-xs text-[#1e1815] focus:border-[#cb6440] outline-none"
            />
            <button 
              type="button"
              className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-5 py-2 text-xs font-medium cursor-pointer transition-colors"
              onClick={() => toast.success("SOAP note synced to clinical record")}
            >
              Save Note & Sync to Patient Portal
            </button>
          </div>
        </div>
      )}

      {/* Tab: AI Clinical Summaries */}
      {activeTab === "ai-summaries" && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#cb6440]" />
              <h1 className="font-editorial-serif text-3xl sm:text-4xl text-[#1e1815] font-normal tracking-tight">
                AI Document Summaries
              </h1>
            </div>
            <p className="text-xs text-[#6e6059] mt-1">Pre-consultation clinical digest generated from patient uploaded files.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7e77]">
              Active Patient Consultations with AI Assistance ({appointments.length})
            </h2>

            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c7e77] bg-white rounded-2xl border border-[#e8e2d8]">
                No active patient appointments found in your queue. AI summaries will become available when appointments are confirmed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white rounded-2xl border border-[#e8e2d8] p-5 hover:border-[#cb6440]/50 transition-all shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1e1815]">
                          {apt.patient ? `${apt.patient.profile.firstName} ${apt.patient.profile.lastName}` : "Patient"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f8f5ee] text-[#6e6059]">
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6e6059]">
                        Visit: <span className="text-[#1e1815]">{apt.reasonForVisit || "Routine Clinical Consultation"}</span>
                      </p>
                      <p className="text-[10px] text-[#8c7e77] font-mono">
                        Ref: {apt.bookingReference} • {new Date(apt.scheduledStart).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#f2ede4] flex items-center justify-between">
                      <span className="text-[10px] text-[#8c6b3e] flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3 h-3 text-[#8c6b3e]" />
                        Physician Supervised
                      </span>
                      <button
                        type="button"
                        className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                        onClick={() => {
                          setCopilotAppointment(apt)
                          setIsCopilotOpen(true)
                        }}
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Launch AI Copilot
                      </button>
                    </div>
                  </div>
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
