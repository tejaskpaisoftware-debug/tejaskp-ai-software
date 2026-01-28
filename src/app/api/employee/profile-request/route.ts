import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { userId, updates } = await req.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
        }

        // Save updates to pendingUpdate field
        await prisma.user.update({
            where: { id: userId },
            data: {
                pendingUpdate: JSON.stringify(updates)
            }
        });

        // Create a notification for admin
        const admin = await prisma.user.findFirst({
            where: { role: "ADMIN" }
        });

        await prisma.notification.create({
            data: {
                userId: admin?.id || userId,
                title: "Profile Approval Request",
                message: `User ${userId} has submitted a profile update request.`,
                type: "INFO"
            }
        });

        return NextResponse.json({ success: true, message: "Request submitted for approval" });
    } catch (error: any) {
        console.error("Profile request error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
