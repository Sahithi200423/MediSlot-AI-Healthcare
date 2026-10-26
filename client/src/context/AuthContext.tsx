import React, { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

export type UserRole = "PATIENT" | "DOCTOR" | "CLINIC_ADMIN" | "PLATFORM_ADMIN"

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  clinicId?: string | null
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<UserProfile>
  logout: () => void
  switchDemoRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE = "http://localhost:5000/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("medislot_user")
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("medislot_token")
  })
  const [isLoading, setIsLoading] = useState(true)

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("medislot_token")
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (res.ok) {
          const json = await res.json()
          setUser(json.data.user)
          localStorage.setItem("medislot_user", JSON.stringify(json.data.user))
        } else {
          // Token expired or invalid
          logout()
        }
      } catch (err) {
        // Backend offline or unreachable, keep local cached profile
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || "Login failed")
      }

      const loggedUser = json.data.user
      const accessToken = json.data.token

      setUser(loggedUser)
      setToken(accessToken)
      localStorage.setItem("medislot_user", JSON.stringify(loggedUser))
      localStorage.setItem("medislot_token", accessToken)

      toast.success(`Welcome back, ${loggedUser.firstName}!`, {
        description: `Signed in as ${loggedUser.role}.`,
      })

      return loggedUser
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || "Registration failed")
      }

      const newUser = json.data.user
      const accessToken = json.data.token

      setUser(newUser)
      setToken(accessToken)
      localStorage.setItem("medislot_user", JSON.stringify(newUser))
      localStorage.setItem("medislot_token", accessToken)

      toast.success("Account Created!", {
        description: "Welcome to MediSlot Healthcare.",
      })

      return newUser
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("medislot_user")
    localStorage.removeItem("medislot_token")
    toast.info("Signed out successfully")
  }

  const switchDemoRole = async (targetRole: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      PATIENT: { email: "patient@demo.medislot.com", pass: "password123" },
      DOCTOR: { email: "dr.jenkins@demo.medislot.com", pass: "password123" },
      CLINIC_ADMIN: { email: "admin.metro@demo.medislot.com", pass: "password123" },
      PLATFORM_ADMIN: { email: "superadmin@medislot.com", pass: "password123" },
    }

    const creds = roleCredentials[targetRole]
    await login(creds.email, creds.pass)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
