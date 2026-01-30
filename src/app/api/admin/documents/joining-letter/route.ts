// Instantiate a fresh client to ensure we have the latest schema in dev environment
// without needing a server restart.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');
    const userId = searchParams.get('userId');
    const isGenerationMode = searchParams.get('generate') === 'true';

    try {
        if (mobile || (userId && isGenerationMode)) {
            // Verification/Generation Mode: Check if user exists
            let user = null;
            if (mobile) {
                user = await prisma.user.findUnique({ where: { mobile } });
            } else if (userId) {
                user = await prisma.user.findUnique({ where: { id: userId } });
            }

            if (!user) {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
            }

            // Robust Raw SQL Fetch for University/College (Bypass Stale Client)
            let rawUser: any = {};
            try {
                // @ts-ignore
                const result: any[] = await prisma.$queryRaw`SELECT university, college FROM users WHERE id = ${user.id}`;
                if (result.length > 0) rawUser = result[0];
            } catch (e) {
                console.warn("Raw user fetch failed", e);
            }

            // Check if letter already exists (Raw SQL for robustness)
            let existingLetter = null;
            try {
                // @ts-ignore
                const letters: any = await prisma.$queryRaw`SELECT id FROM "joining_letters" WHERE "userId" = ${user.id} LIMIT 1`;
                existingLetter = letters?.[0] || null;
            } catch (e) {
                console.warn("Raw fetch failed", e);
            }

            // Auto-fill logic from Invoice
            let autoFillData = {};
            try {
                const latestInvoice = await prisma.invoice.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (latestInvoice && latestInvoice.items) {
                    const items = typeof latestInvoice.items === 'string'
                        ? JSON.parse(latestInvoice.items)
                        : latestInvoice.items;

                    if (items.length > 0) {
                        const item = items[0];
                        const domain = item.description || "Web Development";
                        let startDate = item.startDate;
                        let endDate = item.endDate;

                        if (!startDate) {
                            const startDateObj = new Date(latestInvoice.createdAt);
                            startDate = startDateObj.toISOString().split('T')[0];
                        }
                        if (!endDate) {
                            const startObj = new Date(startDate);
                            startObj.setMonth(startObj.getMonth() + 6);
                            endDate = startObj.toISOString().split('T')[0];
                        }

                        autoFillData = {
                            designation: `Intern - ${domain}`,
                            internshipType: "Offline (On-site)",
                            startDate: startDate,
                            endDate: endDate,
                            stipend: "Unpaid / Educational",
                            course: domain // Add extracted domain as course
                        };
                    }
                }
            } catch (invError) {
                console.warn("Failed to fetch invoice for auto-fill", invError);
            }

            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    // @ts-ignore
                    university: rawUser.university || rawUser.college || user.university || user.college || "", // Prioritize Raw SQL
                    college: rawUser.college || user.college,
                    details: user.details,
                    course: user.course || (autoFillData as any).course || "Full Stack Development", // Fallback chain
                    ...autoFillData
                },
                hasExistingLetter: !!existingLetter,
                existingLetterId: existingLetter?.id
            });
        }

        if (userId) {
            // View Mode: Fetch letter by User ID using Raw SQL
            let letter = null;
            try {
                // @ts-ignore
                const letters: any = await prisma.$queryRaw`SELECT * FROM "joining_letters" WHERE "userId" = ${userId} LIMIT 1`;
                letter = letters?.[0] || null;
            } catch (e) {
                console.error("Raw fetch by ID failed", e);
            }

            if (!letter) {
                return NextResponse.json({ success: false, error: "Letter not found" }, { status: 404 });
            }

            // Backfill from User Profile (Robust Raw SQL)
            if (!letter.university) {
                try {
                    // @ts-ignore
                    const users: any = await prisma.$queryRaw`SELECT university, college FROM users WHERE id = ${userId}`;
                    const user = users[0];
                    if (user) {
                        letter.university = user.university || user.college || "";
                    }
                } catch (e) {
                    console.error("Backfill failed", e);
                }
            }

            return NextResponse.json({ success: true, letter });
        }

        return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });

    } catch (error: any) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Find user by mobile to link automatically
        const user = await prisma.user.findUnique({
            where: { mobile: data.mobile }
        });

        const now = new Date();

        // Check if letter already exists for this user (robust raw check)
        let existingLetter: any = null;
        if (user) {
            try {
                // @ts-ignore
                const letters: any = await prisma.$queryRaw`SELECT id FROM "joining_letters" WHERE "userId" = ${user.id} LIMIT 1`;
                existingLetter = letters?.[0] || null;
            } catch (e) { console.warn("Check exists failed", e); }
        }

        if (existingLetter) {
            // UDPATE existing letter
            // @ts-ignore
            await prisma.$executeRaw`
                UPDATE "joining_letters" SET 
                    "name" = ${data.name},
                    "email" = ${data.email},
                    "mobile" = ${data.mobile},
                    "university" = ${data.university || ""},
                    "date" = ${data.date},
                    "startDate" = ${data.startDate},
                    "endDate" = ${data.endDate},
                    "designation" = ${data.designation},
                    "internshipType" = ${data.internshipType},
                    "stipend" = ${data.stipend},
                    "location" = ${data.location},
                    "reportingManager" = ${data.reportingManager},
                    "managerDesignation" = ${data.managerDesignation},
                    "updatedAt" = ${now}
                WHERE "id" = ${existingLetter.id}
            `;
            return NextResponse.json({ success: true, letter: { id: existingLetter.id, ...data }, linkedUser: !!user, action: "updated" });

        } else {
            // INSERT new letter
            const id = crypto.randomUUID();
            // @ts-ignore
            await prisma.$executeRaw`
                INSERT INTO "joining_letters" (
                    "id", "name", "email", "mobile", "university", "date", "startDate", "endDate", 
                    "designation", "internshipType", "stipend", "location", 
                    "reportingManager", "managerDesignation", "userId", "createdAt", "updatedAt"
                ) VALUES (
                    ${id}, ${data.name}, ${data.email}, ${data.mobile}, ${data.university || ""}, ${data.date}, ${data.startDate}, ${data.endDate}, 
                    ${data.designation}, ${data.internshipType}, ${data.stipend}, ${data.location}, 
                    ${data.reportingManager}, ${data.managerDesignation}, ${user?.id || null}, ${now}, ${now}
                )
            `;
            return NextResponse.json({ success: true, letter: { id, ...data }, linkedUser: !!user, action: "created" });
        }

    } catch (error: any) {
        console.error("Error creating/updating joining letter:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to save letter" }, { status: 500 });
    }
}
