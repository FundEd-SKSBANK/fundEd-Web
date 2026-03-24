import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const studentCount = await prisma.student.count();
    const eventCount = await prisma.event.count();
    const paymentCount = await prisma.payment.count();
    const connectionCount = await (prisma as any).subEventConnection.count();

    console.log('--- Database Stats ---');
    console.log(`Students: ${studentCount}`);
    console.log(`Events: ${eventCount}`);
    console.log(`Payments: ${paymentCount}`);
    console.log(`Connections: ${connectionCount}`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
