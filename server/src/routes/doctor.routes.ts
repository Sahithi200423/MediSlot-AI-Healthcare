import { Router } from "express"
import { DoctorController } from "../controllers/doctor.controller.js"
import { authenticate, requireRole, requireDoctorAccess } from "../middleware/auth.js"

const router = Router()

// Public / Authenticated Doctor Directory & Search
router.get("/", DoctorController.getDoctors)
router.get("/me", authenticate, DoctorController.getCurrentDoctor)
router.get("/:doctorId", DoctorController.getDoctorById)

// Availability Calculation Engine (Public / Authenticated)
router.get("/:doctorId/availability", DoctorController.getAvailability)

// Doctor Onboarding (Authenticated users)
router.post("/onboard", authenticate, DoctorController.onboardDoctor)

// Profile Updating (Doctor themselves, Clinic Admin of that doctor's clinic, or Platform Admin)
router.put("/:doctorId", authenticate, requireDoctorAccess, DoctorController.updateDoctor)

// License Verification (Platform Admin Only)
router.patch("/:doctorId/verify-license", authenticate, requireRole(["PLATFORM_ADMIN"]), DoctorController.verifyLicense)

// Weekly Schedule Management
router.get("/:doctorId/schedule", DoctorController.getSchedule)
router.post("/:doctorId/schedule", authenticate, requireDoctorAccess, DoctorController.setSchedule)

// Breaks Management
router.post("/:doctorId/breaks", authenticate, requireDoctorAccess, DoctorController.addBreak)
router.delete("/:doctorId/breaks/:breakId", authenticate, requireDoctorAccess, DoctorController.deleteBreak)

// Leaves Management
router.post("/:doctorId/leaves", authenticate, requireDoctorAccess, DoctorController.addLeave)
router.delete("/:doctorId/leaves/:leaveId", authenticate, requireDoctorAccess, DoctorController.deleteLeave)

export default router
