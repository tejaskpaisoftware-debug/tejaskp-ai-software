const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing Ghost Student...");

    // 1. Find the student with 0 Paid Amount but > 0 Invoice Amount
    // Based on previous debug: Name might be empty.

    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: { invoices: true }
    });

    for (const s of students) {
        const invSum = s.invoices.reduce((sum, i) => sum + i.paidAmount, 0);
        const userPaid = s.paidAmount || 0;

        if (invSum > 0 && userPaid === 0) {
            console.log(`Found Ghost: ID ${s.id} | Name: '${s.name}' | Mobile: '${s.mobile}' | UserPaid: ${userPaid} | InvSum: ${invSum}`);

            // Delete Invoices FIRST
            console.log("Deleting Invoices...");
            const delInv = await prisma.invoice.deleteMany({
                where: { userId: s.id }
            });
            console.log(`Deleted ${delInv.count} invoices.`);

            // If name/mobile are empty, delete User too (likely junk)
            if (!s.name || !s.mobile || s.name.trim() === '') {
                console.log("User appears to be junk (empty name). Deleting User...");
                await prisma.user.delete({ where: { id: s.id } });
                console.log("Deleted User.");
            } else {
                console.warn("User has name/mobile. NOT deleting user, just cleared mismatched invoices.");
            }
        }
    }

    console.log("✅ Fix Complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
