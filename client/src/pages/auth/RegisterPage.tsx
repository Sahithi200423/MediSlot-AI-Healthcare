import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Info,
  ArrowLeft,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { EDITORIAL_EASE, fadeUpVariants } from "@/lib/motion"

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!hasMinLength) {
      setErrorMessage("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }
    if (!hasUppercase || !hasNumber) {
      setErrorMessage("Password must contain at least one uppercase letter and one number")
      setIsLoading(false)
      return
    }

    try {
      const result = await register({
        email,
        password,
        firstName,
        lastName,
      })

      if (result.emailConfirmationRequired) {
        setRegisteredEmail(email)
        setIsRegistered(true)
      } else {
        navigate("/dashboard/patient")
      }
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again."
      setErrorMessage(msg)
      toast.error("Registration Error", { description: msg })
    } finally {
      setIsLoading(false)
    }
  }

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
          Create Patient Account
        </h1>
        <p className="mt-1.5 text-xs text-[#6e6059] dark:text-[#c4b5a8]">
          Book appointments, store encrypted records, and access care seamlessly
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.08, ease: EDITORIAL_EASE }}
        className="mt-7 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="border-[#e8e2d8] dark:border-[#362f2a] bg-white dark:bg-[#1a1613] shadow-lg shadow-[#1e1815]/5 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#1e1815] dark:text-[#fbf9f5]">
              Patient Registration
            </CardTitle>
            <div className="mt-2 p-3 rounded-2xl bg-[#4a6356]/8 dark:bg-[#4a6356]/15 border border-[#4a6356]/20 text-[11px] text-[#3a5245] dark:text-[#b5c99a] flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#4a6356] dark:text-[#99aa77]" />
              <span>
                <strong>Healthcare Security Notice:</strong> Public self-registration creates Patient accounts. Physician and Clinic Administrator accounts are provisioned via verified clinic onboarding.
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {isRegistered ? (
                <motion.div
                  key="registered"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-[#4a6356]/12 text-[#4a6356] flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="font-editorial-serif text-2xl font-normal text-[#1e1815] dark:text-[#fbf9f5]">
                    Verify Your Email Address
                  </h2>
                  <p className="text-xs text-[#6e6059] dark:text-[#c4b5a8] leading-relaxed">
                    A verification confirmation has been sent to{" "}
                    <strong className="text-[#1e1815] dark:text-[#fbf9f5]">{registeredEmail}</strong>.
                    Please verify your inbox before signing in.
                  </p>
                  <Link to="/login" className="block pt-1">
                    <Button variant="primary" size="sm" className="w-full rounded-full py-2.5">
                      Proceed to Login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="First Name"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        icon={<User className="w-4 h-4" />}
                        placeholder="Aarav"
                      />
                      <Input
                        label="Last Name"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Sharma"
                      />
                    </div>

                    <Input
                      label="Email address"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Mail className="w-4 h-4" />}
                      placeholder="aarav.sharma@example.com"
                    />

                    <div className="space-y-2">
                      <Input
                        label="Create Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (errorMessage) setErrorMessage(null)
                        }}
                        icon={<Lock className="w-4 h-4" />}
                        placeholder="••••••••"
                      />

                      {/* Live Password Criteria */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 transition-colors ${
                            hasMinLength ? "text-[#4a6356] font-medium" : "text-[#8c7e77]"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${hasMinLength ? "opacity-100" : "opacity-35"}`} />
                          8+ characters
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 transition-colors ${
                            hasUppercase ? "text-[#4a6356] font-medium" : "text-[#8c7e77]"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${hasUppercase ? "opacity-100" : "opacity-35"}`} />
                          1 uppercase
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 transition-colors ${
                            hasNumber ? "text-[#4a6356] font-medium" : "text-[#8c7e77]"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${hasNumber ? "opacity-100" : "opacity-35"}`} />
                          1 number
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8c7e77] leading-relaxed">
                      By registering, you acknowledge MediSlot's clinical privacy standards and encrypted health record safeguards.
                    </p>

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                      className="w-full rounded-full py-2.5 font-semibold"
                    >
                      Create Account & Access Portal <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-[#ece6dd] dark:border-[#362f2a] text-center text-xs text-[#6e6059] dark:text-[#c4b5a8]">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-[#cb6440] hover:underline">
                      Sign in here
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-[#8c7e77] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#4a6356]" />
          <span>Role-Based Access Control Protected</span>
        </p>
      </motion.div>
    </div>
  )
}
