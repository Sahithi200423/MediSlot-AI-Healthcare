import { Router } from "express"
import { AppointmentController } from "../controllers/appointment.controller.js"
import { authenticate, requireRole, requireClinicAccess, requireDoctorAccess } from "../middleware/auth.js"

const router = Router()

// All appointment endpoints require authentication
router.use(authenticate)

// Patient booking and personal appointments ledger
router.post("/", AppointmentController.bookAppointment)
router.get("/my", AppointmentController.getMyAppointments)

// User notifications
router.get("/notifications", AppointmentController.getNotifications)
router.patch("/notifications/:id/read", AppointmentController.markNotificationRead)

// Doctor-specific and Clinic-specific appointment rosters
router.get("/doctor/:doctorId", requireDoctorAccess, AppointmentController.getDoctorAppointments)
router.get("/clinic/:clinicId", requireRole(["CLINIC_ADMIN", "PLATFORM_ADMIN"]), requireClinicAccess, AppointmentController.getClinicAppointments)

// Single appointment actions (Inspect, Cancel, Reschedule, Status Transition)
router.get("/:id", AppointmentController.getAppointmentById)
router.post("/:id/cancel", AppointmentController.cancelAppointment)
router.post("/:id/reschedule", AppointmentController.rescheduleAppointment)
router.patch("/:id/status", requireRole(["DOCTOR", "CLINIC_ADMIN", "PLATFORM_ADMIN"]), AppointmentController.updateStatus)

export default router
