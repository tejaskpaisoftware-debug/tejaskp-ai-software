const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for LOOSE duplicate invoices (User + Amount)...");

    const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'asc' },
        include: { user: true }
    });

    // Group only by UserID + Amount
    const groups = {};

    invoices.forEach(inv => {
        const userKey = inv.userId || inv.customerName;
        // Ignore items this time
        const signature = `${userKey}|${inv.amount}`;

        if (!groups[signature]) groups[signature] = [];
        groups[signature].push(inv);
    });

    console.log("\n--- Potential Duplicate Invoices (Same User + Amount) ---");
    Object.keys(groups).forEach(sig => {
        if (groups[sig].length > 1) {
            const [userKey, amount] = sig.split('|');
            const userName = groups[sig][0].user ? groups[sig][0].user.name : groups[sig][0].customerName;

            console.log(`\nUser: ${userName} (${userKey}) | Amount: ${amount}`);
            console.log(`Found ${groups[sig].length} copies:`);
            groups[sig].forEach(inv => {
                // Determine if date is close?
                console.log(`  - ID: ${inv.id} | No: ${inv.invoiceNumber} | Date: ${inv.createdAt.toISOString()} | Items: ${inv.items.substring(0, 50)}...`);
            });
        }
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
