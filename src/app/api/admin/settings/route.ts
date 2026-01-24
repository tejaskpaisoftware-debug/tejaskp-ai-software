import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma;

export async function GET() {
    // HMR Trigger: forcing reload
    try {
        const settings = await db.systemSettings.findUnique({
            where: { key: "global" },
        });

        return NextResponse.json(settings || { appTheme: "light" });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { appTheme } = body;

        if (!appTheme) {
            return NextResponse.json(
                { error: "Theme is required" },
                { status: 400 }
            );
        }

        const settings = await db.systemSettings.upsert({
            where: { key: "global" },
            update: {
                appTheme,
            },
            create: {
                key: "global",
                appTheme,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
