import { PrismaClient, MedicalRecordCategory, ScanStatus } from "@prisma/client"
import crypto from "crypto"
import { getSupabaseAdmin } from "../config/supabase.js"
import { UploadRecordMetadataInput, GrantDoctorAccessInput } from "../validators/medical.validator.js"

const prisma = new PrismaClient()
const STORAGE_BUCKET = "medical-records"
const SIGNED_URL_EXPIRES_IN = 300 // 5 minutes

export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
}

export class MedicalRecordService {
  /**
   * Validates file magic bytes to prevent content-type spoofing
   */
  public static validateFileMagicBytes(buffer: Buffer, declaredMime: string): { isValid: boolean; detectedMime: string } {
    if (!buffer || buffer.length < 4) {
      return { isValid: false, detectedMime: "unknown" }
    }

    // PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return { isValid: declaredMime === "application/pdf", detectedMime: "application/pdf" }
    }

    // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    ) {
      return { isValid: declaredMime === "image/png", detectedMime: "image/png" }
    }

    // JPEG magic bytes: 0xFF, 0xD8, 0xFF
    if (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { isValid: declaredMime === "image/jpeg" || declaredMime === "image/jpg", detectedMime: "image/jpeg" }
    }

    // WebP magic bytes: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return { isValid: declaredMime === "image/webp", detectedMime: "image/webp" }
    }

    return { isValid: false, detectedMime: "unknown" }
  }

  /**
   * Scans file buffer for executable headers or script injection
   */
  public static scanFileBuffer(buffer: Buffer): ScanStatus {
    // Check for DOS / PE executable header (MZ)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return ScanStatus.QUARANTINED
    }

    // Check for ELF executable header (0x7F, 'E', 'L', 'F')
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      return ScanStatus.QUARANTINED
    }

    // Check for suspicious HTML/JS embedded payload in non-executable files
    const sample = buffer.subarray(0, Math.min(buffer.length, 2048)).toString("utf-8", 0, Math.min(buffer.length, 2048)).toLowerCase()
    if (sample.includes("<script") || sample.includes("javascript:") || sample.includes("eval(")) {
      return ScanStatus.QUARANTINED
    }

    return ScanStatus.CLEAN
  }

  /**
   * Uploads medical record to private Supabase Storage and records metadata in database
   */
  public static async uploadRecord(
    uploaderProfileId: string,
    file: UploadedFile,
    metadata: UploadRecordMetadataInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error("Supabase Storage is not configured")
    }

    // 1. Resolve Patient
    let patientId = metadata.patientId
    if (!patientId) {
      const patient = await prisma.patient.findUnique({
        where: { profileId: uploaderProfileId },
      })
      if (!patient) {
        throw new Error("Patient profile not found. Please complete your patient profile before uploading records.")
      }
      patientId = patient.id
    } else {
      // If specifying patientId, check permissions (must be patient owner, treating doctor, or admin)
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      })
      if (!patient) throw new Error("Specified patient does not exist")

      if (patient.profileId !== uploaderProfileId) {
        const uploaderProfile = await prisma.profile.findUnique({ where: { id: uploaderProfileId } })
        if (uploaderProfile?.role !== "PLATFORM_ADMIN") {
          // Check if doctor has active access
          const doctor = await prisma.doctor.findUnique({ where: { profileId: uploaderProfileId } })
          if (!doctor) {
            throw new Error("Unauthorized to upload documents for this patient")
          }
          const hasAccess = await this.canDoctorAccessPatientRecords(doctor.id, patientId)
          if (!hasAccess) {
            throw new Error("You do not have authorization to upload documents for this patient")
          }
        }
      }
    }

    // 2. Validate File Size (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new Error("File exceeds maximum allowed size of 15 MB")
    }

    // 3. Validate Magic Bytes
    const { isValid, detectedMime } = this.validateFileMagicBytes(file.buffer, file.mimetype)
    if (!isValid) {
      throw new Error(`File content validation failed. Expected ${file.mimetype}, detected ${detectedMime}. Only authentic PDF, PNG, JPEG, and WebP files are accepted.`)
    }

    // 4. Malware & Executable Scan
    const scanStatus = this.scanFileBuffer(file.buffer)
    if (scanStatus === ScanStatus.QUARANTINED) {
      throw new Error("File rejected: Security scan detected untrusted or executable payload")
    }

    // 5. Store File in Private Supabase Storage Bucket
    const fileExt = file.originalname.split(".").pop()?.toLowerCase() || "bin"
    const uniqueId = crypto.randomUUID()
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `patients/${patientId}/${uniqueId}_${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 6. Save Record Metadata in Database
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        uploadedByProfileId: uploaderProfileId,
        title: metadata.title,
        description: metadata.description || null,
        category: (metadata.category as MedicalRecordCategory) || MedicalRecordCategory.OTHER,
        fileName: file.originalname,
        storagePath,
        fileType: file.mimetype,
        fileSize: file.size,
        scanStatus,
      },
    })

    // 7. Audit Log Entry
    try {
      await prisma.auditLog.create({
        data: {
          profileId: uploaderProfileId,
          action: "MEDICAL_RECORD_UPLOADED",
          resourceTable: "medical_records",
          resourceId: record.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (auditErr) {
      console.warn("Audit log creation warning:", auditErr)
    }

    return record
  }

  /**
   * Retrieves medical records for a patient with authorization check
   */
  public static async getPatientRecords(patientId: string, viewerProfileId: string, category?: string) {
    await this.verifyViewerAccessToPatient(patientId, viewerProfileId)

    const where: any = {
      patientId,
      isArchived: false,
    }

    if (category && Object.values(MedicalRecordCategory).includes(category as MedicalRecordCategory)) {
      where.category = category as MedicalRecordCategory
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedByProfile: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    })

    return records
  }

  /**
   * Generates a short-lived authenticated signed URL to preview or download a medical record
   */
  public static async getSignedDownloadUrl(
    recordId: string,
    viewerProfileId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: true },
    })

    if (!record || record.isArchived) {
      throw new Error("Medical record not found or has been removed")
    }

    // Verify authorization
    await this.verifyViewerAccessToPatient(record.patientId, viewerProfileId)

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error("Supabase Storage is not configured")
    }

    // Generate short-lived signed URL (300 seconds = 5 minutes)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(record.storagePath, SIGNED_URL_EXPIRES_IN)

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate secure access URL: ${error?.message || "Unknown error"}`)
    }

    // Log access in Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          profileId: viewerProfileId,
          action: "MEDICAL_RECORD_ACCESSED",
          resourceTable: "medical_records",
          resourceId: record.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log warning on record access:", err)
    }

    return {
      signedUrl: data.signedUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      fileName: record.fileName,
      fileType: record.fileType,
      title: record.title,
    }
  }

  /**
   * Deletes a medical record (marks archived & removes from Supabase Storage)
   */
  public static async deleteRecord(
    recordId: string,
    deleterProfileId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: true },
    })

    if (!record) {
      throw new Error("Medical record not found")
    }

    // Only patient owner or PLATFORM_ADMIN can delete records
    const profile = await prisma.profile.findUnique({ where: { id: deleterProfileId } })
    const isOwner = record.patient.profileId === deleterProfileId
    const isAdmin = profile?.role === "PLATFORM_ADMIN"

    if (!isOwner && !isAdmin) {
      throw new Error("Forbidden: You are not authorized to delete this medical record")
    }

    const supabase = getSupabaseAdmin()
    if (supabase) {
      // Delete from Supabase Storage
      await supabase.storage.from(STORAGE_BUCKET).remove([record.storagePath])
    }

    // Delete record from DB
    await prisma.medicalRecord.delete({
      where: { id: recordId },
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          profileId: deleterProfileId,
          action: "MEDICAL_RECORD_DELETED",
          resourceTable: "medical_records",
          resourceId: recordId,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log warning on record deletion:", err)
    }

    return { success: true, message: "Medical record deleted permanently" }
  }

  /**
   * Patient grants treating doctor access to view their medical records
   */
  public static async grantDoctorAccess(
    patientProfileId: string,
    data: GrantDoctorAccessInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findUnique({ where: { profileId: patientProfileId } })
    if (!patient) throw new Error("Patient profile not found")

    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { profile: true },
    })
    if (!doctor) throw new Error("Doctor not found")

    let expiresAt: Date | null = null
    if (data.expiresInDays) {
      expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    }

    const access = await prisma.doctorRecordAccess.upsert({
      where: {
        patientId_doctorId: {
          patientId: patient.id,
          doctorId: data.doctorId,
        },
      },
      update: {
        isRevoked: false,
        revokedAt: null,
        expiresAt,
        grantedByProfileId: patientProfileId,
      },
      create: {
        patientId: patient.id,
        doctorId: data.doctorId,
        grantedByProfileId: patientProfileId,
        expiresAt,
        isRevoked: false,
      },
      include: {
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    // Log grant
    try {
      await prisma.auditLog.create({
        data: {
          profileId: patientProfileId,
          action: "DOCTOR_RECORD_ACCESS_GRANTED",
          resourceTable: "doctor_record_access",
          resourceId: access.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log grant warning:", err)
    }

    return access
  }

  /**
   * Patient revokes doctor access to their medical records
   */
  public static async revokeDoctorAccess(
    patientProfileId: string,
    doctorId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findUnique({ where: { profileId: patientProfileId } })
    if (!patient) throw new Error("Patient profile not found")

    const access = await prisma.doctorRecordAccess.update({
      where: {
        patientId_doctorId: {
          patientId: patient.id,
          doctorId,
        },
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
      include: {
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    // Log revocation
    try {
      await prisma.auditLog.create({
        data: {
          profileId: patientProfileId,
          action: "DOCTOR_RECORD_ACCESS_REVOKED",
          resourceTable: "doctor_record_access",
          resourceId: access.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      })
    } catch (err) {
      console.warn("Audit log revoke warning:", err)
    }

    return access
  }

  /**
   * Gets list of doctors with active or historical access to this patient's records
   */
  public static async getPatientDoctorAccessList(patientProfileId: string) {
    const patient = await prisma.patient.findUnique({ where: { profileId: patientProfileId } })
    if (!patient) return []

    return prisma.doctorRecordAccess.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: {
            profile: { select: { firstName: true, lastName: true, email: true } },
            clinic: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Checks if a doctor has valid access to a patient's records
   */
  public static async canDoctorAccessPatientRecords(doctorId: string, patientId: string): Promise<boolean> {
    // 1. Check explicit grant
    const grant = await prisma.doctorRecordAccess.findUnique({
      where: {
        patientId_doctorId: {
          patientId,
          doctorId,
        },
      },
    })

    if (grant && !grant.isRevoked) {
      if (!grant.expiresAt || grant.expiresAt.getTime() > Date.now()) {
        return true
      }
    }

    // 2. Check active or past appointments between this doctor and patient
    const appointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        patientId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "IN_CONSULTATION", "COMPLETED"] },
      },
    })

    return Boolean(appointment)
  }

  /**
   * Verifies that the viewer profile has legitimate access to the patient's records
   */
  private static async verifyViewerAccessToPatient(patientId: string, viewerProfileId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    })
    if (!patient) {
      throw new Error("Patient not found")
    }

    // A. Patient is viewing their own records
    if (patient.profileId === viewerProfileId) {
      return true
    }

    // B. Platform Admin
    const viewerProfile = await prisma.profile.findUnique({ where: { id: viewerProfileId } })
    if (viewerProfile?.role === "PLATFORM_ADMIN") {
      return true
    }

    // C. Treating Doctor with valid authorization
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: viewerProfileId },
    })

    if (doctor) {
      const hasAccess = await this.canDoctorAccessPatientRecords(doctor.id, patientId)
      if (hasAccess) return true
    }

    throw new Error("Forbidden: You do not have authorization to view this patient's medical records")
  }
}
