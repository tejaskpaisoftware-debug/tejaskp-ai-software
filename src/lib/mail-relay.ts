import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.titan.email",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an email to an external domain.
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body (plain text)
 * @param fromEmail The sender's portal email address (used for Reply-To)
 * @param senderName The sender's display name
 */
export async function sendExternalEmail(to: string, subject: string, body: string, fromEmail: string, senderName: string) {
    try {
        const info = await transporter.sendMail({
            from: `"${senderName} via Portal" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: body,
            replyTo: process.env.SMTP_USER, // Use real email to receive replies
        });

        console.log("External email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("External email relay error:", error);
        return { success: false, error };
    }
}
