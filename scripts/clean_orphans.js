const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning Orphan Invoices...");

    // Find invoices with no User connected
    // Prisma doesn't always strictly enforce FK in SQLite unless enabled, 
    // but we can query where user is null (if the schema allows optional relation)
    // Schema: user User? @relation...
    // valid.

    const orphans = await prisma.invoice.deleteMany({
        where: {
            userId: null
        }
    });

    console.log(`Deleted ${orphans.count} invoices with NULL userId.`);

    // Also check for invoices where userId points to a non-existent user
    // (If SQLite FK constraints weren't enforcing cascade delete)

    // We can't do a join delete easily in one query.
    // Fetch all user IDs.
    const users = await prisma.user.findMany({ select: { id: true } });
    const userIds = new Set(users.map(u => u.id));

    const allInvoices = await prisma.invoice.findMany({ select: { id: true, userId: true } });
    const badInvoiceIds = allInvoices
        .filter(inv => inv.userId && !userIds.has(inv.userId))
        .map(inv => inv.id);

    if (badInvoiceIds.length > 0) {
        console.log(`Found ${badInvoiceIds.length} invoices pointing to non-existent users. Deleting...`);
        await prisma.invoice.deleteMany({
            where: { id: { in: badInvoiceIds } }
        });
    } else {
        console.log("No broken User FKs found.");
    }

    console.log("✅ Cleanup Complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
