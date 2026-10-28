import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, CalendarCheck } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { HospitalTopline, HospitalSpark } from "./HospitalTopline"

export function Navbar({ onOpenBooking }: { onOpenBooking?: () => void }) {
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
    <div className="w-full">
      {/* Top Identity Strip (Soft Spot Inspired) */}
      <HospitalTopline />

      {/* Main Editorial Healthcare Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5]/85 dark:bg-[#141210]/85 backdrop-blur-md transition-colors font-editorial-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Left: Primary Hospital Brand Link */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-[#4a6b5d]/30 bg-[#4a6b5d]/10 flex items-center justify-center text-[#4a6b5d] dark:text-[#99aa77] group-hover:scale-105 transition-transform shadow-xs">
                <HospitalSpark className="w-5 h-5 text-[#e17145]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#2a201e] dark:text-[#fbf9f5] flex items-center">
                  MediSlot<span className="text-[#e17145] text-2xl leading-none">.</span>
                </span>
                <span className="text-[10px] tracking-[0.08em] uppercase text-[#8b7566] dark:text-[#c4b5a8] font-medium">
                  Grand Clinical Pavilion
                </span>
              </div>
            </Link>

            {/* Center: Editorial Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#specialties" 
                className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] dark:hover:text-[#f07e54] transition-colors"
              >
                Specialties
              </a>
              <a 
                href="#doctors" 
                className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] dark:hover:text-[#f07e54] transition-colors"
              >
                Find Doctors
              </a>
              <a 
                href="#how-it-works" 
                className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] dark:hover:text-[#f07e54] transition-colors"
              >
                Booking Steps
              </a>
              <a 
                href="#ai-features" 
                className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] dark:hover:text-[#f07e54] transition-colors flex items-center gap-1.5"
              >
                <span>Clinical AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e17145]"></span>
              </a>
              <a 
                href="#faq" 
                className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] dark:hover:text-[#f07e54] transition-colors"
              >
                Patient FAQ
              </a>
            </nav>

            {/* Right: Actions & User State */}
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle />

              {user ? (
                <div className="flex items-center gap-3">
                  <Link to={userDashboardRoute}>
                    <button className="pill-button !min-h-[36px] !px-4 text-xs font-semibold text-[#4a6b5d] dark:text-[#99aa77] border-[#4a6b5d]/40">
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#e17145]" />
                      <span>Workspace ({user.role})</span>
                    </button>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-[#8b7566] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Sign out of MediSlot"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="text-xs uppercase tracking-[1.1px] font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] transition-colors px-2"
                  >
                    Sign In
                  </Link>
                  
                  {onOpenBooking ? (
                    <button
                      type="button"
                      onClick={onOpenBooking}
                      className="pill-button !bg-[#e17145] !text-white !border-[#b66143] hover:!bg-[#b66143] shadow-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Book Consultation</span>
                    </button>
                  ) : (
                    <Link to="/register">
                      <button className="pill-button !bg-[#e17145] !text-white !border-[#b66143] hover:!bg-[#b66143] shadow-xs">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Book Consultation</span>
                      </button>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#542f28] dark:text-[#f5f1e9] hover:text-[#e17145] transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3">
              <a 
                href="#specialties" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9]"
              >
                Specialties
              </a>
              <a 
                href="#doctors" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9]"
              >
                Find Doctors
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9]"
              >
                Booking Steps
              </a>
              <a 
                href="#ai-features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9]"
              >
                Clinical AI Copilot
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9]"
              >
                Patient FAQ
              </a>
            </nav>

            <div className="pt-4 border-t border-[#dcd3c6] dark:border-[#362f2a] flex flex-col gap-3">
              {user ? (
                <>
                  <Link to={userDashboardRoute} onClick={() => setMobileMenuOpen(false)}>
                    <button className="pill-button w-full justify-center">
                      <LayoutDashboard className="w-4 h-4 text-[#e17145]" />
                      <span>My Workspace ({user.role})</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-center text-xs uppercase text-[#8b7566] hover:text-rose-600 py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="pill-button w-full justify-center">Sign In</button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="pill-button w-full justify-center !bg-[#e17145] !text-white !border-[#b66143]">
                      Book Appointment <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
