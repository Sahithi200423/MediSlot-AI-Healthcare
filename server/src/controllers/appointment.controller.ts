import { Request, Response } from "express"
import { AppointmentService } from "../services/appointment.service.js"
import { 
  bookAppointmentSchema, 
  rescheduleAppointmentSchema, 
  cancelAppointmentSchema, 
  updateAppointmentStatusSchema 
} from "../validators/appointment.validator.js"

export class AppointmentController {
  /**
   * Book a new appointment
   */
  public static async bookAppointment(req: Request, res: Response): Promise<void> {
    try {
      const validated = bookAppointmentSchema.parse(req.body)
      const appointment = await AppointmentService.bookAppointment(req.user!.id, validated)

      res.status(201).json({
        success: true,
        message: "Appointment successfully booked!",
        data: { appointment },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("reserved by another patient") ? 409 : 400
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Failed to book appointment", statusCode },
      })
    }
  }

  /**
   * Get patient's own appointments
   */
  public static async getMyAppointments(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.query.filter as "upcoming" | "past" | "all" | undefined
      const appointments = await AppointmentService.getPatientAppointments(req.user!.id, filter)

      res.status(200).json({
        success: true,
        data: { appointments, total: appointments.length },
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch appointments", statusCode: 500 },
      })
    }
  }

  /**
   * Get doctor appointments
   */
  public static async getDoctorAppointments(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId as string
      const filters = {
        date: req.query.date as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status as any,
      }

      const appointments = await AppointmentService.getDoctorAppointments(doctorId, filters)

      res.status(200).json({
        success: true,
        data: { appointments, total: appointments.length },
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch doctor appointments", statusCode: 500 },
      })
    }
  }

  /**
   * Get clinic appointments (with tenant isolation check)
   */
  public static async getClinicAppointments(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const filters = {
        doctorId: req.query.doctorId as string | undefined,
        status: req.query.status as any,
        date: req.query.date as string | undefined,
      }

      const appointments = await AppointmentService.getClinicAppointments(
        clinicId,
        req.user!.id,
        req.user!.role,
        filters
      )

      res.status(200).json({
        success: true,
        data: { appointments, total: appointments.length },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("Forbidden") ? 403 : 500
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Failed to fetch clinic appointments", statusCode },
      })
    }
  }

  /**
   * Get single appointment details
   */
  public static async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = req.params.id as string
      const appointment = await AppointmentService.getAppointmentById(
        appointmentId,
        req.user!.id,
        req.user!.role
      )

      res.status(200).json({
        success: true,
        data: { appointment },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("Forbidden") ? 403 : 404
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Appointment not found", statusCode },
      })
    }
  }

  /**
   * Cancel appointment
   */
  public static async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = req.params.id as string
      const validated = cancelAppointmentSchema.parse(req.body)
      const appointment = await AppointmentService.cancelAppointment(
        appointmentId,
        req.user!.id,
        req.user!.role,
        validated
      )

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        data: { appointment },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("Forbidden") ? 403 : 400
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Failed to cancel appointment", statusCode },
      })
    }
  }

  /**
   * Reschedule appointment
   */
  public static async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = req.params.id as string
      const validated = rescheduleAppointmentSchema.parse(req.body)
      const appointment = await AppointmentService.rescheduleAppointment(
        appointmentId,
        req.user!.id,
        req.user!.role,
        validated
      )

      res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully",
        data: { appointment },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("Forbidden") ? 403 : 400
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Failed to reschedule appointment", statusCode },
      })
    }
  }

  /**
   * Update appointment status (Check-in, in-progress, completed, no-show)
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = req.params.id as string
      const validated = updateAppointmentStatusSchema.parse(req.body)
      const appointment = await AppointmentService.updateStatus(
        appointmentId,
        req.user!.id,
        req.user!.role,
        validated
      )

      res.status(200).json({
        success: true,
        message: `Appointment status updated to ${validated.status}`,
        data: { appointment },
      })
    } catch (err: any) {
      const statusCode = err.message.includes("Forbidden") ? 403 : 400
      res.status(statusCode).json({
        success: false,
        error: { message: err.message || "Failed to update status", statusCode },
      })
    }
  }

  /**
   * Get user notifications
   */
  public static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const data = await AppointmentService.getNotifications(req.user!.id)
      res.status(200).json({
        success: true,
        data,
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch notifications", statusCode: 500 },
      })
    }
  }

  /**
   * Mark notification as read
   */
  public static async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id as string
      await AppointmentService.markNotificationRead(notificationId, req.user!.id)
      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to mark notification as read", statusCode: 400 },
      })
    }
  }
}
