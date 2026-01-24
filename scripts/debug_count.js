const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, mobile: true, paidAmount: true, totalFees: true, course: true }
    });

    console.log(`Total Students: ${users.length}`);

    const mobileCounts = {};
    users.forEach(u => {
        // Clean mobile of any suffix for checking basic number collisions
        const base = u.mobile.split('-')[0];
        mobileCounts[base] = (mobileCounts[base] || 0) + 1;
    });

    const duplicates = Object.entries(mobileCounts).filter(([m, c]) => c > 1);
    console.log(`Mobile Numbers with >1 Student: ${duplicates.length}`);
    duplicates.forEach(([m, c]) => console.log(` - ${m}: ${c} records`));

    // Totals
    const totalRev = users.reduce((sum, u) => sum + (u.paidAmount || 0), 0);
    console.log(`Total Revenue: ${totalRev}`);

    // Check the known suspects
    const suspects = ['Jagdish', 'Jeet'];
    for (const s of suspects) {
        const found = users.filter(u => u.name.toLowerCase().includes(s.toLowerCase()));
        console.log(`--- ${s} ---`);
        if (found.length === 0) console.log("Missing");
        found.forEach(u => console.log(`${u.name} | ${u.mobile} | Paid: ${u.paidAmount} | Course: ${u.course}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
