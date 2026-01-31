'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    const [activeRole, setActiveRole] = useState("STUDENT"); // Default tab

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
                fetchAttendance(); // Refresh
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 text-foreground">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Daily Attendance
                    </h1>
                    <p className="text-gray-400 mt-2">Approve user logouts to enable next-day login.</p>
                </div>
                <div className="flex gap-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ colorScheme: 'dark' }}
                        className="bg-card border border-theme rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-gold-500"
                    />
                    <button
                        onClick={fetchAttendance}
                        className="bg-gold-theme text-obsidian px-6 py-2 rounded-lg font-bold hover:bg-gold-400 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </header>

            {/* Role Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-white/5">
                {["STUDENT", "EMPLOYEE", "ALL"].map((role) => {
                    const count = role === "ALL" ? attendance.length : attendance.filter(r => r.user.role === role).length;
                    return (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all relative ${activeRole === role
                                ? "text-gold-theme bg-foreground/5 border-b-2 border-gold-500"
                                : "text-gray-500 hover:text-muted-foreground hover:bg-foreground/5"
                                }`}
                        >
                            <span>
                                {role === "ALL" ? "All" :
                                    role === "STUDENT" ? "Students" : "Employees"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeRole === role ? "bg-gold-theme text-obsidian" : "bg-white/10 text-gray-400"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gold-500 animate-pulse">Loading records...</div>
            ) : attendance.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-2xl border border-theme">
                    <p className="text-gray-400">No attendance records found for this date.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {attendance
                        .filter(record => activeRole === "ALL" || record.user.role === activeRole)
                        .map((record) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card/50 border border-theme rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gold-500/40 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-foreground">{record.user.name || record.user.mobile}</h3>
                                        <span className={`text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-gray-700`}>
                                            {record.user.role}
                                        </span>
                                    </div>
                                    <div className="flex gap-8 text-sm text-gray-400">
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase tracking-wider text-gold-theme/60">Logic Time</span>
                                            <span className="font-mono text-foreground">{new Date(record.loginTime).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase tracking-wider text-gold-theme/60">Logout Time</span>
                                            <span className="font-mono text-foreground">
                                                {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString() : '---'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase tracking-wider text-gold-theme/60">Duration</span>
                                            <span className="font-mono text-foreground">
                                                {record.logoutTime
                                                    ? ((new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime()) / (1000 * 60 * 60)).toFixed(2) + ' hrs'
                                                    : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide border
                                    ${record.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                            record.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}
                                `}>
                                        {record.status}
                                    </div>

                                    {record.status === 'PENDING' && record.logoutTime && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStatusUpdate(record.id, 'APPROVED')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-foreground rounded-lg font-bold transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(record.id, 'REJECTED')}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-foreground rounded-lg font-bold transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {record.status === 'PENDING' && !record.logoutTime && (
                                        <span className="text-xs text-gray-500 italic">Wait to logout</span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 hover:bg-red-500/10 rounded text-red-500 hover:text-red-400 transition-colors"
                                        title="Delete Check-in"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                </div>
            )}
        </div>
    );
}
