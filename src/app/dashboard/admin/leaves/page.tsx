'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LeaveRequest {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    reason: string;
    type?: string;
    isHalfDay: boolean;
    managerRemarks?: string;
    status: string;
    user: {
        name: string;
        role: string;
        mobile: string;
        leaveBalances: any[];
    };
}

export default function AdminLeavesPage() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'PUBLIC' });

    useEffect(() => {
        fetchLeaves();
        fetchHolidays();
    }, []);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/leaves`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await fetch('/api/admin/holidays');
            if (res.ok) {
                const data = await res.json();
                setHolidays(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleHolidaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHoliday)
            });
            if (res.ok) {
                setNewHoliday({ name: '', date: '', type: 'PUBLIC' });
                fetchHolidays();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    managerRemarks: remarks[id]
                })
            });

            if (res.ok) {
                fetchLeaves(); // Refresh
            }
        } catch (error) {
            console.error(error);
        }
    };

    const [editLeave, setEditLeave] = useState<LeaveRequest | null>(null);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editLeave) return;

        try {
            const res = await fetch('/api/admin/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editLeave.id,
                    startDate: editLeave.startDate,
                    endDate: editLeave.endDate,
                    type: editLeave.type,
                    isHalfDay: editLeave.isHalfDay,
                    reason: editLeave.reason,
                    // Preserve status/remarks, mainly updating content
                    status: editLeave.status
                })
            });

            if (res.ok) {
                setEditLeave(null);
                window.location.reload(); // Refresh to show updated status immediately
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getBalance = (user: any, year: number) => {
        if (!user.leaveBalances || user.leaveBalances.length === 0) return null;
        return user.leaveBalances.find((b: any) => b.year === year);
    };

    return (
        <div className="p-8 text-foreground relative">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Leave Requests
                    </h1>
                    <p className="text-gray-400 mt-2">Manage employee and student leave applications.</p>
                </div>
                <button
                    onClick={fetchLeaves}
                    className="bg-gold-theme text-obsidian px-6 py-2 rounded-lg font-bold hover:bg-gold-400 transition-colors"
                >
                    Refresh
                </button>
            </header>

            {/* Holidays Manager */}
            <div className="mb-10 bg-card/30 border border-theme p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Manage Holidays</h3>
                <div className="flex gap-4 items-end">
                    <form onSubmit={handleHolidaySubmit} className="flex gap-4 flex-1 items-end">
                        <div className="flex-1">
                            <label className="text-xs uppercase text-gray-400 block mb-1">Holiday Name</label>
                            <input
                                type="text"
                                className="w-full bg-background border border-gray-700 rounded px-3 py-2"
                                value={newHoliday.name}
                                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 block mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full bg-background border border-gray-700 rounded px-3 py-2"
                                value={newHoliday.date}
                                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-theme text-white px-4 py-2 rounded hover:bg-theme/80 font-bold">Add Holiday</button>
                    </form>
                </div>
                {holidays.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {holidays.map(h => (
                            <span key={h.id} className="bg-background border border-gray-700 px-3 py-1 rounded text-sm text-gray-300">
                                {h.date}: {h.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gold-theme animate-pulse">Loading requests...</div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-2xl border border-theme">
                    <p className="text-gray-400">No leave requests found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaves.map((leave) => {
                        const balance = getBalance(leave.user, 2025); // Hardcoded year for now
                        return (
                            <motion.div
                                key={leave.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card/50 border border-theme rounded-xl p-6 flex flex-col gap-4 hover:border-gold-500/40 transition-colors relative"
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setEditLeave(leave)}
                                        className="text-gray-400 hover:text-white p-2"
                                        title="Edit Leave"
                                    >
                                        ✏️
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-foreground">{leave.user.name || leave.user.mobile}</h3>
                                            <span className={`text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-gray-700`}>
                                                {leave.user.role}
                                            </span>
                                        </div>

                                        {/* Show Balances */}
                                        <div className="flex gap-4 text-xs mt-2 bg-black/20 p-2 rounded w-fit">
                                            <span className="text-gold-theme">CL: {balance?.cl || 0}</span>
                                            <span className="text-blue-400">SL: {balance?.sl || 0}</span>
                                            <span className="text-green-400">PL: {balance?.pl || 0}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Duration</span>
                                                <span className="text-foreground">{leave.startDate} <span className="text-gray-600 mx-1">to</span> {leave.endDate}</span>
                                                {leave.isHalfDay && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Half Day</span>}
                                            </div>
                                            <div>
                                                <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Type</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${leave.type?.includes('SL') ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                    {leave.type || 'CL'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Reason</span>
                                            <span className="text-foreground italic bg-black/20 p-2 rounded block">"{leave.reason}"</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4 min-w-[200px] mt-8 md:mt-0">
                                        <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide border w-full text-center
                                            ${leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}
                                        `}>
                                            {leave.status}
                                        </div>

                                        {leave.status === 'PENDING' && (
                                            <div className="w-full space-y-2">
                                                <textarea
                                                    placeholder="Manager Remarks (Optional)"
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-sm h-20"
                                                    value={remarks[leave.id] || ''}
                                                    onChange={(e) => setRemarks({ ...remarks, [leave.id]: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-foreground rounded-lg font-bold transition-colors text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                                                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-foreground rounded-lg font-bold transition-colors text-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {leave.managerRemarks && leave.status !== 'PENDING' && (
                                            <div className="text-xs text-right text-gray-400">
                                                <span className="text-gold-theme">Remark:</span> {leave.managerRemarks}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal (Status Update Only) */}
            {editLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#111] border border-gray-800 rounded-xl p-6 max-w-lg w-full shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Update Leave Status</h3>
                            <button onClick={() => setEditLeave(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {/* Read-Only Details */}
                            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg">
                                <div>
                                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Duration</span>
                                    <span className="text-sm text-gray-300">{editLeave.startDate} <span className="text-gray-600">to</span> {editLeave.endDate}</span>
                                </div>
                                <div>
                                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Type</span>
                                    <span className="text-sm text-gray-300">{editLeave.type} {editLeave.isHalfDay ? '(Half)' : ''}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Reason</span>
                                    <span className="text-sm text-gray-300 italic">"{editLeave.reason}"</span>
                                </div>
                            </div>

                            {/* Status Editor */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-1 block">Status</label>
                                <select
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-gold-500/50 outline-none appearance-none"
                                    value={editLeave.status}
                                    onChange={e => setEditLeave({ ...editLeave, status: e.target.value })}
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="PENDING" className="bg-gray-900 text-white">PENDING</option>
                                    <option value="APPROVED" className="bg-gray-900 text-white">APPROVED</option>
                                    <option value="REJECTED" className="bg-gray-900 text-white">REJECTED</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditLeave(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm transition-colors text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-gold-500/20"
                                >
                                    Update Status
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
