import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const documents = await prisma.studentDocument.findMany({
            where: {
                type: "ASSESSMENT"
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        mobile: true,
                        course: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, documents });
    } catch (error: any) {
        console.error("Admin Assessment Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch assessment submissions" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "ID and Status required" }, { status: 400 });
        }

        const doc = await prisma.studentDocument.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
        console.error("Admin Assessment Update Error:", error);
        return NextResponse.json({ error: "Failed to update assessment status" }, { status: 500 });
    }
}
