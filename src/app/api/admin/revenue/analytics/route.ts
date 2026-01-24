
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

function formatPeriod(period: string, type: 'yearly' | 'monthly' | 'weekly' | 'daily'): string {
    if (!period) return "";
    if (type === 'yearly') return period;
    if (type === 'monthly') {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
    if (type === 'weekly') {
        const [year, week] = period.split('-');
        return "Week " + week + ", " + year;
    }
    if (type === 'daily') {
        const date = new Date(period);
        return date.toLocaleString('default', { day: 'numeric', month: 'short' });
    }
    return period;
}

function getYearRange(year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const yearParam = searchParams.get('year');

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    try {
        let dateFilter: any = {};

        // Date Logic for GRAPHS (Revenue Trends)
        if (from && to) {
            const startDate = new Date(from);
            const endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            dateFilter = {
                createdAt: { gte: startDate, lte: endDate }
            };
        } else {
            const { start, end } = getYearRange(year);
            dateFilter = {
                createdAt: { gte: start, lte: end }
            };
        }

        // 1. Calculate GRAND TOTAL (All Time Revenue from Invoices)
        // Matches Dashboard logic
        const allTimeRevenueAgg = await prisma.invoice.aggregate({
            _sum: { paidAmount: true }
        });
        const grandTotalRevenue = allTimeRevenueAgg._sum.paidAmount || 0;

        // 1.1 Calculate PENDING AMOUNT (Total Pending Fees from Users)
        const pendingAgg = await prisma.user.aggregate({
            _sum: { pendingAmount: true },
            where: { pendingAmount: { gt: 0 } } // Only positive pending
        });
        const totalPending = pendingAgg._sum.pendingAmount || 0;


        // 2. Fetch Invoices for Selected Period (for Graphs ONLY)
        const invoicesGraph = await prisma.invoice.findMany({
            where: { ...dateFilter },
            select: { createdAt: true, paidAmount: true }
        });

        // 3. Fetch Expenses for Selected Period (for Graphs ONLY)
        const purchaseFilter = (from && to)
            ? { date: { gte: new Date(from), lte: new Date(to) } }
            : { date: { gte: getYearRange(year).start, lte: getYearRange(year).end } };

        const purchasesGraph = await prisma.purchase.findMany({
            where: purchaseFilter,
            select: { date: true, amount: true }
        });


        // 4. Fetch ALL RECENT TRANSACTIONS (Unfiltered by Year)
        // If Custom Range is ON, we respect it. If it's just Year view, we show ALL recent.
        let transactionDateFilter: any = {};
        if (from && to) {
            const startDate = new Date(from);
            const endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            transactionDateFilter = {
                createdAt: { gte: startDate, lte: endDate }
            };
        } else {
            transactionDateFilter = {};
        }

        const invoicesAll = await prisma.invoice.findMany({
            where: { ...transactionDateFilter },
            select: { createdAt: true, paidAmount: true, customerName: true, items: true, invoiceNumber: true },
            orderBy: { createdAt: 'desc' },
            take: 1000 // Limit to 1000
        });

        const purchasesAll = await prisma.purchase.findMany({
            where: (from && to) ? { date: { gte: new Date(from), lte: new Date(to) } } : {},
            select: { date: true, amount: true, description: true },
            orderBy: { date: 'desc' },
            take: 50
        });

        const transactions: any[] = [
            ...invoicesAll.map(inv => ({
                date: inv.createdAt,
                name: inv.customerName || 'Customer',
                details: `Invoice #${inv.invoiceNumber}`,
                type: 'REVENUE',
                amount: inv.paidAmount || 0
            })),
            ...purchasesAll.map(p => ({
                date: p.date,
                name: p.description || 'Expense',
                details: 'Purchase',
                type: 'EXPENSE',
                amount: p.amount
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());



        // 5. Aggregation for Graphs (Using the Filtered Data)
        const aggregateData = (type: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
            const map = new Map<string, { revenue: number, expense: number }>();
            const getKey = (dateInput: Date | string) => {
                const date = new Date(dateInput);
                if (isNaN(date.getTime())) return "";
                if (type === 'yearly') return date.getFullYear().toString();
                if (type === 'monthly') return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0');
                if (type === 'daily') return date.toISOString().split('T')[0];
                if (type === 'weekly') {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                    return d.getUTCFullYear() + "-" + weekNo.toString().padStart(2, '0');
                }
                return "";
            };

            invoicesGraph.forEach(inv => {
                const key = getKey(inv.createdAt);
                if (!key) return;
                const entry = map.get(key) || { revenue: 0, expense: 0 };
                entry.revenue += (inv.paidAmount || 0);
                map.set(key, entry);
            });

            purchasesGraph.forEach(p => {
                const key = getKey(p.date);
                if (!key) return;
                const entry = map.get(key) || { revenue: 0, expense: 0 };
                entry.expense += (p.amount || 0);
                map.set(key, entry);
            });
            return map;
        };

        const processView = (type: 'monthly' | 'weekly' | 'daily') => {
            const dataMap = aggregateData(type);
            const result = [];
            if (type === 'monthly') {
                for (let m = 1; m <= 12; m++) {
                    const key = year + "-" + m.toString().padStart(2, '0');
                    const entry = dataMap.get(key) || { revenue: 0, expense: 0 };
                    result.push({ period: key, ...entry, profit: entry.revenue - entry.expense });
                }
            } else if (type === 'weekly') {
                for (let w = 1; w <= 52; w++) {
                    const key = year + "-" + w.toString().padStart(2, '0');
                    const entry = dataMap.get(key) || { revenue: 0, expense: 0 };
                    result.push({ period: key, ...entry, profit: entry.revenue - entry.expense });
                }
            } else if (type === 'daily') {
                const sortedKeys = Array.from(dataMap.keys()).sort();
                return sortedKeys.map(key => {
                    const entry = dataMap.get(key)!;
                    return { period: key, ...entry, profit: entry.revenue - entry.expense };
                });
            }
            return result;
        };

        const monthly = processView('monthly');
        const weekly = processView('weekly');
        const daily = processView('daily');

        const yearlyPromises = [];
        const currentYearNum = year;
        for (let i = 0; i < 5; i++) {
            const y = currentYearNum - i;
            const { start, end } = getYearRange(y);

            yearlyPromises.push(Promise.all([
                prisma.invoice.aggregate({
                    _sum: { paidAmount: true },
                    where: { createdAt: { gte: start, lte: end } }
                }),
                prisma.purchase.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } })
            ]).then(([r, e]) => ({
                period: y.toString(),
                revenue: r._sum.paidAmount || 0,
                expense: e._sum.amount || 0,
                profit: (r._sum.paidAmount || 0) - (e._sum.amount || 0)
            })));
        }
        const yearlyData = await Promise.all(yearlyPromises);

        const serializeWithFormat = (data: any[], type: any) =>
            data.map(item => ({
                originalPeriod: item.period,
                period: formatPeriod(item.period, type),
                revenue: item.revenue || 0,
                expense: item.expense || 0,
                profit: item.profit || 0
            }));

        // Calculate ALL TIME Expenses for consistent Net Profit
        const allTimeExpensesAgg = await prisma.purchase.aggregate({ _sum: { amount: true } });
        const allTimeExpenses = allTimeExpensesAgg._sum.amount || 0;

        // Current Page Selection (for Graph only)
        const selectedYearExpenses = purchasesGraph.reduce((sum, p) => sum + (p.amount || 0), 0);
        const selectedYearRevenue = invoicesGraph.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

        return NextResponse.json({
            success: true,
            overview: {
                // FORCE ALL TIME VIEW for Top Cards
                total: grandTotalRevenue,
                selectedYearTotal: grandTotalRevenue, // Override to show All Time
                selectedYear: year,

                totalExpenses: allTimeExpenses,
                selectedYearExpenses: allTimeExpenses, // Override to show All Time

                netProfit: grandTotalRevenue - allTimeExpenses,
                pendingAmount: totalPending
            },
            graphs: {
                yearly: serializeWithFormat(yearlyData.reverse(), 'yearly'),
                monthly: serializeWithFormat(monthly, 'monthly'),
                weekly: serializeWithFormat(weekly, 'weekly'),
                daily: serializeWithFormat(daily, 'daily'),
                custom: (from && to) ? serializeWithFormat(daily, 'daily') : []
            },
            transactions
        });

    } catch (error: any) {
        console.error("Revenue Analytics Error:", error);
        return NextResponse.json({ success: false, error: "Failed to calculate revenue" }, { status: 500 });
    }
}
