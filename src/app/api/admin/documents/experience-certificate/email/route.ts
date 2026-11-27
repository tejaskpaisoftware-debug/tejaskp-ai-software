import { NextResponse } from "next/server";
import { adminTransporter, ADMIN_SENDER_IDENTITY } from "@/lib/admin-mailer";

export async function POST(request: Request) {
    try {
        const { email, name, pdfBase64, designation, duration } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing required fields (email, pdfBase64)" }, { status: 400 });
        }

        const mailOptions = {
            from: ADMIN_SENDER_IDENTITY,
            to: email,
            subject: `Official Experience & Relieving Certificate - TejasKP AI Software`,
            text: `Dear ${name},\n\nPlease find attached your official Experience & Relieving Certificate from TejasKP AI Software.\n\nWe appreciate your dedication and valuable contributions during your ${duration || "6-Month"} internship.\n\nBest regards,\nTejasKP AI Software`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="text-align: center; border-bottom: 2px solid #D49520; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #0A192F; margin: 0; text-transform: uppercase; letter-spacing: 1px;">TEJASKP AI SOFTWARE</h2>
                        <p style="color: #777; font-size: 12px; margin: 4px 0 0; text-transform: uppercase;">Innovative Solutions For Future</p>
                    </div>

                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Congratulations on successfully completing your <strong>${duration || "6-Month"} Internship & Practical Training</strong> at <strong>TEJASKP AI SOFTWARE</strong>.</p>
                    
                    <p>Please find attached your official <strong>Experience & Relieving Certificate</strong>.</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #D49520; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 4px 0;"><strong>Candidate Name:</strong> ${name}</p>
                        <p style="margin: 4px 0;"><strong>Designation:</strong> ${designation || "Intern - Web Development & AI Solutions"}</p>
                        <p style="margin: 4px 0;"><strong>Organization:</strong> TEJASKP AI SOFTWARE</p>
                        <p style="margin: 4px 0;"><strong>Document:</strong> Experience & Relieving Certificate</p>
                    </div>

                    <p>During your tenure with us, we appreciated your sincere effort, proactive learning attitude, and valuable contributions to our live projects.</p>

                    <p>We wish you all the very best and immense success in all your future endeavors and professional career!</p>

                    <br/>
                    <p style="margin-bottom: 2px;">Warm regards,</p>
                    <p style="margin-top: 0;"><strong>Tejas Patel</strong><br/>
                    Founder & Director<br/>
                    <span style="color: #D49520; font-weight: bold;">TEJASKP AI SOFTWARE</span></p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0 15px;" />
                    <p style="font-size: 12px; color: #666; line-height: 1.5;">
                        📞 Contact: +91 9104630598<br/>
                        ✉️ Email: salesandmarketing@tejaskpaisoftware.com<br/>
                        🌐 Website: <a href="https://tejaskpaisoftware.com" style="color: #D49520; text-decoration: none;">www.tejaskpaisoftware.com</a><br/>
                        📍 Vadodara, Gujarat
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `${name.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await adminTransporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Experience Certificate sent successfully via email" });

    } catch (error: any) {
        console.error("Error sending experience certificate email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
