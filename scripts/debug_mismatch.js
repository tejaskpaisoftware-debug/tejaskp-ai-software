const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deep Dive into Revenue Mismatch...");

    // 1. Fetch All Students and their Paid Amount
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, mobile: true, paidAmount: true }
    });

    // Map Student ID -> Paid Amount
    const studentMap = new Map();
    students.forEach(s => studentMap.set(s.id, s));

    // 2. Fetch All Invoices
    const invoices = await prisma.invoice.findMany({
        include: { user: true }
    });

    let invoiceTotal = 0;
    let matchedInvoiceTotal = 0;
    let ghostInvoiceTotal = 0;

    console.log(`Checking ${invoices.length} invoices...`);

    for (const inv of invoices) {
        invoiceTotal += inv.paidAmount;

        if (!inv.userId) {
            console.log(`[GHOST] Invoice ${inv.invoiceNumber} (Amount: ${inv.paidAmount}) has NO User ID.`);
            ghostInvoiceTotal += inv.paidAmount;
            continue;
        }

        const user = studentMap.get(inv.userId);
        if (!user) {
            // Check if user exists but is NOT a student
            const nonStudent = await prisma.user.findUnique({ where: { id: inv.userId } });
            if (nonStudent) {
                console.log(`[NON-STUDENT] Invoice ${inv.invoiceNumber} (Amount: ${inv.paidAmount}) belongs to ${nonStudent.name} (${nonStudent.role}).`);
            } else {
                console.log(`[ORPHAN] Invoice ${inv.invoiceNumber} (Amount: ${inv.paidAmount}) points to missing user ${inv.userId}.`);
            }
            ghostInvoiceTotal += inv.paidAmount;
        } else {
            matchedInvoiceTotal += inv.paidAmount;
        }
    }

    console.log("\n--- SUMMARY ---");
    console.log(`Total Invoice Revenue: ${invoiceTotal}`);
    console.log(`Matched Student Revenue: ${matchedInvoiceTotal}`);
    console.log(`Unmatched/Ghost Revenue: ${ghostInvoiceTotal}`);

    // Check for Student Amount Mismatches
    console.log("\n--- STUDENT BALANCE CHECK ---");
    for (const s of students) {
        // Get invoices for this student
        const studentInvoices = invoices.filter(i => i.userId === s.id);
        const invSum = studentInvoices.reduce((sum, i) => sum + i.paidAmount, 0);

        if (Math.abs(invSum - (s.paidAmount || 0)) > 1) {
            console.log(`[MISMATCH] Student ${s.name} (${s.mobile}): User Table says ${s.paidAmount}, Invoices say ${invSum}. Diff: ${invSum - s.paidAmount}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
