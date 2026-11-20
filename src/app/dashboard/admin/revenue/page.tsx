"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    TrendingUp, 
    ArrowDownRight, 
    ArrowUpRight, 
    DollarSign, 
    Calendar, 
    Search, 
    Plus, 
    Clock, 
    X, 
    Percent, 
    AlertCircle, 
    MessageCircle, 
    Filter,
    BarChart3
} from "lucide-react";

export default function RevenuePage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'yearly' | 'monthly' | 'weekly' | 'daily' | 'custom'>('monthly');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    // Purchase Modal State
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState({ amount: '', description: '', date: '', category: '' });
    const [submittingPurchase, setSubmittingPurchase] = useState(false);

    const [error, setError] = useState('');

    // Pending Dues Modal State
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);

    // Transaction Filters
    const [filterType, setFilterType] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
    const [filterValue, setFilterValue] = useState('');

    // Role Protection
    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === "TEAM_LEAD") {
                    router.replace('/dashboard/admin');
                }
            }
        } catch (e) {
            console.error("Role Check Error", e);
        }
    }, [router]);

    useEffect(() => {
        if (activeTab !== 'custom') {
            fetchRevenueData();
        }
    }, [activeTab, selectedYear]);

    useEffect(() => {
        if (activeTab === 'custom' && dateRange.from && dateRange.to) {
            fetchRevenueData();
        }
    }, [dateRange, activeTab]);

    const fetchRevenueData = async () => {
        setLoading(true);
        setError('');
        try {
            let url = `/api/admin/revenue/analytics?year=${selectedYear}`;
            if (activeTab === 'custom') {
                if (!dateRange.from || !dateRange.to) {
                    setLoading(false);
                    return;
                }
                url = `/api/admin/revenue/analytics?from=${dateRange.from}&to=${dateRange.to}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch data");
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                throw new Error(json.error || "Unknown error");
            }
        } catch (error) {
            console.error(error);
            setError("Failed to load financial data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingPurchase(true);
        try {
            const res = await fetch('/api/admin/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseForm)
            });
            const json = await res.json();
            if (json.success) {
                setIsPurchaseModalOpen(false);
                setPurchaseForm({ amount: '', description: '', date: '', category: '' });
                fetchRevenueData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingPurchase(false);
        }
    };

    const handleViewPendingDues = async () => {
        setIsPendingModalOpen(true);
        setLoadingPending(true);
        try {
            const res = await fetch('/api/admin/revenue/pending-dues');
            const json = await res.json();
            if (json.success) {
                setPendingUsers(json.users);
            }
        } catch (error) {
            console.error("Failed to load pending dues", error);
        } finally {
            setLoadingPending(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleWhatsAppNotify = (user: any) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5);
        const formattedDueDate = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        const message = `*OFFICIAL PAYMENT NOTICE - TEJASKP AI SOFTWARE*

Dear ${user.name},

This is a reminder regarding your outstanding fees.

🔹 *Total Fees:* ${formatCurrency(user.totalFees || 0)}
🔹 *Paid Amount:* ${formatCurrency(user.paidAmount || 0)}
🚨 *Pending Amount:* ${formatCurrency(user.pendingAmount || 0)}

Please clear your dues by *${formattedDueDate}*.

⚠️ *Penalty Notice:* 
A late fee of *₹100/day* applies if payment is not received by the due date.

Regards,
*Accounts Department*
TEJASKP AI SOFTWARE`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://web.whatsapp.com/send?phone=91${user.mobile}&text=${encodedMessage}`, '_blank');
    };

    if (loading && !data) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-slate-500 font-semibold animate-pulse">Loading Financial Analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center max-w-md">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-900 mb-1">Financial Data Error</p>
                    <p className="text-sm text-slate-600">{error}</p>
                    <button onClick={fetchRevenueData} className="mt-4 px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors text-xs uppercase tracking-wider">
                        Retry Fetch
                    </button>
                </div>
            </div>
        );
    }

    if (!data && activeTab !== 'custom') return null;

    const currentGraphData = activeTab === 'custom'
        ? (data?.graphs?.custom || [])
        : (data?.graphs?.[activeTab] || []);

    const transactions = data?.transactions || [];

    const filteredTransactions = transactions.filter((tx: any) => {
        const matchesSearch = tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.details && tx.details.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;
        if (filterType === 'all') return true;

        const txDate = new Date(tx.date);

        if (filterType === 'day' && filterValue) {
            return txDate.toISOString().split('T')[0] === filterValue;
        }

        if (filterType === 'month' && filterValue) {
            const [year, month] = filterValue.split('-');
            return txDate.getFullYear() === parseInt(year) && (txDate.getMonth() + 1) === parseInt(month);
        }

        if (filterType === 'year' && filterValue) {
            return txDate.getFullYear() === parseInt(filterValue);
        }

        if (filterType === 'week' && filterValue) {
            const [yearStr, weekStr] = filterValue.split('-W');
            const year = parseInt(yearStr);
            const week = parseInt(weekStr);

            const d = new Date(Date.UTC(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const txWeekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

            return txDate.getFullYear() === year && txWeekNo === week;
        }

        return true;
    });

    const filteredTotal = filteredTransactions.reduce((sum: number, tx: any) => {
        if (tx.type === 'REVENUE') {
            return sum + (tx.amount || 0);
        } else {
            return sum - (tx.amount || 0);
        }
    }, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <BarChart3 className="w-3.5 h-3.5" /> Financial Intelligence
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Revenue & Expenses</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Financial performance, net margins, expenditure logs, and pending fee collection.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab !== 'custom' && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fiscal Year</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent text-sm font-bold text-amber-700 focus:outline-none cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y} className="text-slate-900">{y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Expense
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Total Revenue - Highlight */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-5 rounded-2xl shadow-sm border border-amber-400 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Revenue</p>
                            <TrendingUp className="w-4 h-4 opacity-80" />
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight mt-1">
                            {formatCurrency(data?.overview?.selectedYearTotal ?? data?.overview?.total ?? 0)}
                        </h3>
                    </div>
                    <p className="text-[11px] font-medium opacity-80 mt-3">Fiscal Year Total</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Expenses</p>
                            <span className="p-1 rounded bg-rose-50 text-rose-600"><ArrowDownRight className="w-3.5 h-3.5" /></span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1">
                            {formatCurrency(data?.overview?.selectedYearExpenses ?? 0)}
                        </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Recorded Purchases</p>
                </div>

                {/* Net Profit */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Profit</p>
                            <span className={`p-1 rounded ${(data?.overview?.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <h3 className={`text-2xl font-extrabold tracking-tight mt-1 ${(data?.overview?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(data?.overview?.netProfit ?? 0)}
                        </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Revenue minus Expenses</p>
                </div>

                {/* Margin */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Profit Margin</p>
                            <span className="p-1 rounded bg-slate-100 text-slate-600"><Percent className="w-3.5 h-3.5" /></span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                            {`${((data?.overview?.netProfit / (data?.overview?.selectedYearTotal || 1)) * 100).toFixed(1)}%`}
                        </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Operating Ratio</p>
                </div>

                {/* Pending Amount - Interactive */}
                <div 
                    onClick={handleViewPendingDues}
                    className="bg-white border border-amber-200 hover:border-amber-400 p-5 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:bg-amber-50/20 group"
                >
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Dues</p>
                            <span className="p-1 rounded bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform"><Clock className="w-3.5 h-3.5" /></span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight mt-1">
                            {formatCurrency(data?.overview?.pendingAmount || 0)}
                        </h3>
                    </div>
                    <p className="text-[11px] font-semibold text-amber-700 mt-3 group-hover:underline">
                        Click to view pending list →
                    </p>
                </div>
            </div>

            {/* Main Financial Analytics Chart */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Financial Performance Dynamics</h2>
                        <div className="flex items-center gap-4 text-xs mt-1">
                            <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Revenue
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Profit
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {activeTab === 'custom' && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 px-2">
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="bg-transparent text-xs text-slate-800 font-medium outline-none"
                                />
                                <span className="text-slate-400 text-xs">to</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="bg-transparent text-xs text-slate-800 font-medium outline-none"
                                />
                            </div>
                        )}

                        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                            {(['yearly', 'monthly', 'weekly', 'daily', 'custom'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                                        activeTab === tab
                                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SVG Area Chart */}
                <div className="h-80 w-full relative pt-2">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium animate-pulse">
                            Recalculating analytics...
                        </div>
                    ) : currentGraphData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                            {activeTab === 'custom' ? 'Select a custom date range above.' : `No financial data found for fiscal year ${selectedYear}.`}
                        </div>
                    ) : (
                        <RevenueAreaChart data={currentGraphData} formatCurrency={formatCurrency} />
                    )}
                </div>
            </div>

            {/* Financial History Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900">Audit Trail & Transaction Ledger</h3>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {filteredTransactions.length} items
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Net Balance for Filter: <span className={`font-mono font-bold ${filteredTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(filteredTotal)}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value as any);
                                setFilterValue('');
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                        >
                            <option value="all">All Records</option>
                            <option value="day">By Day</option>
                            <option value="week">By Week</option>
                            <option value="month">By Month</option>
                            <option value="year">By Year</option>
                        </select>

                        {filterType === 'day' && (
                            <input
                                type="date"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                            />
                        )}

                        {filterType === 'week' && (
                            <input
                                type="week"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                            />
                        )}

                        {filterType === 'month' && (
                            <input
                                type="month"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                            />
                        )}

                        {filterType === 'year' && (
                            <select
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                            >
                                <option value="">Select Year</option>
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by name or note..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500 w-44"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-3.5">Timestamp</th>
                                <th className="px-6 py-3.5">Description / Client</th>
                                <th className="px-6 py-3.5">Category</th>
                                <th className="px-6 py-3.5 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No transactions match the selected filter.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="text-slate-900 font-mono text-xs font-semibold">
                                                {new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="font-semibold text-slate-900">{tx.name}</div>
                                            {tx.details && <div className="text-xs text-slate-500">{tx.details}</div>}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                tx.type === 'REVENUE' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-3.5 text-right font-bold font-mono ${tx.type === 'REVENUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Purchase Modal */}
            <AnimatePresence>
                {isPurchaseModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl"
                        >
                            <button 
                                onClick={() => setIsPurchaseModalOpen(false)} 
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Record Company Expense</h2>
                            <p className="text-xs text-slate-500 mb-5">Add procurement, supplies, or software subscription costs.</p>

                            <form onSubmit={handleAddPurchase} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Amount (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={purchaseForm.amount}
                                        onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:border-amber-500 outline-none text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={purchaseForm.date}
                                        onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-amber-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description / Vendor</label>
                                    <input
                                        type="text"
                                        required
                                        value={purchaseForm.description}
                                        onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-amber-500 outline-none text-sm"
                                        placeholder="e.g. AWS Cloud Hosting, Office Equipment"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingPurchase}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow text-xs uppercase tracking-wider mt-2"
                                >
                                    {submittingPurchase ? 'Recording Expense...' : 'Save Expense Record'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pending Dues Modal */}
            <AnimatePresence>
                {isPendingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-4xl relative max-h-[85vh] flex flex-col shadow-2xl"
                        >
                            <button 
                                onClick={() => setIsPendingModalOpen(false)} 
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-slate-900">Outstanding Fee Receivables</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Students and clients with overdue or partial balances.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1">
                                {loadingPending ? (
                                    <div className="text-center text-slate-400 py-12 animate-pulse">Loading pending student roster...</div>
                                ) : pendingUsers.length === 0 ? (
                                    <div className="text-center text-slate-400 py-12">No pending balances found! All fees cleared.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-white border-b border-slate-200 z-10">
                                            <tr>
                                                <th className="py-3">Student Name</th>
                                                <th className="py-3">Mobile Contact</th>
                                                <th className="py-3 text-right">Total Fees</th>
                                                <th className="py-3 text-right">Paid</th>
                                                <th className="py-3 text-right text-rose-600">Pending</th>
                                                <th className="py-3 text-center">WhatsApp Notify</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-slate-100">
                                            {pendingUsers.map((user, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 font-semibold text-slate-900">
                                                        {user.name} 
                                                        <span className="text-xs font-normal text-slate-500 block">{user.course}</span>
                                                    </td>
                                                    <td className="py-3 font-mono text-xs text-slate-600">{user.mobile}</td>
                                                    <td className="py-3 text-right font-mono text-slate-700">{formatCurrency(user.totalFees || 0)}</td>
                                                    <td className="py-3 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(user.paidAmount || 0)}</td>
                                                    <td className="py-3 text-right font-mono font-bold text-rose-600">{formatCurrency(user.pendingAmount || 0)}</td>
                                                    <td className="py-3 text-center">
                                                        <button
                                                            onClick={() => handleWhatsAppNotify(user)}
                                                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                            title="Send WhatsApp Payment Reminder"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" /> Remind
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold text-slate-900 sticky bottom-0 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={4} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider text-slate-600">
                                                    Aggregate Outstanding
                                                </td>
                                                <td className="py-3.5 text-right text-rose-600 text-base font-mono">
                                                    {formatCurrency(pendingUsers.reduce((sum, u) => sum + (u.pendingAmount || 0), 0))}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RevenueAreaChart({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) {
    const padding = { top: 10, bottom: 20, left: 0, right: 0 };
    const graphHeight = 100 - padding.top - padding.bottom;

    const allValues = data.flatMap(d => [d.revenue, d.expense, d.profit]);
    const maxVal = Math.max(...allValues, 100);
    const minVal = Math.min(...allValues, 0);
    const range = maxVal - minVal;

    const getY = (val: number) => {
        if (range === 0) return padding.top + (graphHeight / 2);
        const normalized = (val - minVal) / range;
        return (padding.top + graphHeight) - (normalized * graphHeight);
    };

    const zeroY = getY(0);

    const getLineData = (key: 'revenue' | 'expense' | 'profit') => {
        const points = data.map((d, i) => {
            const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
            const y = getY(d[key]);
            return { x, y, val: d[key], label: d.period };
        });

        if (points.length === 0) return { path: '', area: '', points: [] };

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }

        return { path, points };
    };

    const revenue = getLineData('revenue');
    const expense = getLineData('expense');
    const profit = getLineData('profit');

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="w-full h-full flex flex-col justify-between select-none">
            <div className="relative w-full flex-1">
                <div className="absolute left-0 top-0 bottom-0 text-[10px] font-mono text-slate-400 flex flex-col justify-between pointer-events-none z-10 pl-1">
                    <span>{formatCurrency(maxVal)}</span>
                    {minVal < 0 && <span style={{ top: `${zeroY}%`, position: 'absolute' }}>{formatCurrency(0)}</span>}
                    <span style={{ top: `${padding.top + graphHeight}%`, position: 'absolute' }}>{formatCurrency(minVal)}</span>
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#CBD5E1" strokeDasharray="2 2" strokeWidth="0.5" />
                    <line x1="0" y1={padding.top} x2="100" y2={padding.top} stroke="#E2E8F0" strokeDasharray="1 1" strokeWidth="0.3" />
                    <line x1="0" y1={padding.top + graphHeight} x2="100" y2={padding.top + graphHeight} stroke="#E2E8F0" strokeWidth="0.4" />

                    {/* Revenue Line (Amber) */}
                    <motion.path d={revenue.path} fill="none" stroke="#D97706" strokeWidth="0.9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />

                    {/* Expense Line (Rose) */}
                    <motion.path d={expense.path} fill="none" stroke="#F43F5E" strokeWidth="0.9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.1 }} />

                    {/* Profit Line (Emerald) */}
                    <motion.path d={profit.path} fill="none" stroke="#10B981" strokeWidth="1.1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />

                    {/* Interaction Zones */}
                    {data.map((_, i) => {
                        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                        const colWidth = 100 / data.length;
                        return (
                            <rect
                                key={i}
                                x={x - (colWidth / 2)}
                                y="0"
                                width={colWidth}
                                height="100"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        );
                    })}

                    {hoveredIndex !== null && revenue.points[hoveredIndex] && (
                        <>
                            <line
                                x1={revenue.points[hoveredIndex].x} y1={padding.top}
                                x2={revenue.points[hoveredIndex].x} y2={padding.top + graphHeight}
                                stroke="#94A3B8" strokeDasharray="2 2" strokeWidth="0.5"
                            />
                            <circle cx={revenue.points[hoveredIndex].x} cy={revenue.points[hoveredIndex].y} r="1.5" fill="#D97706" />
                            <circle cx={expense.points[hoveredIndex].x} cy={expense.points[hoveredIndex].y} r="1.5" fill="#F43F5E" />
                            <circle cx={profit.points[hoveredIndex].x} cy={profit.points[hoveredIndex].y} r="1.5" fill="#10B981" />
                        </>
                    )}
                </svg>

                {hoveredIndex !== null && revenue.points[hoveredIndex] && (
                    <div
                        className="absolute z-30 bg-white border border-slate-200 rounded-xl p-3 shadow-xl pointer-events-none min-w-[130px]"
                        style={{
                            left: `${revenue.points[hoveredIndex].x}%`,
                            top: '5%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <p className="text-xs text-center font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 whitespace-nowrap">
                            {revenue.points[hoveredIndex].label}
                        </p>
                        <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center gap-3">
                                <span className="text-amber-700 font-semibold">Revenue</span>
                                <span className="text-slate-900 font-mono font-bold">{formatCurrency(revenue.points[hoveredIndex].val)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                                <span className="text-rose-600 font-semibold">Expense</span>
                                <span className="text-slate-900 font-mono font-bold">{formatCurrency(expense.points[hoveredIndex].val)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-100">
                                <span className="text-emerald-700 font-semibold">Profit</span>
                                <span className={`font-mono font-bold ${profit.points[hoveredIndex].val >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(profit.points[hoveredIndex].val)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-400 font-mono w-full">
                {data.map((d, i) => {
                    const showLabel = data.length < 15 || i % Math.ceil(data.length / 10) === 0 || i === data.length - 1;
                    return (
                        <div key={i} className="flex flex-col items-center" style={{ width: `${100 / data.length}%`, opacity: showLabel ? 1 : 0 }}>
                            <span>{d.period.split('-').pop()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
