const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for duplicate invoices...");

    const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'asc' },
        include: { user: true }
    });

    console.log(`Total invoices: ${invoices.length}`);

    // Group by UserID + Amount + Date (fuzzy) ? 
    // Or UserID + Amount + Items?

    // Let's group by "Signature": UserID + Amount + Items String
    const groups = {};

    invoices.forEach(inv => {
        // We use customerName if userId is null (though most should have userId)
        const userKey = inv.userId || inv.customerName;
        // Create a signature. 
        // We'll treat invoices as duplicates if they are for the same user, same amount, and same items.
        // We ignore the Invoice Number as that is likely unique (INV-001, INV-002) but the content might be duplicated.
        const signature = `${userKey}|${inv.amount}|${inv.items}`;

        if (!groups[signature]) groups[signature] = [];
        groups[signature].push(inv);
    });

    console.log("\n--- Potential Duplicate Invoices ---");
    let duplicateCount = 0;
    Object.keys(groups).forEach(sig => {
        if (groups[sig].length > 1) {
            duplicateCount++;
            const [userKey, amount] = sig.split('|');
            const userName = groups[sig][0].user ? groups[sig][0].user.name : groups[sig][0].customerName;

            console.log(`\nUser: ${userName} (${userKey}) | Amount: ${amount}`);
            console.log(`Found ${groups[sig].length} copies:`);
            groups[sig].forEach(inv => {
                console.log(`  - ID: ${inv.id} | No: ${inv.invoiceNumber} | Date: ${inv.createdAt.toISOString()} | Status: ${inv.status}`);
            });
        }
    });

    if (duplicateCount === 0) {
        console.log("No obvious duplicates found (Same User + Amount + Items).");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
