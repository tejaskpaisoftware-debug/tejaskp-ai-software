import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { restrictToAdmin } from "@/lib/auth-server";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const auth = await restrictToAdmin();
    if (!auth.authorized) return auth.response;
    try {
        const { id } = params; // Changed from await params to params

        await prisma.salarySlip.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true, message: "Salary slip deleted successfully" });
    } catch (error: any) {
        console.error("Delete Salary Slip Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
