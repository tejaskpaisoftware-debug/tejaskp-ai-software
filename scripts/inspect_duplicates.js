const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ids = ['a487f962-6488-4fda-bf54-a9ae51e24a81', '204c563a-f7cf-42b3-9ce9-a61ffc171d39'];

    const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        include: {
            invoices: true,
            attendance: true
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
