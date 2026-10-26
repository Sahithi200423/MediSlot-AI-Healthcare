import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Activity, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    // Client-side quick password validation
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter and one number")
      setIsLoading(false)
      return
    }

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
      })

      navigate("/dashboard/patient")
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again."
      setErrorMessage(msg)
      toast.error("Registration Error", { description: msg })
    } finally {
      setIsLoading(false)
    }
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
          Create Patient Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Book appointments, view medical records, and access care
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Patient Registration</CardTitle>
            <div className="mt-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Healthcare Security Notice:</strong> Public self-registration provisions Patient accounts. Doctor and Clinic Administrator accounts are provisioned via verified clinic onboarding.
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  placeholder="Jane"
                />
                <Input
                  label="Last Name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                />
              </div>

              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                placeholder="jane.smith@example.com"
              />

              <Input
                label="Create Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                helperText="Min 8 characters with at least one uppercase letter and one number"
              />

              <div className="text-xs text-slate-500 leading-relaxed">
                By clicking Register, you accept the MediSlot <a href="#" className="text-teal-600 underline">Terms</a> and <a href="#" className="text-teal-600 underline">Privacy Policy</a>.
              </div>

              <Button
                type="submit"
                variant="teal"
                isLoading={isLoading}
                className="w-full font-semibold shadow-md shadow-teal-600/20"
              >
                Create Account & Access Portal <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-teal-600 hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Role-Based Access Control Protected</span>
        </p>
      </div>
    </div>
  )
}
