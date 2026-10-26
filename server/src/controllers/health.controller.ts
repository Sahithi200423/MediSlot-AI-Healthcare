import { Request, Response } from "express"
import { HealthService } from "../services/health.service.js"

export class HealthController {
  public static check(req: Request, res: Response): void {
    const healthData = HealthService.getSystemHealth()
    res.status(200).json({
      success: true,
      message: "MediSlot Core API is operational",
      data: healthData,
    })
  }
}
