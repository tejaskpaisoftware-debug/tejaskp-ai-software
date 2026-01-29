import { NextResponse } from "next/server";
import { syncTitanEmails } from "@/lib/mail-fetcher";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: "UserId is required" }, { status: 400 });
        }

        console.log("Triggering Mail Sync for User ID:", userId);
        const count = await syncTitanEmails(userId);

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
    }
}
