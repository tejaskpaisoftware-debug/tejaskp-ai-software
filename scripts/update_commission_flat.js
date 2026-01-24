const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Updating all projects to flat 5% commission...");

    const result = await prisma.project.updateMany({
        data: {
            commissionRate: 5.0
        }
    });

    console.log(`Updated ${result.count} projects to 5% commission.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
