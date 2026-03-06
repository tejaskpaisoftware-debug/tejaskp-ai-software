import { prisma } from "./prisma";
import WhatsAppManager from "./whatsappClient";

export type NotificationType = "LATE" | "ABSENT" | "SICK_LEAVE" | "URGENT" | "INFO";

interface NotificationOptions {
    userId: string;
    parentOnly?: boolean;
    studentOnly?: boolean;
}

export const NotificationService = {
    /**
     * Sends a notification to both student and parents (Mocked for now)
     */
    async notify({ userId, title, message, type = "INFO" }: { userId: string, title: string, message: string, type?: string }) {
        console.log(`[NOTIFICATION SERVICE] Triggered: ${title}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, mobile: true, parentMobile: true, parentName: true }
        });

        if (!user) return;

        // 1. Send to Student (In-app and Log)
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type
            }
        });
        console.log(`- SMS to Student (${user.name} - ${user.mobile}): ${message}`);

        // 2. Send to Parents (Log)
        if (user.parentMobile) {
            console.log(`- SMS to Parent (${user.parentName || 'Guardian'} - ${user.parentMobile}): ${message}`);
        } else {
            console.log(`- No parent contact found for ${user.name}`);
        }
    },

    /**
     * Specifically for Sick Leave
     */
    async sendSickLeaveCare(adminUserId: string, userId: string) {
        const message = "We hope your child is feeling better. Please take care and inform us once they are ready to resume.";
        await this.notify({
            userId,
            title: "Get Well Soon",
            message,
            type: "INFO"
        });

        // WhatsApp trigger for Sick Leave
        try {
            console.log(`[WHATSAPP DEBUG - ${adminUserId}] Executing Sick Leave trigger for User: ${userId}`);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, mobile: true, parentMobile: true }
            });

            if (user) {
                console.log(`[WHATSAPP DEBUG - ${adminUserId}] Found User: ${user.name}. ParentMobile: ${user.parentMobile}, StudentMobile: ${user.mobile}`);
                // To Parent
                if (user.parentMobile) {
                    const pRes = await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.parentMobile,
                        `Dear Parent/Guardian,\n\nHope your child, ${user.name || "student"}, is fine as they have taken sick leave for today.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                    console.log(`[WHATSAPP DEBUG - ${adminUserId}] Parent Send Result:`, pRes);
                } else {
                    console.log(`[WHATSAPP DEBUG - ${adminUserId}] Skipping Parent - No Mobile Number`);
                }

                // To Student
                if (user.mobile) {
                    const sRes = await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.mobile,
                        `Hi ${user.name || "Student"},\n\nHope you are fine as you have taken leave thus please take care.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                    console.log(`[WHATSAPP DEBUG - ${adminUserId}] Student Send Result:`, sRes);
                } else {
                    console.log(`[WHATSAPP DEBUG - ${adminUserId}] Skipping Student - No Mobile Number`);
                }
            } else {
                console.log(`[WHATSAPP DEBUG - ${adminUserId}] Could not find user in database for ID: ${userId}`);
            }
        } catch (error) {
            console.error(`[WHATSAPP DEBUG - ${adminUserId}] Failed to send WhatsApp Sick Leave info:`, error);
        }
    },

    /**
     * Specifically for Late Warnings
     */
    async sendLateWarning(userId: string, lateCount: number) {
        const message = `Punctuality Warning: You have arrived after 10:40 AM ${lateCount} times this month. Please ensure timely arrival to avoid further action.`;
        await this.notify({
            userId,
            title: "Punctuality Warning",
            message,
            type: "LATE"
        });
    },

    /**
     * Specifically for Uninformed Absence
     */
    async sendAbsenceWarning(userId: string) {
        const message = "Attendance Alert: Our records show you are absent today without prior notice. Please contact the administrator immediately.";
        await this.notify({
            userId,
            title: "Uninformed Absence",
            message,
            type: "ABSENT"
        });
    },

    /**
     * Specifically for Casual Leave Automatic Rejection (Less than 2 days notice)
     */
    async sendCasualLeaveRejected(adminUserId: string, userId: string) {
        const message = "Casual Leave request rejected: Must apply at least 2 days in advance.";
        await this.notify({
            userId,
            title: "Leave Rejected",
            message,
            type: "INFO"
        });

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, mobile: true, parentMobile: true }
            });

            if (user) {
                if (user.parentMobile) {
                    await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.parentMobile,
                        `Dear Parent/Guardian,\n\nThis is to inform you that the Casual Leave request for ${user.name || "your child"} has been REJECTED as it was not applied at least 2 days in advance.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                }
                if (user.mobile) {
                    await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.mobile,
                        `Hi ${user.name || "Student"},\n\nYour Casual Leave request has been REJECTED. Please note that you must apply at least 2 days in advance for a Casual Leave.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                }
            }
        } catch (error) {
            console.error(`[WhatsApp - ${adminUserId}] Failed to send CL Rejection WhatsApp:`, error);
        }
    },

    /**
     * Specifically for Casual Leave Approval
     */
    async sendCasualLeaveApproved(adminUserId: string, userId: string) {
        const message = "Your Casual Leave request has been approved.";
        await this.notify({
            userId,
            title: "Leave Approved",
            message,
            type: "INFO"
        });

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, mobile: true, parentMobile: true }
            });

            if (user) {
                if (user.parentMobile) {
                    await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.parentMobile,
                        `Dear Parent/Guardian,\n\nThis is to inform you that the Casual Leave request for ${user.name || "your child"} has been APPROVED.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                }
                if (user.mobile) {
                    await WhatsAppManager.sendMessage(
                        adminUserId,
                        user.mobile,
                        `Hi ${user.name || "Student"},\n\nYour Casual Leave request has been APPROVED.\n\nRegards,\nAdmin - Tejaskp AI Software`
                    );
                }
            }
        } catch (error) {
            console.error(`[WhatsApp - ${adminUserId}] Failed to send CL Approval WhatsApp:`, error);
        }
    }
};
