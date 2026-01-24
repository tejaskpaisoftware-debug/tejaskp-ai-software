import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        // Use Raw SQL ensures we bypass any stale client definitions
        await prisma.$executeRaw`DELETE FROM announcements WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Announcement DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete announcement", details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { title, content } = await request.json();
        const now = new Date(); // Passing date object usually works in Prisma Raw, if not we'll handle it

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content required" }, { status: 400 });
        }

        // Use Raw SQL ensures we bypass any stale client definitions
        await prisma.$executeRaw`
            UPDATE announcements 
            SET title = ${title}, content = ${content}, updatedAt = ${now}
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Announcement UPDATE Error:", error);
        return NextResponse.json({ error: "Failed to update announcement", details: error.message }, { status: 500 });
    }
}
