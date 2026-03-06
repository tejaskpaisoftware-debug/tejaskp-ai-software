import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restrictToAdmin } from "@/lib/auth-server";

export async function POST(request: Request) {
    const auth = await restrictToAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { amount, description, category, date } = body;

        if (!amount) {
            return NextResponse.json({ success: false, error: "Amount is required" }, { status: 400 });
        }

        const purchase = await prisma.purchase.create({
            data: {
                amount: parseFloat(amount),
                description: description || "Expense",
                category,
                date: date ? new Date(date) : new Date()
            }
        });

        return NextResponse.json({ success: true, purchase });
    } catch (error) {
        console.error("Create Purchase Error:", error);
        return NextResponse.json({ success: false, error: "Failed to create purchase" }, { status: 500 });
    }
}
