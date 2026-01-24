const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning Database...");

    // 1. Delete Dependencies First
    await prisma.attendance.deleteMany({});
    await prisma.leave.deleteMany({});
    await prisma.systemLog.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.joiningLetter.deleteMany({});

    // 2. Delete Transactions
    await prisma.invoice.deleteMany({});
    await prisma.purchase.deleteMany({});

    // 3. Delete Users (Students)
    const result = await prisma.user.deleteMany({ where: { role: 'STUDENT' } });

    console.log(`Database Wiped: ${result.count} Students removed.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
