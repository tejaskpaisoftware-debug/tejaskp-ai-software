const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Testing API Aggregation...");

    // Simulate Dashboard API
    const totalRevenue = await prisma.invoice.aggregate({
        _sum: {
            paidAmount: true,
        },
    });

    console.log(`API Aggregation Result: ${totalRevenue._sum.paidAmount}`);

    // Compare with previous manual sum
    // Manual sum was 166949.
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
