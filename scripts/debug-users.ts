
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE DIAGNOSTIC START ---');
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true }
    });

    console.log(`Total users found: ${users.length}`);
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: "${u.email}" | Role: "${u.role}" | Name: "${u.name}"`);
    });

    const superAdminByEmail = users.find(u => u.email.toLowerCase() === 'super@funded.com');
    if (superAdminByEmail) {
        console.log('\nFound potential superadmin:');
        console.log(JSON.stringify(superAdminByEmail, null, 2));
    } else {
        console.log('\nNo user found with email super@funded.com (case-insensitive check failed too)');
    }

  } catch (error) {
    console.error('Database connection error:', error);
  }
  console.log('--- DATABASE DIAGNOSTIC END ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
