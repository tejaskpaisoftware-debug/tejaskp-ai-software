const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up duplicates...');

    // 1. Get all submissions
    const submissions = await prisma.submission.findMany({
        orderBy: { submittedAt: 'desc' }
    });

    const seen = new Set();
    const toDelete = [];

    for (const sub of submissions) {
        // Key: userId + week
        const key = `${sub.userId}_${sub.weekStartDate}`;

        if (seen.has(key)) {
            // Already saw a newer version (because we sorted desc), so this is old. Delete it.
            toDelete.push(sub.id);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        await prisma.submission.deleteMany({
            where: {
                id: { in: toDelete }
            }
        });
        console.log("Deleted duplicates.");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
