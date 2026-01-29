const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renameMailbox() {
    const oldEmail = "test_1769595265671@tejaskpaiportal.com";
    const newEmail = "tejaspatel.ceo@tejaskpaiportal.com";

    console.log(`🔄 Attempting to rename ${oldEmail} to ${newEmail}...`);

    try {
        const mailbox = await prisma.mailbox.findUnique({
            where: { emailAddress: oldEmail }
        });

        if (!mailbox) {
            console.log(`❌ Mailbox not found: ${oldEmail}`);
            return;
        }

        await prisma.mailbox.update({
            where: { id: mailbox.id },
            data: { emailAddress: newEmail }
        });

        console.log(`✅ Success! Renamed to ${newEmail}`);
        console.log(`   (Mailbox ID: ${mailbox.id})`);

    } catch (error) {
        console.error('❌ Error renaming mailbox:', error);
    } finally {
        await prisma.$disconnect();
    }
}

renameMailbox();
