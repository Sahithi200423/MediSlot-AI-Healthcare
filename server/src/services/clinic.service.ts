import crypto from "crypto"
import { prisma } from "../config/db.js"
import { CreateClinicInput, UpdateClinicInput, InviteStaffInput } from "../validators/clinic.validator.js"

export class ClinicService {
  /**
   * Creates a new clinic profile and assigns creator as OWNER / CLINIC_ADMIN
   */
  public static async createClinic(data: CreateClinicInput, creatorProfileId: string) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    
    // Check slug collision
    const existing = await prisma.clinic.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug

    // Create clinic and membership in transaction
    const clinic = await prisma.$transaction(async (tx) => {
      const createdClinic = await tx.clinic.create({
        data: {
          name: data.name,
          slug: finalSlug,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          operatingHours: data.operatingHours || "08:00 - 20:00",
          timezone: data.timezone || "UTC",
          isVerified: false, // Default to unverified until approved
        },
      })

      // Link creator as OWNER
      await tx.clinicMembership.create({
        data: {
          clinicId: createdClinic.id,
          profileId: creatorProfileId,
          clinicRole: "OWNER",
        },
      })

      // Update creator's profile role to CLINIC_ADMIN if currently PATIENT
      await tx.profile.update({
        where: { id: creatorProfileId },
        data: { role: "CLINIC_ADMIN" },
      })

      return createdClinic
    })

    return clinic
  }

  /**
   * Retrieves all verified clinics, or all clinics if query contains includeAll=true
   */
  public static async getClinics(includeAll = false) {
    return prisma.clinic.findMany({
      where: includeAll ? {} : { isVerified: true },
      include: {
        _count: {
          select: { doctors: true, appointments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Retrieves clinic by ID with its doctors and staff
   */
  public static async getClinicById(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctors: {
          include: {
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true, email: true },
            },
          },
        },
        clinicMemberships: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
      },
    })

    if (!clinic) {
      throw new Error("Clinic not found")
    }

    return clinic
  }

  /**
   * Updates clinic details
   */
  public static async updateClinic(clinicId: string, data: UpdateClinicInput) {
    return prisma.clinic.update({
      where: { id: clinicId },
      data,
    })
  }

  /**
   * Gets staff roster for a clinic
   */
  public static async getClinicStaff(clinicId: string) {
    const [doctors, memberships, invitations] = await Promise.all([
      prisma.doctor.findMany({
        where: { clinicId },
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
          },
        },
      }),
      prisma.clinicMembership.findMany({
        where: { clinicId },
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
      prisma.clinicInvitation.findMany({
        where: { clinicId, status: "PENDING" },
      }),
    ])

    return { doctors, memberships, invitations }
  }

  /**
   * Creates a secure invitation for a doctor or staff member
   */
  public static async inviteStaff(clinicId: string, data: InviteStaffInput) {
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry

    return prisma.clinicInvitation.create({
      data: {
        clinicId,
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        expiresAt,
        status: "PENDING",
      },
    })
  }

  /**
   * Accepts invitation by token and grants clinic membership / doctor association
   */
  public static async acceptInvitation(token: string, profileId: string) {
    const invite = await prisma.clinicInvitation.findUnique({
      where: { token },
      include: { clinic: true },
    })

    if (!invite) {
      throw new Error("Invalid invitation token")
    }

    if (invite.status !== "PENDING") {
      throw new Error(`Invitation has already been ${invite.status.toLowerCase()}`)
    }

    if (new Date() > invite.expiresAt) {
      await prisma.clinicInvitation.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      })
      throw new Error("Invitation has expired")
    }

    return prisma.$transaction(async (tx) => {
      // Mark invitation accepted
      await tx.clinicInvitation.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      })

      // Add clinic membership
      const membership = await tx.clinicMembership.upsert({
        where: {
          clinicId_profileId: {
            clinicId: invite.clinicId,
            profileId,
          },
        },
        create: {
          clinicId: invite.clinicId,
          profileId,
          clinicRole: invite.role === "CLINIC_ADMIN" ? "MANAGER" : "RECEPTIONIST",
        },
        update: {},
      })

      // Update user role to DOCTOR or CLINIC_ADMIN
      await tx.profile.update({
        where: { id: profileId },
        data: { role: invite.role },
      })

      return {
        success: true,
        clinic: invite.clinic,
        membership,
        assignedRole: invite.role,
      }
    })
  }

  /**
   * Removes staff or doctor from clinic
   */
  public static async removeStaff(clinicId: string, profileId: string) {
    return prisma.$transaction(async (tx) => {
      // Unlink doctor from clinic if doctor
      await tx.doctor.updateMany({
        where: { profileId, clinicId },
        data: { clinicId: null },
      })

      // Delete clinic membership
      await tx.clinicMembership.deleteMany({
        where: { clinicId, profileId },
      })

      return { success: true }
    })
  }
}
