import { NextResponse } from 'next/server';
import { ReportGenerator, ReportPeriod } from '@/lib/reportGenerator';
import { WhatsAppService } from '@/lib/whatsapp';
import WhatsAppManager from '@/lib/whatsappClient';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const adminUserId = await getAuthUserId();
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

        const body = await request.json();
        const { userId, period } = body;

        if (!userId || !period) {
            return NextResponse.json(
                { success: false, error: 'User ID and selected period are required' },
                { status: 400 }
            );
        }

        const validPeriods: ReportPeriod[] = ['daily', 'weekly', 'monthly', '3-months', 'all-time'];
        if (!validPeriods.includes(period)) {
            return NextResponse.json(
                { success: false, error: 'Invalid period selected' },
                { status: 400 }
            );
        }

        const report = await ReportGenerator.generateStudentReport(userId, period as ReportPeriod);

        if (!report) {
            return NextResponse.json(
                { success: false, error: 'Could not generate report for the specified user.' },
                { status: 404 }
            );
        }

        if (!report.studentMobile) {
            return NextResponse.json(
                { success: false, error: 'Student does not have a registered mobile number.' },
                { status: 400 }
            );
        }

        const { studentSuccess, parentSuccess } = await WhatsAppService.sendStudentReport(
            adminUserId,
            report.studentMobile,
            report.parentMobile,
            report
        );

        const anySuccess = studentSuccess || parentSuccess;

        if (anySuccess) {
            return NextResponse.json({
                success: true,
                message: 'Report sent successfully.',
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

    } catch (error) {
        console.error('Error in Send WhatsApp Report API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error while sending report' },
            { status: 500 }
        );
    }
}
