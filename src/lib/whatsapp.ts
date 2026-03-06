import WhatsAppManager from './whatsappClient';
import { StudentReport } from './reportGenerator';

export class WhatsAppService {
    static async sendLateWarning(adminUserId: string, parentMobile: string, studentName: string, lateCount: number) {
        try {
            const messageContext = `🚨 *URGENT ATTENDANCE WARNING* 🚨\n\nDear Parent/Guardian,\n\nThis is to inform you that your child, *${studentName}*, has arrived LATE for the *${lateCount}* time this month. \n\nPunctuality is critical for their progress. If a student is late more than 2 times, it may lead to disciplinary action or being marked absent.\n\nPlease ensure they check in before 10:40 AM.\n\nRegards,\n*Admin - TEJASKP AI SOFTWARE*`;

            const success = await WhatsAppManager.sendMessage(adminUserId, parentMobile, messageContext);
            if (success) {
                console.log(`[WhatsApp - ${adminUserId}] warning sent successfully to Parent ${parentMobile}`);
            }
            return success;
        } catch (error) {
            console.error(`[WhatsApp - ${adminUserId}] Failed to send message to Parent:`, error);
            return false;
        }
    }

    static async sendStudentWarning(adminUserId: string, studentMobile: string, studentName: string) {
        try {
            const studentMessageContext = `Dear *${studentName}* (${studentMobile}),\n\nYou have been marked late today. An update has been shared with your parents for their information.\n\nRegards,\n*Admin - Tejaskp AI Software*`;

            const success = await WhatsAppManager.sendMessage(adminUserId, studentMobile, studentMessageContext);
            if (success) {
                console.log(`[WhatsApp - ${adminUserId}] warning sent successfully to Student ${studentMobile}`);
            }
            return success;
        } catch (error) {
            console.error(`[WhatsApp - ${adminUserId}] Failed to send student message:`, error);
            return false;
        }
    }

    static async sendStudentReport(adminUserId: string, studentMobile: string, parentMobile: string | null, report: StudentReport) {
        try {
            const capitalizedPeriod = report.period.charAt(0).toUpperCase() + report.period.slice(1);

            const messageContext = `📊 *${capitalizedPeriod} Student Performance Report* 📊\n\n` +
                `*Student:* ${report.studentName}\n` +
                `*Period:* ${report.startDate.toLocaleDateString()} to ${report.endDate.toLocaleDateString()}\n\n` +
                `*Attendance Summary:*\n` +
                `• Total Working Days: ${report.totalWorkingDays}\n` +
                `• Present Days: ${report.presentDays}\n` +
                `• Average Check-in: ${report.averageCheckInTime}\n` +
                `• Late Marks: ${report.lateMarks}\n` +
                `• Sick Leaves (SL): ${report.sickLeaves}\n` +
                `• Casual Leaves (CL): ${report.casualLeaves}\n\n` +
                `🏅 *Calculated Mark:* ${report.reportMark}%\n\n` +
                `Regards,\n*Admin - Tejaskp AI Software*`;

            // Send to Student
            const studentSuccess = await WhatsAppManager.sendMessage(adminUserId, studentMobile, messageContext);
            if (studentSuccess) {
                console.log(`[WhatsApp - ${adminUserId}] report sent successfully to Student ${studentMobile}`);
            }

            // Send to Parent if available
            let parentSuccess = false;
            if (parentMobile) {
                const parentIntro = `Dear Parent/Guardian,\nHere is the performance report for your child:\n\n`;
                parentSuccess = await WhatsAppManager.sendMessage(adminUserId, parentMobile, parentIntro + messageContext);
                if (parentSuccess) {
                    console.log(`[WhatsApp - ${adminUserId}] report sent successfully to Parent ${parentMobile}`);
                }
            }

            return { studentSuccess, parentSuccess };

        } catch (error) {
            console.error(`[WhatsApp - ${adminUserId}] Failed to send report:`, error);
            return { studentSuccess: false, parentSuccess: false };
        }
    }
}
