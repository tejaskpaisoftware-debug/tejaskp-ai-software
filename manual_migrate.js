const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Adding faceDescriptor...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faceDescriptor" TEXT;`);

        console.log("Adding failedFaceAttempts...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedFaceAttempts" INTEGER DEFAULT 0;`);

        console.log("Adding lockoutUntil...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);`);

        console.log("Successfully added columns via raw SQL.");
    } catch (e) {
        console.error("Error executing raw SQL:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
