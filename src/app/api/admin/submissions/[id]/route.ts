import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper: Get Auth User
async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

// DELETE: Delete a submission
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const user: any = await getAuthUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        await prisma.submission.delete({
            where: { id }
        });
        return NextResponse.json({ success: true, message: "Submission deleted" });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    }
}

// PATCH: Update Status
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const user: any = await getAuthUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'SUBMITTED', 'LATE'];
    if (!status || !validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    try {
        const submission = await prisma.submission.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
    }
}
