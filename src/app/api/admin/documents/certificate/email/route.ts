
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const { email, name, pdfBase64, subject, course, duration } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing email or PDF data" }, { status: 400 });
        }

        // HARDCODED CREDENTIALS (Reusing from Joining Letter)
        const USER = "tejaskpaisoftware@gmail.com";
        const PASS = "jskr uhvo wxbr pahe";

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: USER,
                pass: PASS,
            },
        });

        const mailOptions = {
            from: `"TejasKP AI Software" <${USER}>`,
            to: email,
            subject: subject || "Internship Completion Certificate - TejasKP AI Software",
            text: `Dear ${name},\n\nCongratulations on successfully completing your internship program at TEJASKP AI SOFTWARE.\n\nPlease find attached your internship completion certificate.\n\nIntern Details:\nName: ${name}\nDomain: ${course || 'N/A'}\nDuration: ${duration || 'N/A'}\n\nWe appreciate your contribution and wish you the best for your future endeavors.\n\nWarm regards,\n\nTejas Patel\nDirector\nTEJASKP AI SOFTWARE`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                     <p>Dear <strong>${name}</strong>,</p>
                     
                     <p>Congratulations on successfully completing your internship program at <strong>TEJASKP AI SOFTWARE</strong>.</p>
                     
                     <p>Please find attached your official internship completion certificate.</p>
                     
                     <div style="background: #fdf6e3; padding: 15px; border-left: 4px solid #b8860b; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1a1a1a;">Intern Details:</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>Domain:</strong> ${course || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration || 'N/A'}</p>
                     </div>

                     <p>We appreciate your dedication and contribution during your time with us. We hope this experience has been valuable for your professional growth.</p>

                     <p>We wish you all the very best for your future endeavors.</p>

                     <br/>
                     <p>Warm regards,</p>
                     
                     <p><strong>Tejas Patel</strong><br/>
                     Director</p>
                     
                     <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                     <p style="font-size: 13px; color: #555;">
                        <strong>TEJASKP AI SOFTWARE</strong><br/>
                        📞 Contact: 9104630598<br/>
                        🌐 Website: <a href="https://tejaskpaisoftware.com" style="color: #b8860b; text-decoration: none;">www.tejaskpaisoftware.com</a>
                     </p>
                </div>
            `,
            attachments: [
                {
                    filename: `${name.replace(/\s+/g, '_')}_Certificate.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Certificate sent successfully" });

    } catch (error: any) {
        console.error("Error sending email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
