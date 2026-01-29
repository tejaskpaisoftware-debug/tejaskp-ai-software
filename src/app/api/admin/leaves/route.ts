import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const leaves = await prisma.leave.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        mobile: true,
                        leaveBalances: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(leaves);
    } catch (error) {
        console.error("Fetch all leaves error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, managerRemarks, startDate, endDate, type, isHalfDay, reason } = body;

        if (!id || !status) {
            return NextResponse.json({ message: "ID and Status are required" }, { status: 400 });
        }

        const leave = await prisma.leave.findUnique({ where: { id } });
        if (!leave) return NextResponse.json({ message: "Leave not found" }, { status: 404 });

        // Helper to update balance
        const updateBalance = async (userId: string, year: number, typeStr: string, amount: number) => {
            const typeBase = typeStr.split('_')[0].toLowerCase(); // cl, sl, pl
            if (!['cl', 'sl', 'pl'].includes(typeBase)) return;

            const balance = await prisma.leaveBalance.findUnique({
                where: { userId_year: { userId, year } }
            });

            if (balance) {
                // @ts-ignore
                const currentVal = balance[typeBase] || 0;
                await prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: { [typeBase]: currentVal + amount }
                });
            } else {
                await prisma.leaveBalance.create({
                    data: {
                        userId,
                        year,
                        [typeBase]: amount // If creating, start with the delta (likely negative if deducting)
                    }
                });
            }
        };

        const calcDuration = (s: string, e: string, isHalf: boolean) => {
            if (isHalf) return 0.5;
            const start = new Date(s);
            const end = new Date(e);
            const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
            return days < 0 ? 0 : days; // Safety
        };

        // 1. REVERT OLD BALANCE if it was APPROVED
        if (leave.status === 'APPROVED') {
            const oldYear = new Date(leave.startDate).getFullYear();
            const oldDuration = calcDuration(leave.startDate, leave.endDate, leave.isHalfDay);
            // Add back the days
            await updateBalance(leave.userId, oldYear, leave.type, oldDuration);
        }

        // 2. UPDATE LEAVE RECORD
        // Use new values if provided, else keep old
        const newStartDate = startDate || leave.startDate;
        const newEndDate = endDate || leave.endDate;
        const newType = type || leave.type;
        const newIsHalfDay = isHalfDay !== undefined ? isHalfDay : leave.isHalfDay;

        // 3. APPLY NEW BALANCE if status is APPROVED
        if (status === 'APPROVED') {
            const newYear = new Date(newStartDate).getFullYear();
            const newDuration = calcDuration(newStartDate, newEndDate, newIsHalfDay);
            // Subtract the days
            await updateBalance(leave.userId, newYear, newType, -newDuration);
        }

        const updated = await prisma.leave.update({
            where: { id },
            data: {
                status,
                managerRemarks
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update leave error:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
