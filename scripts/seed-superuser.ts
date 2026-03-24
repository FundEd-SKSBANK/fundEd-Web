
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Create Superuser ---');

  const args = process.argv.slice(2);
  const name = args[0] || 'Super Admin';
  const email = args[1] || 'super@funded.com';
  const password = args[2] || 'superpassword123';

  console.log(`Creating Superuser: ${name} (${email})`);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.role === 'superuser') {
         console.log(`\nSuperuser '${existingUser.name}' (${existingUser.email}) already exists and is verified!`);
         return;
      } else {
        // Promote to superuser
        await prisma.user.update({
             where: { email },
             data: { role: 'superuser' }
        });
        console.log(`\nUser '${existingUser.name}' (${existingUser.email}) promoted to Superuser!`);
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'superuser',
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      }
    });
    console.log(`\nSuperuser '${user.name}' (${user.email}) created successfully!`);
  } catch (error) {
    console.error('\nError creating superuser:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
