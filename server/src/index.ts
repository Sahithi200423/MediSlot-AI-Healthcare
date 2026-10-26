import express from "express"
import cors from "cors"
import morgan from "morgan"
import { config } from "./config/env.js"
import apiRouter from "./routes/index.js"
import { notFoundHandler } from "./middleware/notFound.js"
import { errorHandler } from "./middleware/errorHandler.js"

const app = express()

// 1. Logging Middleware
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"))

// 2. CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
)

// 3. Body Parsing
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// 4. API Routes
app.use("/api", apiRouter)

// Root welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    name: "MediSlot Backend API",
    tagline: "Smarter Appointments. Better Clinic Management.",
    version: "1.0.0",
    healthCheck: "/api/health",
  })
})

// 5. 404 & Centralized Error Handlers
app.use(notFoundHandler)
app.use(errorHandler)

// 6. Start Server
const server = app.listen(config.port, () => {
  console.log(`\n=================================================`)
  console.log(`🏥 MediSlot Core Backend API running successfully!`)
  console.log(`📡 URL: http://localhost:${config.port}`)
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`)
  console.log(`⚙️  Environment: ${config.nodeEnv}`)
  console.log(`=================================================\n`)
})

export default app
