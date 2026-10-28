import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  Bell, LogOut, Menu, X, ArrowLeft
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

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
  roleColor: _roleColor,
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
  const { user, logout } = useAuth()

  const displayName = user ? `${user.firstName} ${user.lastName}` : (userDisplayName || "User")
  const displaySubtitle = user ? `${user.role} • ${user.email}` : (userSubtitle || "MediSlot Account")
  const avatarSrc = userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"

  // Editorial role styling: Patient = Sage green, Doctor = Terracotta, Admin = Champagne gold
  const roleBadgeStyle = user?.role === "DOCTOR"
    ? "bg-[#cb6440]/10 text-[#cb6440] border-[#cb6440]/30"
    : user?.role === "CLINIC_ADMIN" || user?.role === "PLATFORM_ADMIN"
    ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border-[#8c6b3e]/30"
    : "bg-[#4a6356]/10 text-[#4a6356] border-[#4a6356]/30"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1e1815] font-editorial-sans flex flex-col selection:bg-[#ede4d5] selection:text-[#2a201e]">
      
      {/* Top Editorial Bar */}
      <header className="sticky top-0 z-30 h-18 border-b border-[#ece6dd] bg-[#fbf9f5]/95 backdrop-blur-md flex items-center justify-between px-6 sm:px-10 lg:px-14">
        
        {/* Left: Mobile Toggle + medislot. Logo + Role Badge */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl text-[#6e6059] hover:bg-[#ede6dc] transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-[#1e1815]" /> : <Menu className="w-5 h-5 text-[#1e1815]" />}
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-editorial-serif text-3xl tracking-tight text-[#1e1815] font-normal">
              medislot<span className="text-[#cb6440]">.</span>
            </span>
          </Link>

          <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${roleBadgeStyle}`}>
            {roleTitle}
          </span>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Authenticated RBAC Session Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs border border-[#e4ded5] rounded-full px-3.5 py-1.5 bg-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4a6356] animate-pulse" />
            <span className="text-[11px] font-medium text-[#6e6059]">
              Verified: <strong className="text-[#1e1815]">{user?.role || "GUEST"}</strong>
            </span>
          </div>

          {/* Notifications */}
          <button 
            className="relative p-2.5 rounded-full text-[#6e6059] hover:text-[#1e1815] hover:bg-[#ede6dc] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#cb6440] ring-2 ring-[#fbf9f5]" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#ece6dd]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#e4ded5]"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1e1815] leading-tight">{displayName}</p>
              <p className="text-[10px] text-[#8c7e77] truncate max-w-[140px] font-medium">{displaySubtitle}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-[#8c7e77] hover:text-[#cb6440] rounded-full hover:bg-[#ede6dc] ml-1 transition-colors cursor-pointer"
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
            fixed inset-y-18 left-0 z-20 w-64 border-r border-[#ece6dd] bg-[#f8f5ee]
            transition-transform duration-200 md:static md:translate-x-0
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          `}
        >
          <div className="flex flex-col h-full py-5 justify-between">
            <div className="space-y-1.5 px-3">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[1.3px] text-[#8c7e77] mb-3">
                Clinical Navigation
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
                      w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left cursor-pointer
                      ${isActive 
                        ? "bg-[#ede5d9] text-[#cb6440] font-semibold border-r-3 border-[#cb6440] shadow-2xs" 
                        : "text-[#6e6059] hover:text-[#1e1815] hover:bg-[#efe8dc]/60 font-medium"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#cb6440]" : "text-[#8c7e77]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        isActive 
                          ? "bg-[#cb6440] text-white" 
                          : "bg-[#e8e2d8] text-[#4a3e39]"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Bottom link to landing page */}
            <div className="px-4 pt-4 border-t border-[#ece6dd] space-y-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-xs text-[#6e6059] hover:text-[#cb6440] py-1.5 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Hospital Home</span>
              </Link>
              <div className="text-[10px] text-[#8c7e77] uppercase tracking-wider">
                MediSlot Clinical Engine v2.4
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
