const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking for blocking locks...");

        // Attempt to terminate backends holding locks on the 'users' table or just idle transactions
        const result = await prisma.$queryRaw`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE 
          pid <> pg_backend_pid()
          AND datname = current_database()
          AND (state = 'idle in transaction' OR state = 'active');
    `;

        console.log("Terminated sessions:", result);

        console.log("Retrying migration now...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faceDescriptor" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedFaceAttempts" INTEGER DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);`);
        console.log("Migration SUCCESS!");

    } catch (e) {
        console.error("Unlock Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
