import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const rawUrl = process.env.DATABASE_URL || "NOT_SET";
    const sanitized = rawUrl.replace(/:[^:@]+@/, ":***@");
    try {
        const userCount = await prisma.user.count();
        return NextResponse.json({
            status: "CONNECTED",
            userCount,
            dbUrlConfigured: sanitized
        });
    } catch (e: any) {
        return NextResponse.json({
            status: "ERROR",
            error: e.message,
            dbUrlConfigured: sanitized
        }, { status: 500 });
    }
}
