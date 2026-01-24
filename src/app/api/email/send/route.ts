import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, subject, html } = body;

        // Hardcoded generic sender details for display purposes, 
        // but actual sending requires real SMTP credentials.
        // Since we don't have user's SMTP password, we will mock the transport 
        // OR try to use a local transport if user provided env vars.

        // Check for SMTP config
        const smtpConfig = {
            host: process.env.SMTP_HOST || "smtp.titan.email",
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

        const hasCredentials = smtpConfig.auth.user && smtpConfig.auth.pass;

        console.log(`[Email Service] Attempting to send email to: ${to}`);
        console.log(`[Email Service] Subject: ${subject}`);

        if (hasCredentials) {
            const transporter = nodemailer.createTransport(smtpConfig);
            await transporter.sendMail({
                from: '"Tejas Patel - TEJASKP AI" <tejaspatel@tejaskpaisoftware.com>',
                to,
                subject,
                html,
            });
            return NextResponse.json({ message: "Email Sent Successfully via SMTP" });
        } else {
            // SIMULATION MODE (Because we can't send real email without password)
            // We simulate a network delay and success
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log("---------------------------------------------------");
            console.log("SIMULATED EMAIL SENT (Missing SMTP Credentials)");
            console.log(`FROM: tejaspatel@tejaskpaisoftware.com`);
            console.log(`TO: ${to}`);
            console.log("---------------------------------------------------");

            return NextResponse.json({
                message: "Email Sent Successfully (Simulated)",
                note: "Real sending requires SMTP_USER and SMTP_PASS in .env",
                isSimulated: true
            });
        }

    } catch (error: any) {
        console.error("Email Error:", error);
        return NextResponse.json({ message: "Failed to send email: " + (error.message || "Unknown Error") }, { status: 500 });
    }
}
