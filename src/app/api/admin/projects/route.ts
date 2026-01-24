import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { title, description, category, commissionRate } = await request.json();

        const project = await prisma.project.create({
            data: {
                title,
                description,
                category,
                commissionRate: parseFloat(commissionRate) || 5.0,
                status: 'OPEN'
            }
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, projects });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}
