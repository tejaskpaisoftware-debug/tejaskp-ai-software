import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper: Get Auth User
async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function GET(request: Request) {
    const user: any = await getAuthUser();

    // Auth Check: Must be ADMIN
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekDate = searchParams.get('week'); // YYYY-MM-DD (Monday)

    if (!weekDate) {
        return NextResponse.json({ error: "Week date is required" }, { status: 400 });
    }

    try {
        // 1. Get all Active Students
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT', status: 'ACTIVE' },
            select: { id: true, name: true, email: true, mobile: true, course: true }
        });

        // 2. Get Submissions for this week
        const submissions = await prisma.submission.findMany({
            where: {
                weekStartDate: weekDate
            }
        });

        // 3. Merge Data: Find LATEST submission for each student for this week
        const report = students.map(student => {
            // Filter submissions for this student, sort by created date (desc) to get latest
            const studentSubmissions = submissions
                .filter(s => s.userId === student.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const latestSub = studentSubmissions[0]; // Latest one

            return {
                id: student.id,
                name: student.name,
                mobile: student.mobile,
                course: student.course,
                status: latestSub ? latestSub.status : "NOT_SUBMITTED",
                pdfPath: latestSub ? latestSub.pdfPath : null,
                excelPath: latestSub ? latestSub.excelPath : null,
                submittedAt: latestSub ? latestSub.submittedAt : null,
                historyCount: studentSubmissions.length // Added count
            };
        });

        // Sort by Name
        report.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return NextResponse.json({ success: true, report });

    } catch (error: any) {
        console.error("Admin Submission Report Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch report" }, { status: 500 });
    }
}
