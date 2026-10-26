import { useState } from "react"
import { Link } from "react-router-dom"
import { Activity, Menu, X, ArrowRight, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const userDashboardRoute = user
    ? {
        PATIENT: "/dashboard/patient",
        DOCTOR: "/dashboard/doctor",
        CLINIC_ADMIN: "/dashboard/clinic",
        PLATFORM_ADMIN: "/dashboard/platform",
      }[user.role]
    : "/login"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Medi<span className="text-teal-600 dark:text-teal-400">Slot</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Healthcare SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#specialties" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors">
              Specialties
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors">
              Benefits
            </a>
            <a href="#ai-features" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors">
              AI Features
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <Link to={userDashboardRoute}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                    <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                    <span>My Dashboard ({user.role})</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-rose-600"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="teal" size="sm" className="gap-1.5">
                    Book Visit <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-2 pt-2">
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 rounded-lg"
            >
              Specialties
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 rounded-lg"
            >
              How It Works
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 rounded-lg"
            >
              Benefits
            </a>
            <a
              href="#ai-features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 rounded-lg"
            >
              AI Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 rounded-lg"
            >
              FAQ
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={userDashboardRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-xs p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 font-semibold text-teal-700 dark:text-teal-300"
                >
                  Go to {user.role} Dashboard
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-xs" size="sm">Sign In</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="teal" className="w-full text-xs" size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
