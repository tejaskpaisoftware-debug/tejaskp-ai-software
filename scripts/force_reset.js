const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting FORCE User Data Reset...");

    // 1. Unconditionally delete all transactional and student data
    // We do NOT filter by user ID here to ensure orphans are also removed.

    console.log("Deleting all Invoices...");
    await prisma.invoice.deleteMany({});

    console.log("Deleting all Attendance records...");
    await prisma.attendance.deleteMany({});

    console.log("Deleting all Leave requests...");
    await prisma.leave.deleteMany({});

    console.log("Deleting all Joining Letters...");
    await prisma.joiningLetter.deleteMany({});

    console.log("Deleting all Sessions...");
    await prisma.session.deleteMany({});

    // 2. Delete non-admin Users
    console.log("Deleting all non-admin Users...");
    const deleteUsers = await prisma.user.deleteMany({
        where: {
            role: {
                not: 'ADMIN'
            }
        }
    });

    console.log(`Deleted ${deleteUsers.count} users.`);

    // Optional: Clean up logs for non-existing users if needed, but primary concern is data visible in dashboards.
    console.log("Cleaning up orphaned System Logs...");
    // Find admins to keep their logs
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    const adminIds = admins.map(a => a.id);

    await prisma.systemLog.deleteMany({
        where: {
            userId: { notIn: adminIds }
        }
    });

    console.log("✅ FORCE RESET COMPLETE. All student data and invoices are wiped.");
    console.log("ℹ️  Purchases (Company Expenses) are PRESERVED.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
