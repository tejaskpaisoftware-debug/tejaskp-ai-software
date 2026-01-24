const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date("2026-01-03T23:59:59.999Z"); // Trusting metadata time
    console.log("Fixing invoices after:", today.toISOString());

    const futureInvoices = await prisma.invoice.findMany({
        where: {
            createdAt: {
                gt: today
            }
        },
        select: { id: true, invoiceNumber: true, createdAt: true, customerName: true }
    });

    console.log(`Found ${futureInvoices.length} future invoices to fix.`);

    for (const inv of futureInvoices) {
        // Move to December 2025.
        // We will keep the day, but change Month to Dec (11) and Year to 2025.
        // E.g. Jan 19 2026 -> Dec 19 2025.
        // If day is > 31? Dec has 31 days so it's fine.
        // Feb 01 -> Dec 01 2025?

        const oldDate = new Date(inv.createdAt);
        const newDate = new Date(oldDate);
        newDate.setFullYear(2025);
        newDate.setMonth(11); // December (0-indexed)
        // Day remains same (e.g. 5th, 8th, 19th)

        console.log(`Updating ${inv.invoiceNumber} (${inv.customerName}) from ${oldDate.toISOString()} to ${newDate.toISOString()}`);

        await prisma.invoice.update({
            where: { id: inv.id },
            data: { createdAt: newDate }
        });
    }

    console.log("All future invoices updated to December 2025.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
