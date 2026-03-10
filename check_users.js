
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// We need to know who is logged in. 
// Since we can't easily get the session cookie from here, 
// let's just list ALL users in the DB to see if it's empty.

async function main() {
    console.log('--- Checking Users in DB ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
    });

    if (users.length === 0) {
        console.log('DATABASE IS EMPTY: No users found.');
    } else {
        console.log('Users found:', JSON.stringify(users, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
