const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const names = ['Jagdish', 'Jeet'];

    for (const name of names) {
        const users = await prisma.user.findMany({
            where: { name: { contains: name } }
        });
        console.log(`--- Checking: ${name} ---`);
        if (users.length === 0) console.log("NOT FOUND");
        users.forEach(u => {
            console.log(`Name: ${u.name}`);
            console.log(`Mobile: ${u.mobile}`);
            console.log(`Paid: ${u.paidAmount}`);
            console.log(`TotalFees: ${u.totalFees}`);
            console.log(`Pending: ${u.pendingAmount}`);
            console.log('---');
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
