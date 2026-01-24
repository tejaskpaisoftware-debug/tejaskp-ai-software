const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Database Counts...");

    const counts = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.invoice.count(),
        prisma.attendance.count(),
        prisma.leave.count(),
        prisma.joiningLetter.count(),
        prisma.session.count()
    ]);

    console.log("Students:", counts[0]);
    console.log("Invoices:", counts[1]);
    console.log("Attendance:", counts[2]);
    console.log("Leaves:", counts[3]);
    console.log("JoiningLetters:", counts[4]);
    console.log("Sessions:", counts[5]);

    if (counts.some(c => c > 0)) {
        console.error("❌ ERROR: Database is not empty!");
    } else {
        console.log("✅ SUCCESS: Database is clean.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
