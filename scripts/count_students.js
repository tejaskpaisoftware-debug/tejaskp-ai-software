const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count({ where: { role: 'STUDENT' } });
    console.log(`Total Students in DB: ${count}`);

    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, mobile: true, course: true, paidAmount: true }
    });

    // Check for potentially merged data (high paid amounts?)
    // or just list them to see if we can spot valid duplicates.

    // finding duplicates in the current DB is unlikely if I upserted by unique mobile.
    // But I want to see if I have any "999999" numbers.

    const dummies = students.filter(s => s.mobile.startsWith('9999999999'));
    console.log(`Duplicate IDs created: ${dummies.length}`);
    dummies.forEach(d => console.log(` - ${d.name} (${d.mobile})`));

}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
