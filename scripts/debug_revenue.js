const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Starting Database Audit ---");

    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, mobile: true, totalFees: true, paidAmount: true, pendingAmount: true }
    });

    console.log(`Found ${users.length} Student Records.`);

    let totalFees = 0;
    let totalPaid = 0;
    let totalPending = 0;

    users.forEach(u => {
        const fees = u.totalFees || 0;
        const paid = u.paidAmount || 0;
        const pending = u.pendingAmount || 0;

        totalFees += fees;
        totalPaid += paid;
        totalPending += pending;

        // Log suspicious rows
        if (paid > 0 || fees > 0) {
            // console.log(`${u.name} (${u.mobile}): Fees=${fees}, Paid=${paid}, Pending=${pending}`);
        }
    });

    console.log("-----------------------------------------");
    console.log(`GRAND TOTAL FEES:    ${totalFees}`);
    console.log(`GRAND TOTAL PAID:    ${totalPaid}`);
    console.log(`GRAND TOTAL PENDING: ${totalPending}`);
    console.log("-----------------------------------------");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
