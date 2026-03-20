
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'super@funded.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });

  if (user) {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log(`User with email ${email} not found.`);
    const allUsers = await prisma.user.findMany({
        select: { email: true, role: true }
    });
    console.log('All users:');
    console.log(JSON.stringify(allUsers, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
