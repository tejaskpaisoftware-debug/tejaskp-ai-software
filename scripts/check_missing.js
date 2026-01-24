const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for Missing 4200...");

    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, mobile: true, paidAmount: true }
    });

    const total = users.reduce((sum, u) => sum + (u.paidAmount || 0), 0);
    console.log(`Current DB Total: ${total}`);
    console.log(`Expected Total:   163449`);
    console.log(`Difference:       ${163449 - total}`);

    console.log("\nSearching for users with paidAmount == 4200...");
    const with4200 = users.filter(u => u.paidAmount === 4200);
    if (with4200.length > 0) {
        console.log("Found users with 4200 (Have they been counted? Yes):");
        with4200.forEach(u => console.log(` - ${u.name} (${u.mobile})`));
    } else {
        console.log("No users found with exactly 4200.");
    }

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
