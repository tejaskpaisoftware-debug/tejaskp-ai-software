import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ReportGenerator } from '@/lib/reportGenerator';
import { WhatsAppService } from '@/lib/whatsapp';

const prisma = new PrismaClient();

export const maxDuration = 300; // Allow 5 minutes execution on Vercel Pro

export async function GET(request: Request) {
    try {
        // Secure this endpoint with a secret token for Vercel Cron
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET;

        // Verify Bearer token
        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log('[Cron] Starting Monthly Student WhatsApp Reports...');

        // 1. Fetch Primary Admin ID to use for WhatsApp Session
        const primaryAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN', status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' } // Assuming oldest active admin is the 'primary' one
        });

        if (!primaryAdmin) {
            console.error('[Cron] No active Admin found to use for WhatsApp dispatch.');
            return NextResponse.json({ success: false, error: 'No active Admin found for WhatsApp session.' }, { status: 500 });
        }

        const adminUserId = primaryAdmin.id;
        console.log(`[Cron] Using Admin ${primaryAdmin.name} (${adminUserId}) for WhatsApp dispatch.`);

        // 2. Query all ACTIVE students
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                mobile: true
            }
        });

        if (students.length === 0) {
            console.log('[Cron] No active students found to report.');
            return NextResponse.json({ success: true, message: 'No active students found.' });
        }

        console.log(`[Cron] Found ${students.length} active students. Triggering reports...`);

        let successCount = 0;
        let failCount = 0;

        // Process sequentially to be gentle on DB resources & WhatsApp client rate limits
        for (const student of students) {
            try {
                // Generate report data for the past month
                const report = await ReportGenerator.generateStudentReport(student.id, 'monthly');

                if (!report || !report.studentMobile) {
                    failCount++;
                    console.log(`[Cron] Skipping ${student.name} (${student.id}) - No report or mobile number available.`);
                    continue;
                }

                // Send the WhatsApp messages
                const { studentSuccess, parentSuccess } = await WhatsAppService.sendStudentReport(
                    adminUserId,
                    report.studentMobile,
                    report.parentMobile,
                    report
                );

                if (studentSuccess || parentSuccess) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Sleep 2 seconds before sending the next one to avoid block/spam filters
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (studentErr) {
                failCount++;
                console.error(`[Cron] Error sending report for ${student.name}:`, studentErr);
            }
        }

        console.log(`[Cron] Monthly Report Generation Complete. Success: ${successCount}, Failed: ${failCount}`);

        return NextResponse.json({
            success: true,
            processed: students.length,
            successCount,
            failCount
        });

    } catch (error) {
        console.error('[Cron] Monthly Reports Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
