import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { userId, action } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.pendingUpdate) {
            return NextResponse.json({ success: false, message: "No pending update found for this user" }, { status: 404 });
        }

        if (action === "APPROVE") {
            const updates = JSON.parse(user.pendingUpdate);

            // Merge updates into user model
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mobile: updates.mobile,
                    currentAddress: updates.currentAddress,
                    emergencyContact: updates.emergencyContact,
                    panNumber: updates.panCard,
                    aadharCard: updates.aadharCard, // Wait, does schema have aadharCard? Let me check
                    bankName: updates.bankDetails?.bankName,
                    accountNumber: updates.bankDetails?.accountNo,
                    ifscCode: updates.bankDetails?.ifsc,
                    skills: updates.skills,
                    photoUrl: updates.photoUrl,
                    pendingUpdate: null // Clear pending
                }
            });

            // Notify user
            await prisma.notification.create({
                data: {
                    userId: userId,
                    title: "Profile Approved",
                    message: "Your profile update request has been approved.",
                    type: "SUCCESS"
                }
            });

            return NextResponse.json({ success: true, message: "Profile update approved" });
        } else if (action === "REJECT") {
            await prisma.user.update({
                where: { id: userId },
                data: { pendingUpdate: null }
            });

            // Notify user
            await prisma.notification.create({
                data: {
                    userId: userId,
                    title: "Profile Rejected",
                    message: "Your profile update request has been rejected by the administrator.",
                    type: "ERROR"
                }
            });

            return NextResponse.json({ success: true, message: "Profile update rejected" });
        }

        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Profile approval error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
