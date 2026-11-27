import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT) || 465;
const isSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

const defaultSender = "salesandmarketing@tejaskpaisoftware.com";
const defaultPass = "Sales@999@";
const smtpUser = process.env.SMTP_USER || defaultSender;
const smtpPass = process.env.SMTP_PASS || defaultPass;

export const adminTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: smtpPort,
    secure: isSecure,
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

// Guard sendMail to ensure credentials exist
const rawSendMail = adminTransporter.sendMail.bind(adminTransporter);
adminTransporter.sendMail = (async (mailOptions: any) => {
    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP credentials missing: Please set SMTP_USER and SMTP_PASS in Vercel/local environment variables.");
    }
    return rawSendMail(mailOptions);
}) as any;

export const ADMIN_SENDER_IDENTITY = process.env.SMTP_FROM || `"TejasKP AI Software" <${smtpUser}>`;

