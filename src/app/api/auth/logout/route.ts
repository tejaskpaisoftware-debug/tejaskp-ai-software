import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { userId } = body;

        console.log("Logging out user:", userId || "Unknown");

        const today = new Date().toISOString().split('T')[0];

        // Find today's attendance record only if userId exists
        if (userId) {
            const attendance = await prisma.attendance.findFirst({
                where: {
                    userId: userId,
                    date: today
                }
            });

            if (attendance) {
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: {
                        logoutTime: new Date()
                    }
                });
                console.log("Logout time recorded for:", userId);
            } else {
                console.log("No attendance record found for today to update logout time.");
            }
        }


        const response = NextResponse.json({ message: "Logged out successfully" });
        // No Cookie to clear (Header-based auth)
        // Client is responsible for deleting the token from sessionStorage

        // Robust Security: Clear Client Data
        response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
        response.headers.set('Cache-Control', 'no-store, max-age=0');

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
