"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// AdminSidebar removed (handled by layout)

export default function RevenuePage() {
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

    useEffect(() => {
        // Initial fetch only if not custom
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
                fetchRevenueData(); // Refresh data
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
        dueDate.setDate(dueDate.getDate() + 5); // Default due date 5 days from now
        const formattedDueDate = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        const message = `*OFFICIAL PAYMENT REMOTE - TEJASKP AI SOFTWARE*

Dear ${user.name},

This is a reminder regarding your outstanding fees.

🔹 *Total Fees:* ${formatCurrency(user.totalFees || 0)}
🔹 *Paid Amount:* ${formatCurrency(user.paidAmount || 0)}
🚨 *Pending Amount:* ${formatCurrency(user.pendingAmount || 0)}

Please clear your dues by *${formattedDueDate}*.

⚠️ *Penalty Warning:* 
A late fee penalty of *₹100/day* will be applicable if payment is not received by the due date, as per government regulations employed by TEJASKP AI SOFTWARE.

Please make the payment immediately to avoid penalties.

Regards,
*Accounts Department*
TEJASKP AI SOFTWARE`;

        // Create WhatsApp link (Direct Web Access)
        const encodedMessage = encodeURIComponent(message);
        // Using web.whatsapp.com directly skips the "Continue to Chat" landing page on desktop
        window.open(`https://web.whatsapp.com/send?phone=91${user.mobile}&text=${encodedMessage}`, '_blank');
    };

    if (loading && !data) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-gold-theme animate-pulse">Loading Financial Data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-red-500 bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                    <p className="font-bold mb-2">Error</p>
                    <p>{error}</p>
                    <button onClick={fetchRevenueData} className="mt-4 px-4 py-2 bg-red-500 text-foreground rounded hover:bg-red-600 transition-colors">
                        Retry
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



    // Filter transactions
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
            // filterValue format: YYYY-MM
            const [year, month] = filterValue.split('-');
            return txDate.getFullYear() === parseInt(year) && (txDate.getMonth() + 1) === parseInt(month);
        }

        if (filterType === 'year' && filterValue) {
            return txDate.getFullYear() === parseInt(filterValue);
        }

        if (filterType === 'week' && filterValue) {
            // filterValue format: YYYY-Www
            const [yearStr, weekStr] = filterValue.split('-W');
            const year = parseInt(yearStr);
            const week = parseInt(weekStr);

            // Calculate week number for txDate
            const d = new Date(Date.UTC(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const txWeekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

            return txDate.getFullYear() === year && txWeekNo === week;
        }

        return true;
    });

    // Calculate Total for Filtered Transactions
    const filteredTotal = filteredTransactions.reduce((sum: number, tx: any) => {
        if (tx.type === 'REVENUE') {
            return sum + (tx.amount || 0);
        } else {
            return sum - (tx.amount || 0);
        }
    }, 0);

    return (
        <>
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-widest mb-2">REVENUE & EXPENSES</h1>
                    <p className="text-gray-400">Financial performance and profit analysis.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Year Selector */}
                    {activeTab !== 'custom' && (
                        <div className="flex items-center gap-2 bg-card border border-theme px-3 py-1 rounded-lg">
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Fiscal Year</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent text-gold-400 font-bold focus:outline-none cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y} className="bg-card text-foreground">{y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        + Add Expense
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <RevenueCard title="Total Revenue" amount={data?.overview?.selectedYearTotal ?? data?.overview?.total ?? 0} sub="All Time" isHighlight />
                <RevenueCard title="Total Expenses" amount={data?.overview?.selectedYearExpenses ?? 0} sub="All Time" color="red" />
                <RevenueCard
                    title="Net Profit"
                    amount={data?.overview?.netProfit ?? 0}
                    sub="All Time"
                    color={(data?.overview?.netProfit || 0) >= 0 ? "green" : "red"}
                />
                <RevenueCard title="Margin" amount={`${((data?.overview?.netProfit / (data?.overview?.selectedYearTotal || 1)) * 100).toFixed(1)}%`} sub="Profit Margin" isText />
                <RevenueCard title="Pending Amount" amount={data?.overview?.pendingAmount || 0} sub="Uncollected Fees" color="custom-blue" onClick={handleViewPendingDues} />
            </div>

            {/* Main Analytics Section */}
            <div className="bg-card/40 border border-theme rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-foreground">Financial Trends</h2>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1 text-gold-400"><div className="w-2 h-2 rounded-full bg-gold-400" /> Revenue</span>
                            <span className="flex items-center gap-1 text-red-400"><div className="w-2 h-2 rounded-full bg-red-400" /> Expenses</span>
                            <span className="flex items-center gap-1 text-green-400"><div className="w-2 h-2 rounded-full bg-green-400" /> Profit</span>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        {activeTab === 'custom' && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    style={{ colorScheme: 'dark' }}
                                    className="bg-card border border-gold-500/30 rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    style={{ colorScheme: 'dark' }}
                                    className="bg-card border border-gold-500/30 rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500"
                                />
                            </div>
                        )}

                        <div className="flex bg-card rounded-lg p-1 border border-theme">
                            {['yearly', 'monthly', 'weekly', 'daily', 'custom'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === tab
                                        ? 'bg-gold-500 text-obsidian'
                                        : 'text-gray-400 hover:text-foreground'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="h-80 w-full relative p-4 border-b border-white/5">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-gold-theme animate-pulse">
                            Updating Data...
                        </div>
                    ) : currentGraphData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {activeTab === 'custom' ? 'Select a date range.' : `No financial data found for ${selectedYear}.`}
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <RevenueAreaChart data={currentGraphData} />
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Transactions List */}
            <div className="bg-card/40 border border-theme rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gold-500/10 flex justify-between items-center">
                    <div className="flex items-baseline gap-4">
                        <h3 className="font-bold text-foreground">Full Financial History</h3>
                        <div className="text-sm font-normal text-gray-400">
                            Total: <span className="text-foreground font-mono font-bold mr-3">{filteredTransactions.length}</span>
                            Amount: <span className={`font-mono font-bold ${filteredTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(filteredTotal)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Filter Type Selector */}
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value as any);
                                setFilterValue(''); // Reset value on type change
                            }}
                            className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-gold-400 focus:outline-none focus:border-gold-500 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="day">By Day</option>
                            <option value="week">By Week</option>
                            <option value="month">By Month</option>
                            <option value="year">By Year</option>
                        </select>

                        {/* Dynamic Input based on Filter Type */}
                        {filterType === 'day' && (
                            <input
                                type="date"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500"
                            />
                        )}

                        {filterType === 'week' && (
                            <input
                                type="week"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500"
                            />
                        )}

                        {filterType === 'month' && (
                            <input
                                type="month"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500"
                            />
                        )}

                        {filterType === 'year' && (
                            <select
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500 cursor-pointer"
                            >
                                <option value="">Select Year</option>
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}

                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-card border border-gold-500/30 rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-gold-500 w-48"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gold-theme/80 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description / Student</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No transactions found.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-foreground font-mono">{new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{tx.name}</div>
                                            {tx.details && <div className="text-xs text-gray-500">{tx.details}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${tx.type === 'REVENUE' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.type === 'REVENUE' ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Purchase Modal - Keep existing code ... */}
            <AnimatePresence>
                {
                    isPurchaseModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-gold-500/30 rounded-2xl p-8 w-full max-w-md relative"
                            >
                                <button onClick={() => setIsPurchaseModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-foreground">✕</button>
                                <h2 className="text-2xl font-bold text-foreground mb-6">Add Expense</h2>
                                <form onSubmit={handleAddPurchase} className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Amount (INR)</label>
                                        <input
                                            type="number"
                                            required
                                            value={purchaseForm.amount}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                                            className="w-full bg-background border border-theme rounded-lg px-4 py-2 text-foreground focus:border-gold-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={purchaseForm.date}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                            className="w-full bg-background border border-theme rounded-lg px-4 py-2 text-foreground focus:border-gold-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Description</label>
                                        <input
                                            type="text"
                                            required
                                            value={purchaseForm.description}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                                            className="w-full bg-background border border-theme rounded-lg px-4 py-2 text-foreground focus:border-gold-500 outline-none"
                                            placeholder="e.g. Office Supplies"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingPurchase}
                                        className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold py-3 rounded-lg transition-colors mt-4"
                                    >
                                        {submittingPurchase ? 'Saving...' : 'Add Expense'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Pending Dues Modal */}
            <AnimatePresence>
                {
                    isPendingModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-gold-500/30 rounded-2xl p-8 w-full max-w-4xl relative max-h-[90vh] flex flex-col"
                            >
                                <button onClick={() => setIsPendingModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-foreground">✕</button>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-foreground">Pending Dues</h2>
                                    <p className="text-gray-400 text-sm">List of users with outstanding payments.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2">
                                    {loadingPending ? (
                                        <div className="text-center text-gold-theme py-10">Loading...</div>
                                    ) : pendingUsers.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10">No pending dues found.</div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead className="text-xs text-gold-theme/80 uppercase tracking-widest sticky top-0 bg-card z-10">
                                                <tr>
                                                    <th className="py-3 border-b border-white/10">User</th>
                                                    <th className="py-3 border-b border-white/10">Mobile</th>
                                                    <th className="py-3 border-b border-white/10 text-right">Total Fees</th>
                                                    <th className="py-3 border-b border-white/10 text-right">Paid</th>
                                                    <th className="py-3 border-b border-white/10 text-right text-red-400">Pending</th>
                                                    <th className="py-3 border-b border-white/10 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-gray-300 divide-y divide-white/5">
                                                {pendingUsers.map((user, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-3 font-bold text-foreground">{user.name} <span className="text-xs font-normal text-gray-500 block">{user.course}</span></td>
                                                        <td className="py-3 font-mono text-xs">{user.mobile}</td>
                                                        <td className="py-3 text-right font-mono">{formatCurrency(user.totalFees || 0)}</td>
                                                        <td className="py-3 text-right font-mono text-green-400">{formatCurrency(user.paidAmount || 0)}</td>
                                                        <td className="py-3 text-right font-mono font-bold text-red-400">{formatCurrency(user.pendingAmount || 0)}</td>
                                                        <td className="py-3 text-center">
                                                            <button
                                                                onClick={() => handleWhatsAppNotify(user)}
                                                                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/50 p-2 rounded-lg transition-all"
                                                                title="Send WhatsApp Reminder"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-white/5 font-bold text-foreground sticky bottom-0">
                                                <tr>
                                                    <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs tracking-widest text-gold-theme">Total Pending</td>
                                                    <td className="py-3 text-right text-red-500 text-lg">
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
                    )
                }
            </AnimatePresence >
        </>
    );
}

// Chart Component (Needs to be redefined here if overwritten)
function RevenueAreaChart({ data }: { data: any[] }) {
    // Layout Calculation
    const padding = { top: 10, bottom: 20, left: 0, right: 0 };
    const graphHeight = 100 - padding.top - padding.bottom;

    // 1. Calculate min and max
    const allValues = data.flatMap(d => [d.revenue, d.expense, d.profit]);
    const maxVal = Math.max(...allValues, 100);
    const minVal = Math.min(...allValues, 0);
    const range = maxVal - minVal;

    // Y Position Helper (Maps value to 0-100 range respecting padding)
    const getY = (val: number) => {
        if (range === 0) return padding.top + (graphHeight / 2);
        const normalized = (val - minVal) / range;
        return (padding.top + graphHeight) - (normalized * graphHeight);
    };

    // Path & Point Generator
    const generatePath = (key: string) => {
        const points = data.map((d, i) => {
            let x = 0;
            if (data.length > 1) {
                x = (i / (data.length - 1)) * 100;
            } else {
                x = 50;
            }
            // @ts-ignore
            const y = getY(d[key]);
            return { x, y, val: d[key], label: d.period };
        });

        if (points.length === 0) return { path: "", points: [] };

        let path = `M ${points[0].x} ${points[0].y}`;
        points.forEach((p, i) => {
            if (i === 0) return;
            path += ` L ${p.x} ${p.y}`;
        });
        return { path, points };
    };

    const revenue = generatePath('revenue');
    const expense = generatePath('expense');
    const profit = generatePath('profit');

    const zeroY = getY(0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            compactDisplay: "short",
            notation: "compact",
            maximumFractionDigits: 1
        }).format(amount);
    };

    // Hover State for Tooltip
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col">
            <div className="relative flex-1 w-full h-full">
                {/* Y-Axis Labels (HTML Overlay) */}
                <div className="absolute left-0 top-0 bottom-0 w-full pointer-events-none flex flex-col justify-between text-[10px] text-gray-500 pb-8 pl-2 z-10 font-mono opacity-50">
                    <span style={{ top: `${padding.top}%`, position: 'absolute' }}>{formatCurrency(maxVal)}</span>
                    {minVal < 0 && <span style={{ top: `${zeroY}%`, position: 'absolute' }}>{formatCurrency(0)}</span>}
                    <span style={{ top: `${padding.top + graphHeight}%`, position: 'absolute' }}>{formatCurrency(minVal)}</span>
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Zero/Baseline Grid Line */}
                    <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#FFFFFF" strokeOpacity="0.1" strokeDasharray="2 2" strokeWidth="0.5" />

                    {/* Max Value Grid Line */}
                    <line x1="0" y1={padding.top} x2="100" y2={padding.top} stroke="#FFFFFF" strokeOpacity="0.05" strokeDasharray="1 1" strokeWidth="0.2" />

                    {/* Bottom Grid Line */}
                    <line x1="0" y1={padding.top + graphHeight} x2="100" y2={padding.top + graphHeight} stroke="#FFFFFF" strokeOpacity="0.05" strokeWidth="0.5" />

                    {/* Revenue Line (Gold) */}
                    <motion.path d={revenue.path} fill="none" stroke="#FFD700" strokeWidth="0.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />

                    {/* Expense Line (Red) */}
                    <motion.path d={expense.path} fill="none" stroke="#FF4444" strokeWidth="0.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} />

                    {/* Profit Line (Green) */}
                    <motion.path d={profit.path} fill="none" stroke="#4ADE80" strokeWidth="1" strokeDasharray="1 0" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4 }} />

                    {/* Interaction Zones (Bars across full height) */}
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

                    {/* Active Hover Indicators (Only show when hovered) */}
                    {hoveredIndex !== null && (
                        <>
                            {/* Vertical Guide Line */}
                            <line
                                x1={revenue.points[hoveredIndex].x} y1={padding.top}
                                x2={revenue.points[hoveredIndex].x} y2={padding.top + graphHeight}
                                stroke="white" strokeOpacity="0.2" strokeDasharray="2 2" strokeWidth="0.5"
                            />
                            {/* Points */}
                            <circle cx={revenue.points[hoveredIndex].x} cy={revenue.points[hoveredIndex].y} r="1.5" fill="#FFD700" />
                            <circle cx={expense.points[hoveredIndex].x} cy={expense.points[hoveredIndex].y} r="1.5" fill="#FF4444" />
                            <circle cx={profit.points[hoveredIndex].x} cy={profit.points[hoveredIndex].y} r="1.5" fill="#4ADE80" />
                        </>
                    )}
                </svg>

                {/* HTML Tooltip (Absolute Positioned over the graph area) */}
                {hoveredIndex !== null && (
                    <div
                        className="absolute z-50 bg-card/95 border border-gold-500/30 rounded-lg p-3 shadow-2xl backdrop-blur-md min-w-[120px] pointer-events-none"
                        style={{
                            left: `${revenue.points[hoveredIndex].x}%`,
                            top: '10%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <p className="text-xs text-center font-bold text-foreground border-b border-white/10 pb-1 mb-1 whitespace-nowrap">
                            {revenue.points[hoveredIndex].label}
                        </p>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] gap-3">
                                <span className="text-gold-400 font-medium">Revenue</span>
                                <span className="text-foreground font-mono">{formatCurrency(revenue.points[hoveredIndex].val)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] gap-3">
                                <span className="text-red-400 font-medium">Expense</span>
                                <span className="text-foreground font-mono">{formatCurrency(expense.points[hoveredIndex].val)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] gap-3 pt-1 border-t border-white/5">
                                <span className="text-green-400 font-medium">Profit</span>
                                <span className={`font-mono font-bold ${profit.points[hoveredIndex].val >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                                    {formatCurrency(profit.points[hoveredIndex].val)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* X-Axis Labels (Below the graph) */}
            <div className="flex justify-between px-2 pt-2 text-[10px] text-gray-400 font-mono w-full">
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

function RevenueCard({ title, amount, sub, isHighlight, isText, color, onClick }: any) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    let borderColor = 'border-gold-500/10';
    let textColor = 'text-foreground';
    let subColor = 'bg-card/40';

    if (color === 'red') {
        borderColor = 'border-red-500/30';
        textColor = 'text-red-400';
        subColor = 'bg-red-500/5';
    } else if (color === 'green') {
        borderColor = 'border-green-500/30';
        textColor = 'text-green-400';
        subColor = 'bg-green-500/10';
    } else if (color === 'custom-blue') {
        borderColor = 'border-blue-500/30';
        textColor = 'text-blue-400';
        subColor = 'bg-blue-500/5';
    } else if (isHighlight) {
        return (
            <div
                onClick={onClick}
                className={`p-6 rounded-xl border border-gold-400 bg-gold-500 text-obsidian shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-transform hover:-translate-y-1 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
            >
                <p className="text-xs uppercase tracking-widest mb-2 font-bold opacity-70">{title}</p>
                <h3 className="text-3xl font-bold mb-1">{isText ? amount : formatCurrency(amount)}</h3>
                <p className="text-xs opacity-60">{sub}</p>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`p-6 rounded-xl border backdrop-blur-sm transition-transform hover:-translate-y-1 ${borderColor} ${subColor} ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
        >
            <p className="text-xs uppercase tracking-widest mb-2 font-bold text-gray-400">{title}</p>
            <h3 className={`text-3xl font-bold mb-1 ${textColor}`}>{isText ? amount : formatCurrency(amount)}</h3>
            <p className="text-xs text-gray-500">{sub}</p>
        </div>
    );
}
