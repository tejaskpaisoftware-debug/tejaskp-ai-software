const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Set a short lock timeout (5s) to error out instead of hanging
        await prisma.$executeRawUnsafe(`SET lock_timeout = '5s';`);

        console.log("Adding faceDescriptor...");
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faceDescriptor" TEXT;`);
            console.log("-> Added faceDescriptor");
        } catch (e) { console.log("-> faceDescriptor error/exists:", e.message); }

        console.log("Adding failedFaceAttempts...");
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedFaceAttempts" INTEGER DEFAULT 0;`);
            console.log("-> Added failedFaceAttempts");
        } catch (e) { console.log("-> failedFaceAttempts error/exists:", e.message); }

        console.log("Adding lockoutUntil...");
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);`);
            console.log("-> Added lockoutUntil");
        } catch (e) { console.log("-> lockoutUntil error/exists:", e.message); }

    } catch (e) {
        console.error("Global Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
