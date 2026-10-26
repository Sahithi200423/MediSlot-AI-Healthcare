import { useState } from "react"
import { 
  Building2, Users, Calendar, CreditCard, BarChart3, 
  Settings, Stethoscope, FileSpreadsheet, Plus, TrendingUp
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export function ClinicAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const navItems: NavItem[] = [
    { id: "overview", label: "Clinic Overview", icon: Building2 },
    { id: "doctors", label: "Doctors & Providers", icon: Stethoscope, badge: 12 },
    { id: "staff", label: "Clinic Staff", icon: Users, badge: 8 },
    { id: "appointments", label: "Master Appointments", icon: Calendar, badge: 24 },
    { id: "payments", label: "Revenue & Billing", icon: CreditCard },
    { id: "analytics", label: "Operational Analytics", icon: BarChart3 },
    { id: "reports", label: "Clinical Reports", icon: FileSpreadsheet },
    { id: "settings", label: "Clinic Settings", icon: Settings },
  ]

  return (
    <DashboardShell
      roleTitle="Clinic Administrator"
      roleColor="emerald"
      userDisplayName="Elena Rostova"
      userSubtitle="Operations Director • Metro Health"
      userAvatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Metro Heart & Specialty Clinic</h1>
              <p className="text-xs text-slate-500 mt-1">Live operational stats for today • Oct 26, 2026</p>
            </div>
            <Button variant="teal" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Doctor to Clinic
            </Button>
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
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">12 / 14</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 font-medium">
                2 on scheduled leave
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Avg No-Show Rate</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">6.2%</p>
              <div className="flex items-center gap-1 text-[11px] text-teal-600 mt-2 font-medium">
                ML protection active
              </div>
            </Card>
          </div>

          {/* Today's Queue Preview */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Doctor Schedule Utilization</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Dr. Sarah Jenkins (Cardiology)</span>
                </div>
                <span className="text-slate-500">6 / 8 slots booked (75%)</span>
                <Badge variant="teal">On Schedule</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Dr. Marcus Vance (Neurology)</span>
                </div>
                <span className="text-slate-500">8 / 8 slots booked (100%)</span>
                <Badge variant="info">Full Capacity</Badge>
              </div>
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
            <Button variant="teal" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Doctor
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Doctor Name</th>
                    <th className="p-4">Specialty</th>
                    <th className="p-4">License</th>
                    <th className="p-4">Fee / Visit</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Dr. Sarah Jenkins</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Cardiology</td>
                    <td className="p-4 font-mono text-slate-400">MD-LIC-9921</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">$85.00</td>
                    <td className="p-4"><Badge variant="success">Active</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Dr. Marcus Vance</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">Neurology</td>
                    <td className="p-4 font-mono text-slate-400">DO-LIC-4412</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">$110.00</td>
                    <td className="p-4"><Badge variant="success">Active</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Staff */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Staff & Receptionists</h1>
            <p className="text-xs text-slate-500 mt-1">Manage desk personnel and access permissions.</p>
          </div>
          <Card className="p-6">
            <p className="text-xs text-slate-500">8 receptionists and nursing staff assigned to front desk triage.</p>
          </Card>
        </div>
      )}

      {/* Tab: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Master Appointment Ledger</h1>
            <p className="text-xs text-slate-500 mt-1">Cross-practitioner booking schedule with instant check-in.</p>
          </div>
          <Card className="p-6">
            <p className="text-xs text-slate-500">24 appointments scheduled for today across 6 consultation rooms.</p>
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
            <p className="text-xs text-slate-500 mt-1">Configure clinic address, phone, and booking cancellation policies.</p>
          </div>
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Clinic Name</label>
                <input className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold" defaultValue="Metro Heart & Specialty Clinic" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Contact Phone</label>
                <input className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold" defaultValue="+1 (555) 492-0199" />
              </div>
            </div>
            <Button variant="teal" size="sm">Save Changes</Button>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
