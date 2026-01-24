import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { headers, cookies } from 'next/headers';

async function getAuthUser() {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        const cookieStore = await cookies();
        token = cookieStore.get('auth_token')?.value;
    }

    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function POST(request: Request) {
    const user: any = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { studentName, studentMobile } = await request.json();

        if (!studentName || !studentMobile) {
            return NextResponse.json({ error: "Name and Mobile number are required" }, { status: 400 });
        }

        // Logic check: avoid spamming same lead?
        // Optional: Check if mobile already exists in referrals or users.

        const referral = await prisma.referral.create({
            data: {
                referrerId: user.userId || user.id, // Handle token payload variations
                type: 'ENROLLMENT',
                status: 'PENDING',
                amount: 0, // 50 on approval
                description: `${studentName}|${studentMobile}` // Storing format for easy parsing/display
            }
        });

        return NextResponse.json({ success: true, referral });
    } catch (error) {
        console.error("Student Lead Referral Error:", error);
        return NextResponse.json({ error: "Failed to submit referral" }, { status: 500 });
    }
}
