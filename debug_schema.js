const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking User model...");
        // Try to select the new fields to see if Prisma Client knows about them
        // and if the DB throws an error.
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                faceDescriptor: true,
                failedFaceAttempts: true,
                lockoutUntil: true
            }
        });
        console.log("Successfully queried new fields:", user);
    } catch (error) {
        console.error("Error querying new fields:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
