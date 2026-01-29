'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function UserLeavePage() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [balance, setBalance] = useState<any>(null);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('CL');
    const [reason, setReason] = useState('');
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            fetchLeaves(userData.id);
            fetchBalance(userData.id);
            fetchHolidays();
        }
    }, []);

    const fetchLeaves = async (userId: string) => {
        try {
            const res = await fetch(`/api/user/leaves?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchBalance = async (userId: string) => {
        try {
            const res = await fetch(`/api/user/leave-balance?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setBalance(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await fetch(`/api/public/holidays`);
            if (res.ok) {
                const data = await res.json();
                setHolidays(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const res = await fetch('/api/user/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    startDate,
                    endDate,
                    type,
                    reason,
                    isHalfDay
                })
            });

            if (res.ok) {
                // Reset form and refresh
                setStartDate('');
                setEndDate('');
                setReason('');
                setIsHalfDay(false);
                fetchLeaves(user.id);
                alert("Leave application submitted!");
            } else {
                alert("Failed to submit application");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 text-foreground max-w-6xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-foreground">
                    Apply for Leave
                </h1>
                <p className="text-gray-400 mt-2">Submit your leave application for approval.</p>
            </header>

            {/* Leave Balances */}
            {balance && (
                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-card/50 border border-theme rounded-xl p-6 text-center">
                        <span className="text-4xl font-bold text-gold-theme block">{balance.cl}</span>
                        <span className="text-sm uppercase tracking-wider text-gray-400">Casual Leave (CL)</span>
                    </div>
                    <div className="bg-card/50 border border-theme rounded-xl p-6 text-center">
                        <span className="text-4xl font-bold text-blue-400 block">{balance.sl}</span>
                        <span className="text-sm uppercase tracking-wider text-gray-400">Sick Leave (SL)</span>
                    </div>
                    <div className="bg-card/50 border border-theme rounded-xl p-6 text-center">
                        <span className="text-4xl font-bold text-green-400 block">{balance.pl}</span>
                        <span className="text-sm uppercase tracking-wider text-gray-400">Privilege Leave (PL)</span>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Application Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 bg-card/50 border border-theme rounded-xl p-6 h-fit"
                >
                    <h2 className="text-xl font-bold text-foreground mb-6">New Application</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gold-theme/80 uppercase font-bold tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-background border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gold-theme/80 uppercase font-bold tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-background border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="halfDay"
                                checked={isHalfDay}
                                onChange={(e) => setIsHalfDay(e.target.checked)}
                                className="w-5 h-5 rounded border-theme bg-background text-gold-theme focus:ring-gold-theme"
                            />
                            <label htmlFor="halfDay" className="text-foreground">Apply for Half Day</label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gold-theme/80 uppercase font-bold tracking-wider">Leave Type</label>
                            <select
                                required
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-background border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme"
                            >
                                <option value="CL">Casual Leave (CL)</option>
                                <option value="SL">Sick Leave (SL)</option>
                                <option value="LWP">Leave Without Pay (LWP)</option>
                                <option value="PL">Privilege Leave (PL)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gold-theme/80 uppercase font-bold tracking-wider">Reason</label>
                            <textarea
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-background border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme h-32 resize-none"
                                placeholder="Please detail the reason for your leave..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold-theme hover:bg-gold-theme/90 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </motion.div >

                {/* Sidebar: History & Holidays */}
                <div className="space-y-6">
                    {/* Holidays */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card/30 border border-theme rounded-xl p-6"
                    >
                        <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Holidays</h2>
                        {holidays.length === 0 ? (
                            <p className="text-gray-500 text-sm">No upcoming holidays.</p>
                        ) : (
                            <ul className="space-y-3">
                                {holidays.map((h) => (
                                    <li key={h.id} className="flex justify-between items-center text-sm">
                                        <span className="text-foreground">{h.name}</span>
                                        <span className="text-gold-theme">{h.date}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>

                    {/* History */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card/30 border border-theme rounded-xl p-6"
                    >
                        <h2 className="text-lg font-bold text-foreground mb-4">My History</h2>

                        {
                            leaves.length === 0 ? (
                                <p className="text-gray-500 italic">No leave history found.</p>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {leaves.map((leave) => (
                                        <div key={leave.id} className="bg-background/50 border border-theme/50 rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border
                                                ${leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                        leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}
                                            `}>
                                                    {leave.status}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{new Date(leave.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-foreground text-sm font-bold mb-1">
                                                {leave.startDate} <span className="text-gray-500 font-normal">to</span> {leave.endDate}
                                                {leave.isHalfDay && <span className="text-blue-400 ml-2 text-xs">(Half Day)</span>}
                                            </div>
                                            <p className="text-gray-400 text-xs italic">
                                                "{leave.reason}"
                                            </p>
                                            {leave.managerRemarks && (
                                                <div className="mt-2 border-t border-gray-700 pt-1">
                                                    <p className="text-gold-theme text-xs">Manager: {leave.managerRemarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </motion.div >
                </div>
            </div >
        </div >
    );
}
