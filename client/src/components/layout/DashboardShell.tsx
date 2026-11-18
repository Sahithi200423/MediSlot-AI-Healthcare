import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, LogOut, Menu, X, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { EDITORIAL_EASE } from "@/lib/motion"

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

  const displayName = user ? `${user.firstName} ${user.lastName}` : userDisplayName || "User"
  const displaySubtitle = user
    ? `${user.role} • ${user.email}`
    : userSubtitle || "MediSlot Account"
  const avatarSrc =
    userAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"

  const roleBadgeStyle =
    user?.role === "DOCTOR"
      ? "bg-[#cb6440]/10 text-[#cb6440] border-[#cb6440]/30"
      : user?.role === "CLINIC_ADMIN" || user?.role === "PLATFORM_ADMIN"
      ? "bg-[#8c6b3e]/10 text-[#8c6b3e] border-[#8c6b3e]/30"
      : "bg-[#4a6356]/10 text-[#4a6356] border-[#4a6356]/30"

  const notificationsTab = navItems.find((item) => item.id === "notifications")

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId)
    setSidebarOpen(false)
  }

  const renderNavList = (layoutScope: "desktop" | "mobile") => (
    <nav className="space-y-1 px-3" aria-label="Dashboard navigation">
      <p className="px-3 text-[10px] font-bold uppercase tracking-[1.3px] text-[#8c7e77] mb-3">
        Clinical Navigation
      </p>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors text-left cursor-pointer ${
              isActive
                ? "text-[#cb6440] font-semibold"
                : "text-[#6e6059] hover:text-[#1e1815] hover:bg-[#efe8dc]/60 font-medium"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`dashboard-active-tab-${layoutScope}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-[#ede5d9] border-r-3 border-[#cb6440] shadow-2xs"
                aria-hidden="true"
              />
            )}
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-[#cb6440]" : "text-[#8c7e77]"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={`relative z-10 px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                  isActive ? "bg-[#cb6440] text-white" : "bg-[#e8e2d8] text-[#4a3e39]"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1e1815] font-editorial-sans flex flex-col selection:bg-[#ede4d5] selection:text-[#2a201e]">
      {/* Top Editorial Bar */}
      <header className="sticky top-0 z-30 h-16 sm:h-18 border-b border-[#ece6dd] bg-[#fbf9f5]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Left: Mobile Toggle + medislot. Logo + Role Badge */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-[#6e6059] hover:bg-[#ede6dc] transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-mobile-drawer"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-[#1e1815]" />
            ) : (
              <Menu className="w-5 h-5 text-[#1e1815]" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-editorial-serif text-2xl sm:text-3xl tracking-tight text-[#1e1815] font-normal">
              medislot<span className="text-[#cb6440]">.</span>
            </span>
          </Link>

          <span
            className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border truncate ${roleBadgeStyle}`}
          >
            {roleTitle}
          </span>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Authenticated RBAC Session Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs border border-[#e4ded5] rounded-full px-3.5 py-1.5 bg-white shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#4a6356] animate-pulse" />
            <span className="text-[11px] font-medium text-[#6e6059]">
              Verified: <strong className="text-[#1e1815]">{user?.role || "GUEST"}</strong>
            </span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => {
              if (notificationsTab) onSelectTab(notificationsTab.id)
            }}
            className="relative p-2.5 rounded-full text-[#6e6059] hover:text-[#1e1815] hover:bg-[#ede6dc] transition-colors cursor-pointer"
            aria-label="Notifications"
            title={notificationsTab ? "Open notifications" : "Notifications"}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#cb6440] ring-2 ring-[#fbf9f5]" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-[#ece6dd]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#e4ded5]"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1e1815] leading-tight">{displayName}</p>
              <p className="text-[10px] text-[#8c7e77] truncate max-w-[140px] font-medium">
                {displaySubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
              className="p-2 text-[#8c7e77] hover:text-[#cb6440] rounded-full hover:bg-[#ede6dc] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer + Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <div
            id="dashboard-mobile-drawer"
            className="fixed inset-0 z-40 md:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile dashboard navigation"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#1e1815]/45 backdrop-blur-xs"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: EDITORIAL_EASE }}
              className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[#ece6dd] bg-[#f8f5ee] shadow-2xl flex flex-col justify-between py-5 overflow-y-auto"
            >
              <div className="space-y-5">
                <div className="px-5 pb-4 border-b border-[#ece6dd] flex items-center justify-between gap-2">
                  <div>
                    <span className="font-editorial-serif text-2xl tracking-tight text-[#1e1815] block leading-none">
                      medislot<span className="text-[#cb6440]">.</span>
                    </span>
                    <span
                      className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${roleBadgeStyle}`}
                    >
                      {roleTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation drawer"
                    className="p-2 rounded-full text-[#6e6059] hover:text-[#1e1815] hover:bg-[#ede5d9] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {renderNavList("mobile")}
              </div>

              <div className="px-5 pt-4 mt-4 border-t border-[#ece6dd] space-y-2.5">
                <Link
                  to="/"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 text-xs text-[#6e6059] hover:text-[#cb6440] py-1.5 transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Hospital Home</span>
                </Link>
                <div className="text-[10px] text-[#8c7e77] uppercase tracking-wider">
                  MediSlot Clinical Platform
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Persistent Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-[#ece6dd] bg-[#f8f5ee] sticky top-18 h-[calc(100vh-4.5rem)] overflow-y-auto">
          <div className="flex flex-col flex-1 py-5 justify-between">
            {renderNavList("desktop")}

            {/* Bottom link to landing page */}
            <div className="px-4 pt-4 mt-4 border-t border-[#ece6dd] space-y-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-xs text-[#6e6059] hover:text-[#cb6440] py-1.5 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Hospital Home</span>
              </Link>
              <div className="text-[10px] text-[#8c7e77] uppercase tracking-wider">
                MediSlot Clinical Platform
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area with Smooth Tab Fade */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
