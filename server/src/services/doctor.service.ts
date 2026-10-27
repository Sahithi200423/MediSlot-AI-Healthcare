import { prisma } from "../config/db.js"
import { 
  OnboardDoctorInput, 
  UpdateDoctorInput, 
  ScheduleSlotInput, 
  AddDoctorBreakInput, 
  AddDoctorLeaveInput 
} from "../validators/doctor.validator.js"

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
          consultationFee: data.consultationFee || 50.00,
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
    const where: any = {}

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

    return prisma.doctor.findMany({
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
    // Using UTC day to avoid timezone drift
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
            reason: "Booked",
          })
          continue
        }

        // Slot is open and available
        generatedSlots.push({
          time: timeStr,
          endTime: endTimeStr,
          available: true,
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
  }
}
