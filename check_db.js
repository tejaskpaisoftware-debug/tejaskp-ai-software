const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mobile = '9104630598';
    console.log(`Checking for user with mobile: ${mobile}`);

    const user = await prisma.user.findUnique({
        where: { mobile: mobile }
    });

    if (!user) {
        console.log("User NOT FOUND");
        return;
    }

    console.log("User Found:", user.id, user.name);

    // Check for letter
    console.log(`Checking for letter for userId: ${user.id}`);
    const letter = await prisma.joiningLetter.findFirst({
        where: { userId: user.id }
    });

    if (letter) {
        console.log("✅ Letter Found:", letter.id);
    } else {
        console.log("❌ No Letter Found linked to this user.");

        // Check if a letter exists with this mobile but no UserID (orphan?)
        const orphan = await prisma.joiningLetter.findFirst({
            where: { mobile: mobile }
        });

        if (orphan) {
            console.log("⚠️ Orphan Letter Found (matches mobile but not userId):", orphan.id);
            console.log("Updating orphan letter to link to user...");
            await prisma.joiningLetter.update({
                where: { id: orphan.id },
                data: { userId: user.id }
            });
            console.log("Orphan letter linked!");
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
