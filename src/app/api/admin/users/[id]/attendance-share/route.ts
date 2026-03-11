import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WhatsAppManager from '@/lib/whatsappClient';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser();
        const adminUserId = auth?.userId;
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const state = WhatsAppManager.getStatus(adminUserId);
        if (!state.isReady) {
            return NextResponse.json(
                { success: false, error: 'Your WhatsApp is disconnected. Please scan the QR code to reconnect.' },
                { status: 500 }
            );
        }

        const { id } = await params;
        const userId = id;

        const { stats, insight } = await request.json();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, mobile: true, parentMobile: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const message = `*30-Day Attendance Report*\n\nStudent: ${user.name}\n\n*Statistics:*\n✅ Present: ${stats.present} Days\n⚠️ Late: ${stats.late} Days\n❌ Absent: ${stats.absent} Days\n\n*AI Insight:*\n${insight}`;

        // Send to Student
        let studentSuccess = false;
        if (user.mobile) {
            studentSuccess = await WhatsAppManager.sendMessage(adminUserId, user.mobile, message);
        }

        // Send to Parent
        let parentSuccess = false;
        if (user.parentMobile && user.parentMobile !== user.mobile) {
            parentSuccess = await WhatsAppManager.sendMessage(adminUserId, user.parentMobile, message);
        }

        const anySuccess = studentSuccess || parentSuccess;

        if (anySuccess) {
            return NextResponse.json({
                success: true,
                message: 'Attendance insight shared successfully.',
                details: {
                    studentSent: studentSuccess,
                    parentSent: parentSuccess
                }
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to message the student or parent. Their number might be invalid.' },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Share Attendance API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
