const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing Revenue Discrepancy...");

    // 1. User Table Sum
    const userAgg = await prisma.user.aggregate({
        _sum: { paidAmount: true },
        where: { role: 'STUDENT' }
    });
    const userTotal = userAgg._sum.paidAmount || 0;

    // 2. Invoice Table Sum
    const invAgg = await prisma.invoice.aggregate({
        _sum: { paidAmount: true }
    });
    const invTotal = invAgg._sum.paidAmount || 0;

    console.log(`User Table Total (Paid):   INR ${userTotal.toLocaleString()}`);
    console.log(`Invoice Table Total (Paid): INR ${invTotal.toLocaleString()}`);
    console.log(`Difference:                INR ${(userTotal - invTotal).toLocaleString()}`);

    // Detail Check
    if (userTotal !== invTotal) {
        console.log("\nChecking for users without invoices...");

        const users = await prisma.user.findMany({
            where: { role: 'STUDENT', paidAmount: { gt: 0 } },
            select: { mobile: true, name: true, paidAmount: true }
        });

        let missingInvCount = 0;
        let diffAmount = 0;

        for (const u of users) {
            // Find invoices for this user
            // The upload script links via User Relation (mobile) OR Invoice Number convention
            const invoices = await prisma.invoice.findMany({
                where: {
                    OR: [
                        { user: { mobile: u.mobile } },
                        { invoiceNumber: `INV-IMP-${u.mobile}` }
                    ]
                }
            });

            const invSum = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

            if (Math.abs(u.paidAmount - invSum) > 1) { // 1 rupee tolerance
                console.log(`Mismatch: ${u.name} (${u.mobile}) | User: ${u.paidAmount} | Inv: ${invSum}`);
                missingInvCount++;
                diffAmount += (u.paidAmount - invSum);
            }
        }
        console.log(`\nFound ${missingInvCount} users with mismatched invoice amounts.`);
        console.log(`Total Mismatch value: INR ${diffAmount.toLocaleString()}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
