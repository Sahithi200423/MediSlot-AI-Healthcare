const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS = [
  {
    email: 'patient@demo.medislot.com',
    role: 'PATIENT',
    firstName: 'Sarah',
    lastName: 'Jenkins'
  },
  {
    email: 'dr.jenkins@demo.medislot.com',
    role: 'DOCTOR',
    firstName: 'Marcus',
    lastName: 'Vance'
  },
  {
    email: 'admin.metro@demo.medislot.com',
    role: 'CLINIC_ADMIN',
    firstName: 'Elena',
    lastName: 'Rostova'
  },
  {
    email: 'superadmin@medislot.com',
    role: 'PLATFORM_ADMIN',
    firstName: 'David',
    lastName: 'Sterling'
  }
];

async function seedDemoUsers() {
  console.log('====================================================');
  console.log('🌟 SEEDING MEDISLOT PROFESSIONAL DEMO ACCOUNTS');
  console.log('====================================================\n');

  // 1. Ensure central demo clinic exists
  let clinic = await prisma.clinic.findFirst({ where: { slug: 'medislot-central-metro' } });
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'MediSlot Central Metro Clinic',
        slug: 'medislot-central-metro',
        address: '100 Healthcare Boulevard, Suite 400',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        phone: '+1-555-0144',
        email: 'contact@metroclinic.medislot.com',
        isVerified: true,
        timezone: 'America/Los_Angeles'
      }
    });
    console.log(`✓ Created Central Demo Clinic: ${clinic.name} (${clinic.id})`);
  } else {
    console.log(`✓ Found existing Demo Clinic: ${clinic.name}`);
  }

  const createdUserIds = {};

  // 2. Create or update auth users and profiles
  for (const u of DEMO_USERS) {
    let authUser = null;

    // Check if user exists in Supabase Auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find(usr => usr.email === u.email);

    if (existing) {
      // Update password and confirm email
      const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role, firstName: u.firstName, lastName: u.lastName }
      });
      if (updateErr) {
        console.warn(`Notice updating ${u.email}:`, updateErr.message);
      }
      authUser = updateData?.user || existing;
      console.log(`✓ Synchronized Auth user for ${u.role}: ${u.email}`);
    } else {
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role, firstName: u.firstName, lastName: u.lastName }
      });
      if (createErr) {
        throw new Error(`Failed to create auth user for ${u.email}: ${createErr.message}`);
      }
      authUser = createData.user;
      console.log(`✓ Created new Auth user for ${u.role}: ${u.email}`);
    }

    createdUserIds[u.role] = authUser.id;

    // Upsert Profile
    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role
      },
      create: {
        id: authUser.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role
      }
    });
  }

  // 3. Ensure Patient record
  const patientProfileId = createdUserIds['PATIENT'];
  let patientRec = await prisma.patient.findUnique({ where: { profileId: patientProfileId } });
  if (!patientRec) {
    patientRec = await prisma.patient.create({
      data: {
        profileId: patientProfileId,
        dateOfBirth: new Date('1990-05-15'),
        gender: 'FEMALE',
        bloodGroup: 'A_POSITIVE',
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Mild Asthma']
      }
    });
    console.log('✓ Created Demo Patient clinical profile');
  }

  // Ensure AI consent granted for demo patient
  await prisma.patientAiConsent.upsert({
    where: { patientId: patientRec.id },
    update: { consentGiven: true },
    create: {
      patientId: patientRec.id,
      consentGiven: true
    }
  });
  console.log('✓ Enabled AI decision-support consent for Demo Patient');

  // 4. Ensure Doctor record
  const doctorProfileId = createdUserIds['DOCTOR'];
  let doctorRec = await prisma.doctor.findUnique({ where: { profileId: doctorProfileId } });
  if (!doctorRec) {
    doctorRec = await prisma.doctor.create({
      data: {
        profileId: doctorProfileId,
        clinicId: clinic.id,
        specialty: 'Cardiology',
        licenseNumber: 'WA-MD-DEMO-0199',
        licenseVerified: true,
        qualifications: 'MD, FACC - Harvard Medical School',
        yearsOfExperience: 14,
        bio: 'Senior Attending Cardiologist specializing in preventive cardiology and metabolic health.',
        consultationFee: 120,
        isAcceptingPatients: true
      }
    });
    console.log('✓ Created Demo Doctor clinical profile');
  }

  // Ensure 7-day availability slots for Demo Doctor
  await prisma.doctorAvailability.deleteMany({ where: { doctorId: doctorRec.id } });
  for (let d = 0; d < 7; d++) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorRec.id,
        dayOfWeek: d,
        startTime: '08:00',
        endTime: '18:00',
        slotDurationMinutes: 30,
        isActive: true
      }
    });
  }
  console.log('✓ Configured 7-day consultation availability schedule for Demo Doctor');

  // 5. Ensure Clinic Admin linkage
  const adminProfileId = createdUserIds['CLINIC_ADMIN'];
  let adminLink = await prisma.clinicMembership.findFirst({
    where: { clinicId: clinic.id, profileId: adminProfileId }
  });
  if (!adminLink) {
    await prisma.clinicMembership.create({
      data: {
        clinicId: clinic.id,
        profileId: adminProfileId,
        clinicRole: 'OWNER'
      }
    });
    console.log('✓ Linked Clinic Admin to Central Demo Clinic as OWNER');
  }


  console.log('\n====================================================');
  console.log('🎉 ALL 4 PROFESSIONAL DEMO ACCOUNTS READY TO USE:');
  console.log('----------------------------------------------------');
  console.log('1. PATIENT:        patient@demo.medislot.com     / ' + DEMO_PASSWORD);
  console.log('2. DOCTOR:         dr.jenkins@demo.medislot.com  / ' + DEMO_PASSWORD);
  console.log('3. CLINIC ADMIN:   admin.metro@demo.medislot.com / ' + DEMO_PASSWORD);
  console.log('4. PLATFORM ADMIN: superadmin@medislot.com       / ' + DEMO_PASSWORD);
  console.log('====================================================\n');

  await prisma.$disconnect();
}

seedDemoUsers().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
