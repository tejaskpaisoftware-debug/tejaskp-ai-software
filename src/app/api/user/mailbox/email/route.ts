import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, isRead, isStarred, folder } = body;

        if (!recipientId) {
            return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (isRead !== undefined) updateData.isRead = isRead;
        if (isStarred !== undefined) updateData.isStarred = isStarred;
        if (folder) updateData.folder = folder.toUpperCase();

        const updatedRecipient = await prisma.emailRecipient.update({
            where: { id: recipientId },
            data: updateData
        });

        return NextResponse.json({ success: true, updatedRecipient });
    } catch (error) {
        console.error("Update email recipient error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const recipientId = searchParams.get("id");

        if (!recipientId) {
            return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 });
        }

        // Check if already in trash
        const recipient = await prisma.emailRecipient.findUnique({
            where: { id: recipientId }
        });

        if (!recipient) {
            return NextResponse.json({ success: false, error: "Email record not found" }, { status: 404 });
        }

        if (recipient.folder === "TRASH") {
            // Permanent delete from this user's view
            await prisma.emailRecipient.delete({
                where: { id: recipientId }
            });
            return NextResponse.json({ success: true, deleted: true });
        } else {
            // Move to trash
            await prisma.emailRecipient.update({
                where: { id: recipientId },
                data: { folder: "TRASH" }
            });
            return NextResponse.json({ success: true, trashed: true });
        }
    } catch (error) {
        console.error("Delete/Trash email error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
