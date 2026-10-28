const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const appts = await prisma.appointment.findMany({
    include: {
      clinic: true,
      doctor: { include: { profile: true } },
      patient: { include: { profile: true } }
    }
  });
  console.log('Appointments count:', appts.length);
  for (const a of appts) {
    console.log(`[${a.status}] Clinic: ${a.clinic?.name} (${a.clinicId}) | Doctor: Dr. ${a.doctor?.profile?.firstName} ${a.doctor?.profile?.lastName} | Patient: ${a.patient?.profile?.firstName} ${a.patient?.profile?.lastName}`);
  }

  const memberships = await prisma.clinicMembership.findMany({
    include: { clinic: true, profile: true }
  });
  console.log('\nClinic Memberships count:', memberships.length);
  for (const m of memberships) {
    console.log(`User: ${m.profile?.email} | Role: ${m.role} | Clinic: ${m.clinic?.name} (${m.clinicId})`);
  }
}

main().finally(() => prisma.$disconnect());
