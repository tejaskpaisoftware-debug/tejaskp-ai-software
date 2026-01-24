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
        return null; // Invalid token
    }
}

export async function GET() {
    const user: any = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = user.userId || user.id;
    if (!userId) return NextResponse.json({ error: "Invalid Token Payload" }, { status: 401 });

    try {
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, walletBalance: true }
        });

        if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // If code doesn't exist, generate one (lazy generation)
        let referralCode = userData.referralCode;
        if (!referralCode) {
            referralCode = `REF${userId.substring(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
            await prisma.user.update({
                where: { id: userId },
                data: { referralCode }
            });
        }

        const referrals = await prisma.referral.findMany({
            where: { referrerId: userId },
            orderBy: { createdAt: 'desc' },
            include: { project: true } // Include project details if applicable
        });

        const totalEarnings = referrals
            .filter(r => r.status === 'PAID' || r.status === 'APPROVED')
            .reduce((sum, r) => sum + r.amount, 0);

        const pendingEarnings = referrals
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.amount, 0);

        return NextResponse.json({
            success: true,
            referralCode,
            walletBalance: userData.walletBalance,
            totalEarnings,
            pendingEarnings,
            history: referrals
        });
    } catch (error) {
        console.error("Referral Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
