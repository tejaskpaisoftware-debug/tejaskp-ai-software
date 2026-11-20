'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar, Clock, CheckCircle2, XCircle, Trash2, 
    RefreshCw, Filter, User, AlertCircle, ArrowRight
} from 'lucide-react';

interface AttendanceRecord {
    id: string;
    userId: string;
    date: string;
    loginTime: string;
    logoutTime: string | null;
    status: string;
    adminRemarks: string | null;
    user: {
        name: string;
        role: string;
        mobile: string;
    };
}

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeRole, setActiveRole] = useState("STUDENT");

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/attendance?date=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                setAttendance(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this check-in? The user will have to check in again.")) return;

        try {
            const res = await fetch(`/api/admin/attendance?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchAttendance();
            } else {
                alert("Failed to delete record");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/attendance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                fetchAttendance();
            }
        } catch (error) {
            console.error(error);
        }
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
                        Daily Attendance Validation
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor active sessions, verify check-in timestamps, and approve logouts for the day.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={fetchAttendance}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs shadow-amber-500/20"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {["STUDENT", "EMPLOYEE", "ALL"].map((role) => {
                    const count = role === "ALL" ? attendance.length : attendance.filter(r => r.user.role === role).length;
                    const isActive = activeRole === role;

                    return (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                isActive
                                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs shadow-amber-500/20"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <span>
                                {role === "ALL" ? "All Users" :
                                    role === "STUDENT" ? "Students" : "Employees"}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-100 text-slate-500"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Attendance List */}
            {loading ? (
                <div className="text-center py-24 text-slate-500 bg-white rounded-2xl border border-slate-200/80">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Fetching attendance logs for {selectedDate}...</p>
                </div>
            ) : attendance.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">No check-ins were registered for {selectedDate}.</p>
                </div>
            ) : (
                <div className="grid gap-3.5">
                    {attendance
                        .filter(record => activeRole === "ALL" || record.user.role === activeRole)
                        .map((record) => {
                            const isPending = record.status === 'PENDING';
                            const durationHrs = record.logoutTime
                                ? ((new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
                                : null;

                            return (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all"
                                >
                                    {/* Left: User Info */}
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                                            {record.user.name ? record.user.name.slice(0, 2).toUpperCase() : 'U'}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-sm truncate">
                                                    {record.user.name || record.user.mobile}
                                                </h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${roleBadges[record.user.role] || 'bg-slate-100 text-slate-600'}`}>
                                                    {record.user.role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{record.user.mobile}</p>
                                        </div>
                                    </div>

                                    {/* Middle: Checkin/Checkout Timestamps */}
                                    <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200/80">
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Login Time</span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Logout Time</span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Duration</span>
                                            <span className={`font-mono font-bold ${durationHrs ? 'text-slate-800' : 'text-emerald-600 font-semibold'}`}>
                                                {durationHrs ? `${durationHrs} hrs` : '● Active'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Status Pill & Actions */}
                                    <div className="flex items-center gap-2.5 justify-end">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${statusBadges[record.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {record.status}
                                        </span>

                                        {isPending && record.logoutTime && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleStatusUpdate(record.id, 'APPROVED')}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(record.id, 'REJECTED')}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {isPending && !record.logoutTime && (
                                            <span className="text-[11px] text-amber-600 font-medium italic">
                                                Active Session
                                            </span>
                                        )}

                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Check-in record"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
