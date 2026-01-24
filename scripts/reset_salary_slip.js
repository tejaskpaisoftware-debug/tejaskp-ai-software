const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = "fbee3871-9c7b-42c9-8604-44b84a3354ac"; // TEST EMPLOYEE ID
    const month = "January";
    const year = "2026";

    console.log(`Deleting Salary Slip for User ${userId} (${month} ${year})...`);

    const deleted = await prisma.salarySlip.deleteMany({
        where: {
            userId: userId,
            month: month,
            year: year
        }
    });

    console.log(`Deleted ${deleted.count} salary slips.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
