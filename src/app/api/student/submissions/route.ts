import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

// Helper: Get Monday of the current week
function getMonday(d: Date) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = user.userId as string;
        const submissions = await prisma.submission.findMany({
            where: { userId: userId },
            orderBy: { weekStartDate: 'desc' }
        });
        return NextResponse.json({ success: true, submissions });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch submissions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const pdfFile = (formData as any).get("pdf") as File;
        const excelFile = (formData as any).get("excel") as File;
        const weekDate = (formData as any).get("weekDate") as string || getMonday(new Date());

        if (!pdfFile || !excelFile) {
            return NextResponse.json({ success: false, error: "Both PDF and Excel files are required" }, { status: 400 });
        }

        // --- Deadline Check ---
        // Friday 3:30 PM = 15:30
        const now = new Date();
        const currentDay = now.getDay(); // 0=Sun, 5=Fri
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calculate status
        let status = "SUBMITTED";
        // Simple Logic: If it's Saturday (6) or Sunday (0), it's late. 
        // If it's Friday (5) and > 15:30, it's late.
        // We assume 'weekDate' passed is correct for the current week context. 
        // If user is submitting for PAST weeks, it's definitely late.

        const currentWeekMonday = getMonday(new Date());
        if (weekDate < currentWeekMonday) {
            // Submitting for past week ?? Logic choice: Allow but mark late? Or maybe they just can't?
            status = "LATE";
        } else if (weekDate === currentWeekMonday) {
            if (currentDay > 5 || (currentDay === 0)) {
                status = "LATE";
            } else if (currentDay === 5) {
                if (currentHour > 15 || (currentHour === 15 && currentMinute >= 30)) {
                    status = "LATE";
                }
            }
        }

        // --- Save Files ---
        // Directory: public/uploads/submissions/[weekDate]/[userId]/
        const userId = user.userId as string;

        // Verify User Exists (Fix for FK Violation after DB Reset)
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return NextResponse.json({ success: false, error: "Session expired. Please logout and login again." }, { status: 401 });
        }

        const uploadDir = path.join(process.cwd(), "public/uploads/submissions", weekDate, userId);
        await mkdir(uploadDir, { recursive: true });

        const pdfName = `doc_${Date.now()}.pdf`;
        const excelName = `data_${Date.now()}.xlsx`; // Or .xls

        const pdfPath = path.join(uploadDir, pdfName);
        const excelPath = path.join(uploadDir, excelName);

        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const excelBuffer = Buffer.from(await excelFile.arrayBuffer());

        await writeFile(pdfPath, pdfBuffer);
        await writeFile(excelPath, excelBuffer);

        // --- Database Update ---
        // Store relative paths for frontend access
        const relPdfPath = `/uploads/submissions/${weekDate}/${userId}/${pdfName}`;
        const relExcelPath = `/uploads/submissions/${weekDate}/${userId}/${excelName}`;

        const submission = await prisma.submission.create({
            data: {
                userId: userId,
                weekStartDate: weekDate,
                pdfPath: relPdfPath,
                excelPath: relExcelPath,
                status: status,
                submittedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, submission });

    } catch (error: any) {
        console.error("Submission Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Submission failed" }, { status: 500 });
    }
}
