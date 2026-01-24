const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = "fbee3871-9c7b-42c9-8604-44b84a3354ac"; // ID from user error
    console.log("Attempting to update user:", userId);

    const salaryDetails = JSON.stringify({ basic: 15000, hra: 6000, special: 4000, pf: 1800, pt: 200 });

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                salaryDetails: salaryDetails
            }
        });
        console.log("Success! Updated user:", updated);
    } catch (e) {
        console.error("Prisma Update Failed:");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
