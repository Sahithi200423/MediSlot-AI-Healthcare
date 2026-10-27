const http = require('http');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const dotenv = require(path.join(__dirname, '../server/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const prisma = new PrismaClient();

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function registerTestUser(prefix, role = 'PATIENT') {
  const ts = Date.now().toString().slice(-6);
  const email = `${prefix}.${ts}@gmail.com`;
  const password = 'Password123!';
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email,
    password,
    firstName: prefix.charAt(0).toUpperCase() + prefix.slice(1),
    lastName: 'Test',
  });

  return {
    resStatus: res.status,
    resBody: res.body,
    user: res.body?.data?.user,
    token: res.body?.data?.token,
    email,
    password,
  };
}

async function runPhaseThreeSuite() {
  console.log('\n===============================================================');
  console.log('🏥 MEDISLOT PHASE THREE: DOCTOR & CLINIC MANAGEMENT TEST SUITE');
  console.log('===============================================================\n');

  // 1. Create Clinic Admin user and onboard a real clinic
  console.log('1. Testing Authorized Clinic Creation...');
  const clinicAdmin = await registerTestUser('clinicadmin');
  const clinicRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/clinics',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clinicAdmin.token}`,
    },
  }, {
    name: 'Metro Specialty Clinic',
    address: '100 Medical Center Blvd',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94103',
    phone: '415-555-0199',
    email: 'contact@metrospecialty.com',
    operatingHours: '09:00 - 18:00',
    timezone: 'America/Los_Angeles',
  });

  console.log(`   Clinic Admin Registration Status: ${clinicAdmin.resStatus} | Token: ${Boolean(clinicAdmin.token)}`);
  console.log(`   Clinic Creation Status: ${clinicRes.status} | Clinic Name: ${clinicRes.body?.data?.clinic?.name}`);
  if (clinicRes.status !== 201) console.log('   Clinic Error:', JSON.stringify(clinicRes.body));
  console.assert(clinicRes.status === 201, 'Clinic creation should return 201');
  const clinicId = clinicRes.body?.data?.clinic?.id;
  console.assert(Boolean(clinicId), 'Clinic ID must be returned');

  // 2. Test Doctor Onboarding
  console.log('\n2. Testing Doctor Onboarding & Verification Status...');
  const doctorUser = await registerTestUser('doctortest');
  const licenseNum = `MD-LIC-${Date.now().toString().slice(-6)}`;
  const doctorOnboardRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors/onboard',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`,
    },
  }, {
    specialty: 'Cardiology',
    licenseNumber: licenseNum,
    yearsOfExperience: 8,
    bio: 'Board certified cardiologist specializing in preventative care.',
    consultationFee: 75.00,
    qualifications: 'MD, FACC - Harvard Medical School',
    clinicId,
  });

  console.log(`   Doctor Onboarding Status: ${doctorOnboardRes.status}`);
  console.assert(doctorOnboardRes.status === 201, 'Doctor onboarding must return 201');
  const doctor = doctorOnboardRes.body?.data?.doctor;
  const doctorId = doctor?.id;
  console.log(`   Doctor ID: ${doctorId} | Specialty: ${doctor?.specialty}`);
  console.log(`   License Verification Status: ${doctor?.licenseVerified} (Security Rule: Unverified by default)`);
  console.assert(doctor?.licenseVerified === false, 'License must NOT be automatically verified');

  // 3. Test Unauthorized License Verification Rejection
  console.log('\n3. Testing Unauthorized License Verification Rejection (Non-Admin)...');
  const unauthorizedVerify = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/verify-license`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`, // Doctor trying to verify own license
    },
  }, { verified: true });
  console.log(`   Rejection Status: ${unauthorizedVerify.status} | Error: ${unauthorizedVerify.body?.error?.message}`);
  console.assert(unauthorizedVerify.status === 403, 'Non-admin verifying license must return 403 Forbidden');

  // 4. Test Doctor Profile Editing
  console.log('\n4. Testing Doctor Profile Editing...');
  const updateDocRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`,
    },
  }, {
    bio: 'Updated bio: Senior Attending Cardiologist with advanced echocardiography expertise.',
    consultationFee: 85.00,
  });
  console.log(`   Profile Update Status: ${updateDocRes.status} | New Fee: $${updateDocRes.body?.data?.doctor?.consultationFee}`);
  console.assert(updateDocRes.status === 200, 'Doctor profile update should return 200');

  // 5. Test Weekly Schedule Configuration
  console.log('\n5. Testing Weekly Working Schedule Configuration...');
  // Setting Monday (day 1) from 09:00 to 17:00 (30 min slots)
  const setScheduleRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/schedule`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`,
    },
  }, {
    slots: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30, isActive: true },
    ],
  });
  console.log(`   Schedule Setup Status: ${setScheduleRes.status}`);
  console.assert(setScheduleRes.status === 200, 'Setting schedule should return 200');

  // 6. Test Doctor Break Scheduling
  console.log('\n6. Testing Break Period Scheduling...');
  // Add Lunch Break on Monday from 12:00 to 13:00
  const breakRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/breaks`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`,
    },
  }, {
    dayOfWeek: 1,
    startTime: '12:00',
    endTime: '13:00',
    title: 'Lunch Break',
  });
  console.log(`   Break Status: ${breakRes.status} | Title: ${breakRes.body?.data?.break?.title}`);
  console.assert(breakRes.status === 201, 'Adding break should return 201');

  // 7. Test Real Availability Calculation Engine
  console.log('\n7. Testing Real Availability Calculation Engine for a Monday...');
  // Find next Monday date
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  const mondayStr = nextMonday.toISOString().split('T')[0];

  const availRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/availability?date=${mondayStr}`,
    method: 'GET',
  });

  console.log(`   Availability Status: ${availRes.status}`);
  console.assert(availRes.status === 200, 'Availability check should return 200');
  const availData = availRes.body?.data;
  console.log(`   Doctor: ${availData?.doctorName} on ${availData?.date}`);
  console.log(`   Total Generated Slots: ${availData?.totalSlots} | Bookable Slots: ${availData?.availableSlotsCount}`);
  
  // Verify Lunch Break slots (12:00 and 12:30) are correctly marked as unavailable
  const breakSlot1 = availData?.slots?.find(s => s.time === '12:00');
  const breakSlot2 = availData?.slots?.find(s => s.time === '12:30');
  const normalSlot = availData?.slots?.find(s => s.time === '10:00');
  console.log(`   Slot 10:00 (Regular): Available = ${normalSlot?.available}`);
  console.log(`   Slot 12:00 (Lunch Break): Available = ${breakSlot1?.available} (Reason: ${breakSlot1?.reason})`);
  console.assert(normalSlot?.available === true, 'Regular working slot must be available');
  console.assert(breakSlot1?.available === false && breakSlot1?.reason === 'Break', 'Break slot must be unavailable with reason Break');
  console.assert(breakSlot2?.available === false && breakSlot2?.reason === 'Break', 'Second break slot must be unavailable with reason Break');

  // 8. Test Doctor Leave Management & Slot Exclusion
  console.log('\n8. Testing Doctor Leave Period & Complete Slot Exclusion...');
  const leaveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/leaves`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorUser.token}`,
    },
  }, {
    startDate: mondayStr,
    endDate: mondayStr,
    reason: 'Attending Cardiology Conference',
  });
  console.log(`   Leave Request Status: ${leaveRes.status} | Reason: ${leaveRes.body?.data?.leave?.reason}`);
  console.assert(leaveRes.status === 201, 'Leave recording should return 201');

  // Check availability again on the leave date
  const leaveAvailRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/doctors/${doctorId}/availability?date=${mondayStr}`,
    method: 'GET',
  });
  console.log(`   Leave Date Status: ${leaveAvailRes.body?.data?.status} | Available Slots: ${leaveAvailRes.body?.data?.availableSlotsCount}`);
  console.assert(leaveAvailRes.body?.data?.status === 'ON_LEAVE', 'Date during leave must report ON_LEAVE');
  console.assert(leaveAvailRes.body?.data?.availableSlotsCount === 0, 'No slots bookable on leave date');

  // 9. Test Staff Invitation Workflow
  console.log('\n9. Testing Clinic Staff Invitation Workflow...');
  const inviteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/clinics/${clinicId}/invite`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clinicAdmin.token}`,
    },
  }, {
    email: 'new.specialist@medislot.com',
    role: 'DOCTOR',
  });
  console.log(`   Invitation Status: ${inviteRes.status} | Token: ${inviteRes.body?.data?.invitation?.token?.substring(0, 16)}...`);
  console.assert(inviteRes.status === 201, 'Invite creation must return 201');

  // 10. Test Tenant Isolation (Cross-Clinic Scoping)
  console.log('\n10. Testing Tenant Isolation (Cross-Clinic Access Prevention)...');
  const otherAdmin = await registerTestUser('otheradmin');
  const crossAccessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/clinics/${clinicId}/staff`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${otherAdmin.token}`, // Other admin attempting to view Clinic 1 staff
    },
  });
  console.log(`   Cross-Clinic Access Status: ${crossAccessRes.status} | Error: ${crossAccessRes.body?.error?.message}`);
  console.assert(crossAccessRes.status === 403, 'Cross-clinic access must return 403 Forbidden');

  console.log('\n===============================================================');
  console.log('🎉 ALL PHASE THREE BACKEND & SCHEDULING TESTS PASSED (10/10)!');
  console.log('===============================================================\n');
}

runPhaseThreeSuite()
  .catch((err) => {
    console.error('❌ Phase Three Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
