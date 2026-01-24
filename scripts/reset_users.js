const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Safe User Reset...");

    // 1. Identify Users to Delete (Everyone except ADMIN)
    const usersToDelete = await prisma.user.findMany({
        where: {
            role: {
                not: 'ADMIN' // Keep Admin Safe
            }
        },
        select: { id: true }
    });

    const userIds = usersToDelete.map(u => u.id);

    if (userIds.length === 0) {
        console.log("No users to delete.");
        return;
    }

    console.log(`Found ${userIds.length} users to delete.`);

    // 2. Delete Related Data (Dependencies)
    // Deleting records linked to these specific users
    await prisma.attendance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.leave.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.joiningLetter.deleteMany({ where: { userId: { in: userIds } } });

    // System Logs linked to these users
    await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } });

    // Invoices linked to these users (assuming invoices are user-specific data)
    // Note: If you want to keep invoices for accounting even after user delete, you should set userId to null instead.
    // But usually for a "reset" we wipe them.
    await prisma.invoice.deleteMany({ where: { userId: { in: userIds } } });

    // 3. Delete the Users
    await prisma.user.deleteMany({
        where: {
            id: { in: userIds }
        }
    });

    console.log("✅ Successfully deleted all non-admin users and their related data.");
    console.log("ℹ️  Purchases (Expenses) were preserved.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
