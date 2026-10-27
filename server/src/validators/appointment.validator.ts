import { z } from "zod"

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid("Valid Doctor ID is required"),
  clinicId: z.string().uuid("Valid Clinic ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in format HH:MM"),
  visitType: z.enum(["IN_CLINIC", "VIDEO_VISIT"]).default("IN_CLINIC"),
  reasonForVisit: z.string().min(3, "Reason for visit must be at least 3 characters").max(500),
  paymentMethod: z.enum(["PAY_AT_CLINIC", "ONLINE_PENDING"]).default("PAY_AT_CLINIC"),
})

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in format HH:MM"),
  reason: z.string().max(500).optional(),
})

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(3, "Please provide a reason for cancellation").max(500),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "IN_CONSULTATION",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  notes: z.string().max(500).optional(),
})

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>
