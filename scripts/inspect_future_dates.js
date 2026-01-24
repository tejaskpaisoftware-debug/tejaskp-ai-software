const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date("2026-01-03T23:59:59.999Z"); // Trusting metadata time
    console.log("Checking for transactions after:", today.toISOString());

    const futureInvoices = await prisma.invoice.findMany({
        where: {
            createdAt: {
                gt: today
            }
        },
        select: { id: true, invoiceNumber: true, createdAt: true, customerName: true }
    });

    console.log(`Found ${futureInvoices.length} future invoices:`);
    futureInvoices.forEach(inv => {
        console.log(`- ${inv.invoiceNumber} (${inv.customerName}): ${inv.createdAt.toISOString()}`);
    });

    const futurePurchases = await prisma.purchase.findMany({
        where: {
            date: {
                gt: today
            }
        },
        select: { id: true, description: true, date: true }
    });

    console.log(`Found ${futurePurchases.length} future purchases:`);
    futurePurchases.forEach(p => {
        console.log(`- ${p.description}: ${p.date.toISOString()}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
