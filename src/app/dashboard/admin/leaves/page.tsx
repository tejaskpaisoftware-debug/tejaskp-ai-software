'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CheckCircle2, XCircle, Clock, 
    RefreshCw, Pencil, Plus, Trash2, User, AlertCircle
} from 'lucide-react';

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
    const [editLeave, setEditLeave] = useState<LeaveRequest | null>(null);

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
                fetchLeaves();
            }
        } catch (error) {
            console.error(error);
        }
    };

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
                    status: editLeave.status
                })
            });

            if (res.ok) {
                setEditLeave(null);
                fetchLeaves();
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const currentYear = new Date().getFullYear();

    const getBalance = (user: any, year: number) => {
        if (!user.leaveBalances || user.leaveBalances.length === 0) return null;
        return user.leaveBalances.find((b: any) => b.year === year);
    };

    const roleBadges: Record<string, string> = {
        STUDENT: 'bg-amber-50 text-amber-700 border-amber-200',
        EMPLOYEE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
        TEAM_LEAD: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const statusBadges: Record<string, string> = {
        APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Leave Management & Approvals
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Review leave applications, manage official holidays, and verify balance allowances.</p>
                </div>

                <button
                    onClick={fetchLeaves}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs shadow-amber-500/20"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Manage Holidays Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">Manage Official Holidays</h3>
                </div>

                <form onSubmit={handleHolidaySubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Holiday Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Diwali, Republic Day"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            value={newHoliday.name}
                            onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                            value={newHoliday.date}
                            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
                    >
                        + Add Holiday
                    </button>
                </form>

                {holidays.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        {holidays.map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                                <span className="font-semibold text-slate-900">{h.name}:</span>
                                <span className="font-mono text-slate-500">{h.date}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Leave Applications List */}
            {loading ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200/80">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Loading leave requests...</p>
                </div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
                    <p className="text-xs text-slate-400 mt-1">All leave applications have been processed.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaves.map((leave) => {
                        const balance = getBalance(leave.user, currentYear);
                        const isPending = leave.status === 'PENDING';

                        return (
                            <motion.div
                                key={leave.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all relative"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    
                                    {/* Left: User & Leave Details */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                                                {leave.user.name ? leave.user.name.slice(0, 2).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 text-sm">
                                                        {leave.user.name || leave.user.mobile}
                                                    </h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${roleBadges[leave.user.role] || 'bg-slate-100 text-slate-600'}`}>
                                                        {leave.user.role}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono">{leave.user.mobile}</p>
                                            </div>
                                        </div>

                                        {/* Leave Balances Pill */}
                                        <div className="inline-flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase">Available:</span>
                                            <span className="font-medium text-amber-700">CL: {balance?.cl || 0}</span>
                                            <span className="font-medium text-blue-700">SL: {balance?.sl || 0}</span>
                                            <span className="font-medium text-emerald-700">PL: {balance?.pl || 0}</span>
                                        </div>

                                        {/* Duration & Type Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Duration</span>
                                                <span className="font-medium text-slate-800">
                                                    {leave.startDate} <span className="text-slate-400">to</span> {leave.endDate}
                                                </span>
                                                {leave.isHalfDay && (
                                                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">
                                                        Half Day
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Leave Type</span>
                                                <span className="font-semibold text-slate-900">{leave.type || 'Casual (CL)'}</span>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reason</span>
                                                <p className="text-slate-700 italic truncate" title={leave.reason}>
                                                    "{leave.reason}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Admin Remarks Input */}
                                        {isPending && (
                                            <div className="pt-1">
                                                <input
                                                    type="text"
                                                    placeholder="Add optional manager remarks before approval / rejection..."
                                                    value={remarks[leave.id] || ''}
                                                    onChange={(e) => setRemarks({ ...remarks, [leave.id]: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions & Status */}
                                    <div className="flex flex-row lg:flex-col items-end justify-between gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${statusBadges[leave.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {leave.status}
                                            </span>

                                            <button
                                                onClick={() => setEditLeave(leave)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                                title="Edit leave application"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {isPending && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editLeave && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
                        >
                            <h3 className="text-base font-bold text-slate-900 mb-4">Edit Leave Application</h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={editLeave.startDate}
                                            onChange={e => setEditLeave({ ...editLeave, startDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={editLeave.endDate}
                                            onChange={e => setEditLeave({ ...editLeave, endDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Reason</label>
                                    <textarea
                                        value={editLeave.reason}
                                        onChange={e => setEditLeave({ ...editLeave, reason: e.target.value })}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditLeave(null)}
                                        className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
