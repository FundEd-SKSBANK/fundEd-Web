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
  const users = await prisma.user.findMany();
  for (const u of users) {
    const e = await prisma.event.count({ where: { createdById: u.id } });
    const s = await prisma.student.count({ where: { createdById: u.id } });
    console.log(`${u.email} | ID: ${u.id} | Events: ${e} | Students: ${s}`);
  }
  const oe = await prisma.event.count({ where: { createdById: null } });
  const os = await prisma.student.count({ where: { createdById: null } });
  console.log(`ORPHANS | Events: ${oe} | Students: ${os}`);
}

main().finally(() => prisma.$disconnect());
