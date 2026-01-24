import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ message: "ID Required" }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id }
        });

        if (!invoice) {
            return NextResponse.json(
                { message: "Invoice not found" },
                { status: 404 }
            );
        }

        // Parse items JSON
        const formattedInvoice = {
            ...invoice,
            items: JSON.parse(invoice.items)
        };

        return NextResponse.json({ invoice: formattedInvoice });
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}


export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ message: "ID Required" }, { status: 400 });
        }

        // Destructure all possible fields
        const {
            customerName,
            items, // Array
            subtotal,
            discount,
            sgst,
            cgst,
            total,
            paidAmount,
            dueDate
        } = body;

        // Prepare data object, only including defined fields
        const updateData: any = {};
        if (customerName !== undefined) updateData.customerName = customerName;
        if (items !== undefined) updateData.items = JSON.stringify(items); // Convert back to string
        if (subtotal !== undefined) updateData.subtotal = subtotal;
        if (discount !== undefined) updateData.discount = discount;
        if (sgst !== undefined) updateData.sgst = sgst;
        if (cgst !== undefined) updateData.cgst = cgst;
        if (total !== undefined) updateData.total = total;
        if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: updateData
        });

        // Parse items for response
        const formattedInvoice = {
            ...updatedInvoice,
            items: JSON.parse(updatedInvoice.items)
        };

        return NextResponse.json({ message: "Invoice updated", invoice: formattedInvoice });
    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ message: "ID Required" }, { status: 400 });
        }

        await prisma.invoice.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
