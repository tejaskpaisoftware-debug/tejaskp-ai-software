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
        const { projectId, description, clientName, clientMobile } = await request.json();

        if (!projectId || !clientName || !clientMobile) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        // Create Referral Record
        const referral = await prisma.referral.create({
            data: {
                referrerId: user.userId || user.id,
                projectId: projectId,
                type: 'PROJECT',
                status: 'PENDING',
                amount: 0, // Will be calculated on approval based on project value
                description: `Client: ${clientName}, Mobile: ${clientMobile}. ${description || ''}`
            }
        });

        // Notify Admins (For now just log, ideally create a notification for admin)
        // await prisma.notification.create({ ... }) -> For admin

        return NextResponse.json({ success: true, referral });
    } catch (error) {
        console.error("Project Referral Error:", error);
        return NextResponse.json({ error: "Failed to submit referral" }, { status: 500 });
    }
}
