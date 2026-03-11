import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser();
        const adminId = auth?.userId;
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = id;

        const { chartData } = await request.json();

        if (!chartData || !Array.isArray(chartData)) {
            return NextResponse.json({ error: "Invalid chart data provided" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Count stats for context
        const stats = {
            present: chartData.filter((d: any) => d.status === 'PRESENT').length,
            late: chartData.filter((d: any) => d.status === 'LATE').length,
            absent: chartData.filter((d: any) => d.status === 'ABSENT').length,
            off: chartData.filter((d: any) => d.status === 'OFF').length
        };

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `
You are an AI Manager analyzing the attendance of a ${user.role.toLowerCase()} named ${user.name} over the last 30 days.
Here are their exact check-in statistics over that period:
- Present (on-time): ${stats.present} days
- Late: ${stats.late} days
- Absent (missed check-ins): ${stats.absent} days
- Off Days: ${stats.off} days

Here is their raw daily data log for the last 30 days:
${JSON.stringify(chartData)}

Write a professional, 2-3 sentence insight summarizing their attendance habit.
If they are consistent, praise them briefly. If they are frequently late or absent, note the pattern (e.g., "requently misses Mondays") without being entirely overly harsh.
Keep it strictly to 2-3 sentences. No bullet points. No conversational filler like "Here is the summary:".
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ insight: text.trim(), stats });

    } catch (error: any) {
        console.error("Attendance Insights API Error:", error);
        return NextResponse.json({ error: "Internal Server Error or Gemini limit reached", fallbackInsight: "AI is currently unavailable to analyze patterns." }, { status: 500 });
    }
}
