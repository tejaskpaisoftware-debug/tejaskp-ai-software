import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date"); // Optional filter

        const whereClause: any = {};
        if (date) {
            whereClause.date = date;
        }

        const attendance = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        mobile: true
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
        const body = await request.json();
        const { id, status, adminRemarks } = body;

        if (!id || !status) {
            return NextResponse.json(
                { message: "ID and Status are required" },
                { status: 400 }
            );
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Attendance ID is required" },
                { status: 400 }
            );
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
