const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Invoice Creation...");

    // 1. Create a dummy user first (to link invoice to)
    const user = await prisma.user.create({
        data: {
            name: "Test User",
            mobile: "9999911111",
            role: "STUDENT",
            status: "ACTIVE",
            email: "test@example.com"
        }
    });

    console.log(`Created User: ${user.id}`);

    // 2. Try to create invoice with typical payload
    try {
        const body = {
            customerName: "Test User",
            type: "TRAINING",
            items: [{ description: "Course", quantity: 1, rate: 5000, amount: 5000 }],
            subtotal: 5000,
            total: 5000,
            paidAmount: 2000,
            userId: user.id
        };

        console.log("Creating Invoice...");

        // Emulate API logic
        // Generate Invoice Number
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: { startsWith: 'INV-' },
                NOT: { invoiceNumber: { startsWith: 'INV-IMP' } }
            },
            orderBy: { invoiceNumber: 'desc' }
        });
        let nextNumber = 1;
        if (lastInvoice?.invoiceNumber?.match(/^INV-(\d+)$/)) {
            nextNumber = parseInt(lastInvoice.invoiceNumber.match(/^INV-(\d+)$/)[1]) + 1;
        }
        const invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                customerName: body.customerName,
                type: body.type,
                items: JSON.stringify(body.items),
                subtotal: body.subtotal || 0,
                sgst: body.sgst || 0,
                cgst: body.cgst || 0,
                discount: body.discount || 0,
                total: body.total || 0,
                paidAmount: body.paidAmount || 0,
                dueDate: body.dueDate || new Date().toISOString(),
                status: "PENDING",
                userId: body.userId || null,
            }
        });

        console.log("Invoice Created:", invoice.id);

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        // Cleanup
        await prisma.invoice.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
}

main();
