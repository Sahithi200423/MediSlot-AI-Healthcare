import { useState } from "react"
import { 
  Building2, BarChart2, Settings, History, Plus
} from "lucide-react"
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export function PlatformAdminDashboard() {
  const [activeTab, setActiveTab] = useState("clinics")

  const navItems: NavItem[] = [
    { id: "clinics", label: "Managed Clinics", icon: Building2, badge: 38 },
    { id: "onboarding", label: "Clinic Onboarding", icon: Plus, badge: 4 },
    { id: "analytics", label: "Global Platform Analytics", icon: BarChart2 },
    { id: "audit", label: "Security & Audit Logs", icon: History },
    { id: "settings", label: "Global Settings", icon: Settings },
  ]

  return (
    <DashboardShell
      roleTitle="Platform SuperAdmin"
      roleColor="purple"
      userDisplayName="Root Administrator"
      userSubtitle="SaaS Infrastructure Ops"
      userAvatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {/* Tab: Managed Clinics */}
      {activeTab === "clinics" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Healthcare Clinics</h1>
              <p className="text-xs text-slate-500 mt-1">38 verified multi-specialty clinics currently hosted on MediSlot.</p>
            </div>
            <Button variant="teal" size="sm" onClick={() => setActiveTab("onboarding")} className="gap-2">
              <Plus className="w-4 h-4" /> Onboard New Clinic
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Clinic Name</th>
                    <th className="p-4">City / Region</th>
                    <th className="p-4">Doctors</th>
                    <th className="p-4">Monthly Visits</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Metro Heart & Vascular Center</td>
                    <td className="p-4 text-slate-500">New York, NY</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">14 Doctors</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">1,840</td>
                    <td className="p-4"><Badge variant="success">Verified</Badge></td>
                    <td className="p-4 text-emerald-600 font-semibold">Compliant</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Apex Brain & Spine Institute</td>
                    <td className="p-4 text-slate-500">Boston, MA</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">8 Doctors</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">920</td>
                    <td className="p-4"><Badge variant="success">Verified</Badge></td>
                    <td className="p-4 text-emerald-600 font-semibold">Compliant</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">Lumina Clinical Dermatology</td>
                    <td className="p-4 text-slate-500">San Francisco, CA</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">11 Doctors</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">1,420</td>
                    <td className="p-4"><Badge variant="success">Verified</Badge></td>
                    <td className="p-4 text-emerald-600 font-semibold">Compliant</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Clinic Onboarding */}
      {activeTab === "onboarding" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Clinic Onboarding Verification</h1>
            <p className="text-xs text-slate-500 mt-1">Review medical licenses and institutional registrations.</p>
          </div>

          <div className="space-y-4">
            <Card className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Oakwood Family Medical Associates</h4>
                <p className="text-xs text-slate-500">Submitted 3 hours ago • Seattle, WA • License #WA-CLI-49102</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">Inspect Documents</Button>
                <Button variant="teal" size="sm" className="text-xs">Approve & Provision</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Global Platform Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Platform Metrics</h1>
            <p className="text-xs text-slate-500 mt-1">Cross-tenant transaction volumes and infrastructure health.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Total Bookings This Month</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">15,482</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">Total Gross Merchandise Value</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">$1.24M</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-slate-400 font-medium">API Response Time (p95)</span>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">48ms</p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Security & Audit Logs */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Immutable Audit Trail</h1>
            <p className="text-xs text-slate-500 mt-1">System mutations, logins, and clinical file access logs.</p>
          </div>

          <Card className="p-6">
            <div className="space-y-3 font-mono text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between">
                <span>[2026-10-26 19:42:01 UTC] USER_LOGIN • user_id: d82a1-891 • IP: 198.51.100.4</span>
                <span className="text-emerald-600 font-semibold">SUCCESS</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between">
                <span>[2026-10-26 19:35:12 UTC] CLINICAL_DOC_ACCESS • doc_id: cbc_8819.pdf • doctor_id: dr_jenkins</span>
                <span className="text-teal-600 font-semibold">LOGGED</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between">
                <span>[2026-10-26 19:10:44 UTC] SLOT_RESERVATION • slot_id: s_4412 • patient_id: p_turner</span>
                <span className="text-sky-600 font-semibold">LOCKED</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Global Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings & Gateway</h1>
            <p className="text-xs text-slate-500 mt-1">Razorpay API credentials, Supabase URL, and microservice hosts.</p>
          </div>

          <Card className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Backend REST API URL</label>
                <input className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" defaultValue="http://localhost:5000/api" readOnly />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">AI/ML Microservice URL</label>
                <input className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" defaultValue="http://localhost:8000" readOnly />
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
