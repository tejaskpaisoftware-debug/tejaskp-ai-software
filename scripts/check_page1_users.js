const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const checks = [
        { name: 'Hardik', expected: 500 },
        { name: 'Nishtha', expected: 500 },
        { name: 'Komal', expected: 2500 },
        { name: 'Jigar', expected: 500 },
        { name: 'Nitya', expected: 9000 },
        { name: 'Jagdish', expected: 2000 },
        { name: 'Krupa', expected: 0 },
        { name: 'Meghraj', expected: 700 },
        { name: 'Soham', expected: 1700 },
        { name: 'Devam', expected: 1000 }
    ];

    console.log("Name | Expected | Actual | Status");
    console.log("-----|----------|--------|-------");

    for (const c of checks) {
        const user = await prisma.user.findFirst({
            where: { name: { contains: c.name } }
        });

        const actual = user ? user.paidAmount : 'MISSING';
        const status = actual === c.expected ? 'OK' : 'FAIL';

        console.log(`${c.name} | ${c.expected} | ${actual} | ${status}`);

        if (user) {
            const count = await prisma.user.count({ where: { name: { contains: c.name } } });
            if (count > 1) console.log(`  WARNING: ${count} users found for ${c.name}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
