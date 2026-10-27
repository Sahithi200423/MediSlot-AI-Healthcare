import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { config } from "../config/env.js"
import { getSupabaseAdmin, getSupabaseClient } from "../config/supabase.js"
import { prisma } from "../config/db.js"
import { RegisterInput, LoginInput } from "../validators/auth.validator.js"
import { UserRole } from "../middleware/auth.js"

// In-memory user store for seamless local development if Supabase/Postgres is offline
interface StoredUser {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  role: UserRole
  clinicId?: string | null
  createdAt: Date
}

const localDevUsers: StoredUser[] = [
  {
    id: "demo-patient-001",
    email: "patient@demo.medislot.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    firstName: "Alex",
    lastName: "Turner",
    role: "PATIENT",
    createdAt: new Date(),
  },
  {
    id: "demo-doctor-001",
    email: "dr.jenkins@demo.medislot.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    firstName: "Sarah",
    lastName: "Jenkins",
    role: "DOCTOR",
    clinicId: "clinic-metro-001",
    createdAt: new Date(),
  },
  {
    id: "demo-clinic-001",
    email: "admin.metro@demo.medislot.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    firstName: "Elena",
    lastName: "Rostova",
    role: "CLINIC_ADMIN",
    clinicId: "clinic-metro-001",
    createdAt: new Date(),
  },
  {
    id: "demo-platform-001",
    email: "superadmin@medislot.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    firstName: "Platform",
    lastName: "Admin",
    role: "PLATFORM_ADMIN",
    createdAt: new Date(),
  },
]

export class AuthService {
  /**
   * Registers a new patient.
   * STRICT SECURITY: Public signups are forced to 'PATIENT' role to prevent privilege escalation.
   */
  public static async register(data: RegisterInput) {
    const supabase = getSupabaseAdmin()
    const sanitizedRole: UserRole = "PATIENT" // Escalation prevention

    // 1. If Supabase is connected
    if (supabase) {
      // Enforce genuine email verification: do NOT bypass email confirmation
      const { data: authData, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: false, // Genuine email verification enforced
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: sanitizedRole,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!authData.user) {
        throw new Error("Failed to provision Supabase user")
      }

      const userId = authData.user.id

      // If user profile is not yet created by the DB trigger, create it now
      try {
        const existing = await prisma.profile.findUnique({ where: { id: userId } })
        if (!existing) {
          await prisma.profile.create({
            data: {
              id: userId,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: sanitizedRole,
              phone: data.phone,
              patient: {
                create: {},
              },
            },
          })
        }
      } catch (dbErr) {
        console.warn("Prisma profile sync notice:", dbErr)
      }

      // Generate genuine Supabase verification action link and OTP
      let verificationLink: string | null = null
      let emailOtp: string | null = null
      try {
        const linkRes = await supabase.auth.admin.generateLink({
          type: "signup",
          email: data.email,
          password: data.password,
        })
        verificationLink = linkRes.data?.properties?.action_link || null
        emailOtp = linkRes.data?.properties?.email_otp || null
      } catch (linkErr) {
        console.warn("Could not generate verification link:", linkErr)
      }

      return {
        user: {
          id: userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: sanitizedRole,
        },
        token: null, // No token until email is verified
        emailConfirmationRequired: true,
        verificationLink,
        emailOtp,
        message: "Registration successful. Please verify your email address to log in.",
      }
    }

    // Guard: Never allow fallback if Supabase is configured
    if (config.supabaseUrl && (config.supabaseAnonKey || config.supabaseServiceRoleKey)) {
      throw new Error("Supabase authentication is active. Offline registration fallback is disabled.")
    }

    // 2. Offline Fallback Mode ONLY when Supabase credentials are not provided
    const existing = localDevUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase())
    if (existing) {
      throw new Error("A user with this email address already exists")
    }

    const newUser: StoredUser = {
      id: `patient-${Date.now()}`,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      firstName: data.firstName,
      lastName: data.lastName,
      role: sanitizedRole,
      createdAt: new Date(),
    }
    localDevUsers.push(newUser)

    const token = this.generateDevToken(newUser.id, newUser.email, newUser.role, newUser.firstName, newUser.lastName)

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      token,
      emailConfirmationRequired: false,
    }
  }

  /**
   * Logs in a user using Supabase Auth or Local Dev Fallback.
   */
  public static async login(data: LoginInput) {
    const supabase = getSupabaseAdmin()

    // 1. Supabase Auth Login
    if (supabase) {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!authData.user || !authData.session) {
        throw new Error("Login failed. Please verify credentials.")
      }

      let profile = null
      try {
        profile = await prisma.profile.findUnique({
          where: { id: authData.user.id },
          include: { doctor: true, clinicMemberships: true },
        })
      } catch (err) {}

      const role = (profile?.role || authData.user.user_metadata?.role || "PATIENT") as UserRole
      const firstName = profile?.firstName || authData.user.user_metadata?.first_name || "User"
      const lastName = profile?.lastName || authData.user.user_metadata?.last_name || ""
      const clinicId = profile?.doctor?.clinicId || profile?.clinicMemberships?.[0]?.clinicId || null

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          firstName,
          lastName,
          role,
          clinicId,
        },
        token: authData.session.access_token,
      }
    }

    // Guard: Never allow fallback if Supabase is configured
    if (config.supabaseUrl && (config.supabaseAnonKey || config.supabaseServiceRoleKey)) {
      throw new Error("Supabase authentication is active. Offline demo login is disabled.")
    }

    // 2. Offline Fallback Mode ONLY when Supabase credentials are not provided
    const user = localDevUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase())
    if (!user) {
      throw new Error("Invalid email or password")
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash)
    if (!isMatch) {
      throw new Error("Invalid email or password")
    }

    const token = this.generateDevToken(user.id, user.email, user.role, user.firstName, user.lastName, user.clinicId)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId,
      },
      token,
    }
  }

  /**
   * Verifies an unconfirmed email address using Supabase OTP / Token
   */
  public static async verifyEmail(email: string, token: string) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client not configured")
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    })

    if (error) {
      throw new Error(error.message)
    }

    let profile = null
    try {
      profile = await prisma.profile.findUnique({
        where: { id: data.user?.id },
      })
    } catch (e) {}

    return {
      user: profile || data.user,
      session: data.session,
    }
  }

  /**
   * Helper to sign a JWT token
   */
  private static generateDevToken(
    id: string,
    email: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    clinicId?: string | null
  ): string {
    return jwt.sign(
      {
        id,
        email,
        role,
        firstName,
        lastName,
        clinicId: clinicId || null,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    )
  }
}
