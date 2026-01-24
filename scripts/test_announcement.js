const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to create announcement...");
        const announcement = await prisma.announcement.create({
            data: {
                title: "Test Update",
                content: "This is a test content from script."
            }
        });
        console.log("Success! Created:", announcement);
    } catch (e) {
        console.error("Error creating announcement:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
