import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Activity, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"patient" | "doctor" | "clinic" | "platform">("patient")
  const [email, setEmail] = useState("patient@demo.medislot.com")
  const [password, setPassword] = useState("password123")
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = (newRole: "patient" | "doctor" | "clinic" | "platform") => {
    setRole(newRole)
    if (newRole === "patient") setEmail("patient@demo.medislot.com")
    if (newRole === "doctor") setEmail("dr.jenkins@demo.medislot.com")
    if (newRole === "clinic") setEmail("admin.metro@demo.medislot.com")
    if (newRole === "platform") setEmail("superadmin@medislot.com")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate(`/dashboard/${role}`)
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Medi<span className="text-teal-600 dark:text-teal-400">Slot</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back to MediSlot
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to your clinical or patient workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Select Demo Role to Sign In</CardTitle>
            <CardDescription className="text-xs">
              Quickly preview each dashboard role in Phase One
            </CardDescription>
            {/* Role quick toggle */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => handleRoleChange("patient")}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                  role === "patient"
                    ? "bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("doctor")}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                  role === "doctor"
                    ? "bg-teal-50 border-teal-400 text-teal-700 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("clinic")}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                  role === "clinic"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Clinic
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("platform")}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                  role === "platform"
                    ? "bg-purple-50 border-purple-400 text-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Admin
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@domain.com"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="font-semibold text-teal-600 hover:text-teal-500">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="teal"
                isLoading={isLoading}
                className="w-full font-semibold shadow-md shadow-teal-600/20"
              >
                Sign In to {role.charAt(0).toUpperCase() + role.slice(1)} Workspace <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-teal-600 hover:underline">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>256-Bit SSL Encrypted Healthcare Access</span>
        </p>
      </div>
    </div>
  )
}
