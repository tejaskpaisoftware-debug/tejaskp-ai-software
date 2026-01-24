const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, paidAmount: true, mobile: true, course: true }
    });

    const total = users.reduce((sum, u) => sum + (u.paidAmount || 0), 0);
    console.log(`DB Total Revenue: ${total}`);
    console.log(`Total Students: ${users.length}`);

    // Check specific discrepancy candidates
    console.log('--- Analysis: Jagdish (Exp: 2000?) ---');
    const jagdish = users.filter(u => u.name.toLowerCase().includes('jagdish'));
    jagdish.forEach(u => console.log(`found: ${u.name} | Paid: ${u.paidAmount} | Mobile: ${u.mobile}`));

    console.log('--- Analysis: Jeet (Exp: 2200?) ---');
    const jeet = users.filter(u => u.name.toLowerCase().includes('jeet'));
    jeet.forEach(u => console.log(`found: ${u.name} | Paid: ${u.paidAmount} | Mobile: ${u.mobile}`));

    // Check if any "2000" or "2200" payments exist at all
    const p2000 = users.filter(u => u.paidAmount === 2000);
    console.log(`Users with exactly 2000 paid: ${p2000.map(u => u.name).join(', ')}`);

    const p2200 = users.filter(u => u.paidAmount === 2200);
    console.log(`Users with exactly 2200 paid: ${p2200.map(u => u.name).join(', ')}`);

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
