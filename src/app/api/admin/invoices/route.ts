import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Force recompile: 1

// POST: Create Invoice
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Generate Invoice Number (Simple logic, can be improved)
        // Generate Invoice Number (Sequential: INV-0001, INV-0002...)
        // Generate Invoice Number (Sequential: INV-0001, INV-0002...)
        // Fix: Ignore INV-IMP (Imported) invoices when calculating sequence
        // Check for duplicate invoice (Same User + Same Amount + < 15 seconds ago)
        const duplicateCheckTime = new Date(Date.now() - 15 * 1000); // 15 seconds ago

        const recentInvoice = await prisma.invoice.findFirst({
            where: {
                OR: [
                    { userId: body.userId || "undefined_check" },
                    { customerName: body.customerName }
                ],
                // Check if Total matches (exact match)
                total: body.total || 0,
                createdAt: { gt: duplicateCheckTime }
            }
        });

        if (recentInvoice) {
            return NextResponse.json(
                { message: "Duplicate invoice detected. Please wait 15 seconds." },
                { status: 429 }
            );
        }

        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: { startsWith: 'INV-' },
                NOT: { invoiceNumber: { startsWith: 'INV-IMP' } }
            },
            orderBy: { invoiceNumber: 'desc' } // Order by Number to get highest
        });

        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const match = lastInvoice.invoiceNumber.match(/^INV-(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;

        // Create Invoice and Update User within a Transaction
        const { invoice, updatedUser } = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    customerName: body.customerName,
                    type: body.type,
                    items: JSON.stringify(body.items || []), // Default empty array
                    subtotal: body.subtotal || 0,
                    sgst: body.sgst || 0,
                    cgst: body.cgst || 0,
                    discount: body.discount || 0,
                    total: body.total || 0,
                    paidAmount: body.paidAmount || 0,
                    dueDate: body.dueDate || new Date().toISOString(),
                    status: (body.paidAmount || 0) >= (body.total || 0) ? "PAID" : "PARTIAL", // Auto-calc status
                    userId: body.userId || null,
                }
            });

            let updatedUser = null;
            if (body.userId) {
                // Update User Stats
                const user = await tx.user.findUnique({ where: { id: body.userId } });
                if (user) {
                    const newPaid = (user.paidAmount || 0) + (body.paidAmount || 0);
                    // Pending = Total Fees - Paid. 
                    const newPending = (user.totalFees || 0) - newPaid;

                    updatedUser = await tx.user.update({
                        where: { id: user.id },
                        data: {
                            paidAmount: newPaid,
                            pendingAmount: newPending,
                            // Optionally update total fees if it was 0?
                            // For now, respect existing totalFees.
                        }
                    });
                }
            }

            return { invoice: newInvoice, updatedUser };
        });

        return NextResponse.json({
            message: "Invoice Generated Successfully",
            invoiceId: invoice.id
        });
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// GET: List Invoices
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user");

        let invoices;
        if (userId) {
            invoices = await prisma.invoice.findMany({
                where: { userId },
                include: { user: true }
            });
        } else {
            invoices = await prisma.invoice.findMany({
                include: { user: true }
            });
        }

        // Parse items back to JSON for frontend compatibility
        const formattedInvoices = invoices.map((inv: any) => ({
            ...inv,
            items: JSON.parse(inv.items)
        }));

        return NextResponse.json({ invoices: formattedInvoices });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
