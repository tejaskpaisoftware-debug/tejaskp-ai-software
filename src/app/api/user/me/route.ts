import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: "UserId required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                photoUrl: true,
                role: true,
                createdAt: true,
                department: true,
                designation: true,
                // Add commonly used fields to avoid multiple fetches
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Fetch User Error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
