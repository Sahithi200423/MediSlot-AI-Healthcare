import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X, ArrowRight, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

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
    <header className="sticky top-0 z-40 w-full border-b border-[#eae4da] bg-[#fbf9f5]/95 backdrop-blur-md transition-colors font-editorial-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: medislot. logo in dark serif typography */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-editorial-serif text-3xl sm:text-4xl tracking-tight text-[#1e1815] font-normal">
              medislot<span className="text-[#cb6440]">.</span>
            </span>
          </Link>

          {/* Center: Navigation matching screenshot */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#doctors" 
              className="text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              OUR PHYSICIANS
            </a>
            <a 
              href="#specialties" 
              className="text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors flex items-center gap-1"
            >
              <span>SERVICES</span>
              <span className="text-[10px] text-[#8c7e77]">⌄</span>
            </a>
            <Link 
              to={user ? userDashboardRoute : "/login"}
              className="text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              PATIENT PORTAL
            </Link>
            <a 
              href="#about" 
              className="text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              ABOUT
            </a>
          </nav>

          {/* Right: Sage Pill & Terracotta Button matching screenshot */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4a6356] text-white text-[11px] font-semibold tracking-wider uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>ACCEPTING NEW PATIENTS</span>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to={userDashboardRoute}>
                  <button className="rounded-full border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1e1815] hover:border-[#cb6440] transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#cb6440]" />
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
              <button
                type="button"
                onClick={onOpenBooking}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-sm font-medium transition-all shadow-sm hover:shadow cursor-pointer active:scale-98 shrink-0 whitespace-nowrap"
              >
                Book Consultation
              </button>
            )}
          </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#2e2623] hover:text-[#cb6440] transition-colors"
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
  );
}
