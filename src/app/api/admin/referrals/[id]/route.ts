import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        // Optional: Check if we should reverse wallet transaction if it was approved?
        // For now, simple delete as requested.
        // If we want to be safe, we might want to check status. 
        // But user asked "admin delete this automatically it should be deleted from user dashboard also"
        // implying a hard delete or hiding. 

        await prisma.referral.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Referral Error:", error);
        return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
    }
}
