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

    console.log('--- Users with Paid Amount = 4200 ---');
    const exact = users.filter(u => u.paidAmount === 4200);
    if (exact.length) exact.forEach(u => console.log(`${u.name}: ${u.paidAmount}`));
    else console.log("None");

    console.log('--- Top 20 Paid Amounts ---');
    users.sort((a, b) => b.paidAmount - a.paidAmount).slice(0, 20).forEach(u => {
        console.log(`${u.name} (${u.course}): ${u.paidAmount}`);
    });

    console.log('--- Potential "Zero" Paid Users (Might be missing data) ---');
    users.filter(u => u.paidAmount === 0).forEach(u => {
        console.log(`${u.name} (${u.course}): 0`);
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
