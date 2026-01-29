const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateDomain() {
    console.log('🔄 Starting domain migration...');

    try {
        const mailboxes = await prisma.mailbox.findMany({
            where: {
                emailAddress: {
                    contains: '@portal.tejaskp.com'
                }
            }
        });

        console.log(`Found ${mailboxes.length} mailboxes to migrate.`);

        for (const mb of mailboxes) {
            const newAddress = mb.emailAddress.replace('@portal.tejaskp.com', '@tejaskpaiportal.com');
            console.log(`Migrating: ${mb.emailAddress} -> ${newAddress}`);

            await prisma.mailbox.update({
                where: { id: mb.id },
                data: { emailAddress: newAddress }
            });
        }

        console.log('✅ Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateDomain();
