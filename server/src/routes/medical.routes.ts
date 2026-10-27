import { Router } from "express"
import multer from "multer"
import { authenticate, requireRole } from "../middleware/auth.js"
import { MedicalController } from "../controllers/medical.controller.js"

const router = Router()

// Configure Multer for in-memory buffer handling with strict 15MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 Megabytes
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ]
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPEG, WebP.`))
    }
  },
})

// ================= MEDICAL RECORDS =================

// Upload document (Patient, Doctor on behalf of patient, Admin)
router.post(
  "/records/upload",
  authenticate,
  upload.single("file"),
  MedicalController.uploadRecord
)

// Patient's own records
router.get(
  "/records/my-records",
  authenticate,
  MedicalController.getMyRecords
)

// Patient records for authorized doctors or admin
router.get(
  "/records/patient/:patientId",
  authenticate,
  MedicalController.getPatientRecords
)

// Generate short-lived signed download URL (5 minutes)
router.get(
  "/records/:recordId/download-url",
  authenticate,
  MedicalController.getRecordDownloadUrl
)

// Delete medical record (owner patient or admin)
router.delete(
  "/records/:recordId",
  authenticate,
  MedicalController.deleteRecord
)

// Grant doctor record access (patient only)
router.post(
  "/records/access/grant",
  authenticate,
  MedicalController.grantDoctorAccess
)

// Revoke doctor record access (patient only)
router.post(
  "/records/access/revoke",
  authenticate,
  MedicalController.revokeDoctorAccess
)

// Get doctor access list for authenticated patient
router.get(
  "/records/access/doctors",
  authenticate,
  MedicalController.getDoctorAccessList
)

// ================= CLINICAL NOTES (SOAP) =================

// Create SOAP note (Doctor only)
router.post(
  "/clinical-notes",
  authenticate,
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  MedicalController.createClinicalNote
)

// Update or finalize SOAP note (Doctor only)
router.patch(
  "/clinical-notes/:id",
  authenticate,
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  MedicalController.updateClinicalNote
)

// Get note by appointment ID (Doctor or Patient if finalized)
router.get(
  "/clinical-notes/appointment/:appointmentId",
  authenticate,
  MedicalController.getClinicalNoteByAppointment
)

// Get patient clinical notes (Patient or authorized Doctor)
router.get(
  "/clinical-notes/patient/:patientId",
  authenticate,
  MedicalController.getPatientClinicalNotes
)

// ================= DIGITAL PRESCRIPTIONS =================

// Create prescription with PDF generation (Doctor only)
router.post(
  "/prescriptions",
  authenticate,
  requireRole(["DOCTOR", "PLATFORM_ADMIN"]),
  MedicalController.createPrescription
)

// Patient's prescription history
router.get(
  "/prescriptions/my-prescriptions",
  authenticate,
  MedicalController.getMyPrescriptions
)

// Get prescriptions for an appointment
router.get(
  "/prescriptions/appointment/:appointmentId",
  authenticate,
  MedicalController.getAppointmentPrescriptions
)

// Generate short-lived signed download URL for prescription PDF
router.get(
  "/prescriptions/:id/download-url",
  authenticate,
  MedicalController.getPrescriptionDownloadUrl
)

export default router
