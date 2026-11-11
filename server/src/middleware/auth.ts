import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config, isProdEnv } from "../config/env.js"
import { getSupabaseAdmin } from "../config/supabase.js"
import { prisma } from "../config/db.js"

export type UserRole = "PATIENT" | "DOCTOR" | "CLINIC_ADMIN" | "PLATFORM_ADMIN"

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  clinicId?: string | null
  clinicIds: string[]
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

/**
 * Validates Bearer JWT tokens from Supabase Auth or Local Dev Token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        message: "Authorization token missing or malformed",
        statusCode: 401,
      },
    })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const prodMode = isProdEnv()

    // 1. Local dev JWT verification ONLY outside production
    if (!prodMode) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any
        if (decoded && decoded.id) {
          req.user = {
            id: decoded.id,
            email: decoded.email || "",
            role: decoded.role || "PATIENT",
            firstName: decoded.firstName || "Demo",
            lastName: decoded.lastName || "User",
            clinicId: decoded.clinicId || null,
            clinicIds: decoded.clinicId ? [decoded.clinicId] : (decoded.clinicIds || []),
          }
          return next()
        }
      } catch (_) {
        // Not a local dev token or expired, try Supabase next
      }
    }

    const supabase = getSupabaseAdmin()

    if (prodMode && !supabase) {
      res.status(503).json({
        success: false,
        error: {
          message: "Authentication service is not configured.",
          statusCode: 503,
        },
      })
      return
    }

    // 2. Supabase Auth Token Verification (Production / Live Supabase Mode)
    if (supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (!error && user) {
          let profile = null
          try {
            profile = await prisma.profile.findUnique({
              where: { id: user.id },
              include: {
                doctor: true,
                clinicMemberships: true,
              },
            })
          } catch (dbErr) {
            if (prodMode) {
              res.status(503).json({
                success: false,
                error: {
                  message: "Database unavailable while verifying user permissions.",
                  statusCode: 503,
                },
              })
              return
            }
            // Non-production dev tolerance when DB is offline
          }

          const role = (profile?.role || user.user_metadata?.role || "PATIENT") as UserRole
          const firstName = profile?.firstName || user.user_metadata?.first_name || "User"
          const lastName = profile?.lastName || user.user_metadata?.last_name || ""
          const membershipClinicIds: string[] = profile?.clinicMemberships?.map((m: any) => m.clinicId) || []
          if (profile?.doctor?.clinicId && !membershipClinicIds.includes(profile.doctor.clinicId)) {
            membershipClinicIds.push(profile.doctor.clinicId)
          }
          const clinicId = membershipClinicIds[0] || null

          req.user = {
            id: user.id,
            email: user.email || "",
            role,
            firstName,
            lastName,
            clinicId,
            clinicIds: membershipClinicIds,
          }
          return next()
        }
      } catch (sbErr) {
        if (prodMode) {
          res.status(503).json({
            success: false,
            error: {
              message: "Authentication service temporarily unreachable.",
              statusCode: 503,
            },
          })
          return
        }
      }
    }

    res.status(401).json({
      success: false,
      error: {
        message: "Invalid or expired session. Please log in again.",
        statusCode: 401,
      },
    })
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        message: "Session expired or invalid token. Please log in again.",
        statusCode: 401,
      },
    })
  }
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required", statusCode: 401 },
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied: Role '${req.user.role}' is not authorized for this resource`,
          statusCode: 403,
          requiredRoles: allowedRoles,
        },
      })
      return
    }

    next()
  }
}

/**
 * Clinic Tenant Scoping Middleware
 */
export function requireClinicAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestedClinicId = (req.params.clinicId || req.body.clinicId || req.query.clinicId) as string

  if (!req.user) {
    res.status(401).json({ success: false, error: { message: "Authentication required", statusCode: 401 } })
    return
  }

  // SuperAdmins bypass clinic scoping
  if (req.user.role === "PLATFORM_ADMIN") {
    return next()
  }

  // Check if user is associated with this clinic
  if (!requestedClinicId || !req.user.clinicIds || !req.user.clinicIds.includes(requestedClinicId)) {
    res.status(403).json({
      success: false,
      error: {
        message: "Access denied: You do not have permission to access records for this clinic",
        statusCode: 403,
      },
    })
    return
  }

  next()
}

/**
 * Doctor Scoping Middleware:
 * Verifies that the authenticated user is either:
 * 1. The doctor themselves
 * 2. A CLINIC_ADMIN of the clinic where this doctor practices
 * 3. PLATFORM_ADMIN
 */
export async function requireDoctorAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const doctorId = (req.params.doctorId || req.body.doctorId) as string

  if (!req.user) {
    res.status(401).json({ success: false, error: { message: "Authentication required", statusCode: 401 } })
    return
  }

  if (req.user.role === "PLATFORM_ADMIN") {
    return next()
  }

  if (!doctorId) {
    res.status(400).json({ success: false, error: { message: "Doctor ID is required", statusCode: 400 } })
    return
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(doctorId)) {
    res.status(400).json({ success: false, error: { message: "Invalid Doctor ID format. Must be a valid UUID.", statusCode: 400 } })
    return
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { profileId: true, clinicId: true },
    })

    if (!doctor) {
      res.status(404).json({ success: false, error: { message: "Doctor not found", statusCode: 404 } })
      return
    }

    // A. Doctor themselves
    if (doctor.profileId === req.user.id) {
      return next()
    }

    // B. Clinic Admin of the doctor's specific clinic
    if (
      req.user.role === "CLINIC_ADMIN" &&
      doctor.clinicId &&
      req.user.clinicIds &&
      req.user.clinicIds.includes(doctor.clinicId)
    ) {
      return next()
    }

    res.status(403).json({
      success: false,
      error: {
        message: "Forbidden: You do not have permission to manage this doctor's profile, schedule, or appointments",
        statusCode: 403,
      },
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || "Doctor authorization check failed", statusCode: 500 },
    })
  }
}

