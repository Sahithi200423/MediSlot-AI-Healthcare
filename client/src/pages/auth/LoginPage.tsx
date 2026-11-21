import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { EDITORIAL_EASE, fadeUpVariants } from "@/lib/motion"

const ROLE_PRESETS: { role: UserRole; label: string; email: string }[] = [
  { role: "PATIENT", label: "Patient", email: "patient@demo.medislot.com" },
  { role: "DOCTOR", label: "Doctor", email: "dr.jenkins@demo.medislot.com" },
  { role: "CLINIC_ADMIN", label: "Clinic", email: "admin.metro@demo.medislot.com" },
  { role: "PLATFORM_ADMIN", label: "Admin", email: "superadmin@medislot.com" },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [rolePreset, setRolePreset] = useState<UserRole>("PATIENT")
  const [email, setEmail] = useState("patient@demo.medislot.com")
  const [password, setPassword] = useState("Password123!")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePresetSelect = (selectedRole: UserRole) => {
    setRolePreset(selectedRole)
    setErrorMessage(null)
    setPassword("Password123!")
    const preset = ROLE_PRESETS.find((p) => p.role === selectedRole)
    if (preset) setEmail(preset.email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const loggedUser = await login(email, password)

      const roleRoutes: Record<UserRole, string> = {
        PATIENT: "/dashboard/patient",
        DOCTOR: "/dashboard/doctor",
        CLINIC_ADMIN: "/dashboard/clinic",
        PLATFORM_ADMIN: "/dashboard/platform",
      }

      const from = (location.state as any)?.from?.pathname || roleRoutes[loggedUser.role]
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err.message || "Failed to sign in. Please verify your credentials."
      setErrorMessage(msg)
      toast.error("Authentication Failed", { description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  const activePresetLabel =
    ROLE_PRESETS.find((p) => p.role === rolePreset)?.label || rolePreset

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fbf9f5] dark:bg-[#141210] font-editorial-sans transition-colors overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 max-w-6xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6e6059] hover:text-[#cb6440] dark:text-[#c4b5a8] transition-colors px-3 py-1.5 rounded-full hover:bg-[#f5f1e9] dark:hover:bg-[#26211d]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <Link to="/" className="inline-flex items-center justify-center group">
          <span className="font-editorial-serif text-4xl tracking-tight text-[#1e1815] dark:text-[#fbf9f5] font-normal">
            medislot<span className="text-[#cb6440]">.</span>
          </span>
        </Link>
        <h1 className="mt-4 font-editorial-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1e1815] dark:text-[#fbf9f5]">
          Welcome back
        </h1>
        <p className="mt-1.5 text-xs text-[#6e6059] dark:text-[#c4b5a8]">
          Sign in to your clinical or patient workspace
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.08, ease: EDITORIAL_EASE }}
        className="mt-7 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="border-[#e8e2d8] dark:border-[#362f2a] bg-white dark:bg-[#1a1613] shadow-lg shadow-[#1e1815]/5 rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-[#1e1815] dark:text-[#fbf9f5]">
              Workspace Role Preset
            </CardTitle>
            <CardDescription className="text-xs text-[#6e6059] dark:text-[#c4b5a8]">
              Select a demo role to prefill credentials or enter your own account
            </CardDescription>

            {/* Role quick toggle */}
            <div className="grid grid-cols-4 gap-1.5 pt-2.5" role="group" aria-label="Demo workspace presets">
              {ROLE_PRESETS.map((preset) => {
                const isActive = rolePreset === preset.role
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handlePresetSelect(preset.role)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#cb6440] border-[#cb6440] text-white shadow-xs"
                        : "border-[#e4ded5] bg-[#fbf9f5] text-[#6e6059] hover:border-[#cb6440]/50 hover:text-[#1e1815] dark:border-[#362f2a] dark:bg-[#141210] dark:text-[#c4b5a8]"
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence initial={false}>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@domain.com"
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#6e6059] dark:text-[#c4b5a8]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded accent-[#4a6356]"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] text-[#8c7e77]">
                  Protected by RBAC
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full rounded-full py-2.5 font-semibold"
              >
                Sign In to {activePresetLabel} Workspace <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#ece6dd] dark:border-[#362f2a] text-center text-xs text-[#6e6059] dark:text-[#c4b5a8]">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-[#cb6440] hover:underline">
                Register as Patient
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-[#8c7e77] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#4a6356]" />
          <span>Encrypted Healthcare Workspace · Role-Based Access Control</span>
        </p>
      </motion.div>
    </div>
  )
}
