import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const referrals = await prisma.referral.findMany({
            include: {
                referrer: { select: { name: true, email: true, mobile: true } },
                project: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, referrals });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
    }
}
