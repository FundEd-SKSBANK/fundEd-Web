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
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      const eventCount = await prisma.event.count({ where: { createdById: u.id } });
      const studentCount = await prisma.student.count({ where: { createdById: u.id } });
      console.log(`- ${u.email} (ID: ${u.id}, Role: ${u.role}): ${eventCount} events, ${studentCount} students`);
    }

    const orphanEvents = await prisma.event.count({ where: { createdById: null } });
    const orphanStudents = await prisma.student.count({ where: { createdById: null } });
    console.log(`Remaining orphan records: ${orphanEvents} events, ${orphanStudents} students`);
  } catch (err) {
    console.error(err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
