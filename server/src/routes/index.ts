import { Router } from "express"
import healthRoutes from "./health.routes.js"
import authRoutes from "./auth.routes.js"
import appointmentRoutes from "./appointment.routes.js"
import clinicRoutes from "./clinic.routes.js"
import doctorRoutes from "./doctor.routes.js"
import medicalRoutes from "./medical.routes.js"
import aiRoutes from "./ai.routes.js"

const apiRouter = Router()

// Register routes
apiRouter.use("/health", healthRoutes)
apiRouter.use("/auth", authRoutes)
apiRouter.use("/appointments", appointmentRoutes)
apiRouter.use("/clinics", clinicRoutes)
apiRouter.use("/doctors", doctorRoutes)
apiRouter.use("/medical", medicalRoutes)
apiRouter.use("/ai", aiRoutes)

export default apiRouter

