const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Analyzing Date Distribution ---");

    const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT', paidAmount: { gt: 0 } },
        select: { name: true, joiningDate: true, createdAt: true, paidAmount: true }
    });

    console.log(`Total Paying Students: ${allStudents.length}`);

    let in2025 = 0;
    let inOthers = 0;
    const years = {};

    allStudents.forEach(s => {
        let date = s.createdAt;
        let source = "CreatedAt";
        if (s.joiningDate) {
            const d = new Date(s.joiningDate);
            if (!isNaN(d.getTime())) {
                date = d;
                source = "JoiningDate";
            }
        }

        const year = date.getFullYear();
        years[year] = (years[year] || 0) + 1;

        if (year === 2025) {
            in2025++;
        } else {
            inOthers++;
            // console.log(`[OUTLIER] ${s.name}: ${year} (${source}) - ₹${s.paidAmount}`);
        }
    });

    console.log(`Students in 2025: ${in2025}`);
    console.log(`Students in other years: ${inOthers}`);
    console.log("Year Distribution:", years);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
