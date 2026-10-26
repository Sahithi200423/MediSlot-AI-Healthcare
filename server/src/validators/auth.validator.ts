import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  // Strict rule: role cannot be escalated by client request
  role: z.enum(["PATIENT", "DOCTOR", "CLINIC_ADMIN", "PLATFORM_ADMIN"]).optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
