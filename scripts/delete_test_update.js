const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Deleting 'Test Update'...");
        // Use raw query to ensure we hit the table even if model def is stale
        await prisma.$executeRaw`DELETE FROM announcements WHERE title = 'Test Update'`;
        console.log("Deleted 'Test Update'.");
    } catch (e) {
        console.error("Error deleting:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
