import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import nodemailer from "nodemailer";

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

export async function POST(request: Request) {
    const user: any = await getAuthUser();

    // 1. Auth Check: Admin Only
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { userId, mobile } = body; // Receiving mobile as identifier, but we'll fetch email

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Safety Check for Prisma Client
        if (!(prisma as any).notification) {
            console.error("Prisma Client missing 'notification' model. Restart required.");
            // We can't proceed if the model isn't there
            return NextResponse.json({ error: "System update required. Please restart the server terminal." }, { status: 500 });
        }

        // 2. Fetch User Email
        const student = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true }
        });

        if (!student || !student.email) {
            return NextResponse.json({ error: "Student email not found" }, { status: 404 });
        }

        // 3. Send Email (Mock/Real)
        const smtpConfig = {
            host: process.env.SMTP_HOST || "smtp.titan.email",
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

        const hasCredentials = smtpConfig.auth.user && smtpConfig.auth.pass;
        const subject = "Reminder: Weekly Document Submission Pending";
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Weekly Submission Reminder</h2>
                <p>Dear ${student.name},</p>
                <p>This is a reminder that you have not yet submitted your weekly documents (PDF Report and Excel Sheet) for the current week.</p>
                <p>Please log in to your student portal and submit them as soon as possible.</p>
                <br/>
                <p>Best Regards,</p>
                <p>Admin Team</p>
            </div>
        `;

        if (hasCredentials) {
            const transporter = nodemailer.createTransport(smtpConfig);

            try {
                await transporter.sendMail({
                    from: '"Tejas Patel - TEJASKP AI" <tejaspatel@tejaskpaisoftware.com>',
                    to: student.email,
                    subject,
                    html,
                });
            } catch (emailError: any) {
                console.error("SMTP Email Failed (Falling back to DB Notification):", emailError.message);
                // Proceed to log notification anyway
            }

            // Log Notification
            await prisma.notification.create({
                data: {
                    userId,
                    title: "Submission Reminder",
                    message: "You have not yet submitted your weekly documents. Please submit them ASAP.",
                    type: "WARNING"
                }
            });

            return NextResponse.json({ success: true, message: "Reminder Logged (Email might have failed but Dashboard Alert set)" });
        } else {
            // Simulation
            console.log(`[SIMULATION] Sending Reminder Email to ${student.email}`);

            // Log Notification even in simulation
            await prisma.notification.create({
                data: {
                    userId,
                    title: "Submission Reminder",
                    message: "You have not yet submitted your weekly documents. Please submit them ASAP.",
                    type: "WARNING"
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({ success: true, message: "Reminder Sent (Simulated) & Notification Logged", isSimulated: true });
        }

    } catch (error: any) {
        console.error("Reminder Error Details:", error);

        // Debugging for Stale Client
        if (!prisma.notification) {
            console.error("CRITICAL: prisma.notification is undefined. The server needs a restart to pick up the new schema.");
            return NextResponse.json({ error: "Server update pending. Please restart the application server." }, { status: 500 });
        }

        return NextResponse.json({ error: "Failed to send reminder: " + error.message }, { status: 500 });
    }
}
