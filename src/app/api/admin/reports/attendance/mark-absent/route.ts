
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: Request) {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');

        // 1. Get all students
        const students = await prisma.user.findMany({
            where: { role: "STUDENT", status: { not: "BLOCKED" } }
        });

        const results = [];

        for (const student of students) {
            // Check today's attendance
            const attendance = await prisma.attendance.findFirst({
                where: { userId: student.id, date: today }
            });

            if (!attendance) {
                // Check if they have an approved leave
                const leave = await prisma.leave.findFirst({
                    where: {
                        userId: student.id,
                        status: "APPROVED",
                        startDate: { lte: today },
                        endDate: { gte: today }
                    }
                });

                if (!leave) {
                    // Mark as ABSENT
                    await prisma.attendance.create({
                        data: {
                            userId: student.id,
                            date: today,
                            status: "ABSENT",
                            isAbsent: true,
                            informedInAdvance: false,
                            loginTime: new Date(), // Dummy for EOD marking
                            adminRemarks: "Auto-marked Absent (No activity)"
                        }
                    });

                    // Check for "Uninformed Absence" (2+ days without notice)
                    // We check if yesterday was also uninformed absent
                    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
                    const yesterdayAbsent = await prisma.attendance.findFirst({
                        where: {
                            userId: student.id,
                            date: yesterday,
                            isAbsent: true,
                            informedInAdvance: false
                        }
                    });

                    if (yesterdayAbsent) {
                        // This is the 2nd day or more
                        await NotificationService.sendAbsenceWarning(student.id);
                        results.push({ name: student.name, status: "MARKED_ABSENT_AND_NOTIFIED" });
                    } else {
                        results.push({ name: student.name, status: "MARKED_ABSENT" });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error("Auto-marking absence error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
