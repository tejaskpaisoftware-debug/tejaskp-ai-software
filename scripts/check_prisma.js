const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma Client...");
    if (prisma.racingSession) {
        console.log("✅ prisma.racingSession EXISTS");
        try {
            const count = await prisma.racingSession.count();
            console.log("✅ Linked to DB. Session count:", count);
        } catch (e) {
            console.error("❌ DB Connection Error:", e.message);
        }
    } else {
        console.error("❌ prisma.racingSession is UNDEFINED");
        console.error("The generated client does not have the new models yet.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
