import { Router } from "express"
import { HealthController } from "../controllers/health.controller.js"

const router = Router()

/**
 * @route   GET /api/health
 * @desc    Get API health status, version, and uptime
 * @access  Public
 */
router.get("/", HealthController.check)

export default router
