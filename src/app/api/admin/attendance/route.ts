import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function GET(request: Request) {
    try {
        const auth = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date"); // Optional filter

        const whereClause: any = {};
        if (date) {
            whereClause.date = date;
        }

        // Team Lead Restriction
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            whereClause.user = {
                role: "STUDENT",
                department: lead?.department || undefined
            };
        }

        const attendance = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        mobile: true,
                        department: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(attendance);
    } catch (error) {
        console.error("Fetch attendance error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const auth = await getAuthUser();
        const body = await request.json();
        const { id, status, adminRemarks } = body;

        if (!id || !status) {
            return NextResponse.json(
                { message: "ID and Status are required" },
                { status: 400 }
            );
        }

        // Team Lead Restriction
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            const record = await prisma.attendance.findUnique({ where: { id }, include: { user: { select: { department: true, role: true } } } });
            if (!record || record.user?.role !== "STUDENT" || record.user?.department !== lead?.department) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
        }


        const updated = await prisma.attendance.update({
            where: { id },
            data: {
                status,
                adminRemarks
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update attendance error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Attendance ID is required" },
                { status: 400 }
            );
        }

        // Team Lead Restriction
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            const record = await prisma.attendance.findUnique({ where: { id }, include: { user: { select: { department: true, role: true } } } });
            if (!record || record.user?.role !== "STUDENT" || record.user?.department !== lead?.department) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
        }


        await prisma.attendance.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Record deleted" });
    } catch (error) {
        console.error("Delete attendance error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
