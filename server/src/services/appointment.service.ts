import { prisma } from "../config/db.js"
import { 
  BookAppointmentInput, 
  RescheduleAppointmentInput, 
  CancelAppointmentInput, 
  UpdateAppointmentStatusInput 
} from "../validators/appointment.validator.js"
import { AppointmentStatus, Prisma } from "@prisma/client"

export class AppointmentService {
  /**
   * Generates a unique, human-readable booking reference.
   * e.g. MS-829104-E7X2
   */
  private static generateReference(): string {
    const timeSlice = Date.now().toString().slice(-6)
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MS-${timeSlice}-${randomHex}`
  }

  /**
   * Calculates scheduledStart and scheduledEnd Date objects from YYYY-MM-DD and HH:MM
   */
  private static parseSlotTimes(dateStr: string, timeStr: string, durationMinutes = 30): { start: Date; end: Date } {
    const [year, month, day] = dateStr.split("-").map(Number)
    const [hours, minutes] = timeStr.split(":").map(Number)

    // Construct UTC ISO timestamp
    const start = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

    return { start, end }
  }

  /**
   * Books an appointment with strict database-level concurrency protection against double booking.
   */
  public static async bookAppointment(profileId: string, data: BookAppointmentInput) {
    // 1. Ensure Patient record exists for this profile
    let patient = await prisma.patient.findUnique({
      where: { profileId },
      include: { profile: true },
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: { profileId },
        include: { profile: true },
      })
    }

    // 2. Fetch doctor details, consultation fee, and clinic affiliation
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { profile: true, clinic: true },
    })

    if (!doctor) {
      throw new Error("The specified doctor was not found")
    }

    if (!doctor.isAcceptingPatients) {
      throw new Error("This physician is not currently accepting new appointment bookings")
    }

    if (doctor.clinicId && doctor.clinicId !== data.clinicId) {
      throw new Error("The doctor is not affiliated with the selected clinic location")
    }

    // 3. Compute slot timestamps
    const { start: scheduledStart, end: scheduledEnd } = this.parseSlotTimes(data.date, data.time, 30)

    if (scheduledStart.getTime() < Date.now()) {
      throw new Error("Cannot book an appointment in the past")
    }

    // 4. Execute atomic booking inside a PostgreSQL transaction with concurrency protection
    try {
      const result = await prisma.$transaction(async (tx) => {
        // A. Validate Doctor Weekly Availability on this day of week
        const dayOfWeek = scheduledStart.getUTCDay()
        const availability = await tx.doctorAvailability.findFirst({
          where: {
            doctorId: data.doctorId,
            dayOfWeek,
            isActive: true,
          },
        })

        if (!availability) {
          throw new Error("Doctor is off duty on this day of the week")
        }

        // Validate time is within working hours
        if (data.time < availability.startTime || data.time >= availability.endTime) {
          throw new Error(`Appointment time ${data.time} is outside doctor working hours (${availability.startTime} - ${availability.endTime})`)
        }

        // B. Check for active doctor leaves on this date
        const leave = await tx.doctorLeave.findFirst({
          where: {
            doctorId: data.doctorId,
            isApproved: true,
            startDate: { lte: scheduledEnd },
            endDate: { gte: scheduledStart },
          },
        })

        if (leave) {
          throw new Error("Doctor is on scheduled leave during this date")
        }

        // C. Check for recurring breaks overlapping this time
        const breaks = await tx.doctorBreak.findMany({
          where: {
            doctorId: data.doctorId,
            dayOfWeek,
          },
        })

        for (const b of breaks) {
          if (data.time >= b.startTime && data.time < b.endTime) {
            throw new Error(`The selected slot falls within the doctor's ${b.title || "scheduled break"}`)
          }
        }

        // D. Re-validate overlapping active appointments inside transaction
        const existingOverlap = await tx.appointment.findFirst({
          where: {
            doctorId: data.doctorId,
            status: { not: "CANCELLED" },
            scheduledStart: { lt: scheduledEnd },
            scheduledEnd: { gt: scheduledStart },
          },
        })

        if (existingOverlap) {
          throw new Error("This appointment slot has just been reserved by another patient. Please select another time slot.")
        }

        // E. Generate unique booking reference
        let bookingReference = this.generateReference()
        let isRefUnique = false
        let attempts = 0
        while (!isRefUnique && attempts < 5) {
          const clash = await tx.appointment.findUnique({ where: { bookingReference } })
          if (!clash) {
            isRefUnique = true
          } else {
            bookingReference = this.generateReference()
            attempts++
          }
        }

        // F. Determine initial status and payment status based on chosen payment method
        const isPayAtClinic = data.paymentMethod === "PAY_AT_CLINIC"
        const initialStatus: AppointmentStatus = isPayAtClinic ? "CONFIRMED" : "PENDING"
        const paymentStatus = isPayAtClinic ? "PAY_AT_CLINIC" : "PENDING"

        // G. Create Appointment Record
        const appointment = await tx.appointment.create({
          data: {
            bookingReference,
            patientId: patient.id,
            doctorId: data.doctorId,
            clinicId: data.clinicId,
            scheduledStart,
            scheduledEnd,
            status: initialStatus,
            visitType: data.visitType,
            consultationFee: doctor.consultationFee,
            paymentStatus,
            paymentMethod: data.paymentMethod,
            reasonForVisit: data.reasonForVisit,
          },
          include: {
            doctor: {
              include: {
                profile: {
                  select: { firstName: true, lastName: true, email: true, phone: true },
                },
              },
            },
            clinic: {
              select: { id: true, name: true, address: true, city: true, state: true, phone: true },
            },
            patient: {
              include: {
                profile: {
                  select: { firstName: true, lastName: true, email: true, phone: true },
                },
              },
            },
          },
        })

        return appointment
      }, { maxWait: 10000, timeout: 30000 })

      // Dispatch notifications after transaction commits
      const dateFormatted = scheduledStart.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      const timeFormatted = data.time

      try {
        await prisma.notification.createMany({
          data: [
            {
              profileId,
              title: "Appointment Confirmed",
              message: `Your ${data.visitType === "VIDEO_VISIT" ? "video" : "in-clinic"} consultation with Dr. ${doctor.profile.firstName} ${doctor.profile.lastName} is confirmed for ${dateFormatted} at ${timeFormatted}. Reference: ${result.bookingReference}.`,
              type: "APPOINTMENT_BOOKED",
            },
            {
              profileId: doctor.profileId,
              title: "New Appointment Booked",
              message: `Patient ${patient.profile.firstName} ${patient.profile.lastName} booked a consultation on ${dateFormatted} at ${timeFormatted}. Clinical details are available in the provider portal.`,
              type: "APPOINTMENT_BOOKED",
            },
          ],
        })
      } catch (notifErr) {
        console.warn("Notice: notification creation non-fatal error:", notifErr)
      }

      return result
    } catch (err: any) {
      // PostgreSQL Unique Index Constraint Violation (P2002) for race conditions
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new Error("This appointment slot has just been reserved by another patient. Please select an alternate time slot.")
      }
      throw err
    }
  }

  /**
   * Retrieves all appointments for the currently authenticated patient
   */
  public static async getPatientAppointments(profileId: string, filter?: "upcoming" | "past" | "all") {
    const patient = await prisma.patient.findUnique({ where: { profileId } })
    if (!patient) return []

    const now = new Date()
    const where: Prisma.AppointmentWhereInput = { patientId: patient.id }

    if (filter === "upcoming") {
      where.scheduledStart = { gte: now }
      where.status = { in: ["PENDING", "CONFIRMED"] }
    } else if (filter === "past") {
      where.OR = [
        { scheduledStart: { lt: now } },
        { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
      ]
    }

    return prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
            },
          },
        },
        clinic: {
          select: { id: true, name: true, address: true, city: true, state: true, phone: true },
        },
      },
      orderBy: { scheduledStart: filter === "past" ? "desc" : "asc" },
    })
  }

  /**
   * Retrieves appointments for a doctor
   */
  public static async getDoctorAppointments(
    doctorId: string,
    filters: { date?: string; startDate?: string; endDate?: string; status?: AppointmentStatus }
  ) {
    const where: Prisma.AppointmentWhereInput = { doctorId }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.date) {
      const [year, month, day] = filters.date.split("-").map(Number)
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
      where.scheduledStart = { gte: dayStart, lte: dayEnd }
    } else if (filters.startDate && filters.endDate) {
      where.scheduledStart = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      }
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
            },
          },
        },
        clinic: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    })
  }

  /**
   * Retrieves appointments for a clinic (with tenant isolation check)
   */
  public static async getClinicAppointments(
    clinicId: string,
    profileId: string,
    userRole: string,
    filters: { doctorId?: string; status?: AppointmentStatus; date?: string }
  ) {
    // Tenant Isolation Check: verify user is member of this clinic or PLATFORM_ADMIN
    if (userRole !== "PLATFORM_ADMIN") {
      const membership = await prisma.clinicMembership.findUnique({
        where: { clinicId_profileId: { clinicId, profileId } },
      })
      if (!membership) {
        throw new Error("Forbidden: You do not have permission to view appointments for this clinic")
      }
    }

    const where: Prisma.AppointmentWhereInput = { clinicId }

    if (filters.doctorId) {
      where.doctorId = filters.doctorId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.date) {
      const [year, month, day] = filters.date.split("-").map(Number)
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
      where.scheduledStart = { gte: dayStart, lte: dayEnd }
    }

    return prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        patient: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    })
  }

  /**
   * Retrieves a single appointment with access control
   */
  public static async getAppointmentById(appointmentId: string, profileId: string, userRole: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        patient: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        clinic: true,
      },
    })

    if (!appointment) {
      throw new Error("Appointment not found")
    }

    // Access control: Patient who booked, Doctor assigned, Clinic staff, or Platform Admin
    const isPatient = appointment.patient.profileId === profileId
    const isDoctor = appointment.doctor.profileId === profileId
    let isClinicStaff = false

    if (!isPatient && !isDoctor && userRole !== "PLATFORM_ADMIN") {
      const membership = await prisma.clinicMembership.findUnique({
        where: { clinicId_profileId: { clinicId: appointment.clinicId, profileId } },
      })
      isClinicStaff = Boolean(membership)
    }

    if (!isPatient && !isDoctor && !isClinicStaff && userRole !== "PLATFORM_ADMIN") {
      throw new Error("Forbidden: You do not have access to view this appointment")
    }

    return appointment
  }

  /**
   * Cancels an appointment with status validation and notifications
   */
  public static async cancelAppointment(
    appointmentId: string,
    profileId: string,
    userRole: string,
    data: CancelAppointmentInput
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { profile: true } },
        patient: { include: { profile: true } },
      },
    })

    if (!appointment) {
      throw new Error("Appointment not found")
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("This appointment is already cancelled")
    }

    if (appointment.status === "COMPLETED") {
      throw new Error("Cannot cancel an appointment that has already been completed")
    }

    // Authorization check
    const isPatient = appointment.patient.profileId === profileId
    const isDoctor = appointment.doctor.profileId === profileId
    let isClinicStaff = false

    if (!isPatient && !isDoctor && userRole !== "PLATFORM_ADMIN") {
      const membership = await prisma.clinicMembership.findUnique({
        where: { clinicId_profileId: { clinicId: appointment.clinicId, profileId } },
      })
      isClinicStaff = Boolean(membership)
    }

    if (!isPatient && !isDoctor && !isClinicStaff && userRole !== "PLATFORM_ADMIN") {
      throw new Error("Forbidden: You are not authorized to cancel this appointment")
    }

    // Update appointment in transaction and issue notifications
    return prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CANCELLED",
          cancellationReason: data.cancellationReason,
          paymentStatus: appointment.paymentStatus === "PAID" ? "REFUND_PENDING" : appointment.paymentStatus,
        },
      })

      const dateStr = appointment.scheduledStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      // Notify the other party
      if (isPatient) {
        // Notify doctor that patient cancelled
        await tx.notification.create({
          data: {
            profileId: appointment.doctor.profileId,
            title: "Appointment Cancelled by Patient",
            message: `Patient ${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName} cancelled consultation on ${dateStr}. Reason: ${data.cancellationReason}`,
            type: "APPOINTMENT_CANCELLED",
          },
        })
      } else {
        // Notify patient that doctor/clinic cancelled
        await tx.notification.create({
          data: {
            profileId: appointment.patient.profileId,
            title: "Appointment Cancelled by Clinic",
            message: `Your appointment with Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName} on ${dateStr} was cancelled. Reason: ${data.cancellationReason}`,
            type: "APPOINTMENT_CANCELLED",
          },
        })
      }

      return updated
    }, { maxWait: 10000, timeout: 30000 })
  }

  /**
   * Reschedules an appointment to a new date/time with concurrency check
   */
  public static async rescheduleAppointment(
    appointmentId: string,
    profileId: string,
    userRole: string,
    data: RescheduleAppointmentInput
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { profile: true } },
        patient: { include: { profile: true } },
      },
    })

    if (!appointment) {
      throw new Error("Appointment not found")
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      throw new Error(`Cannot reschedule an appointment that is ${appointment.status.toLowerCase()}`)
    }

    // Authorization check
    const isPatient = appointment.patient.profileId === profileId
    const isDoctor = appointment.doctor.profileId === profileId
    let isClinicStaff = false

    if (!isPatient && !isDoctor && userRole !== "PLATFORM_ADMIN") {
      const membership = await prisma.clinicMembership.findUnique({
        where: { clinicId_profileId: { clinicId: appointment.clinicId, profileId } },
      })
      isClinicStaff = Boolean(membership)
    }

    if (!isPatient && !isDoctor && !isClinicStaff && userRole !== "PLATFORM_ADMIN") {
      throw new Error("Forbidden: You are not authorized to reschedule this appointment")
    }

    // Calculate new start and end times
    const { start: newStart, end: newEnd } = this.parseSlotTimes(data.date, data.time, 30)

    if (newStart.getTime() < Date.now()) {
      throw new Error("Cannot reschedule an appointment to a past time")
    }

    // Atomic reschedule transaction
    return prisma.$transaction(async (tx) => {
      // 1. Verify doctor availability on new day of week
      const dayOfWeek = newStart.getUTCDay()
      const availability = await tx.doctorAvailability.findFirst({
        where: {
          doctorId: appointment.doctorId,
          dayOfWeek,
          isActive: true,
        },
      })

      if (!availability) {
        throw new Error("Doctor is not available on this day of the week")
      }

      if (data.time < availability.startTime || data.time >= availability.endTime) {
        throw new Error(`New time ${data.time} is outside working hours`)
      }

      // 2. Check doctor leaves
      const leave = await tx.doctorLeave.findFirst({
        where: {
          doctorId: appointment.doctorId,
          isApproved: true,
          startDate: { lte: newEnd },
          endDate: { gte: newStart },
        },
      })

      if (leave) {
        throw new Error("Doctor is on scheduled leave during the requested new date")
      }

      // 3. Check doctor breaks
      const breaks = await tx.doctorBreak.findMany({
        where: { doctorId: appointment.doctorId, dayOfWeek },
      })
      for (const b of breaks) {
        if (data.time >= b.startTime && data.time < b.endTime) {
          throw new Error(`Requested time falls within doctor's break (${b.title})`)
        }
      }

      // 4. Check for overlapping appointment (excluding the current one)
      const conflict = await tx.appointment.findFirst({
        where: {
          id: { not: appointmentId },
          doctorId: appointment.doctorId,
          status: { not: "CANCELLED" },
          scheduledStart: { lt: newEnd },
          scheduledEnd: { gt: newStart },
        },
      })

      if (conflict) {
        throw new Error("The requested new slot is already booked. Please choose another time.")
      }

      // 5. Update appointment
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledStart: newStart,
          scheduledEnd: newEnd,
          status: "CONFIRMED",
        },
      })

      const newDateFormatted = newStart.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })

      // 6. Notify patient and doctor
      await tx.notification.create({
        data: {
          profileId: appointment.patient.profileId,
          title: "Appointment Rescheduled",
          message: `Your appointment with Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName} has been rescheduled to ${newDateFormatted} at ${data.time}.`,
          type: "APPOINTMENT_RESCHEDULED",
        },
      })

      await tx.notification.create({
        data: {
          profileId: appointment.doctor.profileId,
          title: "Consultation Rescheduled",
          message: `Consultation with ${appointment.patient.profile.firstName} ${appointment.patient.profile.lastName} was moved to ${newDateFormatted} at ${data.time}.`,
          type: "APPOINTMENT_RESCHEDULED",
        },
      })

      return updated
    }, { maxWait: 10000, timeout: 30000 })
  }

  /**
   * Updates appointment status with validated lifecycle transitions.
   * Allowed transitions:
   * PENDING -> CONFIRMED
   * CONFIRMED -> IN_PROGRESS (check-in)
   * IN_PROGRESS -> COMPLETED
   * CONFIRMED -> NO_SHOW
   * Any -> CANCELLED
   */
  public static async updateStatus(
    appointmentId: string,
    profileId: string,
    userRole: string,
    data: UpdateAppointmentStatusInput
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { profile: true } },
        patient: { include: { profile: true } },
      },
    })

    if (!appointment) {
      throw new Error("Appointment not found")
    }

    // Only doctor, clinic staff, or platform admin can update clinical status
    const isDoctor = appointment.doctor.profileId === profileId
    let isClinicStaff = false

    if (!isDoctor && userRole !== "PLATFORM_ADMIN") {
      const membership = await prisma.clinicMembership.findUnique({
        where: { clinicId_profileId: { clinicId: appointment.clinicId, profileId } },
      })
      isClinicStaff = Boolean(membership)
    }

    if (!isDoctor && !isClinicStaff && userRole !== "PLATFORM_ADMIN") {
      throw new Error("Forbidden: Only attending physicians and clinic staff can update appointment status")
    }

    const currentStatus = appointment.status
    const targetStatus = data.status as AppointmentStatus

    // Valid state transitions
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["CHECKED_IN", "IN_PROGRESS", "IN_CONSULTATION", "NO_SHOW", "CANCELLED"],
      CHECKED_IN: ["IN_CONSULTATION", "IN_PROGRESS", "NO_SHOW", "CANCELLED"],
      IN_CONSULTATION: ["COMPLETED", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    }

    if (!validTransitions[currentStatus].includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}`)
    }

    const updateData: Prisma.AppointmentUpdateInput = { status: targetStatus }

    if ((targetStatus === "CHECKED_IN" || targetStatus === "IN_PROGRESS") && !appointment.checkInTime) {
      updateData.checkInTime = new Date()
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: updateData,
      })

      // Send status update notification to patient
      if (targetStatus === "IN_PROGRESS") {
        await tx.notification.create({
          data: {
            profileId: appointment.patient.profileId,
            title: "Consultation In Progress",
            message: `Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName} has checked you in for your consultation.`,
            type: "SCHEDULE_CHANGE",
          },
        })
      } else if (targetStatus === "COMPLETED") {
        await tx.notification.create({
          data: {
            profileId: appointment.patient.profileId,
            title: "Consultation Completed",
            message: `Your consultation with Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName} has ended. Consultation notes are available in your portal.`,
            type: "APPOINTMENT_REMINDER",
          },
        })
      }

      return updated
    }, { maxWait: 10000, timeout: 30000 })
  }

  /**
   * Retrieves notifications for authenticated user
   */
  public static async getNotifications(profileId: string) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { profileId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { profileId, isRead: false },
      }),
    ])

    return { notifications, unreadCount }
  }

  /**
   * Marks a notification as read
   */
  public static async markNotificationRead(notificationId: string, profileId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, profileId },
      data: { isRead: true },
    })
  }
}
