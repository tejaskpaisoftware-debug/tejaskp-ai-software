const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mobile = "9876543210";
    const password = "admin"; // Logic will migrate this on login

    console.log(`Seeding Admin User: ${mobile}`);

    // Upsert Admin User
    const user = await prisma.user.upsert({
        where: { mobile },
        update: {
            status: "ACTIVE",
            role: "ADMIN",
            password: password // Reset to plain text to test migration
        },
        create: {
            mobile,
            name: "Super Admin",
            password: password,
            role: "ADMIN",
            status: "ACTIVE",
            email: "admin@example.com"
        }
    });

    console.log("Admin seeded:", user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
