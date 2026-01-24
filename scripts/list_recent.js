const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Listing Recent Users...");

    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    users.forEach(u => {
        console.log(`[${u.createdAt.toISOString()}] Name: '${u.name}' | Mobile: '${u.mobile}' | Paid: ${u.paidAmount}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
