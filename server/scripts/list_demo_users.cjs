const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: { profile: true },
    take: 3
  });
  console.log('Doctors:', doctors.map(d => ({
    id: d.id,
    name: `${d.profile.firstName} ${d.profile.lastName}`,
    email: d.profile.email,
    role: d.profile.role,
    specialty: d.specialty
  })));

  const patients = await prisma.profile.findMany({
    where: { role: 'PATIENT' },
    take: 3
  });
  console.log('Patients:', patients.map(p => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    email: p.email
  })));
}

main().finally(() => prisma.$disconnect());
