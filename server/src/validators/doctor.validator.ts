import { z } from "zod"

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const onboardDoctorSchema = z.object({
  specialty: z.string().min(2, "Specialty is required"),
  licenseNumber: z.string().min(4, "Valid medical license number required"),
  yearsOfExperience: z.number().int().min(0).default(0),
  bio: z.string().max(1000).optional(),
  consultationFee: z.number().positive("Consultation fee must be positive").default(50.00),
  qualifications: z.string().optional(),
  clinicId: z.string().uuid("Valid clinic UUID required").optional().nullable(),
})

export const updateDoctorSchema = z.object({
  specialty: z.string().min(2).optional(),
  bio: z.string().max(1000).optional(),
  consultationFee: z.number().positive().optional(),
  qualifications: z.string().optional(),
  isAcceptingPatients: z.boolean().optional(),
  licenseNumber: z.string().min(4).optional(),
})

export const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Start time must be in HH:MM format"),
  endTime: z.string().regex(timeRegex, "End time must be in HH:MM format"),
  slotDurationMinutes: z.number().int().min(10).max(120).default(30),
  isActive: z.boolean().default(true),
}).refine(data => data.startTime < data.endTime, {
  message: "Start time must precede end time",
  path: ["startTime"],
})

export const setDoctorScheduleSchema = z.object({
  slots: z.array(scheduleSlotSchema).min(1, "At least one schedule slot is required"),
})

export const addDoctorBreakSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Start time must be in HH:MM format"),
  endTime: z.string().regex(timeRegex, "End time must be in HH:MM format"),
  title: z.string().min(2).max(50).default("Break"),
}).refine(data => data.startTime < data.endTime, {
  message: "Break start time must precede end time",
  path: ["startTime"],
})

export const addDoctorLeaveSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  reason: z.string().max(500).optional(),
})

export type OnboardDoctorInput = z.infer<typeof onboardDoctorSchema>
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>
export type ScheduleSlotInput = z.infer<typeof scheduleSlotSchema>
export type SetDoctorScheduleInput = z.infer<typeof setDoctorScheduleSchema>
export type AddDoctorBreakInput = z.infer<typeof addDoctorBreakSchema>
export type AddDoctorLeaveInput = z.infer<typeof addDoctorLeaveSchema>
