const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for Avdhoot and Nirav...");

    const avdhoots = await prisma.user.findMany({
        where: { name: { contains: 'Avdhoot' } }
    });
    console.log(`\nFound ${avdhoots.length} Avdhoots:`);
    avdhoots.forEach(u => console.log(` - [${u.createdAt.toISOString()}] ID: ${u.id} | Name: '${u.name}' | Mobile: '${u.mobile}' | Paid: ${u.paidAmount}`));

    const niravs = await prisma.user.findMany({
        where: { name: { contains: 'nirav' } } // Exact case for now, or just contains
    });
    console.log(`\nFound ${niravs.length} Niravs:`);
    niravs.forEach(u => console.log(` - [${u.createdAt.toISOString()}] ID: ${u.id} | Name: '${u.name}' | Mobile: '${u.mobile}' | Paid: ${u.paidAmount}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
