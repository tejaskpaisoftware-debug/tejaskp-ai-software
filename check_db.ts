import { prisma } from "./src/lib/prisma";

async function check() {
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log("Columns in User table:", Object.keys(users[0] || {}));
    } catch (e) {
        console.error("Error checking columns:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
