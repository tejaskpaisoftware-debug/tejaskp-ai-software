"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Define interface locally to avoid circular dependency with page.tsx
export interface UserProp {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    status: string;
    createdAt: string;
    course?: string;
    paymentMode?: string;
    totalFees?: number;
    paidAmount?: number;
    pendingAmount?: number;
    joiningDate?: string;
    salarySlips?: any[];
    salaryDetails?: string;
}

interface UserCardProps {
    user: UserProp;
    onEdit: (user: UserProp) => void;
    onStatusUpdate: (userId: string, newStatus: string) => void;
    onDelete: (userId: string) => void;
    onSalarySlip: (user: UserProp) => void;
}

export default function UserCard({ user, onEdit, onStatusUpdate, onDelete, onSalarySlip }: UserCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300
                ${user.status === 'BLOCKED' ? 'border-red-500/30 bg-red-950/20' : 'border-white/10 bg-gradient-to-br from-[#121212] to-[#0a0a0a]'}
                hover:border-gold-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]
                group
            `}
        >
            {/* Top Bar (Always Visible) */}
            <div className="p-5 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    {/* Avatar / Icon */}
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner
                        ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                            user.role === 'EMPLOYEE' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' :
                                user.role === 'CLIENT' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                                    'bg-gold-500/20 text-gold-500 border border-gold-500/30'}
                    `}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold border ${user.role === 'ADMIN' ? 'border-red-500/30 text-red-400' :
                                user.role === 'EMPLOYEE' ? 'border-purple-500/30 text-purple-400' :
                                    user.role === 'CLIENT' ? 'border-blue-500/30 text-blue-400' :
                                        'border-gold-500/30 text-gold-400'
                                }`}>
                                {user.role}
                            </span>
                            <span className="text-gray-400 text-xs">{user.mobile}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Status Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
                            if (confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'ACTIVATE' : 'BLOCK'} this user?`)) {
                                onStatusUpdate(user.id, newStatus);
                            }
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${user.status === 'ACTIVE' ? 'text-green-500 border-green-500/30 bg-green-500/10 hover:bg-green-500/20' :
                            'text-red-500 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                            }`}
                    >
                        {user.status === 'ACTIVE' ? 'ACTIVE' : 'BLOCKED'}
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        {isExpanded ? '−' : '+'}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-5 space-y-4">
                            {/* Course / Fees Grid */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="text-gray-400 mb-1">Joined</div>
                                    <div className="text-gray-300 font-mono">
                                        {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 mb-1">Course</div>
                                    <div className="text-gray-300">{user.course || '-'}</div>
                                </div>
                            </div>

                            {/* Financials (If Applicable) */}
                            {((user.totalFees || 0) > 0 || (user.paidAmount || 0) > 0) && (
                                <div className="bg-white/5 rounded-lg p-3 grid grid-cols-3 gap-2 text-center border border-white/5">
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase">Fees</div>
                                        <div className="text-sm font-bold text-white">₹{user.totalFees || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase">Paid</div>
                                        <div className="text-sm font-bold text-green-400">₹{user.paidAmount || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase">Pending</div>
                                        <div className="text-sm font-bold text-red-400">₹{Math.max(0, (user.totalFees || 0) - (user.paidAmount || 0))}</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={() => onEdit(user)}
                                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 py-2 rounded text-xs font-bold transition-all"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => window.location.href = `/dashboard/admin/users/${user.id}`}
                                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 rounded text-xs font-bold transition-all"
                                >
                                    📜 History
                                </button>
                                <button
                                    onClick={() => window.location.href = `/dashboard/admin/documents/joining-letter?userId=${user.id}`}
                                    className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 py-2 rounded text-xs font-bold transition-all"
                                >
                                    📄 Letter
                                </button>

                                {user.role === 'EMPLOYEE' ? (
                                    <button
                                        onClick={() => onSalarySlip(user)}
                                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 py-2 rounded text-xs font-bold transition-all"
                                    >
                                        💰 Salary Slip
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = `/dashboard/admin/documents/certificate?userId=${user.id}`}
                                        className="bg-gold-600/20 hover:bg-gold-600/30 text-gold-400 border border-gold-500/30 py-2 rounded text-xs font-bold transition-all"
                                    >
                                        🏆 Certificate
                                    </button>
                                )}
                            </div>

                            {/* Delete Button (Full Width) */}
                            <button
                                onClick={() => onDelete(user.id)}
                                className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                🗑️ Delete User
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
