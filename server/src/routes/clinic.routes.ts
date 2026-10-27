import { Router } from "express"
import { ClinicController } from "../controllers/clinic.controller.js"
import { authenticate, requireRole, requireClinicAccess } from "../middleware/auth.js"

const router = Router()

// Public / Authenticated directory
router.get("/", ClinicController.getClinics)
router.get("/:clinicId", ClinicController.getClinicById)

// Accept invitation (Authenticated user)
router.post("/invitations/:token/accept", authenticate, ClinicController.acceptInvitation)

// Clinic Onboarding / Creation (Any authenticated user can create their clinic and become CLINIC_ADMIN)
router.post("/", authenticate, ClinicController.createClinic)

// Clinic Administration (requires CLINIC_ADMIN of this clinic or PLATFORM_ADMIN)
router.put(
  "/:clinicId",
  authenticate,
  requireRole(["CLINIC_ADMIN", "PLATFORM_ADMIN"]),
  requireClinicAccess,
  ClinicController.updateClinic
)

router.get(
  "/:clinicId/staff",
  authenticate,
  requireRole(["CLINIC_ADMIN", "PLATFORM_ADMIN"]),
  requireClinicAccess,
  ClinicController.getClinicStaff
)

router.post(
  "/:clinicId/invite",
  authenticate,
  requireRole(["CLINIC_ADMIN", "PLATFORM_ADMIN"]),
  requireClinicAccess,
  ClinicController.inviteStaff
)

router.delete(
  "/:clinicId/staff/:profileId",
  authenticate,
  requireRole(["CLINIC_ADMIN", "PLATFORM_ADMIN"]),
  requireClinicAccess,
  ClinicController.removeStaff
)

export default router
