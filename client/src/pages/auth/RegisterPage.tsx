import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Activity, Mail, Lock, User, Building, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"patient" | "doctor" | "clinic">("patient")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
          Create your MediSlot Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Join thousands of patients and healthcare providers
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">I want to register as a:</CardTitle>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === "patient"
                    ? "bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === "doctor"
                    ? "bg-teal-50 border-teal-400 text-teal-700 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setRole("clinic")}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === "clinic"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                    : "border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                Clinic Owner
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Legal Name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                placeholder="Dr. John Doe or Jane Smith"
              />

              {role === "clinic" && (
                <Input
                  label="Clinic / Practice Name"
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  icon={<Building className="w-4 h-4" />}
                  placeholder="Apex Health Clinic"
                />
              )}

              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                placeholder="user@example.com"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                placeholder="At least 8 characters"
                helperText="Must include numbers and symbols"
              />

              <div className="text-xs text-slate-500 leading-relaxed">
                By registering, you agree to our <a href="#" className="text-teal-600 underline">Terms</a> and <a href="#" className="text-teal-600 underline">Privacy Policy</a>.
              </div>

              <Button
                type="submit"
                variant="teal"
                isLoading={isLoading}
                className="w-full font-semibold shadow-md shadow-teal-600/20"
              >
                Complete Registration <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-teal-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>HIPAA & SOC2 Ready Cloud Environment</span>
        </p>
      </div>
    </div>
  )
}
