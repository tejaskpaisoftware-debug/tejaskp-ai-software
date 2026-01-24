import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
        console.log("Processing Data Reset Request...");

        // 1. Transaction to Delete All Data
        await prisma.$transaction(async (tx) => {
            // Delete Dependencies
            await tx.attendance.deleteMany({});
            await tx.leave.deleteMany({});
            await tx.joiningLetter.deleteMany({});
            await tx.session.deleteMany({});
            await tx.invoice.deleteMany({});

            // Fix: Delete Missing User Relations to prevent FK Errors
            await tx.certificate.deleteMany({});
            await tx.salarySlip.deleteMany({});
            await tx.submission.deleteMany({});
            await tx.notification.deleteMany({});
            await tx.referral.deleteMany({});

            // Fix: Delete Chat & AI Data
            await tx.message.deleteMany({});
            await tx.conversation.deleteMany({});
            await tx.aiMessage.deleteMany({});
            await tx.aiSession.deleteMany({});

            // Fix: Delete Game Data
            await tx.racingPlayer.deleteMany({});
            await tx.racingSession.deleteMany({});
            await tx.racingLeaderboard.deleteMany({});

            // Delete Students (Non-Admin Users)
            await tx.user.deleteMany({
                where: { role: { not: 'ADMIN' } }
            });

            // Note: Purchases are preserved (Company Expenses)
            // Note: Admin Logs are technically preserved if linked to Admin, but we can clean orphans

            // Clean Orphan Logs
            const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
            const adminIds = admins.map(a => a.id);

            await tx.systemLog.deleteMany({
                where: { userId: { notIn: adminIds } }
            });
        });

        return NextResponse.json({ success: true, message: "All student data deleted successfully." });

    } catch (error: any) {
        console.error("Reset Error:", error);
        return NextResponse.json({ success: false, error: "Failed to reset data" }, { status: 500 });
    }
}
