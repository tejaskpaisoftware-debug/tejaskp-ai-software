const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ids = ['805f8e50-1fae-4477-8203-4799863b43b6', '6c361f0b-8822-47be-ba81-1fd30dcbe403'];

    const invoices = await prisma.invoice.findMany({
        where: { id: { in: ids } }
    });

    console.log(JSON.stringify(invoices, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
