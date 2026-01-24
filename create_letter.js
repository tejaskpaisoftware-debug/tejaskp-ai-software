const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mobile = '9104630598';

    const user = await prisma.user.findUnique({
        where: { mobile: mobile }
    });

    if (!user) {
        console.log("User NOT FOUND");
        return;
    }

    // Create Letter
    const letter = await prisma.joiningLetter.create({
        data: {
            name: user.name || "Tejas kp shwo",
            email: user.email || "tejas@example.com",
            mobile: user.mobile,
            date: new Date().toISOString().split('T')[0],
            startDate: "2025-12-26",
            endDate: "2026-03-26",
            designation: "Intern - Web Development",
            internshipType: "Offline",
            stipend: "Unpaid",
            location: "Vadodara",
            reportingManager: "Tejas Patel",
            managerDesignation: "CEO",
            userId: user.id
        }
    });

    console.log("✅ Created Joining Letter:", letter.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
