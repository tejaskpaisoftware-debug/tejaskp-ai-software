require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Use DIRECT_URL for reliable write connection
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

const sqlitePath = path.join(__dirname, 'prisma/dev.db');
const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);

function query(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrateUsers() {
    console.log('Migrating Users...');
    const users = await query("SELECT * FROM users");
    console.log(`Found ${users.length} users in SQLite.`);

    for (const u of users) {
        try {
            // Check if exists
            const exists = await prisma.user.findFirst({
                where: { OR: [{ email: u.email }, { mobile: u.mobile }] }
            });

            if (exists) {
                console.log(`Skipping existing user: ${u.email || u.mobile}`);
                continue;
            }

            // Clean up boolean/date fields if necessary
            await prisma.user.create({
                data: {
                    id: u.id,
                    email: u.email,
                    mobile: u.mobile,
                    password: u.password,
                    name: u.name,
                    role: u.role,
                    status: u.status,
                    details: u.details,
                    course: u.course,
                    college: u.college,
                    university: u.university,
                    paymentMode: u.paymentMode,
                    totalFees: u.totalFees ? parseFloat(u.totalFees) : null,
                    paidAmount: u.paidAmount ? parseFloat(u.paidAmount) : null,
                    pendingAmount: u.pendingAmount ? parseFloat(u.pendingAmount) : null,
                    studyMode: u.studyMode,
                    duration: u.duration,
                    joiningDate: u.joiningDate,
                    endDate: u.endDate,
                    createdAt: new Date(u.createdAt),
                    updatedAt: new Date(u.updatedAt),
                    isChatEnabled: u.isChatEnabled ? true : false,
                    referralCode: u.referralCode,
                    walletBalance: u.walletBalance ? parseFloat(u.walletBalance) : 0,
                    referredBy: u.referredBy
                }
            });
            console.log(`Migrated user: ${u.email || u.mobile}`);
        } catch (e) {
            console.error(`Failed to migrate user ${u.mobile}:`, e.message);
        }
    }
}

async function migrateInvoices() {
    console.log('Migrating Invoices...');
    try {
        const invoices = await query("SELECT * FROM invoices");
        console.log(`Found ${invoices.length} invoices.`);

        for (const inv of invoices) {
            const exists = await prisma.invoice.findUnique({
                where: { invoiceNumber: inv.invoiceNumber }
            });
            if (exists) continue;

            await prisma.invoice.create({
                data: {
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    customerName: inv.customerName,
                    type: inv.type,
                    items: inv.items,
                    subtotal: inv.subtotal,
                    discount: inv.discount,
                    sgst: inv.sgst,
                    cgst: inv.cgst,
                    total: inv.total,
                    paidAmount: inv.paidAmount,
                    dueDate: inv.dueDate,
                    status: inv.status,
                    userId: inv.userId,
                    createdAt: new Date(inv.createdAt),
                    updatedAt: new Date(inv.updatedAt),
                }
            });
            process.stdout.write('.');
        }
        console.log('\nInvoices Done.');
    } catch (e) {
        console.log('No invoices table or error:', e.message);
    }
}

// Add other tables as needed based on schema

async function main() {
    try {
        await migrateUsers();
        await migrateInvoices();
        // Assuming other tables are less critical for initial dashboard view or empty
        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Fatal Error:', e);
    } finally {
        db.close();
        await prisma.$disconnect();
    }
}

main();
