import dotenv from "dotenv"
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  aiServiceSecret: process.env.AI_SERVICE_SECRET || "medislot-internal-ai-secret-2026",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medislot",
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medislot",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "medislot-dev-super-secure-jwt-secret-key-32chars",
} as const
