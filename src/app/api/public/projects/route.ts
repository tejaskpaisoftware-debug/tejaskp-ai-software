import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, projects });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}
