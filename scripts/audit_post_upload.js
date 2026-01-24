const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, paidAmount: true, mobile: true, course: true, createdAt: true }
    });

    const total = users.reduce((sum, u) => sum + (u.paidAmount || 0), 0);
    console.log(`CURRENT DB Total Revenue: ${total}`);
    console.log(`Total Students: ${users.length}`); // Should be 90

    console.log('--- Duplicate Check: Jagdish ---');
    const jagdish = users.filter(u => u.name.toLowerCase().includes('jagdish'));
    jagdish.forEach(u => console.log(` - ${u.name} (${u.mobile}): ${u.paidAmount} [Created: ${u.createdAt.toISOString()}]`));

    console.log('--- Duplicate Check: Jeet ---');
    const jeet = users.filter(u => u.name.toLowerCase().includes('jeet'));
    jeet.forEach(u => console.log(` - ${u.name} (${u.mobile}): ${u.paidAmount} [Created: ${u.createdAt.toISOString()}]`));

    console.log('--- NEWLY CREATED USERS (Last 1 hour) ---');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const newUsers = users.filter(u => new Date(u.createdAt) > oneHourAgo);
    newUsers.forEach(u => console.log(`NEW: ${u.name} (${u.mobile}) - Paid: ${u.paidAmount}`));

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
