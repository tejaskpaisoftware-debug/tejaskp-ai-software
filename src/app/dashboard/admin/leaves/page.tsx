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
    status: string;
    user: {
        name: string;
        role: string;
        mobile: string;
    };
}

export default function AdminLeavesPage() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaves();
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

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                fetchLeaves(); // Refresh
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

            {loading ? (
                <div className="text-center py-20 text-gold-theme animate-pulse">Loading requests...</div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-2xl border border-theme">
                    <p className="text-gray-400">No leave requests found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaves.map((leave) => (
                        <motion.div
                            key={leave.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card/50 border border-theme rounded-xl p-6 flex flex-col md:flex-row justify-between gap-4 hover:border-gold-500/40 transition-colors"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-foreground">{leave.user.name || leave.user.mobile}</h3>
                                    <span className={`text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-gray-700`}>
                                        {leave.user.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Duration</span>
                                    <span className="text-foreground">{leave.startDate} <span className="text-gray-600 mx-1">to</span> {leave.endDate}</span>
                                </div>
                                <div>
                                    <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Type</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${leave.type === 'SL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        {leave.type || 'CL'}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs uppercase tracking-wider text-gold-theme/60 block mb-1">Reason</span>
                                    <span className="text-foreground italic">"{leave.reason}"</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide border
                                    ${leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                        leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}
                                `}>
                                    {leave.status}
                                </div>

                                {leave.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-foreground rounded-lg font-bold transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-foreground rounded-lg font-bold transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
