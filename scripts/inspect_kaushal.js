const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Kaushal' } }
    });

    if (user) {
        console.log("Found Kaushal:");
        console.log(`ID: ${user.id}`);
        console.log(`Status: ${user.status}`);
        console.log(`Total Fees: ${user.totalFees}`);
        console.log(`Paid Amount: ${user.paidAmount}`);
        console.log(`Pending Amount: ${user.pendingAmount}`);
    } else {
        console.log("Kaushal not found.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
