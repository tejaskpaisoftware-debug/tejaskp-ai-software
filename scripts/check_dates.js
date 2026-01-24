
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Invoice Dates...');
    const invoices = await prisma.invoice.findMany({
        take: 5,
        select: { createdAt: true, paidAmount: true, invoiceNumber: true }
    });
    console.log('Invoices sample:', JSON.stringify(invoices, null, 2));

    console.log('Checking Aggregates...');
    const agg = await prisma.invoice.aggregate({
        _sum: { paidAmount: true }
    });
    console.log('Total Revenue:', agg._sum.paidAmount);

    console.log('Checking Raw Query...');
    try {
        // Test the exact query used in API (simplified)
        const raw = await prisma.$queryRaw`
        SELECT strftime('%Y-%m', createdAt) as period, SUM(paidAmount) as revenue
        FROM invoices
        GROUP BY strftime('%Y-%m', createdAt)
        LIMIT 5
      `;
        console.log('Raw Query Result:', raw);
    } catch (e) {
        console.error('Raw query failed:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
