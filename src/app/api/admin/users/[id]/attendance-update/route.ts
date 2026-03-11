import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser();
        if (!auth?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: userId } = await params;
        const { date, status } = await request.json();

        if (!date || !status) {
            return NextResponse.json({ error: "Date and status are required" }, { status: 400 });
        }

        // Team Lead Restriction: Can only update students in their department
        if (auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({
                where: { id: auth.userId },
                select: { department: true }
            });
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true, department: true }
            });

            if (!targetUser || targetUser.role !== "STUDENT" || targetUser.department !== lead?.department) {
                return NextResponse.json({ error: "Forbidden: You can only manage students in your department." }, { status: 403 });
            }
        }

        // Upsert the attendance record for this date
        const attendance = await prisma.attendance.upsert({
            where: {
                userId_date: {
                    userId,
                    date
                }
            },
            update: {
                status,
                updatedAt: new Date()
            },
            create: {
                userId,
                date,
                status
            }
        });

        return NextResponse.json({ success: true, attendance });

    } catch (error: any) {
        console.error("Attendance Update API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
