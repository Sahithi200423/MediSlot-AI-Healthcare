import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/env.js"
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
    const supabase = getSupabaseAdmin()

    // 1. Try Supabase Auth Token Verification if configured
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (!error && user) {
        // Query user profile from Prisma if DB connected
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
          // If DB is offline, read from metadata
        }

        const role = (profile?.role || user.user_metadata?.role || "PATIENT") as UserRole
        const firstName = profile?.firstName || user.user_metadata?.first_name || "User"
        const lastName = profile?.lastName || user.user_metadata?.last_name || ""
        const clinicId = profile?.doctor?.clinicId || profile?.clinicMemberships?.[0]?.clinicId || null

        req.user = {
          id: user.id,
          email: user.email || "",
          role,
          firstName,
          lastName,
          clinicId,
        }
        return next()
      }
    }

    // 2. Local JWT Verification Fallback (for development / mock sessions)
    const decoded = jwt.verify(token, config.jwtSecret) as any

    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid or expired token", statusCode: 401 },
      })
      return
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "PATIENT",
      firstName: decoded.firstName || "Demo",
      lastName: decoded.lastName || "User",
      clinicId: decoded.clinicId || null,
    }
    next()
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
  const requestedClinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId

  if (!req.user) {
    res.status(401).json({ success: false, error: { message: "Authentication required", statusCode: 401 } })
    return
  }

  // SuperAdmins bypass clinic scoping
  if (req.user.role === "PLATFORM_ADMIN") {
    return next()
  }

  // Check if user is associated with this clinic
  if (!requestedClinicId || req.user.clinicId !== requestedClinicId) {
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
