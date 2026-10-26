import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  Activity, Bell, LogOut, Menu, X, Home
} from "lucide-react"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: string | number
}

interface DashboardShellProps {
  roleTitle: string
  roleColor: "sky" | "teal" | "emerald" | "purple"
  userDisplayName?: string
  userSubtitle?: string
  userAvatar?: string
  navItems: NavItem[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  children: React.ReactNode
}

export function DashboardShell({
  roleTitle,
  roleColor,
  userDisplayName,
  userSubtitle,
  userAvatar,
  navItems,
  activeTab,
  onSelectTab,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout, switchDemoRole } = useAuth()

  const displayName = user ? `${user.firstName} ${user.lastName}` : (userDisplayName || "User")
  const displaySubtitle = user ? `${user.role} • ${user.email}` : (userSubtitle || "MediSlot Account")
  const avatarSrc = userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"

  const badgeColor = {
    sky: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800",
    teal: "bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    purple: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
  }[roleColor]

  const activeColor = {
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold border-r-4 border-sky-600",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold border-r-4 border-teal-600",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border-r-4 border-emerald-600",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold border-r-4 border-purple-600",
  }[roleColor]

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleRoleSwitch = async (targetRole: UserRole) => {
    await switchDemoRole(targetRole)
    const routes: Record<UserRole, string> = {
      PATIENT: "/dashboard/patient",
      DOCTOR: "/dashboard/doctor",
      CLINIC_ADMIN: "/dashboard/clinic",
      PLATFORM_ADMIN: "/dashboard/platform",
    }
    navigate(routes[targetRole])
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Medi<span className="text-teal-600 dark:text-teal-400">Slot</span>
            </span>
          </Link>

          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
            {roleTitle}
          </span>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick role switcher for demonstration and test verification */}
          <div className="hidden lg:flex items-center gap-1 text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold px-1.5">Switch Session:</span>
            <button
              onClick={() => handleRoleSwitch("PATIENT")}
              className={`px-2 py-0.5 rounded cursor-pointer ${user?.role === "PATIENT" ? "bg-white dark:bg-slate-700 shadow-xs font-semibold text-sky-600" : "text-slate-500"}`}
            >
              Patient
            </button>
            <button
              onClick={() => handleRoleSwitch("DOCTOR")}
              className={`px-2 py-0.5 rounded cursor-pointer ${user?.role === "DOCTOR" ? "bg-white dark:bg-slate-700 shadow-xs font-semibold text-teal-600" : "text-slate-500"}`}
            >
              Doctor
            </button>
            <button
              onClick={() => handleRoleSwitch("CLINIC_ADMIN")}
              className={`px-2 py-0.5 rounded cursor-pointer ${user?.role === "CLINIC_ADMIN" ? "bg-white dark:bg-slate-700 shadow-xs font-semibold text-emerald-600" : "text-slate-500"}`}
            >
              Clinic
            </button>
            <button
              onClick={() => handleRoleSwitch("PLATFORM_ADMIN")}
              className={`px-2 py-0.5 rounded cursor-pointer ${user?.role === "PLATFORM_ADMIN" ? "bg-white dark:bg-slate-700 shadow-xs font-semibold text-purple-600" : "text-slate-500"}`}
            >
              Platform
            </button>
          </div>

          <ThemeToggle />

          <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Profile Thumbnail */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{displaySubtitle}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-16 left-0 z-20 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 
            transition-transform duration-200 md:static md:translate-x-0
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          `}
        >
          <div className="flex flex-col h-full py-4 justify-between">
            <div className="space-y-1 px-3">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Workspace Menu
              </p>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors text-left cursor-pointer
                      ${isActive ? activeColor : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Bottom link to landing page */}
            <div className="px-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-teal-600 py-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Return to Landing Page</span>
              </Link>
              <div className="text-[10px] text-slate-400">
                Phase Two: Supabase Auth Active
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
