import { Router, Request, Response } from "express"
import { prisma } from "../config/db.js"
import { isProdEnv } from "../config/env.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

/**
 * GET /api/admin/stats
 * Real platform-wide metrics across all tenants
 */
router.get("/stats", authenticate, requireRole(["PLATFORM_ADMIN"]), async (_req: Request, res: Response) => {
  try {
    const [
      totalClinics,
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalAuditLogs,
      verifiedClinicsCount,
      recentAppointments,
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.doctor.count(),
      prisma.profile.count({ where: { role: "PATIENT" } }),
      prisma.appointment.count(),
      prisma.auditLog.count(),
      prisma.clinic.count({ where: { isVerified: true } }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { include: { profile: true } },
          patient: { include: { profile: true } },
          clinic: true,
        },
      }),
    ])

    res.status(200).json({
      success: true,
      data: {
        totalClinics,
        totalDoctors,
        totalPatients,
        totalAppointments,
        totalAuditLogs,
        verifiedClinicsCount,
        recentAppointments,
      },
    })
  } catch (err: any) {
    if (isProdEnv()) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch platform stats", statusCode: 500 },
      })
      return
    }
    // Non-production offline DB fallback
    res.status(200).json({
      success: true,
      data: {
        totalClinics: 12,
        totalDoctors: 48,
        totalPatients: 3890,
        totalAppointments: 1420,
        totalAuditLogs: 240,
        verifiedClinicsCount: 10,
        recentAppointments: [],
      },
    })
  }
})

/**
 * GET /api/admin/audit-logs
 * Security and administrative audit logs from PostgreSQL
 */
router.get("/audit-logs", authenticate, requireRole(["PLATFORM_ADMIN"]), async (req: Request, res: Response) => {
  try {
    const resourceTable = req.query.resourceTable as string | undefined
    const limit = Math.min(Number(req.query.limit) || 50, 100)

    const logs = await prisma.auditLog.findMany({
      where: resourceTable && resourceTable !== "ALL" ? { resourceTable } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    })

    res.status(200).json({
      success: true,
      data: { logs, total: logs.length },
    })
  } catch (err: any) {
    if (isProdEnv()) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch audit logs", statusCode: 500 },
      })
      return
    }
    // Non-production offline DB fallback
    const fallbackLogs = [
      { id: "audit-01", action: "CLINIC_VERIFIED", resourceTable: "clinics", resourceId: "clinic-metro-001", createdAt: new Date().toISOString(), profile: { firstName: "David", lastName: "Sterling", role: "PLATFORM_ADMIN" } },
      { id: "audit-02", action: "MEDICAL_RECORD_UPLOADED", resourceTable: "medical_records", resourceId: "rec-001", createdAt: new Date().toISOString(), profile: { firstName: "Sarah", lastName: "Jenkins", role: "PATIENT" } },
      { id: "audit-03", action: "APPOINTMENT_BOOKED", resourceTable: "appointments", resourceId: "appt-001", createdAt: new Date().toISOString(), profile: { firstName: "Sarah", lastName: "Jenkins", role: "PATIENT" } }
    ]
    res.status(200).json({
      success: true,
      data: { logs: fallbackLogs, total: fallbackLogs.length },
    })
  }
})

/**
 * GET /api/admin/users
 * Multi-role user directory
 */
router.get("/users", authenticate, requireRole(["PLATFORM_ADMIN"]), async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string | undefined
    const search = req.query.search as string | undefined

    const where: any = {}
    if (role && role !== "ALL") where.role = role
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const users = await prisma.profile.findMany({
      where,
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { id: true, specialty: true, licenseNumber: true } },
        clinicMemberships: {
          include: { clinic: { select: { id: true, name: true, city: true } } },
        },
      },
    })

    res.status(200).json({
      success: true,
      data: { users, total: users.length },
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to fetch users", statusCode: 500 },
    })
  }
})

/**
 * PATCH /api/admin/clinics/:clinicId/verification
 * Toggle verification status on a clinic facility
 */
router.patch(
  "/clinics/:clinicId/verification",
  authenticate,
  requireRole(["PLATFORM_ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const clinicId = req.params.clinicId as string
      const { isVerified } = req.body

      const updated = await prisma.clinic.update({
        where: { id: clinicId },
        data: { isVerified: Boolean(isVerified) },
      })

      // Log action in audit trail
      try {
        await prisma.auditLog.create({
          data: {
            profileId: req.user!.id,
            action: isVerified ? "CLINIC_VERIFIED" : "CLINIC_VERIFICATION_REVOKED",
            resourceTable: "clinics",
            resourceId: clinicId,
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
          },
        })
      } catch (_) {}

      res.status(200).json({
        success: true,
        message: `Clinic "${updated.name}" is now ${updated.isVerified ? "verified" : "unverified"}`,
        data: { clinic: updated },
      })
    } catch (err: any) {
      const statusCode = err?.code === "P2025" ? 404 : 500
      res.status(statusCode).json({
        success: false,
        error: {
          message: err?.code === "P2025" ? "Clinic not found" : (err.message || "Failed to update clinic verification"),
          statusCode,
        },
      })
    }
  }
)

export default router
