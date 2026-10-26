import { useState } from "react"
import { 
  Calendar, Clock, User, Search, CreditCard, FileText, 
  Bell, CheckCircle2, Upload, Plus
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("upcoming")

  const navItems: NavItem[] = [
    { id: "upcoming", label: "Upcoming Appointments", icon: Calendar, badge: 2 },
    { id: "find-doctors", label: "Find & Book Doctors", icon: Search },
    { id: "history", label: "Appointment History", icon: Clock },
    { id: "documents", label: "Medical Documents", icon: FileText, badge: 3 },
    { id: "payments", label: "Billing & Payments", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 1 },
    { id: "profile", label: "My Medical Profile", icon: User },
  ]

  return (
    <DashboardShell
      roleTitle="Patient Portal"
      roleColor="sky"
      userDisplayName="Alex Turner"
      userSubtitle="ID: #MED-88219"
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
              <p className="text-xs text-slate-500 mt-1">Review upcoming consultations and arrival guidelines.</p>
            </div>
            <Button variant="teal" size="sm" onClick={() => setActiveTab("find-doctors")} className="gap-2 self-start">
              <Plus className="w-4 h-4" /> Book New Appointment
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1 */}
            <Card className="border-l-4 border-l-teal-500 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
                      alt="Doctor"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Dr. Sarah Jenkins</h3>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Cardiology Specialist</p>
                      <p className="text-xs text-slate-400">Metro Heart & Vascular Clinic</p>
                    </div>
                  </div>
                  <Badge variant="teal">Confirmed</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 block">Date & Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tomorrow • 10:30 AM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consultation Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">In-Clinic Consultation</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400">Paid: $85.00 via Razorpay</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">Reschedule</Button>
                    <Button variant="danger" size="sm" className="text-xs">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-l-4 border-l-sky-500 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1594824813511-2090432c74d8?auto=format&fit=crop&q=80&w=150"
                      alt="Doctor"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Dr. Priya Patel</h3>
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Dermatology</p>
                      <p className="text-xs text-slate-400">Lumina Clinical Dermatology</p>
                    </div>
                  </div>
                  <Badge variant="info">Upcoming</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 block">Date & Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Nov 2, 2026 • 2:00 PM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consultation Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Video Consultation</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400">Paid: $75.00 via Razorpay</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">Details</Button>
                    <Button variant="secondary" size="sm" className="text-xs">Join Room</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Find Doctors & Book */}
      {activeTab === "find-doctors" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Doctors & Book Slots</h1>
            <p className="text-xs text-slate-500 mt-1">Select from accredited healthcare providers.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by specialty, doctor or clinic..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button variant="teal" size="sm" className="gap-2">
              <Search className="w-4 h-4" /> Filter Slots
            </Button>
          </div>

          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Calendar className="w-10 h-10 text-teal-600 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Interactive Slot Booking Grid</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              In Phase 4, this view renders live 30-minute booking slots fetched from PostgreSQL with double-booking lock prevention.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Appointment History */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointment History</h1>
            <p className="text-xs text-slate-500 mt-1">Past completed and closed medical consultations.</p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Specialty</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Prescription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">Dr. Marcus Vance</td>
                    <td className="p-4 text-slate-500">Oct 14, 2026</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Neurology</td>
                    <td className="p-4"><Badge variant="success">Completed</Badge></td>
                    <td className="p-4"><button className="text-teal-600 hover:underline font-semibold">Download PDF</button></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">Dr. Sarah Jenkins</td>
                    <td className="p-4 text-slate-500">Sep 28, 2026</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Cardiology</td>
                    <td className="p-4"><Badge variant="success">Completed</Badge></td>
                    <td className="p-4"><button className="text-teal-600 hover:underline font-semibold">Download PDF</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Medical Documents */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Documents & Vault</h1>
              <p className="text-xs text-slate-500 mt-1">Securely store lab tests, X-Rays, and prescriptions.</p>
            </div>
            <Button variant="teal" size="sm" className="gap-2">
              <Upload className="w-4 h-4" /> Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Lipid_Panel_Lab.pdf</h4>
                  <p className="text-[10px] text-slate-400">Oct 10, 2026 • 1.2 MB</p>
                </div>
              </div>
              <Badge variant="teal">AI Summarized</Badge>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Chest_Xray_Scan.pdf</h4>
                  <p className="text-[10px] text-slate-400">Sep 20, 2026 • 4.8 MB</p>
                </div>
              </div>
              <Badge variant="neutral">Verified</Badge>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Vaccination_Card.pdf</h4>
                  <p className="text-[10px] text-slate-400">Aug 05, 2026 • 850 KB</p>
                </div>
              </div>
              <Badge variant="neutral">Archived</Badge>
            </Card>
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Dr. Sarah Jenkins Consultation</p>
                    <p className="text-[11px] text-slate-400">Razorpay ID: pay_928128182 • Oct 25, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">$85.00</p>
                    <span className="text-emerald-600 font-semibold text-[10px]">PAID</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Notifications</h1>
            <p className="text-xs text-slate-500 mt-1">Appointment confirmations and medical test reminders.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Appointment Confirmed with Dr. Sarah Jenkins</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Your visit is confirmed for tomorrow at 10:30 AM. Please arrive 10 minutes early.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
              </div>
            </div>
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
                <p className="font-semibold text-slate-800 dark:text-slate-200">Alex Turner</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Blood Group</label>
                <p className="font-semibold text-slate-800 dark:text-slate-200">O Positive (O+)</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Allergies</label>
                <p className="font-semibold text-rose-600">Penicillin (Severe)</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Emergency Contact</label>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Sarah Turner (+1 555-0192)</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
