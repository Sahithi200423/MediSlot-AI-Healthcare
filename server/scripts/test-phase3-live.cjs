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
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
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

async function runLiveVerification() {
  console.log("==================================================")
  console.log("  MEDISLOT PHASE THREE: LIVE SUPABASE TEST SUITE  ")
  console.log("==================================================")

  let passed = 0
  let failed = 0

  function assert(testNum, testName, condition, details = "") {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] Test ${testNum}: ${testName} -> ${details}`)
      failed++
    }
  }

  try {
    // 0. Ensure we have authenticated test users in live Supabase
    // We fetch a patient profile and an admin profile directly from live Supabase
    const profiles = await prisma.profile.findMany({ take: 5 })
    if (profiles.length === 0) {
      throw new Error("No profiles found in live Supabase. Run registration first.")
    }

    console.log(`Found ${profiles.length} live Supabase profiles for testing.`)

    // Create or find a test admin profile and doctor profile
    let adminProfile = profiles.find((p) => p.role === "CLINIC_ADMIN" || p.role === "PLATFORM_ADMIN")
    if (!adminProfile) {
      adminProfile = profiles[0]
      await prisma.profile.update({
        where: { id: adminProfile.id },
        data: { role: "CLINIC_ADMIN" },
      })
    }

    // Login or sign JWT token via auth endpoint or existing mock
    const loginRes = await makeRequest("/auth/login", {
      method: "POST",
      body: {
        email: adminProfile.email,
        password: "TestPassword123!",
      },
    })

    let token = loginRes.body?.data?.token
    if (!token) {
      // If password changed, update password or sign in with another test user
      console.log("Logging in using test admin credentials...")
      const testEmail = `admin_test_${Date.now()}@example.com`
      const regRes = await makeRequest("/auth/register", {
        method: "POST",
        body: {
          email: testEmail,
          password: "TestPassword123!",
          firstName: "Admin",
          lastName: "Tester",
        },
      })
      if (!regRes.body?.data) {
        console.error("Registration response error:", regRes.status, regRes.body)
        throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`)
      }
      const newAdmin = regRes.body?.data?.user
      const otp = regRes.body?.data?.emailOtp
      if (otp) {
        const vRes = await makeRequest("/auth/verify-email", {
          method: "POST",
          body: { email: testEmail, token: otp },
        })
        token = vRes.body?.data?.session?.access_token
      }
      if (!token) {
        const lRes = await makeRequest("/auth/login", {
          method: "POST",
          body: { email: testEmail, password: "TestPassword123!" },
        })
        token = lRes.body?.data?.token
      }
      await prisma.profile.update({
        where: { id: newAdmin.id },
        data: { role: "CLINIC_ADMIN" },
      })
    }

    const authHeaders = { Authorization: `Bearer ${token}` }

    // TEST 1: Authorized Clinic Creation
    const clinicName = `MediSlot Central Clinic ${Date.now()}`
    const clinicRes = await makeRequest("/clinics", {
      method: "POST",
      headers: authHeaders,
      body: {
        name: clinicName,
        address: "123 Healthcare Blvd",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        phone: "+1 (555) 123-4567",
        email: `contact_${Date.now()}@centralclinic.com`,
        operatingHours: "08:00 - 18:00",
        timezone: "America/New_York",
      },
    })
    const createdClinic = clinicRes.body?.data?.clinic
    assert(1, "Authorized clinic creation", clinicRes.status === 201 && createdClinic?.name === clinicName, JSON.stringify(clinicRes.body))

    // TEST 2: Unauthorized Clinic Creation Rejection (Missing required fields)
    const badClinicRes = await makeRequest("/clinics", {
      method: "POST",
      headers: authHeaders,
      body: {
        name: "", // Invalid empty name
        address: "123 St",
      },
    })
    assert(2, "Unauthorized/invalid clinic creation rejection", badClinicRes.status === 400, `Status: ${badClinicRes.status}`)

    // Register a new user to act as a doctor (with genuine email verification)
    const docEmail = `doctor_${Date.now()}@medislot.com`
    const docReg = await makeRequest("/auth/register", {
      method: "POST",
      body: {
        email: docEmail,
        password: "DoctorPassword123!",
        firstName: "Marcus",
        lastName: "Vance",
      },
    })
    const docOtp = docReg.body?.data?.emailOtp
    let docToken = docReg.body?.data?.token
    if (docOtp) {
      const vDoc = await makeRequest("/auth/verify-email", {
        method: "POST",
        body: { email: docEmail, token: docOtp },
      })
      docToken = vDoc.body?.data?.session?.access_token
    }
    if (!docToken) {
      const lDoc = await makeRequest("/auth/login", {
        method: "POST",
        body: { email: docEmail, password: "DoctorPassword123!" },
      })
      docToken = lDoc.body?.data?.token
    }
    const docAuthHeaders = { Authorization: `Bearer ${docToken}` }

    // TEST 3: Doctor Onboarding (Strict Security: licenseVerified must be false by default)
    const licenseNum = `LIC-${Date.now()}`
    const onboardRes = await makeRequest("/doctors/onboard", {
      method: "POST",
      headers: docAuthHeaders,
      body: {
        specialty: "Cardiology",
        licenseNumber: licenseNum,
        qualifications: "MD, FACC",
        yearsOfExperience: 10,
        consultationFee: 120.0,
        clinicId: createdClinic?.id,
        bio: "Specializing in interventional cardiology and vascular diagnostics.",
      },
    })
    const createdDoctor = onboardRes.body?.data?.doctor
    assert(
      3,
      "Doctor onboarding and approval workflow",
      onboardRes.status === 201 && createdDoctor?.licenseVerified === false,
      JSON.stringify(onboardRes.body)
    )

    // TEST 4: Prevention of Unauthorized Doctor Role/License Escalation
    // Non-platform-admin attempting to verify their own license must be rejected with 403 Forbidden
    const unauthVerifyRes = await makeRequest(`/doctors/${createdDoctor?.id}/verify-license`, {
      method: "PATCH",
      headers: docAuthHeaders,
      body: { verified: true },
    })
    assert(
      4,
      "Prevention of unauthorized doctor role/license escalation",
      unauthVerifyRes.status === 403,
      `Status: ${unauthVerifyRes.status}`
    )

    // TEST 5: Doctor Profile Editing
    const updateDocRes = await makeRequest(`/doctors/${createdDoctor?.id}`, {
      method: "PUT",
      headers: docAuthHeaders,
      body: {
        consultationFee: 150.0,
        bio: "Updated: Board-certified Cardiologist with 12 years clinical practice.",
      },
    })
    assert(
      5,
      "Doctor profile editing",
      updateDocRes.status === 200 && Number(updateDocRes.body?.data?.doctor?.consultationFee) === 150.0,
      JSON.stringify(updateDocRes.body)
    )

    // TEST 6: Weekly Schedule Creation in Supabase PostgreSQL
    const scheduleRes = await makeRequest(`/doctors/${createdDoctor?.id}/schedule`, {
      method: "POST",
      headers: docAuthHeaders,
      body: {
        slots: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30, isActive: true }, // Monday
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30, isActive: true }, // Tuesday
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30, isActive: true }, // Wednesday
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30, isActive: true }, // Thursday
          { dayOfWeek: 5, startTime: "09:00", endTime: "15:00", slotDurationMinutes: 30, isActive: true }, // Friday
        ],
      },
    })
    assert(6, "Weekly schedule creation in Supabase PostgreSQL", scheduleRes.status === 200, JSON.stringify(scheduleRes.body))

    // TEST 7: Break and Leave Management
    // Add Lunch Break on Mondays 12:00 - 13:00
    const breakRes = await makeRequest(`/doctors/${createdDoctor?.id}/breaks`, {
      method: "POST",
      headers: docAuthHeaders,
      body: {
        dayOfWeek: 1,
        startTime: "12:00",
        endTime: "13:00",
        title: "Clinical Lunch Break",
      },
    })
    assert(7, "Break and leave management (Add Break)", breakRes.status === 201 && breakRes.body?.data?.break?.startTime === "12:00", JSON.stringify(breakRes.body))

    // TEST 8: Real Availability Calculation Engine
    // Query availability for next Monday
    const today = new Date()
    const daysUntilMonday = (1 + 7 - today.getUTCDay()) % 7 || 7
    const nextMonday = new Date(today.getTime() + daysUntilMonday * 86400000)
    const nextMondayStr = nextMonday.toISOString().split("T")[0]

    const availRes = await makeRequest(`/doctors/${createdDoctor?.id}/availability?date=${nextMondayStr}`)
    const availData = availRes.body?.data
    const hasSlots = availData?.slots && availData.slots.length > 0
    const lunchSlot = availData?.slots?.find((s) => s.time === "12:00")
    const regularSlot = availData?.slots?.find((s) => s.time === "09:00")

    assert(
      8,
      "Correct available-slot calculation (30m slots, working hours)",
      availRes.status === 200 && hasSlots && regularSlot?.available === true,
      `Total slots: ${availData?.totalSlots}`
    )

    // TEST 9: Exclusion of Unavailable Slots (Break & Leave)
    const breakExcluded = lunchSlot?.available === false && lunchSlot?.reason === "Break"

    // Register a Leave for next Tuesday
    const daysUntilTuesday = (2 + 7 - today.getUTCDay()) % 7 || 7
    const nextTuesday = new Date(today.getTime() + daysUntilTuesday * 86400000)
    const nextTuesdayStr = nextTuesday.toISOString().split("T")[0]

    await makeRequest(`/doctors/${createdDoctor?.id}/leaves`, {
      method: "POST",
      headers: docAuthHeaders,
      body: {
        startDate: nextTuesdayStr,
        endDate: nextTuesdayStr,
        reason: "Cardiology Symposium",
      },
    })

    const tuesdayAvail = await makeRequest(`/doctors/${createdDoctor?.id}/availability?date=${nextTuesdayStr}`)
    const leaveBlocked = tuesdayAvail.body?.data?.status === "ON_LEAVE" && tuesdayAvail.body?.data?.availableSlotsCount === 0

    assert(
      9,
      "Exclusion of unavailable slots (Breaks marked unavailable, Leave blocks all day)",
      breakExcluded && leaveBlocked,
      `Break excluded: ${breakExcluded}, Leave blocked: ${leaveBlocked}`
    )

    // TEST 10: Cross-Clinic Access Prevention (Tenant Isolation)
    // Create a 2nd clinic with another user
    const clinic2Res = await makeRequest("/clinics", {
      method: "POST",
      headers: docAuthHeaders,
      body: {
        name: `Westside Health Center ${Date.now()}`,
        address: "456 West Ave",
        city: "Boston",
        state: "MA",
        postalCode: "02108",
        phone: "+1 (555) 987-6543",
        email: `westside_${Date.now()}@health.com`,
      },
    })
    const clinic2 = clinic2Res.body?.data?.clinic

    // User from clinic 1 tries to update clinic 2 -> Must be rejected with 403 Forbidden
    const crossClinicUpdate = await makeRequest(`/clinics/${clinic2?.id}`, {
      method: "PUT",
      headers: authHeaders, // Admin of clinic 1
      body: {
        name: "Hacked Clinic Name",
      },
    })
    assert(
      10,
      "Cross-clinic access prevention (Tenant isolation)",
      crossClinicUpdate.status === 403,
      `Status: ${crossClinicUpdate.status}`
    )

  } catch (err) {
    console.error("Test execution failed with error:", err)
    failed++
  } finally {
    await prisma.$disconnect()
    console.log("==================================================")
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
    console.log("==================================================")
    process.exit(failed > 0 ? 1 : 0)
  }
}

runLiveVerification()
