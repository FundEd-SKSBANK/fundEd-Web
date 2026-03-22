import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Stats ---');
    const studentCount = await prisma.student.count();
    const eventCount = await prisma.event.count();
    const paymentCount = await prisma.payment.count();
    // Use raw query for connectionToken if model is not in Prisma yet
    const connectionTokenCount = await (prisma as any).connectionToken.count().catch(() => 'N/A');
    const subEventConnectionCount = await (prisma as any).subEventConnection.count().catch(() => 'N/A');

    console.log(`Students: ${studentCount}`);
    console.log(`Events: ${eventCount}`);
    console.log(`Payments: ${paymentCount}`);
    console.log(`ConnectionTokens: ${connectionTokenCount}`);
    console.log(`SubEventConnections: ${subEventConnectionCount}`);

    console.log('\n--- Query Performance ---');
    
    const startStudents = Date.now();
    const students = await prisma.student.findMany({ take: 1000 });
    console.log(`Fetching up to 1000 students took ${Date.now() - startStudents}ms`);

    const startEvents = Date.now();
    const events = await prisma.event.findMany({
        include: {
            payments: { select: { amount: true, status: true, studentId: true } },
            participants: { select: { id: true } },
            _count: { select: { participants: true } }
        }
    });
    console.log(`Fetching all events with payments/participants took ${Date.now() - startEvents}ms`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
