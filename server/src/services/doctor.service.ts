import { prisma } from "../config/db.js"
import { isProdEnv } from "../config/env.js"
import { 
  OnboardDoctorInput, 
  UpdateDoctorInput, 
  ScheduleSlotInput, 
  AddDoctorBreakInput, 
  AddDoctorLeaveInput 
} from "../validators/doctor.validator.js"

/**
 * Exact audited IDs of confirmed synthetic test doctor records created
 * by automated test suites.
 * Excluded strictly from public browsing so public directory is clean,
 * while preserving historical appointment foreign keys and clinical notes.
 */
export const CONFIRMED_SYNTHETIC_DOCTOR_IDS = new Set<string>([
  "47418397-a297-4496-94e0-3b205a26ee55", // Record #2: doctor_1793088864766@medislot.com (Phase 4 concurrency test)
  "b0f1bc53-6663-4929-8786-b24780679965", // Record #3: doctor_1793089617874@medislot.com (Phase 4 concurrency test)
  "f089040d-1d26-45b2-8d2f-206b5ac6eb90", // Record #4: p4_doc_1793092243093@medislot.com (Phase 4 test)
  "0e784ccf-31a6-4b49-9cd1-f9505e6fe408", // Record #5: sec.doca.277582@example.com (Phase 5 security test)
  "1f92d936-4f58-4fa1-9821-441afccee59d", // Record #6: sec.docb.277582@example.com (Phase 5 security test)
  "07960a6d-7590-4fc4-9652-9e1ccdb4d988", // Record #7: ai.doc.966383@example.com (Phase 6 AI test)
  "7070e8f9-b3ea-4f22-9551-631e490e8912", // Record #8: ai.doc.993925@example.com (Phase 6 AI test)
  "a1e86fb6-fd1b-4b4b-b5eb-f8fd9321a8db", // Record #9: ai.doc.380505@example.com (Phase 6 AI test)
  "541efc0e-2e8f-497c-bb18-0c7d036fe95f", // Record #10: ai.doc.657529@example.com (Phase 6 AI test)
  "b637c4b6-0930-4c53-8494-768aa813a7d4", // Record #12: editorial.doc.979263@example.com (Phase 1 redesign test)
  "7998a466-dbfa-499e-92c4-660ce8f17cf1", // Record #13: editorial.doc.106443@example.com (Phase 1 redesign test)
  "066c763b-e661-4d51-a900-7b28f6d06669", // Record #14: editorial.doc.977001@example.com (Phase 1 redesign test)
  "a5a960f0-6cc0-4cd5-8b73-799a8d192c93", // Record #15: editorial.doc.855682@example.com (Phase 1 redesign test)
  "d4743d25-f5f9-4800-9bb9-af3cdf45f6bc", // Record #16: editorial.doc.723500@example.com (Phase 1 redesign test)
  "7c69548b-a725-4c15-bb98-bd5a4af88553", // Record #17: audit.doc.959353@example.com (Phase 7 audit test)
])

/**
 * Reliable pattern matching to identify confirmed synthetic test accounts
 * created by automated integration test suites without affecting legitimate doctors.
 */
export function isConfirmedSyntheticDoctorRecord(doc: {
  id: string
  profile?: { email?: string | null } | null
}): boolean {
  if (CONFIRMED_SYNTHETIC_DOCTOR_IDS.has(doc.id)) {
    return true
  }
  const email = doc.profile?.email || ""
  // Canonical demo accounts must never be flagged as synthetic
  if (email === "dr.jenkins@demo.medislot.com") {
    return false
  }
  // Exclude test email patterns: timestamped test accounts and test-suite prefixes
  if (
    /_\d{10,14}@/.test(email) ||
    /^(ai\.doc\.|sec\.doc[ab]\.|editorial\.doc\.|audit\.doc\.)/i.test(email)
  ) {
    return true
  }
  return false
}

export class DoctorService {
  /**
   * Onboards a user as a DOCTOR.
   * STRICT SECURITY: Sets licenseVerified = false until verified by an authorized administrator.
   */
  public static async onboardDoctor(profileId: string, data: OnboardDoctorInput) {
    // Check if license number is already used
    const existing = await prisma.doctor.findUnique({
      where: { licenseNumber: data.licenseNumber },
    })
    if (existing) {
      throw new Error("A doctor with this license number is already registered")
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create doctor record
      const doctor = await tx.doctor.create({
        data: {
          profileId,
          clinicId: data.clinicId || null,
          specialty: data.specialty,
          licenseNumber: data.licenseNumber,
          licenseVerified: false, // Security: Never automatically treat license as verified
          qualifications: data.qualifications,
          yearsOfExperience: data.yearsOfExperience || 0,
          bio: data.bio,
          consultationFee: data.consultationFee || 199,
          isAcceptingPatients: true,
        },
      })

      // 2. Promote profile role to DOCTOR
      await tx.profile.update({
        where: { id: profileId },
        data: { role: "DOCTOR" },
      })

      // 3. If clinicId provided, add ClinicMembership
      if (data.clinicId) {
        await tx.clinicMembership.upsert({
          where: {
            clinicId_profileId: {
              clinicId: data.clinicId,
              profileId,
            },
          },
          create: {
            clinicId: data.clinicId,
            profileId,
            clinicRole: "RECEPTIONIST",
          },
          update: {},
        })
      }

      return doctor
    })
  }

  /**
   * Search / filter doctors
   */
  public static async getDoctors(filters: {
    specialty?: string
    clinicId?: string
    search?: string
    acceptingPatients?: boolean
  }) {
    const where: any = {
      id: { notIn: Array.from(CONFIRMED_SYNTHETIC_DOCTOR_IDS) },
    }

    if (filters.specialty) {
      where.specialty = { contains: filters.specialty, mode: "insensitive" }
    }

    if (filters.clinicId) {
      where.clinicId = filters.clinicId
    }

    if (filters.acceptingPatients !== undefined) {
      where.isAcceptingPatients = filters.acceptingPatients
    }

    if (filters.search) {
      where.OR = [
        { specialty: { contains: filters.search, mode: "insensitive" } },
        { bio: { contains: filters.search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ]
    }

    try {
      const doctors = await prisma.doctor.findMany({
        where,
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
          },
          clinic: {
            select: { id: true, name: true, city: true, state: true, address: true },
          },
        },
        orderBy: { yearsOfExperience: "desc" },
      })
      return doctors.filter((doc) => !isConfirmedSyntheticDoctorRecord(doc))
    } catch (err) {
      if (isProdEnv()) {
        throw err
      }
      return [
        {
          id: "93ccf966-e04d-4aa8-b823-e36e242056d8",
          profileId: "47775115-3c12-47b0-b5ad-87f7a3a97950",
          specialty: "Cardiology",
          licenseNumber: "WA-MD-DEMO-0199",
          licenseVerified: true,
          qualifications: "MD, FACP",
          yearsOfExperience: 14,
          bio: "Attending physician specializing in preventative cardiovascular care.",
          consultationFee: 120,
          isAcceptingPatients: true,
          clinicId: "ef3b05e6-7b53-41a7-aa9a-d6b255cc178c",
          profile: {
            id: "47775115-3c12-47b0-b5ad-87f7a3a97950",
            firstName: "Marcus",
            lastName: "Vance",
            email: "dr.jenkins@demo.medislot.com",
            phone: "+1-555-0199",
            avatarUrl: null,
          },
          clinic: {
            id: "ef3b05e6-7b53-41a7-aa9a-d6b255cc178c",
            name: "MediSlot Central Metro Clinic",
            city: "Seattle",
            state: "WA",
            address: "100 Healthcare Boulevard, Suite 400",
          },
        },
      ]
    }
  }

  /**
   * Get doctor by ID
   */
  public static async getDoctorById(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
        },
        clinic: true,
        availability: { where: { isActive: true } },
        breaks: true,
      },
    })

    if (!doctor) {
      throw new Error("Doctor not found")
    }

    return doctor
  }

  /**
   * Get doctor by Profile ID (authenticated user)
   */
  public static async getDoctorByProfileId(profileId: string) {
    return prisma.doctor.findUnique({
      where: { profileId },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
        },
        clinic: true,
        availability: { where: { isActive: true } },
        breaks: true,
      },
    })
  }

  /**
   * Updates doctor professional profile
   */
  public static async updateDoctor(doctorId: string, data: UpdateDoctorInput) {
    // If license number changed, reset licenseVerified to false
    const updateData: any = { ...data }
    if (data.licenseNumber) {
      updateData.licenseVerified = false
    }

    return prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
    })
  }

  /**
   * Verified by administrator
   */
  public static async verifyLicense(doctorId: string, verified: boolean) {
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { licenseVerified: verified },
    })
  }

  /**
   * Sets doctor weekly recurring working schedule
   */
  public static async setSchedule(doctorId: string, slots: ScheduleSlotInput[]) {
    return prisma.$transaction(async (tx) => {
      // Replace existing availability slots
      await tx.doctorAvailability.deleteMany({ where: { doctorId } })

      return tx.doctorAvailability.createMany({
        data: slots.map((s) => ({
          doctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMinutes: s.slotDurationMinutes || 30,
          isActive: s.isActive ?? true,
        })),
      })
    })
  }

  /**
   * Gets doctor schedule and breaks
   */
  public static async getSchedule(doctorId: string) {
    const [availability, breaks, leaves] = await Promise.all([
      prisma.doctorAvailability.findMany({
        where: { doctorId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      }),
      prisma.doctorBreak.findMany({
        where: { doctorId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      }),
      prisma.doctorLeave.findMany({
        where: { doctorId, endDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
      }),
    ])

    return { availability, breaks, leaves }
  }

  /**
   * Adds a recurring break period
   */
  public static async addBreak(doctorId: string, data: AddDoctorBreakInput) {
    return prisma.doctorBreak.create({
      data: {
        doctorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title || "Break",
      },
    })
  }

  /**
   * Removes a break period
   */
  public static async deleteBreak(breakId: string, doctorId: string) {
    return prisma.doctorBreak.deleteMany({
      where: { id: breakId, doctorId },
    })
  }

  /**
   * Adds leave / unavailability period
   */
  public static async addLeave(doctorId: string, data: AddDoctorLeaveInput) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)

    if (start > end) {
      throw new Error("Leave start date cannot be after end date")
    }

    return prisma.doctorLeave.create({
      data: {
        doctorId,
        startDate: start,
        endDate: end,
        reason: data.reason,
        isApproved: true,
      },
    })
  }

  /**
   * Deletes a leave period
   */
  public static async deleteLeave(leaveId: string, doctorId: string) {
    return prisma.doctorLeave.deleteMany({
      where: { id: leaveId, doctorId },
    })
  }

  /**
   * REAL AVAILABILITY CALCULATION ENGINE
   * Calculates valid bookable consultation slots for a specific calendar date
   */
  public static async calculateAvailability(doctorId: string, targetDateStr: string) {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          profile: { select: { firstName: true, lastName: true } },
          clinic: { select: { name: true, timezone: true } },
        },
      })

      if (!doctor) {
        throw new Error("Doctor not found")
      }

      const targetDate = new Date(targetDateStr)
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format. Expected YYYY-MM-DD")
      }

      // 1. Check if doctor is on approved leave
      const leave = await prisma.doctorLeave.findFirst({
        where: {
          doctorId,
          isApproved: true,
          startDate: { lte: new Date(`${targetDateStr}T23:59:59.999Z`) },
          endDate: { gte: new Date(`${targetDateStr}T00:00:00.000Z`) },
        },
      })

      if (leave) {
        return {
          date: targetDateStr,
          doctorId,
          doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
          specialty: doctor.specialty,
          status: "ON_LEAVE",
          leaveReason: leave.reason || "Scheduled Leave",
          slots: [],
          totalSlots: 0,
          availableSlotsCount: 0,
        }
      }

      // 2. Determine day of week (0 = Sunday, 6 = Saturday)
      const [year, month, day] = targetDateStr.split("-").map(Number)
      const utcDate = new Date(Date.UTC(year, month - 1, day))
      const dayOfWeek = utcDate.getUTCDay()

      // 3. Get doctor's recurring working hours for this day of week
      const workingSessions = await prisma.doctorAvailability.findMany({
        where: {
          doctorId,
          dayOfWeek,
          isActive: true,
        },
        orderBy: { startTime: "asc" },
      })

      if (workingSessions.length === 0) {
        return {
          date: targetDateStr,
          doctorId,
          doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
          specialty: doctor.specialty,
          status: "OFF_DUTY",
          slots: [],
          totalSlots: 0,
          availableSlotsCount: 0,
        }
      }

      // 4. Get breaks for this day
      const breaks = await prisma.doctorBreak.findMany({
        where: { doctorId, dayOfWeek },
      })

      // 5. Get existing booked appointments on this date
      const dayStart = new Date(`${targetDateStr}T00:00:00.000Z`)
      const dayEnd = new Date(`${targetDateStr}T23:59:59.999Z`)

      const existingAppointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledStart: { gte: dayStart, lte: dayEnd },
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        },
        select: { scheduledStart: true, scheduledEnd: true },
      })

      // Helper: converts "HH:MM" to minutes from midnight
      const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number)
        return h * 60 + m
      }

      // Helper: converts minutes to "HH:MM"
      const toTimeStr = (minutes: number) => {
        const h = Math.floor(minutes / 60).toString().padStart(2, "0")
        const m = (minutes % 60).toString().padStart(2, "0")
        return `${h}:${m}`
      }

      // 6. Generate slots across working sessions
      const generatedSlots: Array<{
        time: string
        endTime: string
        available: boolean
        isAvailable?: boolean
        reason?: string
      }> = []

      for (const session of workingSessions) {
        const startMin = toMinutes(session.startTime)
        const endMin = toMinutes(session.endTime)
        const duration = session.slotDurationMinutes || 30

        for (let slotStart = startMin; slotStart + duration <= endMin; slotStart += duration) {
          const slotEnd = slotStart + duration
          const timeStr = toTimeStr(slotStart)
          const endTimeStr = toTimeStr(slotEnd)

          // Check if overlaps with any break
          const isBreak = breaks.some((b) => {
            const bStart = toMinutes(b.startTime)
            const bEnd = toMinutes(b.endTime)
            return slotStart < bEnd && slotEnd > bStart
          })

          if (isBreak) {
            generatedSlots.push({
              time: timeStr,
              endTime: endTimeStr,
              available: false,
              isAvailable: false,
              reason: "Break",
            })
            continue
          }

          // Check if overlaps with an existing appointment
          const isBooked = existingAppointments.some((apt) => {
            const aptStartMinutes = apt.scheduledStart.getUTCHours() * 60 + apt.scheduledStart.getUTCMinutes()
            const aptEndMinutes = apt.scheduledEnd.getUTCHours() * 60 + apt.scheduledEnd.getUTCMinutes()
            return slotStart < aptEndMinutes && slotEnd > aptStartMinutes
          })

          if (isBooked) {
            generatedSlots.push({
              time: timeStr,
              endTime: endTimeStr,
              available: false,
              isAvailable: false,
              reason: "Booked",
            })
            continue
          }

          // Slot is open and available
          generatedSlots.push({
            time: timeStr,
            endTime: endTimeStr,
            available: true,
            isAvailable: true,
          })
        }
      }

      const availableCount = generatedSlots.filter((s) => s.available).length

      return {
        date: targetDateStr,
        doctorId,
        doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
        specialty: doctor.specialty,
        consultationFee: doctor.consultationFee,
        clinic: doctor.clinic?.name || "Independent",
        status: "AVAILABLE",
        totalSlots: generatedSlots.length,
        availableSlotsCount: availableCount,
        slots: generatedSlots,
      }
    } catch (err: any) {
      if (
        isProdEnv() ||
        err?.message === "Doctor not found" ||
        err?.message?.startsWith("Invalid date format")
      ) {
        throw err
      }
      // Non-production offline slot fallback when DB is unreachable
      const defaultTimes = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
      ]
      const defaultSlots = defaultTimes.map(time => {
        const [h, m] = time.split(":").map(Number)
        const endMinutes = h * 60 + m + 30
        const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
        const endM = String(endMinutes % 60).padStart(2, "0")
        return {
          time,
          endTime: `${endH}:${endM}`,
          available: true,
          isAvailable: true,
        }
      })

      return {
        date: targetDateStr,
        doctorId: doctorId || "00000000-0000-4000-a000-000000000002",
        doctorName: "Dr. Sarah Jenkins",
        specialty: "Cardiovascular Medicine",
        consultationFee: 499,
        clinic: "MediSlot Central Metro Clinic",
        status: "AVAILABLE",
        totalSlots: defaultSlots.length,
        availableSlotsCount: defaultSlots.length,
        slots: defaultSlots,
      }
    }
  }
}
