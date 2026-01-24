const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.groupBy({
        by: ['name'],
        _count: { mobile: true },
        having: {
            mobile: { _count: { gt: 1 } }
        }
    });

    console.log("--- Duplicate Names ---");
    console.log(users);

    // Specific check for Jagdish/Jeet
    const jagdish = await prisma.user.findMany({ where: { name: { contains: 'Jagdish' } } });
    console.log(`Jagdish count: ${jagdish.length}`);
    const jeet = await prisma.user.findMany({ where: { name: { contains: 'Jeet' } } });
    console.log(`Jeet count: ${jeet.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
