import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.salarySlip.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true, message: "Salary slip deleted successfully" });
    } catch (error: any) {
        console.error("Delete Salary Slip Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
