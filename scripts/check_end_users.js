const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const specific = ['Trupal', 'Patel Aryan', 'Patel Shivang', 'Vraj Shah'];

    for (const name of specific) {
        const u = await prisma.user.findFirst({ where: { name: { contains: name } } });
        if (u) console.log(`${u.name}: ${u.paidAmount} (Total: ${u.totalFees})`);
        else console.log(`${name}: MISSING`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
