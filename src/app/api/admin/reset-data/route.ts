import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
        console.log("Processing Data Reset Request...");

        // 1. Delete All Data (Sequential to avoid transaction timeouts)
        // A. Deep Child Records (Task, Chat, Game, AI)
        await prisma.taskAttachment.deleteMany({});
        await prisma.taskComment.deleteMany({});
        await prisma.taskHistory.deleteMany({});
        await prisma.task.deleteMany({});

        await prisma.emailAttachment.deleteMany({});
        await prisma.emailRecipient.deleteMany({});
        await prisma.email.deleteMany({});
        await prisma.mailbox.deleteMany({});

        await prisma.message.deleteMany({});
        await prisma.conversation.deleteMany({});

        await prisma.aiMessage.deleteMany({});
        await prisma.aiSession.deleteMany({});

        await prisma.racingPlayer.deleteMany({});
        await prisma.racingSession.deleteMany({});
        await prisma.racingLeaderboard.deleteMany({});

        // B. Direct User Dependencies
        await prisma.attendance.deleteMany({});
        await prisma.leaveBalance.deleteMany({});
        await prisma.leave.deleteMany({});
        await prisma.joiningLetter.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.invoice.deleteMany({});
        await prisma.certificate.deleteMany({});
        await prisma.salarySlip.deleteMany({});
        await prisma.submission.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.referral.deleteMany({});
        await prisma.studentDocument.deleteMany({});

        // C. Final User Clean-up (Exclude Admins)
        await prisma.user.deleteMany({
            where: { role: { not: 'ADMIN' } }
        });

        // D. System Clean-up (Orphaned Logs)
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        const adminIds = admins.map(a => a.id);

        await prisma.systemLog.deleteMany({
            where: { userId: { notIn: adminIds } }
        });

        return NextResponse.json({ success: true, message: "All student data deleted successfully." });

    } catch (error: any) {
        console.error("Reset Error:", error);
        return NextResponse.json({ success: false, error: "Failed to reset data" }, { status: 500 });
    }
}
