import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { EDITORIAL_EASE } from "@/lib/motion"

export function Navbar({
  onOpenBooking,
  onPrefetchBooking,
}: {
  onOpenBooking?: () => void
  onPrefetchBooking?: () => void
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 12)
          ticking = false
        })
        ticking = true
      }
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mobileMenuOpen])

  const userDashboardRoute = user
    ? {
        PATIENT: "/dashboard/patient",
        DOCTOR: "/dashboard/doctor",
        CLINIC_ADMIN: "/dashboard/clinic",
        PLATFORM_ADMIN: "/dashboard/platform",
      }[user.role]
    : "/login"

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b font-editorial-sans transition-all duration-200 ${
        isScrolled
          ? "border-[#e4dcd0] bg-[#fbf9f5]/98 shadow-[0_4px_20px_-10px_rgba(30,24,21,0.12)]"
          : "border-[#eae4da] bg-[#fbf9f5]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between h-20">
          {/* Left: medislot. logo in dark serif typography */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-editorial-serif text-3xl sm:text-4xl tracking-tight text-[#1e1815] font-normal transition-opacity group-hover:opacity-85">
              medislot<span className="text-[#cb6440]">.</span>
            </span>
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            <a
              href="#doctors"
              className="nav-link-editorial text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              OUR PHYSICIANS
            </a>
            <a
              href="#specialties"
              className="nav-link-editorial group text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors flex items-center gap-1"
            >
              <span>SERVICES</span>
              <ChevronDown className="w-3 h-3 text-[#8c7e77] transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-[#cb6440]" />
            </a>
            <Link
              to={user ? userDashboardRoute : "/login"}
              className="nav-link-editorial text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              PATIENT PORTAL
            </Link>
            <a
              href="#about"
              className="nav-link-editorial text-[12px] uppercase tracking-[1.3px] font-medium text-[#2e2623] hover:text-[#cb6440] transition-colors"
            >
              ABOUT
            </a>
          </nav>

          {/* Right: Sage Pill & Terracotta Button */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4a6356] text-white text-[11px] font-semibold tracking-wider uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>ACCEPTING NEW PATIENTS</span>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to={userDashboardRoute}>
                  <button
                    type="button"
                    className="rounded-full border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1e1815] hover:border-[#cb6440] hover:shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#cb6440]" />
                    <span>Workspace ({user.role})</span>
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-full text-[#8b7566] hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
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
                onPointerEnter={onPrefetchBooking}
                onFocus={onPrefetchBooking}
                className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white px-6 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm shadow-[#cb6440]/15 hover:shadow-md hover:shadow-[#cb6440]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap"
              >
                Book Consultation
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-[#2e2623] hover:text-[#cb6440] hover:bg-[#f5f1e9] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Animated Mobile Dropdown Drawer (GPU-Composited Transform & Opacity) */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
            className="sm:hidden border-t border-[#dcd3c6] dark:border-[#362f2a] bg-[#fbf9f5] dark:bg-[#141210] shadow-md origin-top"
          >
            <div className="px-6 py-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4a6356]/12 text-[#4a6356] text-[10px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a6356] animate-pulse" />
                <span>Accepting New Patients</span>
              </div>

              <nav className="flex flex-col space-y-3" aria-label="Mobile navigation">
                <a
                  href="#doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  Our Physicians
                </a>
                <a
                  href="#specialties"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  Services & Specialties
                </a>
                <Link
                  to={user ? userDashboardRoute : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  Patient Portal
                </Link>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#ai-features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  Clinical AI Copilot
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 text-sm uppercase tracking-wider font-medium text-[#542f28] dark:text-[#f5f1e9] hover:text-[#cb6440] transition-colors"
                >
                  Patient FAQ
                </a>
              </nav>

              <div className="pt-4 border-t border-[#dcd3c6] dark:border-[#362f2a] flex flex-col gap-3">
                {user ? (
                  <>
                    <Link to={userDashboardRoute} onClick={() => setMobileMenuOpen(false)}>
                      <button type="button" className="pill-button w-full justify-center">
                        <LayoutDashboard className="w-4 h-4 text-[#e17145]" />
                        <span>My Workspace ({user.role})</span>
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-center text-xs uppercase tracking-wider text-[#8b7566] hover:text-rose-600 py-2 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button type="button" className="pill-button w-full justify-center">
                        Sign In
                      </button>
                    </Link>
                    {onOpenBooking ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          onOpenBooking()
                        }}
                        className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 px-5 text-sm font-medium w-full inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        Book Consultation <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                        <button
                          type="button"
                          className="rounded-full bg-[#cb6440] hover:bg-[#b85633] text-white py-2.5 px-5 text-sm font-medium w-full inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          Book Appointment <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
