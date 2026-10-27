import { Request, Response } from "express"
import { ClinicService } from "../services/clinic.service.js"
import { createClinicSchema, updateClinicSchema, inviteStaffSchema } from "../validators/clinic.validator.js"

export class ClinicController {
  public static async createClinic(req: Request, res: Response): Promise<void> {
    try {
      const validated = createClinicSchema.parse(req.body)
      const clinic = await ClinicService.createClinic(validated, req.user!.id)

      res.status(201).json({
        success: true,
        message: "Clinic profile created successfully",
        data: { clinic },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to create clinic", statusCode: 400 },
      })
    }
  }

  public static async getClinics(req: Request, res: Response): Promise<void> {
    try {
      const includeAll = req.query.includeAll === "true" || req.user?.role === "PLATFORM_ADMIN"
      const clinics = await ClinicService.getClinics(includeAll)

      res.status(200).json({
        success: true,
        data: { clinics, total: clinics.length },
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch clinics", statusCode: 500 },
      })
    }
  }

  public static async getClinicById(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const clinic = await ClinicService.getClinicById(clinicId)

      res.status(200).json({
        success: true,
        data: { clinic },
      })
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { message: err.message || "Clinic not found", statusCode: 404 },
      })
    }
  }

  public static async updateClinic(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const validated = updateClinicSchema.parse(req.body)
      const clinic = await ClinicService.updateClinic(clinicId, validated)

      res.status(200).json({
        success: true,
        message: "Clinic updated successfully",
        data: { clinic },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to update clinic", statusCode: 400 },
      })
    }
  }

  public static async getClinicStaff(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const staff = await ClinicService.getClinicStaff(clinicId)

      res.status(200).json({
        success: true,
        data: staff,
      })
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to fetch clinic staff", statusCode: 500 },
      })
    }
  }

  public static async inviteStaff(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const validated = inviteStaffSchema.parse(req.body)
      const invitation = await ClinicService.inviteStaff(clinicId, validated)

      res.status(201).json({
        success: true,
        message: `Invitation generated for ${validated.email}`,
        data: { invitation },
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to issue invitation", statusCode: 400 },
      })
    }
  }

  public static async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string
      const result = await ClinicService.acceptInvitation(token, req.user!.id)

      res.status(200).json({
        success: true,
        message: "Invitation accepted. Clinic membership granted.",
        data: result,
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to accept invitation", statusCode: 400 },
      })
    }
  }

  public static async removeStaff(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.params.clinicId as string
      const profileId = req.params.profileId as string
      await ClinicService.removeStaff(clinicId, profileId)

      res.status(200).json({
        success: true,
        message: "Staff member removed from clinic roster",
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to remove staff member", statusCode: 400 },
      })
    }
  }
}
