import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | '3-months' | 'all-time';

export interface StudentReport {
    studentName: string;
    studentMobile: string;
    parentName: string | null;
    parentMobile: string | null;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    lateMarks: number;
    sickLeaves: number;
    casualLeaves: number;
    averageCheckInTime: string;
    reportMark: number;
}

export class ReportGenerator {

    /**
     * Calculates the start date based on the chosen period
     */
    private static getStartDateForPeriod(period: ReportPeriod): Date {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        switch (period) {
            case 'daily':
                return now;
            case 'weekly':
                const weeklyDate = new Date(now);
                weeklyDate.setDate(now.getDate() - 7);
                return weeklyDate;
            case 'monthly':
                const monthlyDate = new Date(now);
                monthlyDate.setMonth(now.getMonth() - 1);
                return monthlyDate;
            case '3-months':
                const threeMonthsDate = new Date(now);
                threeMonthsDate.setMonth(now.getMonth() - 3);
                return threeMonthsDate;
            case 'all-time':
            default:
                return new Date(0); // Epoch
        }
    }

    /**
     * Generates a comprehensive report for a given student and period
     */
    static async generateStudentReport(userId: string, period: ReportPeriod): Promise<StudentReport | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                console.error(`User with ID ${userId} not found.`);
                return null;
            }

            const startDate = this.getStartDateForPeriod(period);
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            // 1. Fetch Attendance Records
            const attendances = await prisma.attendance.findMany({
                where: {
                    userId: userId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // 2. Fetch Leaves
            // Assuming `startDate` and `endDate` inside Leave model are stored as YYYY-MM-DD strings
            // We'll fetch all approved leaves and filter them down
            const allLeaves = await prisma.leave.findMany({
                where: {
                    userId: userId,
                    status: 'APPROVED'
                }
            });

            // Parse and filter leaves within the period boundaries
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            let sickLeaves = 0;
            let casualLeaves = 0;

            allLeaves.forEach(leave => {
                if (leave.startDate >= startStr && leave.endDate <= endStr) {
                    // Count days (rough estimation: assuming 1 record = 1 day if start == end, else difference)
                    const sDate = new Date(leave.startDate);
                    const eDate = new Date(leave.endDate);
                    const days = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)) + 1;

                    const actualDays = leave.isHalfDay ? 0.5 : days;

                    if (leave.type === 'SL') sickLeaves += actualDays;
                    else if (leave.type === 'CL') casualLeaves += actualDays;
                }
            });

            // 3. Process Attendance Metrics
            let presentDays = 0;
            let lateMarks = 0;
            let absentDays = 0;
            let totalCheckInMinutes = 0;
            let checkInCount = 0;

            const uniqueAttendanceDays = new Set<string>();

            attendances.forEach(record => {
                uniqueAttendanceDays.add(record.date);

                if (record.status === 'PRESENT' || record.status === 'PENDING') {
                    presentDays++;
                    if (record.isLate) lateMarks++;

                    // Average check-in time calculation
                    const loginTime = new Date(record.loginTime);
                    totalCheckInMinutes += (loginTime.getHours() * 60) + loginTime.getMinutes();
                    checkInCount++;
                }

                if (record.isAbsent) absentDays++;
            });

            // Estimate total working days (Present + Absent + Leaves) for this user explicitly in this period
            // If it's daily, totalWorkingDays is probably 1. If weekly, maybe 5 or 6 depending on schedule.
            // A dynamic approximation:
            const totalWorkingDays = presentDays + absentDays + sickLeaves + casualLeaves;

            // Calculate average check-in time
            let averageCheckInTimeStr = 'N/A';
            if (checkInCount > 0) {
                const avgMinutes = Math.floor(totalCheckInMinutes / checkInCount);
                const avgHours = Math.floor(avgMinutes / 60);
                const avgMins = avgMinutes % 60;
                const ampm = avgHours >= 12 ? 'PM' : 'AM';
                const formattedHours = avgHours % 12 || 12;
                averageCheckInTimeStr = `${formattedHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')} ${ampm}`;
            }

            // Calculate Report Mark
            let reportMark = 100;
            if (totalWorkingDays > 0) {
                // Formula: (Present Days - (Late Days * 0.5) - SL - CL) / Total Working Days * 100
                const score = ((presentDays - (lateMarks * 0.5) - sickLeaves - casualLeaves) / totalWorkingDays) * 100;
                reportMark = Math.max(0, Math.min(100, Math.round(score))); // Clamp between 0-100
            }


            return {
                studentName: user.name || 'Unknown',
                studentMobile: user.mobile,
                parentName: user.parentName,
                parentMobile: user.parentMobile,
                period,
                startDate,
                endDate,
                totalWorkingDays: totalWorkingDays === 0 && period === 'daily' ? 1 : totalWorkingDays, // Prevent 0 if just today and pending
                presentDays,
                absentDays,
                lateMarks,
                sickLeaves,
                casualLeaves,
                averageCheckInTime: averageCheckInTimeStr,
                reportMark
            };

        } catch (error) {
            console.error("Error generating student report:", error);
            return null;
        }
    }
}
