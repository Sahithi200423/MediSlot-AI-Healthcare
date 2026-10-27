import { z } from "zod"

export const createClinicSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Valid postal code is required"),
  phone: z.string().min(7, "Valid contact number is required"),
  email: z.string().email("Valid email address required"),
  operatingHours: z.string().optional().default("08:00 - 20:00"),
  timezone: z.string().optional().default("UTC"),
})

export const updateClinicSchema = createClinicSchema.partial()

export const inviteStaffSchema = z.object({
  email: z.string().email("Valid recipient email is required"),
  role: z.enum(["DOCTOR", "CLINIC_ADMIN"]).default("DOCTOR"),
})

export type CreateClinicInput = z.infer<typeof createClinicSchema>
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
