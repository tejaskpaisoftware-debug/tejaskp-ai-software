import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Use global instance, raw query works on any instance


// Fallback UUID generator if 'uuid' package isn't there (standard in many Nextjs templates but...)
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function GET() {
    try {
        // Raw SQL to bypass stale client model definition
        // SQLite: boolean is stored as 0/1 usually, or we just select all
        // We order by createdAt desc
        const announcements: any = await prisma.$queryRaw`
            SELECT * FROM announcements 
            WHERE isActive = true OR isActive = 1 
            ORDER BY createdAt DESC 
            LIMIT 5
        `;

        // Normalize data (Prisma raw might return dates as strings or objects)
        const formatted = Array.isArray(announcements) ? announcements.map(a => ({
            ...a,
            // Ensure boolean is true (sqlite returns 1)
            isActive: a.isActive === 1 || a.isActive === true
        })) : [];

        return NextResponse.json({ success: true, announcements: formatted });
    } catch (error: any) {
        console.error("Announcement GET Error (Raw):", error);
        return NextResponse.json({ error: "Failed to fetch announcements", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content required" }, { status: 400 });
        }

        const id = generateId();
        const now = new Date();
        const isActive = true; // or 1

        // Raw Insert
        // Note: SQLite stores dates as Strings or Integers usually, but Prisma usually handles passing Date objects in params.
        // If it fails, we might need valueOf(). But usually it works.
        // We use parameterized query for safety.
        await prisma.$executeRaw`
            INSERT INTO announcements (id, title, content, isActive, createdAt, updatedAt)
            VALUES (${id}, ${title}, ${content}, ${isActive}, ${now}, ${now})
        `;

        return NextResponse.json({
            success: true,
            announcement: { id, title, content, isActive, createdAt: now, updatedAt: now }
        });
    } catch (error: any) {
        console.error("Announcement POST Error (Raw):", error);
        return NextResponse.json({ error: "Failed to create announcement", details: error.message }, { status: 500 });
    }
}
