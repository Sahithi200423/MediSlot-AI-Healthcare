import { Router } from "express"
import healthRoutes from "./health.routes.js"
import authRoutes from "./auth.routes.js"
import appointmentRoutes from "./appointment.routes.js"

const apiRouter = Router()

// Register routes
apiRouter.use("/health", healthRoutes)
apiRouter.use("/auth", authRoutes)
apiRouter.use("/appointments", appointmentRoutes)

export default apiRouter
