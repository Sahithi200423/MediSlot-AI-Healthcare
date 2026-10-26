import { useState } from "react"
import { 
  Calendar, Clock, Users, FileText, 
  Sparkles, Bot, Plus, Stethoscope
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("today")

  const navItems: NavItem[] = [
    { id: "today", label: "Today's Consultations", icon: Clock, badge: 4 },
    { id: "schedule", label: "Weekly Schedule", icon: Calendar },
    { id: "availability", label: "Availability Slots", icon: Plus },
    { id: "patients", label: "Assigned Patients", icon: Users },
    { id: "notes", label: "Consultation Notes", icon: FileText },
    { id: "ai-summaries", label: "AI Clinical Summaries", icon: Bot, badge: "AI" },
    { id: "follow-ups", label: "Follow-Up Queue", icon: Stethoscope },
  ]

  return (
    <DashboardShell
      roleTitle="Doctor Workspace"
      roleColor="teal"
      userDisplayName="Dr. Sarah Jenkins, MD"
      userSubtitle="Cardiology • Metro Health"
      userAvatar="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* Tab: Today's Appointments */}
      {activeTab === "today" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Today's Consultation Queue</h1>
              <p className="text-xs text-slate-500 mt-1">4 patients scheduled for today • Oct 26, 2026</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="teal">Clinic Status: Active (Room 304)</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Patient Consultation 1 */}
            <Card className="hover:border-teal-500 transition-all border-l-4 border-l-emerald-500">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">10:30</span>
                    <span className="text-[10px] text-slate-400">AM</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Alex Turner</h4>
                      <Badge variant="teal">In-Clinic</Badge>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        • Low No-Show Risk (12%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Reason: Routine follow-up for mild hypertension and lab review.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("ai-summaries")} className="text-xs gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-teal-600" /> View AI Summary
                  </Button>
                  <Button variant="teal" size="sm" className="text-xs">
                    Start Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Patient Consultation 2 */}
            <Card className="hover:border-teal-500 transition-all border-l-4 border-l-sky-500">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">11:15</span>
                    <span className="text-[10px] text-slate-400">AM</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Maria Gonzales</h4>
                      <Badge variant="info">Video Visit</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Reason: Palpitations post-exercise, reviewing Holter monitor report.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Chart
                  </Button>
                  <Button variant="teal" size="sm" className="text-xs">
                    Launch Video Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Weekly Schedule */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Calendar Schedule</h1>
            <p className="text-xs text-slate-500 mt-1">Overview of clinical shifts and consultation bookings.</p>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className={`p-3 rounded-xl border ${i === 0 ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40" : "border-slate-200 dark:border-slate-800"}`}>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{day}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{i < 5 ? "9 AM - 5 PM" : "Off Duty"}</p>
                  <Badge variant={i < 5 ? "teal" : "neutral"} className="mt-2 text-[10px]">
                    {i < 5 ? "Slots Open" : "Off"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Availability Slots */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Consultation Availability Manager</h1>
              <p className="text-xs text-slate-500 mt-1">Configure slot length (default 30 mins) and vacation blocks.</p>
            </div>
            <Button variant="teal" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Working Window
            </Button>
          </div>

          <Card className="p-6">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Configured Recurring Windows</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Monday through Thursday • Morning Block</p>
                  <p className="text-slate-400">09:00 AM – 01:00 PM (30 min slots • 8 slots)</p>
                </div>
                <Badge variant="teal">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Monday through Thursday • Afternoon Block</p>
                  <p className="text-slate-400">02:00 PM – 05:00 PM (30 min slots • 6 slots)</p>
                </div>
                <Badge variant="teal">Active</Badge>
              </div>
            </div>
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
            <Button variant="teal" size="sm">Save Note & Sync to Patient Portal</Button>
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

          <Card className="border-teal-300 dark:border-teal-800/80 bg-teal-50/20 dark:bg-teal-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-teal-900 dark:text-teal-200">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Patient: Alex Turner • CBC & Lipid Profile Report
                  </CardTitle>
                  <CardDescription className="text-xs">Extracted via FastAPI Python OCR engine • Accuracy 99.4%</CardDescription>
                </div>
                <Badge variant="teal">AI Ready</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">Summary Highlights for Clinician:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Total Cholesterol: 218 mg/dL (Borderline elevated).</li>
                  <li>LDL: 135 mg/dL; HDL: 44 mg/dL.</li>
                  <li>Blood pressure readings log averaged 132/86 mmHg over previous 14 days.</li>
                  <li className="text-rose-600 font-semibold">Flag: Patient confirmed allergy to Penicillin.</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400">
                * Note: AI summaries are decision-support aids for qualified clinicians and do not replace professional diagnosis.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Follow-Ups */}
      {activeTab === "follow-ups" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Follow-Up Patient Queue</h1>
            <p className="text-xs text-slate-500 mt-1">Track post-consultation recovery and medication checks.</p>
          </div>

          <Card className="p-6">
            <p className="text-xs text-slate-500">3 patients due for 30-day follow-up review this week.</p>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
