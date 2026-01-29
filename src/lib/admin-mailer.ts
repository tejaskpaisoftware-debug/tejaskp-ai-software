import nodemailer from "nodemailer";

export const adminTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: 587, // Try 587 (~STARTTLS) which is often faster/more standard for this host
    secure: false, // Must be false for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const ADMIN_SENDER_IDENTITY = `"TejasKP AI Software" <${process.env.SMTP_USER}>`;
