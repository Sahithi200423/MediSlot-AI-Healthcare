const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.profile.findFirst({
    where: { email: 'admin.metro@demo.medislot.com' }
  });
  if (!admin) {
    console.log('Admin not found!');
    return;
  }
  const metroClinic = await prisma.clinic.findUnique({
    where: { id: 'bf27f9e6-5410-4dd7-8332-26493b0d1127' }
  });
  if (!metroClinic) {
    console.log('Metro Specialty Clinic not found!');
    return;
  }

  // Ensure ClinicMembership exists
  const existingMem = await prisma.clinicMembership.findFirst({
    where: { profileId: admin.id, clinicId: metroClinic.id }
  });
  if (!existingMem) {
    await prisma.clinicMembership.create({
      data: {
        profileId: admin.id,
        clinicId: metroClinic.id,
        clinicRole: 'OWNER'
      }
    });
  }

  console.log(`✓ Successfully associated ${admin.email} with ${metroClinic.name} (${metroClinic.id})`);
}

main().finally(() => prisma.$disconnect());
