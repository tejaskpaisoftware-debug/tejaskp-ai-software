
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Instantiate a fresh client
const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Find user by mobile to link automatically
        let user = null;
        if (data.mobile) {
            user = await prisma.user.findUnique({
                where: { mobile: data.mobile }
            });
        } else if (data.email) {
            user = await prisma.user.findUnique({
                where: { email: data.email }
            });
        }

        // 2. Use Raw SQL to Insert Certificate
        const id = crypto.randomUUID();
        const now = new Date();

        // @ts-ignore
        await prisma.$executeRaw`
            INSERT INTO "certificates" (
                "id", "name", "email", "mobile", "course", "startDate", "endDate", 
                "issueDate", "duration", "userId", "createdAt", "updatedAt"
            ) VALUES (
                ${id}, ${data.name}, ${data.email}, ${data.mobile}, ${data.course}, 
                ${data.startDate}, ${data.endDate}, ${data.date}, ${data.duration}, 
                ${user?.id || null}, ${now}, ${now}
            )
        `;

        return NextResponse.json({ success: true, certificate: { id, ...data }, linkedUser: !!user });

    } catch (error: any) {
        console.error("Error creating certificate:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to save certificate" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Basic implementation to check if certificate exists or fetch by ID (similar to joining letter)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const certificateId = searchParams.get('id');

    try {
        if (certificateId) {
            // @ts-ignore
            const result: any[] = await prisma.$queryRaw`SELECT * FROM "certificates" WHERE "id" = ${certificateId}`;
            const cert = result[0];
            return NextResponse.json({ success: !!cert, certificate: cert });
        }

        if (userId) {
            // Check if user has certificate
            // @ts-ignore
            const result: any[] = await prisma.$queryRaw`SELECT * FROM "certificates" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC LIMIT 1`;
            const cert = result[0];
            return NextResponse.json({ success: true, certificate: cert });
        }

        return NextResponse.json({ success: false, error: "Invalid parameters" });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
