"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    X, Home, Calendar, FileText, ClipboardList, MessageCircle, TrendingUp, Gamepad2, Video, User,
    Bell, LogOut, CheckCircle2, AlertTriangle, Sparkles, Clock, Award, ShieldCheck, ChevronRight,
    GraduationCap, Building2, BookOpen, Layers, Bot, Download, Info, Check, RefreshCw, DollarSign,
    PartyPopper, Phone, Mail, Camera, ArrowRight, ArrowUpRight, Lock, CheckCircle, Flame
} from "lucide-react";
import StudentSubmissionsPage from "./submissions/page";
import DraggableAIButton from "@/components/common/DraggableAIButton";
import ReferralSection from "@/components/student/ReferralSection";
import MeetingSection from "@/components/common/MeetingSection";
import TejasKPLogo from "@/components/common/TejasKPLogo";
import FaceCheckInModal from "@/components/student/FaceCheckInModal";
import ProfileSection from "@/components/student/ProfileSection";

// Helper for Auth Header
const getAuthHeader = (): HeadersInit => {
    const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) return { 'Authorization': `Bearer ${user.token}` };
        } catch (e) { console.error(e); }
    }
    return {};
};

interface StudentUser {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    createdAt: string;
    role?: string;
    course?: string;
    department?: string;
    college?: string;
    employeeId?: string;
    photoUrl?: string;
    totalFees?: number;
    paidAmount?: number;
    pendingAmount?: number;
}

export default function StudentDashboard() {
    const [user, setUser] = useState<StudentUser | null>(null);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'documents' | 'submissions' | 'earn' | 'meetings' | 'profile'>('overview');
    const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [isCheckingInFromPrompt, setIsCheckingInFromPrompt] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                // Fetch complete profile details (course, college, fees, etc.)
                fetch(`/api/user/me?userId=${parsed.id}`, { headers: { ...getAuthHeader() } })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.user) {
                            setUser(prev => ({ ...prev, ...data.user }));
                        }
                    })
                    .catch(e => console.error("Could not fetch user/me:", e));
            } catch (err) {
                console.error("Invalid session data:", err);
            }
        } else {
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        if (user?.id) {
            checkTodayAttendance();
            fetchNotifications();
        }
    }, [user?.id]);

    const checkTodayAttendance = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/user/attendance?userId=${user.id}`, { headers: { ...getAuthHeader() } });
            if (!res.ok) return;

            const data = await res.json();
            setTodayRecord(data);

            const skipped = sessionStorage.getItem("skipCheckInToday");
            if (data || skipped) {
                setShowCheckInPrompt(false);
            } else {
                setShowCheckInPrompt(true);
            }
        } catch (e) { console.error(e); }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/student/notifications', { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error("Failed to load notifications");
        }
    };

    const handleDismiss = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        try {
            await fetch(`/api/student/notifications/${id}`, {
                method: 'PATCH',
                headers: { ...getAuthHeader() }
            });
        } catch (e) {
            console.error("Failed to dismiss notification");
        }
    };

    const handleLogout = async () => {
        if (user) {
            try {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeader() },
                    body: JSON.stringify({ userId: user.id })
                });
            } catch (e) { console.error(e); }
        }
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/login?logout=true";
    };

    // Calculate tenure progress (75 days towards Experience Certificate)
    const getTenureProgress = () => {
        if (!user?.createdAt) return { days: 1, total: 75, percent: 1, unlocked: false };
        const joinDate = new Date(user.createdAt);
        const today = new Date();
        const diffTime = today.getTime() - joinDate.getTime();
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const percent = Math.min(100, Math.round((diffDays / 75) * 100));
        return {
            days: Math.min(75, diffDays),
            total: 75,
            percent,
            unlocked: diffDays >= 75,
            daysLeft: Math.max(0, 75 - diffDays)
        };
    };

    const tenure = getTenureProgress();
    const studentDomain = user?.course || user?.department || "Web Development";
    const studentCollege = user?.college || "Academic Partner";

    const unreadNotifications = notifications.filter(n => !n.isRead);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-12">
            
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Brand / Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-xs">
                            <GraduationCap className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                                    TEJASKP AI SOFTWARE
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                                    Student Portal
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 hidden sm:block">
                                Intern Learning Management & Attendance Hub
                            </p>
                        </div>
                    </div>

                    {/* Right User Bar */}
                    <div className="flex items-center gap-2.5 sm:gap-4">
                        {/* Notification Bell with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                                className={`w-9 h-9 rounded-xl border transition-colors relative flex items-center justify-center cursor-pointer ${
                                    showNotificationsDropdown
                                        ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                                }`}
                                title="Notifications"
                            >
                                <Bell className="w-4 h-4" />
                                {unreadNotifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                                        {unreadNotifications.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Popover */}
                            <AnimatePresence>
                                {showNotificationsDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotificationsDropdown(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                                        >
                                            {/* Popover Header */}
                                            <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                        Notifications
                                                    </span>
                                                    {unreadNotifications.length > 0 ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                            {unreadNotifications.length} unread
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            All caught up
                                                        </span>
                                                    )}
                                                </div>
                                                {unreadNotifications.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            unreadNotifications.forEach(n => handleDismiss(n.id));
                                                        }}
                                                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* Notification Items */}
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1.5 custom-scrollbar">
                                                {unreadNotifications.length === 0 ? (
                                                    <div className="py-8 px-4 text-center">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                                                            <Bell className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700">No new notifications</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">You're completely up to date!</p>
                                                    </div>
                                                ) : (
                                                    unreadNotifications.map(n => {
                                                        const isApproval = n.type === 'SUCCESS' || n.title?.toLowerCase().includes('approved');
                                                        const isWarning = n.type === 'WARNING' || n.title?.toLowerCase().includes('warning') || n.title?.toLowerCase().includes('late');
                                                        return (
                                                            <div
                                                                key={n.id}
                                                                className="p-3 hover:bg-slate-50/80 rounded-xl transition-colors flex items-start gap-3"
                                                            >
                                                                <div className="mt-0.5 shrink-0">
                                                                    {isApproval ? (
                                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    ) : isWarning ? (
                                                                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                                                                            <Info className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <h4 className="text-xs font-bold text-slate-900 truncate">
                                                                            {n.title}
                                                                        </h4>
                                                                        <span className="text-[10px] text-slate-400 shrink-0">
                                                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                                                                        {n.message}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDismiss(n.id);
                                                                    }}
                                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                                                                    title="Dismiss"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Student Profile Pill */}
                        <div 
                            onClick={() => setActiveTab('profile')}
                            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                        >
                            <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center overflow-hidden">
                                {user?.photoUrl ? (
                                    <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase() || "S"
                                )}
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-xs font-bold text-slate-900 leading-tight">
                                    {user?.name || "Student"}
                                </div>
                                <div className="text-[10px] text-amber-700 font-semibold truncate max-w-[120px]">
                                    {studentDomain}
                                </div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="px-3 sm:px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="Sign out of student portal"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">



                {/* Student Hero & Welcome Card (Compact) */}
                <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 text-slate-950 shadow-xs relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                                    Welcome back, {user?.name || "Student"}! 👋
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/15 text-slate-950 font-bold text-[10px] uppercase border border-slate-950/10">
                                    <Sparkles className="w-2.5 h-2.5" /> Active
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-900/80 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span>Domain: <strong className="text-slate-950">{studentDomain}</strong></span>
                                <span className="opacity-50">•</span>
                                <span>University: <strong className="text-slate-950">{studentCollege}</strong></span>
                                {user?.mobile && (
                                    <>
                                        <span className="opacity-50">•</span>
                                        <span>ID: <strong className="text-slate-950">{user.mobile}</strong></span>
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Compact Quick Attendance Check-in Widget */}
                        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-3 shrink-0 self-start sm:self-auto">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                {todayRecord?.logoutTime ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : todayRecord ? (
                                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                ) : (
                                    <Camera className="w-4 h-4 text-amber-600" />
                                )}
                            </div>
                            <div className="leading-tight">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Today's Attendance
                                </div>
                                <div className="text-xs font-extrabold text-slate-900">
                                    {todayRecord?.logoutTime ? (
                                        <span className="text-emerald-700">Day Completed</span>
                                    ) : todayRecord ? (
                                        <span className="text-amber-800">Checked In ({new Date(todayRecord.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                                    ) : (
                                        <span className="text-slate-800">Check-in Pending</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className="ml-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                                <span>{todayRecord?.logoutTime ? "View" : todayRecord ? "Status" : "Check In"}</span>
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modern Navigation Tabs Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-2xs flex flex-wrap md:flex-nowrap items-center justify-between gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Primary Navigation Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[
                        { id: 'overview', label: 'Overview', icon: Home },
                        { id: 'attendance', label: 'Attendance', icon: Clock },
                        { id: 'leaves', label: 'Leaves', icon: Calendar },
                        { id: 'documents', label: 'Documents', icon: FileText },
                        { id: 'submissions', label: 'Tasks', icon: ClipboardList },
                        { id: 'meetings', label: 'Meetings', icon: Video },
                        { id: 'earn', label: 'Refer & Earn', icon: TrendingUp },
                        { id: 'profile', label: 'My Profile', icon: User },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                    </div>

                    {/* Direct Quick Launch Pills (Right-aligned) */}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
                        <button
                            onClick={() => router.push('/dashboard/user/chat')}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            title="Chat with team and mentors"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/student/ai')}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            title="Ask TEJASKP AI Tutor"
                        >
                            <Bot className="w-3.5 h-3.5 text-amber-600" />
                            <span>TEJASKP AI</span>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/student/games')}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            title="Take a break with games"
                        >
                            <Gamepad2 className="w-3.5 h-3.5" />
                            <span>Break</span>
                        </button>
                    </div>
                </div>

                {/* Tab Views */}
                <div>
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            
                            {/* KPI Metrics Grid (4 Clean Cards) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                {/* Metric 1: Attendance Rate */}
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Attendance Rate
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 font-mono">
                                            {todayRecord ? "95%" : "92%"}
                                        </div>
                                        <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Excellent Standing
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Target: 85%+</span>
                                        <button onClick={() => setActiveTab('attendance')} className="font-bold text-amber-600 hover:underline">
                                            View Logs →
                                        </button>
                                    </div>
                                </div>

                                {/* Metric 2: Internship Tenure & Certificate Progress */}
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Internship Tenure
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                            <Award className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 font-mono">
                                            Day {tenure.days} <span className="text-xs font-bold text-slate-400">/ 75 Days</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
                                            <div 
                                                className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${tenure.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>{tenure.unlocked ? "Certificate Unlocked!" : `${tenure.daysLeft} days to certificate`}</span>
                                        <button onClick={() => setActiveTab('documents')} className="font-bold text-amber-600 hover:underline">
                                            Certificate →
                                        </button>
                                    </div>
                                </div>

                                {/* Metric 3: Submissions & Tasks */}
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Weekly Reports
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 font-mono">
                                            Active
                                        </div>
                                        <p className="text-xs text-blue-700 font-semibold mt-0.5 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Weekly Progress Track
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Tasks & Reports</span>
                                        <button onClick={() => setActiveTab('submissions')} className="font-bold text-amber-600 hover:underline">
                                            Submit Now →
                                        </button>
                                    </div>
                                </div>

                                {/* Metric 4: Assigned Domain */}
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Assigned Domain
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                            {studentDomain}
                                        </div>
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 mt-1">
                                            Student Intern
                                        </span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>Role: STUDENT</span>
                                        <button onClick={() => setActiveTab('profile')} className="font-bold text-amber-600 hover:underline">
                                            My Profile →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Two-Column Main Dashboard Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Left Column: Official Documents Hub & Action Center (2 cols) */}
                                <div className="lg:col-span-2 space-y-6">
                                    
                                    {/* Official Documents Grid Card */}
                                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-amber-600" />
                                                    Official Documents & Certificates
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Access and download your verified internship records
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('documents')}
                                                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                                            >
                                                <span>View All</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Joining Letter Card */}
                                            <div 
                                                onClick={() => router.push('/dashboard/student/joining-letter')}
                                                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                                                        📄
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        READY
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                                                        Joining Letter
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Official Internship Offer with QR verification
                                                    </p>
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-amber-700">
                                                    <span>View Letter</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>

                                            {/* Experience Certificate Card */}
                                            <div 
                                                onClick={() => {
                                                    if (tenure.unlocked) {
                                                        router.push(`/dashboard/student/certificate?userId=${user?.id}`);
                                                    } else {
                                                        alert(`Experience Certificate unlocks automatically after 75 days. You are currently on Day ${tenure.days} (${tenure.daysLeft} days remaining).`);
                                                    }
                                                }}
                                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                                    tenure.unlocked
                                                        ? 'border-slate-200/90 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-300 cursor-pointer group'
                                                        : 'border-slate-200 bg-slate-50/40 opacity-80 cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                                                        🎓
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                        tenure.unlocked 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {tenure.unlocked ? "READY" : `DAY ${tenure.days}/75`}
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <h4 className="font-bold text-slate-900 text-sm">
                                                        Experience Certificate
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {tenure.unlocked ? "Internship Completion Certificate ready" : `Unlocks after 75 days (${tenure.daysLeft} days left)`}
                                                    </p>
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                                                    <span>{tenure.unlocked ? "View Certificate" : "Tenure In Progress"}</span>
                                                    {tenure.unlocked ? <ArrowRight className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                                                </div>
                                            </div>

                                            {/* University NOC Submission */}
                                            <div 
                                                onClick={() => router.push('/dashboard/student/noc')}
                                                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                                                        📑
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                        PORTAL
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                                                        NOC Submission
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Upload College No Objection Certificate
                                                    </p>
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-amber-700">
                                                    <span>Upload NOC</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>

                                            {/* Assessments Submission */}
                                            <div 
                                                onClick={() => router.push('/dashboard/student/assessment')}
                                                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                                        📝
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        SUBMIT
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                                                        Assessments & Projects
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Submit evaluation files and project code
                                                    </p>
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-amber-700">
                                                    <span>Open Assessments</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily Updates Section */}
                                    <DailyUpdatesSection />
                                </div>

                                {/* Right Column: Financial Status & Quick Hub (1 col) */}
                                <div className="space-y-6">
                                    
                                    {/* Financial & Fee Status Card */}
                                    <FinancialSection user={user} />

                                    {/* Quick Tools & Shortcuts */}
                                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-amber-600" />
                                            Quick Tools & Connect
                                        </h3>
                                        <div className="space-y-2.5">
                                            <button
                                                onClick={() => router.push('/dashboard/student/ai')}
                                                className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 transition-colors text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                                                        <Bot className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">TEJASKP AI Tutor</div>
                                                        <div className="text-[10px] text-amber-800">Ask coding & project doubts</div>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-amber-700" />
                                            </button>

                                            <button
                                                onClick={() => router.push('/dashboard/user/chat')}
                                                className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition-colors text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                                                        <MessageCircle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">Direct Team Chat</div>
                                                        <div className="text-[10px] text-blue-800">Message lead & teammates</div>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-blue-700" />
                                            </button>

                                            <button
                                                onClick={() => setActiveTab('meetings')}
                                                className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition-colors text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                                                        <Video className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">Online Meetings</div>
                                                        <div className="text-[10px] text-emerald-800">Daily standup & mentoring</div>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                                            </button>

                                            <button
                                                onClick={() => router.push('/dashboard/student/games')}
                                                className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition-colors text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                                                        <Gamepad2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">Mind Games</div>
                                                        <div className="text-[10px] text-purple-800">F1 Racing & Memory tests</div>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-purple-700" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: ATTENDANCE */}
                    {activeTab === 'attendance' && user && (
                        <AttendanceSection userId={user.id} onRefresh={checkTodayAttendance} />
                    )}

                    {/* TAB 3: LEAVES */}
                    {activeTab === 'leaves' && user && (
                        <LeaveSection userId={user.id} />
                    )}

                    {/* TAB 4: DOCUMENTS */}
                    {activeTab === 'documents' && user && (
                        <DocumentsSection userId={user.id} createdAt={user.createdAt} />
                    )}

                    {/* TAB 5: SUBMISSIONS & TASKS */}
                    {activeTab === 'submissions' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <StudentSubmissionsPage />
                        </motion.div>
                    )}

                    {/* TAB 6: MEETINGS */}
                    {activeTab === 'meetings' && user && (
                        <MeetingSection userId={user.id} userName={user.name} />
                    )}

                    {/* TAB 7: REFER & EARN */}
                    {activeTab === 'earn' && user && (
                        <ReferralSection userId={user.id} />
                    )}

                    {/* TAB 8: PROFILE */}
                    {activeTab === 'profile' && user && (
                        <div className="mt-2">
                            <ProfileSection userId={user.id} />
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex justify-between items-center md:hidden z-50 shadow-lg">
                <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Home size={18} />} label="Home" />
                <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Clock size={18} />} label="Attend" />
                <NavButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} icon={<ClipboardList size={18} />} label="Tasks" />
                <NavButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={18} />} label="Docs" />
                <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Profile" />
                <button onClick={() => router.push('/dashboard/student/ai')} className="flex flex-col items-center gap-0.5 text-amber-600 font-bold">
                    <Bot size={18} />
                    <span className="text-[10px]">AI</span>
                </button>
            </div>

            {/* Draggable AI Button (Overlay) */}
            <DraggableAIButton />

            {/* Check-in Pending Prompt Modal */}
            {showCheckInPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
                            <Camera className="w-8 h-8 text-amber-600 animate-pulse" />
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-1">
                            Daily Check-In Pending
                        </h2>
                        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                            Good morning! Please complete your facial biometric verification to record today's attendance.
                        </p>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => {
                                    setShowCheckInPrompt(false);
                                    setIsCheckingInFromPrompt(true);
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl shadow-xs transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Verify Face & Check In Now
                            </button>
                            <button
                                onClick={() => {
                                    setShowCheckInPrompt(false);
                                    sessionStorage.setItem("skipCheckInToday", "true");
                                }}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all text-xs"
                            >
                                Remind Me Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Face ID Modal Triggered from Prompt */}
            <FaceCheckInModal
                isOpen={isCheckingInFromPrompt}
                onClose={() => setIsCheckingInFromPrompt(false)}
                onSuccess={async () => {
                    setIsCheckingInFromPrompt(false);
                    try {
                        const res = await fetch('/api/user/attendance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                            body: JSON.stringify({ userId: user?.id })
                        });
                        if (res.ok) {
                            alert("Check-in Successful!");
                            checkTodayAttendance();
                        } else {
                            const err = await res.json();
                            alert(`Check-in Failed: ${err.message || "Unknown error"}`);
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Network error during check-in.");
                    }
                }}
                userId={user?.id || ""}
                mode="check-in"
            />
        </div>
    );
}

// ----------------------------------------------------
// ATTENDANCE SECTION (High Contrast & User-Friendly)
// ----------------------------------------------------
function AttendanceSection({ userId, onRefresh }: { userId: string, onRefresh?: () => void }) {
    const [history, setHistory] = useState<any[]>([]);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [checkInMode, setCheckInMode] = useState<'check-in' | 'check-out'>('check-in');

    useEffect(() => {
        fetchHistory();
        fetchTodayStatus();
    }, [userId]);

    const fetchHistory = () => {
        fetch(`/api/admin/attendance?date=`, { headers: { ...getAuthHeader() } })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const myData = data.filter((d: any) => d.userId === userId);
                    setHistory(myData);
                }
            })
            .catch(e => console.error(e));
    };

    const fetchTodayStatus = () => {
        fetch(`/api/user/attendance?userId=${userId}`, { headers: { ...getAuthHeader() } })
            .then(res => res.json())
            .then(data => setTodayRecord(data))
            .catch(e => console.error(e));
    };

    const handleFaceSuccess = async () => {
        setLoading(true);
        try {
            if (checkInMode === 'check-in') {
                const res = await fetch('/api/user/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify({ userId })
                });
                if (res.ok) {
                    alert("Check-in Successful!");
                    fetchTodayStatus();
                    fetchHistory();
                    if (onRefresh) onRefresh();
                } else {
                    const err = await res.json();
                    alert(`Check-in Failed: ${err.message || "Unknown error"}`);
                }
            } else {
                const res = await fetch('/api/user/attendance', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify({ userId })
                });
                if (res.ok) {
                    alert("Check-out Successful!");
                    fetchTodayStatus();
                    fetchHistory();
                    if (onRefresh) onRefresh();
                } else {
                    const err = await res.json();
                    alert(`Check-out Failed: ${err.message || "Unknown error"}`);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Network error during attendance update.");
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        present: history.filter(h => h.status === 'PRESENT' || h.status === 'LATE' || h.status === 'APPROVED').length,
        late: history.filter(h => h.isLate || h.status === 'LATE').length,
        absent: history.filter(h => h.status === 'ABSENT' || h.isAbsent).length
    };

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-emerald-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days Present</span>
                        <div className="text-3xl font-black text-emerald-600 font-mono mt-1">{stats.present}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                        ✓
                    </div>
                </div>

                <div className="bg-white border border-amber-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
                        <div className="text-3xl font-black text-amber-600 font-mono mt-1">{stats.late}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
                        ⚠️
                    </div>
                </div>

                <div className="bg-white border border-rose-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absents</span>
                        <div className="text-3xl font-black text-rose-600 font-mono mt-1">{stats.absent}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
                        ✕
                    </div>
                </div>
            </div>

            {/* Interactive Today's Action Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-xs max-w-2xl mx-auto">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Today's Biometric Status
                </span>

                <div className="my-6">
                    {!todayRecord ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 max-w-md mx-auto">
                                You haven't checked in yet today. Click the button below to complete facial recognition check-in.
                            </p>
                            <button
                                onClick={() => {
                                    setCheckInMode('check-in');
                                    setShowFaceModal(true);
                                }}
                                disabled={loading}
                                className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Camera className="w-5 h-5" />
                                <span>Verify Face Check-In</span>
                            </button>
                        </div>
                    ) : !todayRecord.logoutTime ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 inline-block text-emerald-800 text-sm font-semibold">
                                ✓ Checked in at <span className="font-mono font-bold">{new Date(todayRecord.loginTime).toLocaleTimeString()}</span>
                            </div>
                            <div>
                                <button
                                    onClick={() => {
                                        setCheckInMode('check-out');
                                        setShowFaceModal(true);
                                    }}
                                    disabled={loading}
                                    className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <span>Check Out For The Day</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-2xl mx-auto">
                                ✓
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">Attendance Completed Today</h4>
                            <p className="text-xs text-slate-500 font-mono">
                                In: {new Date(todayRecord.loginTime).toLocaleTimeString()} • Out: {new Date(todayRecord.logoutTime).toLocaleTimeString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Policies Box */}
                <div className="pt-4 border-t border-slate-100 text-left text-xs text-slate-500 space-y-1.5">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Important Rules:</p>
                    <p>• Arrival after <strong>10:45 AM</strong> is marked as <strong>LATE</strong> (3 late marks = 1 absent).</p>
                    <p>• Minimum <strong>4 hours</strong> required to avoid absent mark.</p>
                </div>
            </div>

            {/* Attendance Logs Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Attendance History</h3>
                    <span className="text-xs text-slate-500">{history.length} records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                            <tr>
                                <th className="p-3.5 pl-6">Date</th>
                                <th className="p-3.5">Check-In</th>
                                <th className="p-3.5">Check-Out</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 pr-6">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        No attendance logs found yet.
                                    </td>
                                </tr>
                            ) : (
                                history.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50/60">
                                        <td className="p-3.5 pl-6 font-mono font-medium">{rec.date}</td>
                                        <td className="p-3.5 font-mono">{new Date(rec.loginTime).toLocaleTimeString()}</td>
                                        <td className="p-3.5 font-mono">{rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString() : '-'}</td>
                                        <td className="p-3.5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                rec.status === 'APPROVED' || rec.status === 'PRESENT'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : rec.status === 'LATE'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 pr-6 text-slate-400">{rec.adminRemarks || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <FaceCheckInModal
                isOpen={showFaceModal}
                onClose={() => setShowFaceModal(false)}
                onSuccess={handleFaceSuccess}
                userId={userId}
                mode={checkInMode}
            />
        </motion.div>
    );
}

// ----------------------------------------------------
// LEAVES SECTION
// ----------------------------------------------------
function LeaveSection({ userId }: { userId: string }) {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, [userId]);

    const fetchLeaves = () => {
        fetch(`/api/user/leaves?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLeaves(data);
            })
            .catch(e => console.error(e));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/user/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, startDate, endDate, reason })
            });
            if (res.ok) {
                setStartDate(''); setEndDate(''); setReason('');
                fetchLeaves();
                alert("Leave application submitted successfully!");
            }
        } catch (e) { alert("Error submitting leave."); }
        finally { setLoading(false); }
    };

    const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
    const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
    const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-emerald-200/80 p-4 rounded-2xl shadow-xs text-center">
                    <span className="text-2xl font-black text-emerald-600 font-mono">{approvedCount}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Approved</p>
                </div>
                <div className="bg-white border border-amber-200/80 p-4 rounded-2xl shadow-xs text-center">
                    <span className="text-2xl font-black text-amber-600 font-mono">{pendingCount}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Pending</p>
                </div>
                <div className="bg-white border border-rose-200/80 p-4 rounded-2xl shadow-xs text-center">
                    <span className="text-2xl font-black text-rose-600 font-mono">{rejectedCount}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Rejected</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Apply Form */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Apply for Leave</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">From Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">To Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Reason for Leave</label>
                            <textarea
                                required
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Explain reason (e.g. University exam, sick leave)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 resize-none outline-none focus:border-amber-500 focus:bg-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs"
                        >
                            {loading ? "Submitting..." : "Submit Leave Application"}
                        </button>
                    </form>
                </div>

                {/* History List */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Leave History</h3>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                        {leaves.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No leave requests submitted yet.</p>
                        ) : (
                            leaves.map(l => (
                                <div key={l.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-800">{l.startDate} → {l.endDate}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            l.status === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : l.status === 'REJECTED'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {l.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 italic">"{l.reason}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------
// DOCUMENTS SECTION
// ----------------------------------------------------
function DocumentsSection({ userId, createdAt }: { userId: string, createdAt?: string }) {
    const router = useRouter();

    const isCertificateUnlocked = () => {
        if (!createdAt) return false;
        const joinDate = new Date(createdAt);
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 75;
    };

    const unlocked = isCertificateUnlocked();

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Official Internship Documents</h2>
                    <p className="text-xs text-slate-500">Download, review, and submit mandatory documents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Joining Letter */}
                <div 
                    onClick={() => router.push('/dashboard/student/joining-letter')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        📄
                    </div>
                    <div className="mt-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-amber-700">Joining Letter</h3>
                        <p className="text-xs text-slate-500 mt-1">Official appointment letter with security verification seal.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700 flex items-center justify-between">
                        <span>View Document</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Experience Certificate */}
                <div 
                    onClick={() => {
                        if (unlocked) {
                            router.push(`/dashboard/student/certificate?userId=${userId}`);
                        } else {
                            alert("Experience Certificate unlocks automatically after 75 days of internship tenure.");
                        }
                    }}
                    className={`bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                        unlocked 
                            ? 'border-slate-200/80 hover:border-amber-400 hover:shadow-sm cursor-pointer group' 
                            : 'border-slate-200 opacity-75 cursor-pointer'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-2xl">
                        {unlocked ? "🎓" : "🔒"}
                    </div>
                    <div className="mt-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            unlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            {unlocked ? "READY" : "75-DAY LOCK"}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">Experience Certificate</h3>
                        <p className="text-xs text-slate-500 mt-1">Official completion certificate with company authorization.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>{unlocked ? "Download PDF" : "Locked (Tenure Incomplete)"}</span>
                        {unlocked ? <ArrowRight className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                </div>

                {/* NOC Submission */}
                <div 
                    onClick={() => router.push('/dashboard/student/noc')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        📑
                    </div>
                    <div className="mt-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">UNIVERSITY</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-amber-700">NOC Submission</h3>
                        <p className="text-xs text-slate-500 mt-1">Upload your college No Objection Certificate for approval.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700 flex items-center justify-between">
                        <span>Upload File</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Assessments */}
                <div 
                    onClick={() => router.push('/dashboard/student/assessment')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        📝
                    </div>
                    <div className="mt-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">PORTAL</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-amber-700">Assessments</h3>
                        <p className="text-xs text-slate-500 mt-1">Submit your module evaluations and project files.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700 flex items-center justify-between">
                        <span>Open Tasks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------
// FINANCIAL & FEES SECTION
// ----------------------------------------------------
function FinancialSection({ user }: { user: StudentUser | null }) {
    const totalFees = user?.totalFees || 0;
    const paidAmount = user?.paidAmount || 0;
    const pendingAmount = Math.max(0, totalFees - paidAmount);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    Financial & Fees Status
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    pendingAmount === 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                    {pendingAmount === 0 ? "FEES CLEAR" : "DUES PENDING"}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Fees</span>
                    <div className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5">₹{totalFees.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Paid Amount</span>
                    <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono mt-0.5">₹{paidAmount.toLocaleString()}</div>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/80 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-800">Pending</span>
                    <div className="text-sm sm:text-base font-bold text-amber-800 font-mono mt-0.5">₹{pendingAmount.toLocaleString()}</div>
                </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
                For fee receipts or online installment payments, contact the administration.
            </p>
        </div>
    );
}

// ----------------------------------------------------
// DAILY UPDATES SECTION
// ----------------------------------------------------
function DailyUpdatesSection() {
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.announcements)) {
                    setUpdates(data.announcements);
                }
            })
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        📢 Daily Announcements & Notices
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        LIVE
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {updates.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic">
                        No announcements posted for today.
                    </p>
                ) : (
                    updates.slice(0, 3).map(up => (
                        <div key={up.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{up.title}</h4>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                    {new Date(up.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {up.content}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-0.5 transition-colors ${active ? 'text-amber-600 font-bold' : 'text-slate-500'}`}
        >
            {icon}
            <span className="text-[10px]">{label}</span>
        </button>
    );
}
