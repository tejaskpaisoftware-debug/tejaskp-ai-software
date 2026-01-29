import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const year: number = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
        }

        // Parallel Fetch for Performance
        const [user, storedBalance] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    joiningDate: true,
                    leaves: {
                        where: {
                            status: 'APPROVED',
                            startDate: { startsWith: year.toString() }
                        },
                        select: {
                            startDate: true,
                            endDate: true,
                            type: true,
                            isHalfDay: true
                        }
                    }
                }
            }),
            prisma.leaveBalance.findUnique({
                where: { userId_year: { userId, year } }
            }).catch(() => null) // Handle case where balance table row doesn't exist
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Calculate Accrued Balance
        const joiningDate = user.joiningDate ? new Date(user.joiningDate) : new Date(`${year}-01-01`);
        const currentDate = new Date();

        if (joiningDate > currentDate) {
            return NextResponse.json({ cl: 0, sl: 0, pl: 0 });
        }

        const startOfYear = new Date(year, 0, 1);
        const accrualStartDate = joiningDate > startOfYear ? joiningDate : startOfYear;

        let monthsAccrued = 0;

        if (year < currentDate.getFullYear()) {
            if (joiningDate.getFullYear() === year) {
                monthsAccrued = 12 - joiningDate.getMonth();
            } else {
                monthsAccrued = 12;
            }
        } else if (year === currentDate.getFullYear()) {
            const startMonth = accrualStartDate.getMonth();
            const currentMonth = currentDate.getMonth();
            monthsAccrued = (currentMonth - startMonth) + 1;
        }

        monthsAccrued = Math.max(0, monthsAccrued);

        const RATE_CL = 1.0;
        const RATE_SL = 0.5;

        const totalCL = monthsAccrued * RATE_CL;
        const totalSL = monthsAccrued * RATE_SL;

        // 3. Subtract Consumed Leaves
        const leaves = user.leaves || [];

        let usedCL = 0;
        let usedSL = 0;
        let usedPL = 0;

        leaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

            // Robust half-day check
            const isHalf = leave.isHalfDay || (leave.type && leave.type.toUpperCase().includes('HALF'));
            const deduction = isHalf ? 0.5 : days;

            const type = leave.type ? leave.type.toUpperCase() : '';

            if (type.startsWith('CL')) usedCL += deduction;
            else if (type.startsWith('SL')) usedSL += deduction;
            else if (type.startsWith('PL')) usedPL += deduction;
        });

        const finalPL = (storedBalance?.pl || 0) - usedPL;

        const response = {
            userId,
            year,
            cl: Math.max(0, totalCL - usedCL),
            sl: Math.max(0, totalSL - usedSL),
            pl: Math.max(0, finalPL),
            accruedInfo: {
                months: monthsAccrued,
                totalAccruedCL: totalCL,
                totalAccruedSL: totalSL
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
