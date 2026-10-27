const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    const profileCount = await prisma.profile.count();
    const clinicCount = await prisma.clinic.count();
    const doctorCount = await prisma.doctor.count();
    const patientCount = await prisma.patient.count();
    const breakCount = await prisma.doctorBreak.count();
    const leaveCount = await prisma.doctorLeave.count();
    const inviteCount = await prisma.clinicInvitation.count();
    console.log('✅ Verified tables in remote database:');
    console.log('   - profiles count:', profileCount);
    console.log('   - clinics count:', clinicCount);
    console.log('   - doctors count:', doctorCount);
    console.log('   - patients count:', patientCount);
    console.log('   - doctor_breaks count:', breakCount);
    console.log('   - doctor_leaves count:', leaveCount);
    console.log('   - clinic_invitations count:', inviteCount);


  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
