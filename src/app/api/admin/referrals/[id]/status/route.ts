import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { status, amount } = await request.json(); // Admin can override amount

        const referral = await prisma.referral.findUnique({ where: { id } });
        if (!referral) return NextResponse.json({ error: "Referral not found" }, { status: 404 });

        // Logic check: Can only approve if pending
        if (referral.status !== 'PENDING') {
            return NextResponse.json({ error: "Referral is already processed" }, { status: 400 });
        }

        const payoutAmount = amount ? parseFloat(amount) : (referral.type === 'ENROLLMENT' ? 50.0 : 0);

        // Transaction: Update Status + Credit Wallet + Create Notification
        await prisma.$transaction(async (tx) => {
            // 1. Update Referral
            await tx.referral.update({
                where: { id },
                data: {
                    status,
                    amount: status === 'APPROVED' ? payoutAmount : 0
                }
            });

            // 2. Credit Wallet if Approved
            if (status === 'APPROVED') {
                await tx.user.update({
                    where: { id: referral.referrerId },
                    data: {
                        walletBalance: { increment: payoutAmount }
                    }
                });

                // 3. Notify User
                await tx.notification.create({
                    data: {
                        userId: referral.referrerId,
                        title: "Referral Approved! 🎉",
                        message: `Your referral has been approved. ₹${payoutAmount} has been credited to your wallet.`,
                        type: "SUCCESS"
                    }
                });
            } else if (status === 'REJECTED') {
                // Notify Rejection
                await tx.notification.create({
                    data: {
                        userId: referral.referrerId,
                        title: "Referral Update",
                        message: `Your referral has been marked as REJECTED.`,
                        type: "WARNING"
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Referral Status Error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
