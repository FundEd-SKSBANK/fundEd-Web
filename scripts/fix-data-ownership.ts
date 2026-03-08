import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const getPrismaClient = () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = getPrismaClient();

async function main() {
  const targetEmail = 'sabinksanthosh6@gmail.com';
  const sourceEmail = 'super@funded.com';

  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
  const sourceUser = await prisma.user.findUnique({ where: { email: sourceEmail } });

  if (!targetUser) {
    console.error(`Target user ${targetEmail} not found`);
    return;
  }

  if (!sourceUser) {
    console.warn(`Source user ${sourceEmail} not found, checking for orphans only.`);
  }

  console.log(`Reassigning records to: ${targetUser.email} (ID: ${targetUser.id})`);

  // Update Events
  const updatedEvents = await prisma.event.updateMany({
    where: { 
      OR: [
        { createdById: null },
        ...(sourceUser ? [{ createdById: sourceUser.id }] : [])
      ]
    },
    data: { createdById: targetUser.id },
  });
  console.log(`Updated ${updatedEvents.count} events`);

  // Update Students
  const updatedStudents = await prisma.student.updateMany({
    where: { 
      OR: [
        { createdById: null },
        ...(sourceUser ? [{ createdById: sourceUser.id }] : [])
      ]
    },
    data: { createdById: targetUser.id },
  });
  console.log(`Updated ${updatedStudents.count} students`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
