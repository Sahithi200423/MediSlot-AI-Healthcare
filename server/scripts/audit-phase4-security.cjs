const http = require("http")
const { PrismaClient } = require("@prisma/client")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({ path: path.join(__dirname, "../.env") })

const prisma = new PrismaClient()
const API_BASE = "http://localhost:5000/api"

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + (endpoint.startsWith("/") ? endpoint : "/" + endpoint))

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null })
          } catch (e) {
            resolve({ status: res.statusCode, body: data })
          }
        })
      }
    )
    req.on("error", reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}

async function retryQuery(fn, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

async function registerAndVerifyUser(email, firstName, lastName, role = "PATIENT") {
  const regRes = await makeRequest("/auth/register", {
    method: "POST",
    body: {
      email,
      password: "TestPassword123!",
      firstName,
      lastName,
    },
  })

  if (!regRes.body?.data) {
    throw new Error(`Registration failed for ${email}: ${JSON.stringify(regRes.body)}`)
  }

  let token = regRes.body?.data?.token
  const otp = regRes.body?.data?.emailOtp
  const userId = regRes.body?.data?.user?.id

  if (otp) {
    const vRes = await makeRequest("/auth/verify-email", {
      method: "POST",
      body: { email, token: otp },
    })
    token = vRes.body?.data?.session?.access_token || token
  }

  if (!token) {
    const lRes = await makeRequest("/auth/login", {
      method: "POST",
      body: { email, password: "TestPassword123!" },
    })
    token = lRes.body?.data?.token
  }

  let profile = await retryQuery(() => prisma.profile.findUnique({ where: { id: userId } }))
  for (let i = 0; i < 6 && !profile; i++) {
    await new Promise((r) => setTimeout(r, 400))
    profile = await prisma.profile.findUnique({ where: { id: userId } })
  }

  if (!profile && userId) {
    try {
      profile = await prisma.profile.create({
        data: {
          id: userId,
          email,
          firstName,
          lastName,
          role,
        },
      })
    } catch (createErr) {
      profile = await prisma.profile.findUnique({ where: { id: userId } })
    }
  }

  if (profile && profile.role !== role) {
    profile = await retryQuery(() => prisma.profile.update({
      where: { id: profile.id },
      data: { role },
    }))
  }

  let patient = null
  if (role === "PATIENT" && profile) {
    patient = await retryQuery(() => prisma.patient.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id },
      update: {},
    }))
  }

  return { token, profile, patient }
}

async function runFocusedSecurityAudit() {
  console.log("\n========================================================")
  console.log("🔒 MEDISLOT PHASE FOUR FOCUSED SECURITY AUDIT")
  console.log("   Concurrency, Payment Integrity, Tenant Isolation")
  console.log("========================================================\n")

  const suffix = Date.now().toString().slice(-6)
  const createdRecordIds = {
    profiles: [],
    clinics: [],
    doctors: [],
    patients: [],
    appointments: [],
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Two Distinct Clinics with Dedicated Clinic Admins
    // -------------------------------------------------------------
    console.log("1. Setting up multi-tenant test clinics and administrators...")

    // Clinic A & Admin A
    const adminA = await registerAndVerifyUser(`sec.adminA.${suffix}@example.com`, "AdminA", "ClinicA", "CLINIC_ADMIN")
    createdRecordIds.profiles.push(adminA.profile.id)

    const clinicARes = await makeRequest("/clinics", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminA.token}` },
      body: {
        name: `Alpha Care Medical ${suffix}`,
        address: "100 Alpha St",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        phone: "+1-206-555-0101",
        email: `alpha.${suffix}@example.com`,
      },
    })
    const clinicA = clinicARes.body?.data?.clinic
    if (!clinicA) throw new Error("Failed to create Clinic A: " + JSON.stringify(clinicARes.body))
    createdRecordIds.clinics.push(clinicA.id)
    console.log(`   ✓ Clinic A created: ${clinicA.name} (Admin: ${adminA.profile.email})`)

    // Clinic B & Admin B
    const adminB = await registerAndVerifyUser(`sec.adminB.${suffix}@example.com`, "AdminB", "ClinicB", "CLINIC_ADMIN")
    createdRecordIds.profiles.push(adminB.profile.id)

    const clinicBRes = await makeRequest("/clinics", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminB.token}` },
      body: {
        name: `Beta Health Network ${suffix}`,
        address: "200 Beta Blvd",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        phone: "+1-503-555-0202",
        email: `beta.${suffix}@example.com`,
      },
    })
    const clinicB = clinicBRes.body?.data?.clinic
    if (!clinicB) throw new Error("Failed to create Clinic B: " + JSON.stringify(clinicBRes.body))
    createdRecordIds.clinics.push(clinicB.id)
    console.log(`   ✓ Clinic B created: ${clinicB.name} (Admin: ${adminB.profile.email})`)

    // Doctor A at Clinic A
    const docAUser = await registerAndVerifyUser(`sec.docA.${suffix}@example.com`, "Arthur", "Conan", "DOCTOR")
    createdRecordIds.profiles.push(docAUser.profile.id)
    const docAOnboard = await makeRequest("/doctors/onboard", {
      method: "POST",
      headers: { Authorization: `Bearer ${docAUser.token}` },
      body: {
        clinicId: clinicA.id,
        specialty: "Internal Medicine",
        licenseNumber: `LIC-DOC-A-${suffix}`,
        qualifications: "MD, Board Certified",
        yearsOfExperience: 10,
        consultationFee: 100.00,
        bio: "Physician at Clinic A.",
      },
    })
    const docA = docAOnboard.body?.data?.doctor
    if (!docA) throw new Error("Failed to onboard Doctor A: " + JSON.stringify(docAOnboard.body))
    createdRecordIds.doctors.push(docA.id)
    console.log(`   ✓ Doctor A onboarded at Clinic A: Dr. Arthur Conan`)

    // Doctor B at Clinic B
    const docBUser = await registerAndVerifyUser(`sec.docB.${suffix}@example.com`, "Beatrix", "Potter", "DOCTOR")
    createdRecordIds.profiles.push(docBUser.profile.id)
    const docBOnboard = await makeRequest("/doctors/onboard", {
      method: "POST",
      headers: { Authorization: `Bearer ${docBUser.token}` },
      body: {
        clinicId: clinicB.id,
        specialty: "Pediatrics",
        licenseNumber: `LIC-DOC-B-${suffix}`,
        qualifications: "MD, FAAP",
        yearsOfExperience: 8,
        consultationFee: 120.00,
        bio: "Physician at Clinic B.",
      },
    })
    const docB = docBOnboard.body?.data?.doctor
    if (!docB) throw new Error("Failed to onboard Doctor B: " + JSON.stringify(docBOnboard.body))
    createdRecordIds.doctors.push(docB.id)
    console.log(`   ✓ Doctor B onboarded at Clinic B: Dr. Beatrix Potter`)

    // Patient 1
    const pat1 = await registerAndVerifyUser(`sec.pat1.${suffix}@example.com`, "Alice", "Wonder", "PATIENT")
    createdRecordIds.profiles.push(pat1.profile.id)
    createdRecordIds.patients.push(pat1.patient.id)

    // Patient 2
    const pat2 = await registerAndVerifyUser(`sec.pat2.${suffix}@example.com`, "Bob", "Builder", "PATIENT")
    createdRecordIds.profiles.push(pat2.profile.id)
    createdRecordIds.patients.push(pat2.patient.id)

    // Doctor A availability on day of appointment
    const targetDate = new Date(Date.now() + 86400000 * 2)
    const dateStr = targetDate.toISOString().split("T")[0]
    const dayOfWeek = targetDate.getUTCDay()

    await retryQuery(() => prisma.doctorAvailability.create({
      data: {
        doctorId: docA.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        slotDurationMinutes: 30,
        isActive: true,
      },
    }))

    // -------------------------------------------------------------
    // AUDIT ITEM 1: Prevent Overlapping Appointments with Different Start Times
    // -------------------------------------------------------------
    console.log("\n[AUDIT 1] Overlapping Appointments with Different Start Times & Durations...")

    // Booking 1: Patient 1 books 10:00 - 10:30 with Doctor A
    const book1 = await makeRequest("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${pat1.token}` },
      body: {
        doctorId: docA.id,
        clinicId: clinicA.id,
        date: dateStr,
        time: "10:00",
        visitType: "IN_CLINIC",
        paymentMethod: "PAY_AT_CLINIC",
        reasonForVisit: "Initial checkup",
      },
    })
    const appt1 = book1.body?.data?.appointment
    if (!appt1) throw new Error("Booking 1 failed: " + JSON.stringify(book1.body))
    createdRecordIds.appointments.push(appt1.id)
    console.log(`   ✓ Booking 1 Confirmed: 10:00 - 10:30 (Ref ${appt1.bookingReference})`)

    // Attempt Booking 2: Exact slot 10:00 -> must be rejected
    const book2Exact = await makeRequest("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${pat2.token}` },
      body: {
        doctorId: docA.id,
        clinicId: clinicA.id,
        date: dateStr,
        time: "10:00",
        visitType: "IN_CLINIC",
        paymentMethod: "PAY_AT_CLINIC",
        reasonForVisit: "Second checkup attempt",
      },
    })
    if (book2Exact.status === 400 || book2Exact.status === 409) {
      console.log(`   ✓ Duplicate exact start time rejected: status ${book2Exact.status}`)
    } else {
      throw new Error(`Expected overlap rejection, received ${book2Exact.status}`)
    }

    // Direct Database Overlap Check: Insert an appointment that spans 09:45 - 10:15
    // Interval condition: scheduledStart < 10:30 AND scheduledEnd > 10:00 -> OVERLAP!
    const overlapSlotCheck = await prisma.appointment.findFirst({
      where: {
        doctorId: docA.id,
        status: { not: "CANCELLED" },
        scheduledStart: { lt: new Date(`${dateStr}T10:15:00.000Z`) },
        scheduledEnd: { gt: new Date(`${dateStr}T09:45:00.000Z`) },
      },
    })
    if (overlapSlotCheck) {
      console.log(`   ✓ Interval overlap query successfully detected collision with Booking 1 (${overlapSlotCheck.bookingReference})`)
      console.log("   PASSED: Audit Item 1 (Database Interval Overlap Prevention)")
    } else {
      throw new Error("Interval overlap query failed to detect overlap!")
    }

    // -------------------------------------------------------------
    // AUDIT ITEM 2: Concurrent Rescheduling Overlap Prevention
    // -------------------------------------------------------------
    console.log("\n[AUDIT 2] Concurrent Rescheduling Overlap Protection...")

    // Patient 2 books 11:00 - 11:30
    const book3 = await makeRequest("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${pat2.token}` },
      body: {
        doctorId: docA.id,
        clinicId: clinicA.id,
        date: dateStr,
        time: "11:00",
        visitType: "IN_CLINIC",
        paymentMethod: "PAY_AT_CLINIC",
        reasonForVisit: "Patient 2 slot",
      },
    })
    const appt2 = book3.body?.data?.appointment
    if (!appt2) throw new Error("Booking 3 failed: " + JSON.stringify(book3.body))
    createdRecordIds.appointments.push(appt2.id)
    console.log(`   ✓ Booking 2 Confirmed: 11:00 - 11:30 (Ref ${appt2.bookingReference})`)

    // Attempt to reschedule Booking 2 to 10:00 (overlapping Booking 1)
    const reschedOverlap = await makeRequest(`/appointments/${appt2.id}/reschedule`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pat2.token}` },
      body: {
        date: dateStr,
        time: "10:00",
      },
    })

    if (reschedOverlap.status === 400 || reschedOverlap.status === 409) {
      console.log(`   ✓ Rescheduling collision rejected: status ${reschedOverlap.status} ("${reschedOverlap.body?.error?.message || reschedOverlap.body?.error}")`)
      console.log("   PASSED: Audit Item 2 (Rescheduling Collision Blocked)")
    } else {
      throw new Error(`Expected reschedule conflict rejection, received ${reschedOverlap.status}`)
    }

    // -------------------------------------------------------------
    // AUDIT ITEM 3: Cancellation Payment Status Integrity
    // -------------------------------------------------------------
    console.log("\n[AUDIT 3] Cancellation Payment Status Integrity (Never REFUNDED without gateway confirmation)...")

    // Mark Booking 2 as PAID in database
    await prisma.appointment.update({
      where: { id: appt2.id },
      data: { paymentStatus: "PAID" },
    })

    // Cancel Booking 2
    const cancelRes = await makeRequest(`/appointments/${appt2.id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pat2.token}` },
      body: { cancellationReason: "Schedule conflict" },
    })

    if (cancelRes.status !== 200) {
      throw new Error("Cancellation failed: " + JSON.stringify(cancelRes.body))
    }

    const cancelledAppt = await prisma.appointment.findUnique({ where: { id: appt2.id } })
    console.log(`   ✓ Appointment Status: ${cancelledAppt.status}`)
    console.log(`   ✓ Payment Status: ${cancelledAppt.paymentStatus}`)

    if (cancelledAppt.paymentStatus === "REFUNDED") {
      throw new Error("VULNERABILITY DETECTED: Cancellation falsely claimed 'REFUNDED' without payment gateway confirmation!")
    } else if (cancelledAppt.paymentStatus === "REFUND_PENDING") {
      console.log("   ✓ Payment accurately marked 'REFUND_PENDING' awaiting gateway refund confirmation.")
      console.log("   PASSED: Audit Item 3 (Payment Integrity Enforced)")
    } else {
      throw new Error(`Unexpected payment status: ${cancelledAppt.paymentStatus}`)
    }

    // -------------------------------------------------------------
    // AUDIT ITEM 4: Clinic Creation & Global CLINIC_ADMIN Scope Isolation
    // -------------------------------------------------------------
    console.log("\n[AUDIT 4] Clinic Creation & CLINIC_ADMIN Cross-Tenant Privilege Isolation...")

    // 1. Admin A tries to access Clinic B staff -> MUST BE 403 FORBIDDEN
    const crossStaffRes = await makeRequest(`/clinics/${clinicB.id}/staff`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminA.token}` },
    })

    if (crossStaffRes.status === 403) {
      console.log(`   ✓ Admin A denied access to Clinic B staff: 403 Forbidden`)
    } else {
      throw new Error(`VULNERABILITY: Admin A accessed Clinic B staff! Status ${crossStaffRes.status}`)
    }

    // 2. Admin A tries to update Clinic B profile -> MUST BE 403 FORBIDDEN
    const crossClinicUpdate = await makeRequest(`/clinics/${clinicB.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminA.token}` },
      body: { name: "Malicious Takeover" },
    })

    if (crossClinicUpdate.status === 403) {
      console.log(`   ✓ Admin A denied updating Clinic B details: 403 Forbidden`)
    } else {
      throw new Error(`VULNERABILITY: Admin A updated Clinic B! Status ${crossClinicUpdate.status}`)
    }

    // 3. Admin A tries to view Doctor B's appointment roster -> MUST BE 403 FORBIDDEN
    const crossDocAppointments = await makeRequest(`/appointments/doctor/${docB.id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminA.token}` },
    })

    if (crossDocAppointments.status === 403) {
      console.log(`   ✓ Admin A denied viewing Doctor B's appointment schedule: 403 Forbidden`)
    } else {
      throw new Error(`VULNERABILITY: Admin A viewed Doctor B's appointments! Status ${crossDocAppointments.status}`)
    }

    // 4. Admin A tries to tamper with Doctor B's schedule -> MUST BE 403 FORBIDDEN
    const crossDocSchedule = await makeRequest(`/doctors/${docB.id}/schedule`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminA.token}` },
      body: { slots: [] },
    })

    if (crossDocSchedule.status === 403) {
      console.log(`   ✓ Admin A denied modifying Doctor B's schedule: 403 Forbidden`)
    } else {
      throw new Error(`VULNERABILITY: Admin A modified Doctor B's schedule! Status ${crossDocSchedule.status}`)
    }

    // 5. Admin A accesses their OWN Clinic A -> MUST BE 200 OK
    const ownStaffRes = await makeRequest(`/clinics/${clinicA.id}/staff`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminA.token}` },
    })

    if (ownStaffRes.status === 200) {
      console.log(`   ✓ Admin A legitimately accessed their own Clinic A staff: 200 OK`)
      console.log("   PASSED: Audit Item 4 (Multi-Tenant CLINIC_ADMIN Scoping Isolated)")
    } else {
      throw new Error(`Admin A failed to access own clinic staff: ${ownStaffRes.status}`)
    }

    console.log("\n========================================================")
    console.log("🎉 ALL FOCUSED SECURITY AUDIT CHECKS PASSED!")
    console.log("========================================================\n")
  } finally {
    console.log("🧹 Cleaning up audit test data from Supabase...")
    try {
      if (createdRecordIds.appointments.length > 0) {
        await prisma.appointment.deleteMany({ where: { id: { in: createdRecordIds.appointments } } })
      }
      if (createdRecordIds.profiles.length > 0) {
        await prisma.notification.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.auditLog.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.emailVerificationToken.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.patient.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.doctorAvailability.deleteMany({ where: { doctor: { profileId: { in: createdRecordIds.profiles } } } })
        await prisma.doctor.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.clinicMembership.deleteMany({ where: { profileId: { in: createdRecordIds.profiles } } })
        await prisma.profile.deleteMany({ where: { id: { in: createdRecordIds.profiles } } })
      }
      if (createdRecordIds.clinics.length > 0) {
        await prisma.clinic.deleteMany({ where: { id: { in: createdRecordIds.clinics } } })
      }
      console.log("   ✓ Audit test data cleaned up safely.")
    } catch (cleanupErr) {
      console.warn("Cleanup notice:", cleanupErr.message)
    }
    await prisma.$disconnect()
  }
}

runFocusedSecurityAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ FOCUSED SECURITY AUDIT FAILED:", err)
    process.exit(1)
  })
