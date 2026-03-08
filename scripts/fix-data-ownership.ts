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
  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });

  if (!targetUser) {
    console.error(`Target user ${targetEmail} not found`);
    return;
  }

  console.log(`Target User ID: ${targetUser.id}`);

  // 1. Move everything CURRENTLY owned by super@funded.com
  const sourceUser = await prisma.user.findUnique({ where: { email: 'super@funded.com' } });
  if (sourceUser) {
    console.log(`Found source user super@funded.com with ID: ${sourceUser.id}`);
    const e1 = await prisma.event.updateMany({
        where: { createdById: sourceUser.id },
        data: { createdById: targetUser.id }
    });
    const s1 = await prisma.student.updateMany({
        where: { createdById: sourceUser.id },
        data: { createdById: targetUser.id }
    });
    console.log(`Moved ${e1.count} events and ${s1.count} students from super@funded.com`);
  }

  // 2. Move all orphans
  const e2 = await prisma.event.updateMany({
    where: { createdById: null },
    data: { createdById: targetUser.id }
  });
  const s2 = await prisma.student.updateMany({
    where: { createdById: null },
    data: { createdById: targetUser.id }
  });
  console.log(`Moved ${e2.count} orphan events and ${s2.count} orphan students`);

  // Final count
  const finalE = await prisma.event.count({ where: { createdById: targetUser.id } });
  const finalS = await prisma.student.count({ where: { createdById: targetUser.id } });
  console.log(`Final count for ${targetEmail}: ${finalE} events, ${finalS} students`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
