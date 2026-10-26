import { Router, Request, Response } from "express"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

/**
 * @route   GET /api/appointments/my
 * @desc    Get appointments isolated to the authenticated user's role and identity
 * @access  Protected
 */
router.get("/my", authenticate, async (req: Request, res: Response) => {
  const user = req.user!

  // Synthetic records demonstrating tenant and user-level isolation
  const sampleData = {
    scopedUserId: user.id,
    scopedRole: user.role,
    records: [
      {
        id: "apt-101",
        patientName: user.role === "PATIENT" ? `${user.firstName} ${user.lastName}` : "Alex Turner",
        doctorName: user.role === "DOCTOR" ? `${user.firstName} ${user.lastName}` : "Dr. Sarah Jenkins",
        scheduledStart: "2026-10-27T10:30:00Z",
        status: "CONFIRMED",
        accessNotice: `Data isolated strictly for ${user.role} (${user.email})`,
      },
    ],
  }

  res.status(200).json({
    success: true,
    data: sampleData,
  })
})

/**
 * @route   GET /api/appointments/admin-metrics
 * @desc    Restricted endpoint only accessible to PLATFORM_ADMIN
 * @access  Protected (SuperAdmin only)
 */
router.get(
  "/admin-metrics",
  authenticate,
  requireRole(["PLATFORM_ADMIN"]),
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Authorized Platform Admin metrics unlocked",
      data: {
        totalGlobalAppointments: 15482,
        activeClinics: 38,
        platformStatus: "NOMINAL",
      },
    })
  }
)

export default router
