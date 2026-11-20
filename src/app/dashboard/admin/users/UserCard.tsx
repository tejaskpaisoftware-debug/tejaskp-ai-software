"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Pencil,
    Eye,
    History,
    FileText,
    CreditCard,
    Award,
    Clock,
    HeartPulse,
    Calendar,
    BarChart2,
    Sparkles,
    Trash2,
    ChevronDown,
    ChevronUp,
    Shield,
    CheckCircle,
    XCircle,
    DollarSign,
    Phone,
    CalendarDays
} from "lucide-react";

export interface UserProp {
    id: string;
    name: string;
    email: string;
    mobile: string;
    parentMobile?: string;
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
    joiningLetters?: any[];
    leaveBalances?: any[];
    salaryDetails?: string;
    pendingUpdate?: string;
    photoUrl?: string;
}

interface UserCardProps {
    user: UserProp;
    onEdit: (user: UserProp) => void;
    onStatusUpdate: (userId: string, newStatus: string) => void;
    onDelete: (userId: string) => void;
    onSalarySlip: (user: UserProp) => void;
    onProfileApproval: (user: UserProp) => void;
    onMarkLate: (userId: string) => void;
    onMarkSickLeave: (userId: string) => void;
    onMarkCasualLeave: (userId: string) => void;
    onSendReport: (user: UserProp) => void;
    onViewAttendanceChart: (user: UserProp) => void;
}

function LeaveBalanceSection({ user }: { user: UserProp }) {
    const [balance, setBalance] = useState<any>(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (user.leaveBalances && user.leaveBalances.length > 0) {
            const b = user.leaveBalances.find((b: any) => b.year === currentYear);
            if (b) {
                setBalance(b);
                return;
            }
        }

        fetch(`/api/user/leave-balance?userId=${user.id}&year=${currentYear}`)
            .then(res => res.json())
            .then(data => setBalance(data))
            .catch(e => console.error(e));
    }, [user, currentYear]);

    if (!balance && (!user.leaveBalances || user.leaveBalances.length === 0)) return null;

    const displayBalance = balance || { cl: 0, sl: 0, pl: 0 };

    return (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Leave Balance ({currentYear})
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-amber-600 font-semibold">Casual (CL)</div>
                    <div className="text-sm font-bold text-slate-800">{displayBalance.cl || 0}</div>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-blue-600 font-semibold">Sick (SL)</div>
                    <div className="text-sm font-bold text-slate-800">{displayBalance.sl || 0}</div>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-emerald-600 font-semibold">Paid (PL)</div>
                    <div className="text-sm font-bold text-slate-800">{displayBalance.pl || 0}</div>
                </div>
            </div>
        </div>
    );
}

export default function UserCard({
    user,
    onEdit,
    onStatusUpdate,
    onDelete,
    onSalarySlip,
    onProfileApproval,
    onMarkLate,
    onMarkSickLeave,
    onMarkCasualLeave,
    onSendReport,
    onViewAttendanceChart
}: UserCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const getCourseName = () => {
        if (user.course) return user.course;
        if (user.joiningLetters && user.joiningLetters.length > 0) {
            return user.joiningLetters[0].designation || user.joiningLetters[0].internshipType;
        }
        return '-';
    };

    const roleBadges: Record<string, string> = {
        ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
        EMPLOYEE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        TEAM_LEAD: 'bg-blue-50 text-blue-700 border-blue-200',
        CLIENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        STUDENT: 'bg-amber-50 text-amber-800 border-amber-200',
    };

    const isBlocked = user.status === 'BLOCKED';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                isBlocked ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/90'
            }`}
        >
            {/* Card Header */}
            <div className="p-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base overflow-hidden shrink-0 shadow-xs">
                        {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user.name ? user.name.slice(0, 2).toUpperCase() : 'U'
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${roleBadges[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {user.role.replace('_', ' ')}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">{user.mobile}</span>
                        </div>

                        {user.pendingUpdate && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold animate-pulse">
                                <span>Update Requested</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Toggle & Expand */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = isBlocked ? 'ACTIVE' : 'BLOCKED';
                            if (confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'ACTIVATE' : 'BLOCK'} this user?`)) {
                                onStatusUpdate(user.id, newStatus);
                            }
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            !isBlocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                    >
                        {user.status}
                    </button>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Collapsible Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 overflow-hidden"
                    >
                        <div className="p-5 space-y-4 bg-slate-50/50">
                            
                            {/* Joining & Course Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                                <div>
                                    <div className="text-slate-400 text-[11px] font-medium mb-0.5">Joined</div>
                                    <div className="text-slate-700 font-mono font-semibold">
                                        {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-[11px] font-medium mb-0.5">Course / Domain</div>
                                    <div className="text-slate-800 font-medium truncate">{getCourseName()}</div>
                                </div>
                            </div>

                            {/* Employee Leave Balance Component */}
                            {user.role === 'EMPLOYEE' && (
                                <LeaveBalanceSection user={user} />
                            )}

                            {/* Fees Breakdown for Students */}
                            {((user.totalFees || 0) > 0 || (user.paidAmount || 0) > 0) && (
                                <div className="bg-white rounded-xl p-3 grid grid-cols-3 gap-2 text-center border border-slate-200/80">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Fees</div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">₹{user.totalFees || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Paid</div>
                                        <div className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">₹{user.paidAmount || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Pending</div>
                                        <div className="text-xs sm:text-sm font-bold text-rose-600 font-mono">
                                            ₹{Math.max(0, (user.totalFees || 0) - (user.paidAmount || 0))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => onEdit(user)}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit</span>
                                </button>

                                {user.pendingUpdate ? (
                                    <button
                                        onClick={() => onProfileApproval(user)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Review</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = `/dashboard/admin/users/${user.id}`}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                                    >
                                        <History className="w-3.5 h-3.5 text-slate-500" />
                                        <span>History</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => window.location.href = `/dashboard/admin/documents/joining-letter?userId=${user.id}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Joining Letter</span>
                                </button>

                                {user.role === 'EMPLOYEE' ? (
                                    <button
                                        onClick={() => onSalarySlip(user)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span>Salary Slip</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = `/dashboard/admin/documents/certificate?userId=${user.id}`}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        <Award className="w-3.5 h-3.5" />
                                        <span>Certificate</span>
                                    </button>
                                )}
                            </div>

                            {/* Student Attendance Actions */}
                            {user.role === 'STUDENT' && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <button
                                            onClick={() => onMarkLate(user.id)}
                                            className="py-1.5 px-2 text-[11px] font-semibold text-amber-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-center gap-1"
                                            title="Mark Late Today"
                                        >
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            <span>Late</span>
                                        </button>
                                        <button
                                            onClick={() => onMarkSickLeave(user.id)}
                                            className="py-1.5 px-2 text-[11px] font-semibold text-blue-700 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                            title="Mark Sick Leave"
                                        >
                                            <HeartPulse className="w-3 h-3 text-blue-600" />
                                            <span>Sick</span>
                                        </button>
                                        <button
                                            onClick={() => onMarkCasualLeave(user.id)}
                                            className="py-1.5 px-2 text-[11px] font-semibold text-indigo-700 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                                            title="Mark Casual Leave"
                                        >
                                            <Calendar className="w-3 h-3 text-indigo-600" />
                                            <span>Leave</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => onSendReport(user)}
                                            className="py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Send Report</span>
                                        </button>

                                        <button
                                            onClick={() => onViewAttendanceChart(user)}
                                            className="py-2 px-3 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Attendance AI</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={() => onDelete(user.id)}
                                className="w-full py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete User</span>
                            </button>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
