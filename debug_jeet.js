const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mobile = '9712523278';
    console.log(`Debugging User: ${mobile}`);

    const user = await prisma.user.findUnique({
        where: { mobile: mobile }
    });

    if (!user) {
        console.log("❌ User NOT FOUND.");
    } else {
        console.log("✅ User Found:");
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: '${user.name}'`);
        console.log(`   Mobile: '${user.mobile}'`);
        console.log(`   Password: '${user.password}'`);
        console.log(`   Role: '${user.role}'`);
        console.log(`   Status: '${user.status}'`);

        // Check for whitespace
        if (user.password !== user.password.trim()) {
            console.log("⚠️ WARNING: Password has leading/trailing spaces!");
        }
        if (user.mobile !== user.mobile.trim()) {
            console.log("⚠️ WARNING: Mobile has leading/trailing spaces!");
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
