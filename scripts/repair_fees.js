const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log(" repairing user fees...");

    // Find users with Paid > 0 but Total Fees is null or 0
    const users = await prisma.user.findMany({
        where: {
            paidAmount: { gt: 0 },
            OR: [
                { totalFees: null },
                { totalFees: 0 }
            ]
        }
    });

    console.log(`Found ${users.length} users to repair.`);

    for (const u of users) {
        // Set totalFees to at least paidAmount so Pending isn't negative
        const newTotalFees = u.paidAmount;
        const newPending = 0; // If they paid what we set as total, pending is 0.

        await prisma.user.update({
            where: { id: u.id },
            data: {
                totalFees: newTotalFees,
                pendingAmount: newPending,
                status: 'ACTIVE' // Auto activate
            }
        });
        console.log(`Updated ${u.name}: Fees -> ${newTotalFees}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
