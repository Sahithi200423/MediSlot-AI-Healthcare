import { Router } from "express"
import healthRoutes from "./health.routes.js"

const apiRouter = Router()

// Register routes
apiRouter.use("/health", healthRoutes)

export default apiRouter
