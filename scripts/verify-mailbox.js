const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testMailbox() {
    console.log("🚀 Starting Mailbox System Verification...");

    try {
        // 1. Get a test user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("❌ No users found in database to test with.");
            return;
        }
        console.log(`✅ Found test user: ${user.name} (${user.id})`);

        // 2. Provision Mailbox
        const emailAddress = `test_${Date.now()}@tejaskpaiportal.com`;
        console.log(`📡 Provisioning mailbox: ${emailAddress}`);

        let mailbox = await prisma.mailbox.findUnique({ where: { userId: user.id } });
        if (!mailbox) {
            mailbox = await prisma.mailbox.create({
                data: {
                    userId: user.id,
                    emailAddress: emailAddress,
                    storageLimit: 5368709120
                }
            });
            console.log("✅ Mailbox provisioned successfully.");
        } else {
            console.log(`ℹ️ User already has mailbox: ${mailbox.emailAddress}`);
        }

        // 3. Send Test Email (Self)
        console.log("📧 Sending internal test email (self-send)...");
        const email = await prisma.email.create({
            data: {
                subject: "System Verification Test",
                body: "This is a secure internal test message.",
                senderId: mailbox.id
            }
        });

        // Inbox Recipient
        await prisma.emailRecipient.create({
            data: {
                emailId: email.id,
                mailboxId: mailbox.id,
                folder: "INBOX"
            }
        });

        // Sent Recipient
        await prisma.emailRecipient.create({
            data: {
                emailId: email.id,
                mailboxId: mailbox.id,
                folder: "SENT",
                isRead: true
            }
        });
        console.log("✅ Test email sent and recipients created.");

        // 4. Verify Records
        const inboxCount = await prisma.emailRecipient.count({
            where: { mailboxId: mailbox.id, folder: "INBOX" }
        });
        const sentCount = await prisma.emailRecipient.count({
            where: { mailboxId: mailbox.id, folder: "SENT" }
        });

        console.log(`📊 Stats for ${mailbox.emailAddress}:`);
        console.log(`   - Inbox: ${inboxCount}`);
        console.log(`   - Sent: ${sentCount}`);

        if (inboxCount > 0 && sentCount > 0) {
            console.log("🎉 VERIFICATION SUCCESS: Mailbox system is operational!");
        } else {
            console.error("❌ VERIFICATION FAILED: Records not found.");
        }

    } catch (e) {
        console.error("❌ Test failed with error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testMailbox();
