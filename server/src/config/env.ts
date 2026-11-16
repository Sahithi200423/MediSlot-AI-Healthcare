import dotenv from "dotenv"
dotenv.config()

const nodeEnv = process.env.NODE_ENV || "development"
export const isProduction = nodeEnv === "production"

export function isProdEnv(): boolean {
  return (process.env.NODE_ENV || "development") === "production"
}

function requireProductionSecret(name: string, devFallback: string): string {
  const value = process.env[name]?.trim()
  if (value) {
    return value
  }
  if (isProduction) {
    throw new Error(`Missing required production environment variable: ${name}`)
  }
  return devFallback
}

const LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

/**
 * Resolves allowed CORS origins cleanly:
 * - Production: ONLY exact non-localhost origins explicitly listed in FRONTEND_URL
 * - Development/Test: configured origins plus standard local Vite ports
 */
export function getAllowedOrigins(): string[] {
  const prodMode = (process.env.NODE_ENV || "development") === "production"
  const rawFrontend = process.env.FRONTEND_URL ?? (prodMode ? "" : "http://localhost:5173")

  const configured = rawFrontend
    .split(",")
    .map((u) => u.trim().replace(/\/$/, ""))
    .filter(Boolean)

  if (prodMode) {
    return Array.from(new Set(configured.filter((u) => !LOCAL_ORIGIN_REGEX.test(u))))
  }

  return Array.from(
    new Set([
      ...configured,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ])
  )
}

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv,
  isProduction,
  frontendUrl: (process.env.FRONTEND_URL || (isProduction ? "" : "http://localhost:5173")).trim(),
  aiServiceUrl: (process.env.AI_SERVICE_URL || (isProduction ? "" : "http://localhost:8000")).replace(/\/$/, ""),
  aiServiceSecret: requireProductionSecret("AI_SERVICE_SECRET", "medislot-internal-ai-secret-2026"),
  databaseUrl: process.env.DATABASE_URL || (isProduction ? "" : "postgresql://postgres:postgres@localhost:5432/medislot"),
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || (isProduction ? "" : "postgresql://postgres:postgres@localhost:5432/medislot"),
  supabaseUrl: (process.env.SUPABASE_URL || "").trim(),
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || "").trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  jwtSecret: requireProductionSecret("JWT_SECRET", "medislot-dev-super-secure-jwt-secret-key-32chars"),
} as const
