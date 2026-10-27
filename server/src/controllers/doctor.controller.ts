import { Request, Response } from "express"
import { DoctorService } from "../services/doctor.service.js"
import { 
  onboardDoctorSchema, 
  updateDoctorSchema, 
  setDoctorScheduleSchema, 
  addDoctorBreakSchema, 
  addDoctorLeaveSchema 
} from "../validators/doctor.validator.js"

export class DoctorController {
  public static async onboardDoctor(req: Request, res: Response): Promise<void> {
    try {
      const validated = onboardDoctorSchema.parse(req.body)
      const doctor = await DoctorService.onboardDoctor(req.user!.id, validated)

      res.status(201).json({
        success: true,
        message: "Doctor profile onboarded successfully. Medical license is pending administrator verification.",
        data: { doctor },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to onboard doctor", statusCode: 400 },
      })
    }
  }

  public static async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        specialty: req.query.specialty as string | undefined,
        clinicId: req.query.clinicId as string | undefined,
        search: req.query.search as string | undefined,
        acceptingPatients: req.query.acceptingPatients ? req.query.acceptingPatients === "true" : undefined,
      }

      const doctors = await DoctorService.getDoctors(filters)

      res.status(200).json({
        success: true,
        data: { doctors, total: doctors.length },
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch doctors", statusCode: 500 },
      })
    }
  }

  public static async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const doctor = await DoctorService.getDoctorById(doctorId)

      res.status(200).json({
        success: true,
        data: { doctor },
      })
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { message: err.message || "Doctor not found", statusCode: 404 },
      })
    }
  }

  public static async getCurrentDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctor = await DoctorService.getDoctorByProfileId(req.user!.id)
      res.status(200).json({
        success: true,
        data: { doctor },
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch doctor profile", statusCode: 500 },
      })
    }
  }

  public static async updateDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const validated = updateDoctorSchema.parse(req.body)
      const doctor = await DoctorService.updateDoctor(doctorId, validated)

      res.status(200).json({
        success: true,
        message: "Doctor profile updated",
        data: { doctor },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to update doctor profile", statusCode: 400 },
      })
    }
  }

  public static async verifyLicense(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const verified = req.body.verified !== false
      const doctor = await DoctorService.verifyLicense(doctorId, verified)

      res.status(200).json({
        success: true,
        message: `Medical license verification status updated to: ${verified}`,
        data: { doctor },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to update license verification", statusCode: 400 },
      })
    }
  }

  public static async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const schedule = await DoctorService.getSchedule(doctorId)

      res.status(200).json({
        success: true,
        data: schedule,
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch doctor schedule", statusCode: 500 },
      })
    }
  }

  public static async setSchedule(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const validated = setDoctorScheduleSchema.parse(req.body)
      await DoctorService.setSchedule(doctorId, validated.slots)

      res.status(200).json({
        success: true,
        message: "Weekly working schedule updated successfully",
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to set schedule", statusCode: 400 },
      })
    }
  }

  public static async addBreak(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const validated = addDoctorBreakSchema.parse(req.body)
      const doctorBreak = await DoctorService.addBreak(doctorId, validated)

      res.status(201).json({
        success: true,
        message: "Break period scheduled",
        data: { break: doctorBreak },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to schedule break", statusCode: 400 },
      })
    }
  }

  public static async deleteBreak(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const breakId = req.params.breakId as string
      await DoctorService.deleteBreak(breakId, doctorId)

      res.status(200).json({
        success: true,
        message: "Break period removed",
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to remove break", statusCode: 400 },
      })
    }
  }

  public static async addLeave(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const validated = addDoctorLeaveSchema.parse(req.body)
      const leave = await DoctorService.addLeave(doctorId, validated)

      res.status(201).json({
        success: true,
        message: "Leave period recorded",
        data: { leave },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to add leave", statusCode: 400 },
      })
    }
  }

  public static async deleteLeave(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const leaveId = req.params.leaveId as string
      await DoctorService.deleteLeave(leaveId, doctorId)

      res.status(200).json({
        success: true,
        message: "Leave period cancelled",
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to cancel leave", statusCode: 400 },
      })
    }
  }

  public static async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const dateStr = req.query.date as string
      if (!dateStr) {
        res.status(400).json({
          success: false,
          error: { message: "Query parameter 'date' (YYYY-MM-DD) is required", statusCode: 400 },
        })
        return
      }

      const result = await DoctorService.calculateAvailability(doctorId, dateStr)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to calculate availability", statusCode: 400 },
      })
    }
  }
}
