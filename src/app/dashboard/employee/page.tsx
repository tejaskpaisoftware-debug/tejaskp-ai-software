"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Home, Calendar, FileText, ClipboardList, MessageCircle, TrendingUp, Gamepad2, Video, Palette } from "lucide-react";
import StudentSubmissionsPage from "../student/submissions/page";
import DraggableAIButton from "@/components/common/DraggableAIButton";
import ReferralSection from "@/components/student/ReferralSection";
import MeetingSection from "@/components/common/MeetingSection";
import ThemeSelector from "@/components/common/ThemeSelector";
import SalarySlipTemplate from "@/components/documents/SalarySlipTemplate";
import ProfileSection from "@/components/employee/ProfileSection";
import MailboxSection from "@/components/employee/MailboxSection";
import SplashScreen from "@/components/common/SplashScreen";
import TejasKPLogo from "@/components/common/TejasKPLogo";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

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

export default function EmployeeDashboard() {
    const [user, setUser] = useState<{ id: string; name: string; mobile: string; createdAt: string; photoUrl?: string } | null>(null);
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const { theme, avengersCharacter } = useTheme();
    const isIronMan = theme === 'avengers' && avengersCharacter === 'iron-man';

    // Fail-safe: Force hide splash if it hangs for more than 7 seconds
    useEffect(() => {
        if (showSplash) {
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [showSplash]);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser");
        if (stored) {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);

            // FETCH FRESH DATA (Background)
            fetch(`/api/user/me?userId=${parsedUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.id) {
                        setUser(prev => ({ ...prev, ...data }));
                        // Optional: Update session storage to keep it fresh for next reload
                        sessionStorage.setItem("currentUser", JSON.stringify({ ...parsedUser, ...data }));
                    }
                })
                .catch(err => console.error("Failed to refresh user data", err));

        } else {
            router.push("/login");
        }
    }, [router]);

    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'mailbox' | 'attendance' | 'leaves' | 'documents' | 'submissions' | 'earn' | 'meetings' | 'profile' | 'theme'>('overview');

    const handleLogout = async () => {
        if (user) {
            try {
                // Call Logout API to mark attendance & clear cookie
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeader() },
                    body: JSON.stringify({ userId: (user as any).id })
                });
            } catch (e) { console.error(e); }
        }
        // Client-side cleanup
        sessionStorage.removeItem("currentUser");
        sessionStorage.clear();
        sessionStorage.clear();
        // Force hard reload to login with logout flag to bypass middleware redirects
        window.location.href = "/login?logout=true";
    };

    const [notifications, setNotifications] = useState<any[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [pendingTasksCount, setPendingTasksCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchAttendanceStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/student/notifications', { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (e) {
            console.error("Failed to load notifications");
        }
    };

    const fetchAttendanceStats = async () => {
        try {
            if (!user?.id) return;
            const res = await fetch(`/api/user/attendance?userId=${user.id}&type=stats`, { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.percentage !== undefined) setAttendanceStats(data);
        } catch (e) { console.error("Failed to load stats"); }
    };

    const fetchTasks = async () => {
        try {
            if (!user?.id) return;
            const res = await fetch(`/api/user/tasks?userId=${user.id}`, { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks);
                const pending = data.tasks.filter((t: any) => t.status === "TODO" || t.status === "IN_PROGRESS").length;
                setPendingTasksCount(pending);
            }
        } catch (e) { console.error("Failed to load tasks"); }
    };

    // Auto-Refresh polling (every 5 seconds)
    useEffect(() => {
        if (!user) return;

        const refreshUserData = () => {
            fetch(`/api/user/me?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.id) {
                        // Only update if changes detected (optional optimization could go here)
                        setUser(prev => ({ ...prev, ...data }));
                        sessionStorage.setItem("currentUser", JSON.stringify({ ...user, ...data }));
                    }
                })
                .catch(err => console.error("Auto-refresh error", err));
        };

        const intervalId = setInterval(() => {
            refreshUserData();
            fetchNotifications();
            fetchTasks();
        }, 5000); // 5 Seconds Polling

        return () => clearInterval(intervalId);
    }, [user?.id]); // Depend on ID to stability

    const handleDismiss = async (id: string) => {
        // Optimistic UI update
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

    const handleFinishSplash = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <>{/* Fragments */}
            {showSplash && user && (
                <SplashScreen
                    // key={user.photoUrl || 'default'} // Removed to avoid base64 key issues
                    user={user}
                    onFinish={handleFinishSplash}
                />
            )}
            <div className={`min-h-screen bg-background text-foreground font-sans transition-all duration-500 relative z-10 selection:bg-gold-500/30 ${isIronMan ? 'p-16 scale-95 origin-center' : 'p-4 md:p-8'}`}>
                <header className="sticky top-4 z-40 glass-panel rounded-2xl px-6 py-4 mb-12 flex justify-between items-center transform transition-all hover:shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)] border-theme">
                    <div className="flex items-center gap-4">
                        {user?.photoUrl ? (
                            <img
                                src={user.photoUrl}
                                alt="Profile"
                                className="w-16 h-16 rounded-full border-2 border-gold-500/50 object-cover shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-105 transition-transform"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full border-2 border-gold-500/50 bg-black/50 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                <span className="text-2xl">👤</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-[0.1em] font-cinzel bg-clip-text text-transparent bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-800 drop-shadow-[0_1px_0_#ffeb3b] drop-shadow-[0_2px_0_#fbc02d] drop-shadow-[0_3px_0_#f57f17] drop-shadow-[0_4px_0_#e65100] drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] filter contrast-150 brightness-110 pb-2 select-none">
                                EMPLOYEE PORTAL
                            </h1>
                            <p className="text-gold-500/80 font-bold tracking-wider text-xs md:text-sm mt-1">
                                WELCOME BACK, <span className="text-foreground text-glow uppercase">{user?.name || "COMMANDER"}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Notification Badge */}
                        <div className="relative cursor-pointer hover:scale-110 transition-transform p-2 rounded-full hover:bg-white/5 active:scale-95" onClick={() => setActiveTab('overview')}>
                            <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🔔</span>
                            {notifications.some(n => !n.isRead) && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                            )}
                            {notifications.some(n => !n.isRead) && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-black shadow-[0_0_10px_red]"></span>
                            )}
                        </div>

                        <button onClick={handleLogout} className="btn-3d px-6 py-2 rounded-xl text-xs tracking-widest font-bold text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400">
                            LOGOUT
                        </button>
                    </div>
                </header>

                {/* Notifications Alert */}
                {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                    <div className="mb-6 space-y-2">
                        {notifications.filter(n => !n.isRead).map(n => {
                            const isSuccess = n.type === 'SUCCESS' || n.title.includes('Approved');
                            return (
                                <div key={n.id} className={`relative p-4 rounded-lg flex items-start gap-4 animate-in fade-in slide-in-from-top-2 group border ${isSuccess
                                    ? 'bg-green-500/10 border-green-500/50'
                                    : 'bg-red-500/10 border-red-500/50'
                                    }`}>
                                    <span className="text-xl">{isSuccess ? '🎉' : '⚠️'}</span>
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-sm tracking-wide ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>{n.title}</h3>
                                        <p className="text-muted-foreground text-sm mt-1">{n.message}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(n.id)}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${isSuccess
                                            ? 'text-green-400 hover:text-green-200 hover:bg-green-500/20'
                                            : 'text-red-400 hover:text-red-200 hover:bg-red-500/20'
                                            }`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="hidden md:flex flex-wrap gap-3 mb-12 justify-center perspective-[1000px]">
                    {['overview', 'tasks', 'mailbox', 'attendance', 'leaves', 'documents', 'submissions', 'earn', 'meetings', 'profile', 'theme'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-8 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 transform preserve-3d active:scale-95 ${activeTab === tab
                                ? '!bg-gradient-to-r !from-[#FFD700] !to-[#FFA000] !text-black shadow-[0_10px_20px_-5px_rgba(234,179,8,0.5)] -translate-y-1'
                                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-200 hover:-translate-y-1 hover:border-gold-500/30 hover:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)]'
                                }`}
                        >
                            {tab.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Content Area with bottom padding for mobile nav */}
                <div className="mb-24 md:mb-0">
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card
                                    title="Attendance"
                                    value={attendanceStats ? `${attendanceStats.percentage}%` : "Loading..."}
                                    onClick={() => setActiveTab('attendance')}
                                />
                                <Card
                                    title="Tasks"
                                    value={`${pendingTasksCount} Pending`}
                                    onClick={() => setActiveTab('tasks')}
                                />
                                <Card title="Performance" value="Excellent" />
                            </div>
                            {/* Leave Balances Widget */}
                            <LeaveBalanceWidget userId={user?.id || ""} />

                            <FinancialSection userId={user?.id || ""} />
                            <DailyUpdatesSection />
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && user && <TasksSection userId={(user as any).id} tasks={tasks} onRefresh={fetchTasks} />}
                    {activeTab === 'mailbox' && user && <MailboxSection userId={(user as any).id} />}
                    {activeTab === 'attendance' && user && <AttendanceSection userId={(user as any).id} />}
                    {activeTab === 'leaves' && user && <LeaveSection userId={(user as any).id} />}
                    {activeTab === 'documents' && user && <DocumentsSection userId={(user as any).id} createdAt={user.createdAt} />}
                    {activeTab === 'submissions' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <StudentSubmissionsPage />
                        </motion.div>
                    )}
                    {activeTab === 'earn' && user && <ReferralSection userId={(user as any).id} />}
                    {activeTab === 'meetings' && user && <MeetingSection userId={(user as any).id} userName={(user as any).name} />}
                    {activeTab === 'profile' && user && <ProfileSection userId={(user as any).id} />}
                    {activeTab === 'theme' && <ThemeSelector />}
                </div>

                {/* Draggable AI Button (Overlay) */}
                <DraggableAIButton />

                {/* Mobile Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 w-full bg-card border-t border-theme p-4 flex justify-between items-center md:hidden z-50 safe-area-bottom">
                    <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Home size={20} />} label="Home" />
                    <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Calendar size={20} />} label="Attend" />
                    <NavButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} icon={<ClipboardList size={20} />} label="Tasks" />
                    <NavButton active={activeTab === 'mailbox'} onClick={() => setActiveTab('mailbox')} icon={<MessageCircle size={20} />} label="Mail" />
                    <NavButton active={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} icon={<Video size={20} />} label="Meet" />
                    <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<span className="text-xl">👤</span>} label="Profile" />
                    <NavButton active={activeTab === 'theme'} onClick={() => setActiveTab('theme')} icon={<Palette size={20} />} label="Theme" />
                </div>
            </div>
        </>
    );
}





function DocumentsSection({ userId, createdAt }: { userId: string, createdAt?: string }) {
    const router = useRouter();
    const [slips, setSlips] = useState<any[]>([]);
    const [selectedSlip, setSelectedSlip] = useState<any>(null);
    const slipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userId) {
            fetch(`/api/employee/documents/salary-slips?userId=${userId}`).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setSlips(data);
            });
        }
    }, [userId]);

    const handleDownload = async () => {
        if (!slipRef.current || !selectedSlip) return;
        try {
            const dataUrl = await toPng(slipRef.current, { quality: 1.0, pixelRatio: 3 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SalarySlip_${selectedSlip.month}_${selectedSlip.year}.pdf`);
        } catch (e) {
            console.error("PDF Gen Error", e);
            alert("Failed to download PDF");
        }
    };

    // 75-Day Lock Logic
    const isCertificateUnlocked = () => {
        if (!createdAt) return false;
        const joinDate = new Date(createdAt);
        const today = new Date();
        const diffTime = today.getTime() - joinDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 75;
    };

    const unlocked = isCertificateUnlocked();

    // Map DB slip to Template format
    const getTemplateData = (slip: any) => ({
        month: slip.month,
        year: slip.year,
        employeeName: slip.user?.name || "Employee",
        designation: "Software Engineer",
        employeeId: "EMP-" + (slip.user?.mobile ? slip.user.mobile.slice(-4) : "XXXX"),
        joiningDate: slip.user?.createdAt ? new Date(slip.user.createdAt).toLocaleDateString() : "-",
        bankName: slip.bankName,
        bankBranch: slip.bankBranch,
        ifscCode: slip.ifscCode,
        accountNumber: slip.accountNumber,
        panNumber: slip.panNumber,
        basicSalary: slip.basicSalary,
        hra: slip.hra,
        specialAllowance: slip.special,
        conveyance: slip.conveyance,
        medical: slip.medical,
        bonus: slip.bonus,
        pf: slip.pf,
        professionalTax: slip.professionalTax,
        tds: slip.tds,
        loan: slip.loan,
        otherDeductions: slip.otherDeductions
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground">My Documents</h2>

            {/* 1. MAIN DOCUMENTS */}
            <div className="grid md:grid-cols-3 gap-6">
                <div
                    onClick={() => router.push('/dashboard/student/joining-letter')}
                    className="glass-card-3d p-6 cursor-pointer hover:border-gold-500 hover:bg-white/5 transition-all group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            📄
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Joining Letter</h3>
                            <p className="text-xs text-gold-theme">Official Employment Offer</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">View and download your official joining letter.</p>
                </div>

                {/* Experience Certificate */}
                <div
                    onClick={() => {
                        if (unlocked) {
                            router.push(`/dashboard/student/certificate?userId=${userId}`);
                        } else {
                            alert("Please wait for 75 days from joining to unlock your Experience Certificate. Keep up the good work!");
                        }
                    }}
                    className={`glass-card-3d p-6 transition-all group relative overflow-hidden ${unlocked ? 'cursor-pointer hover:border-gold-500 hover:bg-white/5 opacity-100' : 'opacity-60 cursor-not-allowed'}`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${unlocked ? 'bg-gold-500/10 text-gold-500' : 'bg-white/5 text-gray-500'}`}>
                            {unlocked ? '🎓' : '🔒'}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${unlocked ? 'text-foreground' : 'text-gray-500'}`}>Experience Certificate</h3>
                            <p className="text-xs text-gray-600">{unlocked ? 'Ready for Download' : 'Locked'}</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {unlocked ? "Your completion certificate is ready." : "Available after 75 days of tenure."}
                    </p>

                    {!unlocked && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                            Wait 75 Days
                        </div>
                    )}
                </div>
            </div>

            {/* 2. SALARY SLIPS SECTION */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    💰 Salary Slips
                </h3>
                {slips.length === 0 ? (
                    <div className="bg-card border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500">
                        No salary slips generated yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slips.map((slip) => (
                            <div key={slip.id} className="bg-card border border-gray-800 rounded-lg p-4 hover:border-gold-500/50 transition-colors flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-foreground text-lg">{slip.month} {slip.year}</p>
                                    <p className="text-xs text-green-500 font-mono mt-1">
                                        Net Pay: ₹{((slip.basicSalary + slip.hra + slip.special + slip.conveyance + slip.medical + slip.bonus) - (slip.pf + slip.professionalTax + slip.tds + slip.loan + slip.otherDeductions)).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedSlip(slip)}
                                    className="px-3 py-1.5 bg-gold-500/10 text-gold-500 border border-gold-500/30 rounded text-xs font-bold hover:bg-gold-500 hover:text-black transition-all"
                                >
                                    VIEW
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PREVIEW MODAL */}
            {selectedSlip && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-theme rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-card">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                📄 Salary Slip: {selectedSlip.month} {selectedSlip.year}
                            </h3>
                            <button onClick={() => setSelectedSlip(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-auto bg-gray-900 p-8 flex justify-center">
                            <div className="bg-white shadow-2xl transform scale-90 origin-top">
                                {/* @ts-ignore */}
                                <SalarySlipTemplate ref={slipRef} data={getTemplateData(selectedSlip)} />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-700 bg-card flex justify-center gap-4">
                            <button
                                onClick={handleDownload}
                                className="px-6 py-2 bg-gold-500 text-black font-bold rounded hover:bg-gold-400 transition-colors flex items-center gap-2"
                            >
                                <span>⬇</span> Download PDF
                            </button>
                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="px-6 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </motion.div>
    );
}

// Dummy export to keep file structure if needed, or ensuring I replaced the function correctly.
// The replace tool works on line ranges, so I am just replacing the DocumentsSection function body and adding imports above it if possible.
// Wait, 'imports' in the middle of file in TSX is valid but messy. 
// I should check if I can add imports at top. But replace_file_content is better for blocks.
// I will just put require/imports at top if I can, or use dynamic imports?
// Dynamic imports for 'html-to-image' and 'jspdf' might be safer to avoid heavy load on main bundle.
// But standard imports are fine. I'll put them above the function.


function AttendanceSection({ userId }: { userId: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
        fetchTodayStatus();
        fetchStats();
    }, [userId]);

    const fetchStats = () => {
        fetch(`/api/user/attendance?userId=${userId}&type=stats`, { headers: { ...getAuthHeader() } })
            .then(res => res.json())
            .then(data => {
                if (data.percentage !== undefined) setStats(data);
            });
    };

    const fetchHistory = () => {
        fetch(`/api/user/attendance?userId=${userId}&type=history`, { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => {
            setHistory(data);
        });
    };

    const fetchTodayStatus = () => {
        // Fetch strictly for today to determine button state
        fetch(`/api/user/attendance?userId=${userId}`, { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => {
            setTodayRecord(data);
        });
    };

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                fetchTodayStatus();
                fetchStats(); // Update stats
                fetchHistory();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/attendance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                fetchTodayStatus();
                fetchStats(); // Update stats
                fetchHistory();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Attendance Management</h2>
                {stats && (
                    <div className="bg-card border border-gold-500/30 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-bold">{stats.month} Attendance</p>
                            <p className="text-xl font-black text-gold-500">{stats.percentage}%</p>
                        </div>
                        {/* Circular Indicator */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gold-500"
                                    strokeDasharray={100}
                                    strokeDashoffset={100 - stats.percentage}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Card */}
            {/* Action Card */}
            <div className="glass-card-3d p-8 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Today's Status</h3>

                {!todayRecord ? (
                    <button
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="w-64 h-64 rounded-full bg-green-500/10 border-4 border-green-500 text-green-500 text-2xl font-bold flex flex-col items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)]"
                    >
                        <span>👆</span>
                        <span className="mt-2">CHECK IN</span>
                    </button>
                ) : !todayRecord.logoutTime ? (
                    <div className="space-y-4">
                        <div className="text-foreground text-lg mb-2">
                            Checked In at <span className="font-mono text-gold-500">{new Date(todayRecord.loginTime).toLocaleTimeString()}</span>
                        </div>
                        <button
                            onClick={handleCheckOut}
                            disabled={loading}
                            className="w-64 h-64 rounded-full bg-red-500/10 border-4 border-red-500 text-red-500 text-2xl font-bold flex flex-col items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)]"
                        >
                            <span>🛑</span>
                            <span className="mt-2">CHECK OUT</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center text-3xl mb-2">✅</div>
                        <h4 className="text-xl font-bold text-foreground">Day Complete</h4>
                        <p className="text-gray-400">
                            {new Date(todayRecord.loginTime).toLocaleTimeString()} - {new Date(todayRecord.logoutTime).toLocaleTimeString()}
                        </p>
                        <span className="text-xs text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded bg-yellow-500/10">Pending Approval</span>

                        {/* Correction Feature */}
                        <div className="mt-4 pt-4 border-t border-gray-800 w-full flex flex-col items-center">
                            <p className="text-[10px] text-gray-500 mb-2 max-w-[200px] leading-tight">
                                Mistakenly checked out? You can resume your day (Limit: 4 times/month).
                            </p>
                            <button
                                onClick={async () => {
                                    if (!confirm("Did you check out by mistake? This will resume your session.")) return;
                                    setLoading(true);
                                    try {
                                        const res = await fetch('/api/user/attendance', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                                            body: JSON.stringify({ userId, action: 'correct' })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            alert("Session Resumed!");
                                            fetchTodayStatus();
                                            fetchHistory();
                                            fetchStats();
                                        } else {
                                            alert(data.message || "Failed to resume session");
                                        }
                                    } catch (e) { alert("Error"); }
                                    finally { setLoading(false); }
                                }}
                                disabled={loading}
                                className="text-xs text-gold-500 hover:text-gold-400 underline decoration-dotted"
                            >
                                Resume Day
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Policy Note - Themed to match Admin Dashboard */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-xl p-6 shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-[#FFF5C3] via-[#FDB931] to-[#9F6900]">
                    ℹ️ Attendance Policy & Correction
                </h4>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent mb-4"></div>
                <ul className="space-y-3 text-xs text-gray-400 font-medium tracking-wide">
                    <li className="flex gap-3 items-start">
                        <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                        <span>
                            <strong className="text-gray-200">Mistaken Checkout:</strong> If you accidentally click "Check Out", you can use the <span className="text-yellow-400 font-bold border-b border-yellow-500/30 pb-0.5">Resume Day</span> option to continue your session.
                        </span>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                        <span>
                            <strong className="text-gray-200">Monthly Limit:</strong> You are allowed a maximum of <strong className="text-white border border-white/20 px-1 rounded bg-white/5">4 corrections per month</strong>. Once exceeded, you cannot resume.
                        </span>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                        <span>
                            <strong className="text-gray-200">Late Mark:</strong> Check-in after 10:45 AM is marked as <span className="text-yellow-500 font-bold">LATE</span>. 3 Late marks = 1 Absent.
                        </span>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                        <span>
                            <strong className="text-gray-200">Minimum Hours:</strong> You must complete at least 4 hours to avoid being marked <span className="text-red-500 font-bold">ABSENT</span>.
                        </span>
                    </li>
                </ul>
            </div>

            <h2 className="text-2xl font-bold text-foreground mt-4">History</h2>
            <div className="bg-card border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-white/5 text-gold-500">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">In Time</th>
                            <th className="p-4">Out Time</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {history.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records found.</td></tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record.id} className="hover:bg-white/5">
                                    <td className="p-4 text-foreground font-mono">{record.date}</td>
                                    <td className="p-4 text-gray-300">{new Date(record.loginTime).toLocaleTimeString()}</td>
                                    <td className="p-4 text-gray-300">
                                        {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString() : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${record.status === 'APPROVED' ? 'text-green-500 border-green-500 bg-green-500/10' :
                                            record.status === 'REJECTED' ? 'text-red-500 border-red-500 bg-red-500/10' :
                                                'text-yellow-500 border-yellow-500 bg-yellow-500/10'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm italic">{record.adminRemarks || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

function LeaveSection({ userId }: { userId: string }) {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [balance, setBalance] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('CL');
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDaySession, setHalfDaySession] = useState('1'); // '1' or '2'
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchLeaves();
            fetchBalance();
        }
    }, [userId]);

    const fetchLeaves = () => {
        fetch(`/api/user/leaves?userId=${userId}`, { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => setLeaves(data));
    };

    const fetchBalance = () => {
        fetch(`/api/user/leave-balance?userId=${userId}`, { headers: { ...getAuthHeader() } })
            .then(res => res.json())
            .then(data => setBalance(data))
            .catch(e => console.error(e));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Append _HALF_1 or _HALF_2 to type if selected (Logic preserved for now, but API mainly needs isHalfDay)
            const finalType = isHalfDay ? `${type}_HALF_${halfDaySession}` : type;
            const finalEndDate = isHalfDay ? startDate : endDate;

            const res = await fetch('/api/user/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    userId,
                    startDate,
                    endDate: finalEndDate,
                    type: finalType,
                    reason,
                    isHalfDay // Explicitly sending this now
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStartDate(''); setEndDate(''); setReason('');
                fetchLeaves();
                alert("Leave application submitted successfully!");
            } else {
                alert(`Error submitting leave: ${data.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error submitting leave");
        }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-8">
            {/* Leave Balances */}
            {balance && (
                <div className="grid grid-cols-3 gap-6">
                    <div className="glass-card-3d p-6 text-center border-l-4 border-gold-500">
                        <span className="text-4xl font-bold text-gold-500 block text-glow">{balance.cl}</span>
                        <span className="text-xs uppercase tracking-widest text-gray-400">Casual Leave</span>
                    </div>
                    <div className="glass-card-3d p-6 text-center border-l-4 border-blue-500">
                        <span className="text-4xl font-bold text-blue-400 block text-glow">{balance.sl}</span>
                        <span className="text-xs uppercase tracking-widest text-gray-400">Sick Leave</span>
                    </div>
                    <div className="glass-card-3d p-6 text-center border-l-4 border-green-500">
                        <span className="text-4xl font-bold text-green-400 block text-glow">{balance.pl}</span>
                        <span className="text-xs uppercase tracking-widest text-gray-400">Privilege Leave</span>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <div className="glass-card-3d p-6">
                        <h3 className="text-xl font-bold text-foreground mb-6">Apply for Leave</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">From</label>
                                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-card border border-gray-700 rounded p-2 text-foreground outline-none focus:border-gold-500" />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">To</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        disabled={isHalfDay}
                                        className={`w-full bg-card border border-gray-700 rounded p-2 text-foreground outline-none focus:border-gold-500 ${isHalfDay ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gold-500/80 uppercase font-bold tracking-wider">Leave Type</label>
                                <div className="flex gap-4">
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        className="flex-1 bg-card border border-gold-500/30 rounded p-2 text-foreground outline-none focus:border-gold-500"
                                    >
                                        <option value="CL">Casual Leave (CL)</option>
                                        <option value="SL">Sick Leave (SL)</option>
                                        <option value="LWP">Leave Without Pay (LWP)</option>
                                    </select>
                                    <div className="flex items-center gap-2 bg-card border border-gray-700 px-3 rounded">
                                        <input
                                            type="checkbox"
                                            id="halfDay"
                                            checked={isHalfDay}
                                            onChange={e => {
                                                setIsHalfDay(e.target.checked);
                                                if (e.target.checked && startDate) setEndDate(startDate);
                                            }}
                                            className="accent-gold-500 w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor="halfDay" className="text-sm text-gray-300 cursor-pointer select-none">Half Day</label>
                                    </div>
                                </div>

                                {isHalfDay && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${halfDaySession === '1' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-card border-gray-700 text-gray-400'}`}>
                                            <input type="radio" name="halfDaySession" value="1" checked={halfDaySession === '1'} onChange={() => setHalfDaySession('1')} className="hidden" />
                                            <span className="font-bold text-sm">1st Half</span>
                                            <span className="text-[10px] opacity-70">10:30 AM - 01:00 PM</span>
                                        </label>
                                        <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${halfDaySession === '2' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-card border-gray-700 text-gray-400'}`}>
                                            <input type="radio" name="halfDaySession" value="2" checked={halfDaySession === '2'} onChange={() => setHalfDaySession('2')} className="hidden" />
                                            <span className="font-bold text-sm">2nd Half</span>
                                            <span className="text-[10px] opacity-70">01:30 PM - 04:00 PM</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Reason</label>
                                <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-card border border-gray-700 rounded p-2 text-foreground h-24 resize-none outline-none focus:border-gold-500" placeholder="Reason for leave..."></textarea>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-gold-500 text-obsidian font-bold py-2 rounded hover:bg-gold-400 transition-colors">
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </motion.div>

                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h3 className="text-xl font-bold text-foreground mb-6">Leave History</h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {leaves.map(leave => (
                            <div key={leave.id} className="bg-card border border-gray-800 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-foreground font-bold text-sm tracking-wide">{leave.startDate} <span className="text-gray-500 font-normal">to</span> {leave.endDate}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${leave.status === 'APPROVED' ? 'text-green-500 border-green-500' :
                                        leave.status === 'REJECTED' ? 'text-red-500 border-red-500' :
                                            'text-yellow-500 border-yellow-500'
                                        }`}>{leave.status}</span>
                                </div>
                                <div className="mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${leave.type === 'SL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        {leave.type || 'CL'}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs italic">"{leave.reason}"</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function FinancialSection({ userId }: { userId: string }) {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;
        fetch(`/api/admin/invoices?user=${userId}`, { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => {
            if (data.invoices) setInvoices(data.invoices);
        });
    }, [userId]);

    return (
        <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="glass-card-3d p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    💰 Financial Status
                </h3>
                {invoices.length === 0 ? (
                    <p className="text-gray-500">No invoices found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="text-xs text-gold-500 uppercase border-b border-gray-700">
                                <tr>
                                    <th className="py-2">Invoice #</th>
                                    <th className="py-2">Date</th>
                                    <th className="py-2 text-right">Amount</th>
                                    <th className="py-2 text-right">Due</th>
                                    <th className="py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {invoices.map((inv) => {
                                    const dueAmt = (inv.total || 0) - (inv.paidAmount || 0);
                                    const dueDate = new Date(inv.dueDate);
                                    const today = new Date();
                                    const diffTime = (dueDate instanceof Date && !isNaN(dueDate.getTime())) ? (today.getTime() - dueDate.getTime()) : 0;
                                    const daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                                    const lateFee = daysLate * 100;
                                    const totalPayable = dueAmt + lateFee;

                                    return (
                                        <tr key={inv.id} className="hover:bg-white/5 cursor-pointer" onClick={() => window.open(`/invoice/${inv.id}`, '_blank')}>
                                            <td className="py-3 font-mono text-gold-200">{inv.invoiceNumber}</td>
                                            <td className="py-3 text-gray-400">
                                                {dueDate instanceof Date && !isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="py-3 text-right">₹{(inv.total || 0).toLocaleString()}</td>
                                            <td className="py-3 text-right font-bold text-foreground">
                                                ₹{totalPayable.toLocaleString()}
                                                {daysLate > 0 && <span className="block text-[10px] text-red-500">Includes ₹{lateFee} Late Fee ({daysLate} Days)</span>}
                                            </td>
                                            <td className="py-3 text-center">
                                                {totalPayable <= 0 ? (
                                                    <span className="text-green-500 font-bold text-[10px] border border-green-500 rounded px-2 py-1">PAID</span>
                                                ) : daysLate > 0 ? (
                                                    <span className="text-red-500 font-bold text-[10px] border border-red-500 rounded px-2 py-1 animate-pulse">OVERDUE</span>
                                                ) : (
                                                    <span className="text-yellow-500 font-bold text-[10px] border border-yellow-500 rounded px-2 py-1">PENDING</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function LeaveBalanceWidget({ userId }: { userId: string }) {
    const [balance, setBalance] = useState<any>(null);
    const [leaves, setLeaves] = useState<any[]>([]); // All leaves history
    const [selectedType, setSelectedType] = useState<string | null>(null); // 'CL', 'SL', 'PL'

    useEffect(() => {
        if (!userId) return;
        // Fetch Balance
        fetch(`/api/user/leave-balance?userId=${userId}`, { headers: { ...getAuthHeader() } })
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Balance fetch failed (${res.status}): ${text}`);
                }
                return res.json();
            })
            .then(data => setBalance(data))
            .catch(e => console.error("Balance Error:", e));

        // Fetch History for modal
        fetch(`/api/user/leaves?userId=${userId}`, { headers: { ...getAuthHeader() } })
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Leaves fetch failed (${res.status}): ${text}`);
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setLeaves(data);
                } else {
                    console.error("Invalid leaves data format (expected array):", data);
                    setLeaves([]);
                }
            })
            .catch(e => {
                console.error("Leaves History Error:", e);
                setLeaves([]);
            });
    }, [userId]);

    if (!balance) return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                🏝️ Leave Balance
                <span className="text-xs font-normal text-muted-foreground ml-2 animate-pulse">Loading...</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse border border-white/10" />
                ))}
            </div>
        </div>
    );

    const filteredLeaves = selectedType ? leaves.filter(l => l.type.startsWith(selectedType)) : [];

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                🏝️ Leave Balance
            </h3>
            <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div
                    onClick={() => setSelectedType('CL')}
                    className="glass-card-3d p-4 flex flex-col items-center justify-center border-l-4 border-gold-500 min-h-[100px] hover:bg-gold-500/10 transition-colors cursor-pointer group active:scale-95"
                >
                    <span className="text-3xl font-bold text-gold-500 block mb-1 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform">{balance?.cl ?? 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-gold-200">Casual Leave</span>
                    <span className="text-[8px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View History</span>
                </div>
                <div
                    onClick={() => setSelectedType('SL')}
                    className="glass-card-3d p-4 flex flex-col items-center justify-center border-l-4 border-blue-500 min-h-[100px] hover:bg-blue-500/10 transition-colors cursor-pointer group active:scale-95"
                >
                    <span className="text-3xl font-bold text-blue-400 block mb-1 filter drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">{balance?.sl ?? 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-blue-200">Sick Leave</span>
                    <span className="text-[8px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View History</span>
                </div>
                <div
                    onClick={() => setSelectedType('PL')}
                    className="glass-card-3d p-4 flex flex-col items-center justify-center border-l-4 border-green-500 min-h-[100px] hover:bg-green-500/10 transition-colors cursor-pointer group active:scale-95"
                >
                    <span className="text-3xl font-bold text-green-400 block mb-1 filter drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] group-hover:scale-110 transition-transform">{balance?.pl ?? 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-green-200">Privilege Leave</span>
                    <span className="text-[8px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View History</span>
                </div>
            </div>

            {/* History Modal */}
            {selectedType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-theme rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-card">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                📜 {selectedType} History
                            </h3>
                            <button onClick={() => setSelectedType(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {/* List */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-neutral-950/50">
                            {filteredLeaves.length === 0 ? (
                                <p className="text-gray-500 text-center italic py-8">No history found for {selectedType}.</p>
                            ) : (
                                filteredLeaves.map((leave, idx) => (
                                    <div key={leave.id || idx} className="bg-card border border-white/5 rounded-lg p-3 hover:border-gold-500/30 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-sm font-bold text-foreground">
                                                {leave.startDate}
                                                {leave.startDate !== leave.endDate && <span className="text-gray-500 font-normal"> to {leave.endDate}</span>}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${leave.status === 'APPROVED' ? 'text-green-500 border-green-500/50 bg-green-500/10 animate-[pulse_2s_infinite]' :
                                                leave.status === 'REJECTED' ? 'text-red-500 border-red-500/50 bg-red-500/10 animate-[pulse_2s_infinite]' :
                                                    'text-yellow-500 border-yellow-500/50 bg-yellow-500/10'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        {leave.reason && (
                                            <p className="text-xs text-gray-400 italic mb-2">"{leave.reason}"</p>
                                        )}
                                        {leave.managerRemarks && (
                                            <div className="text-[10px] bg-white/5 p-2 rounded border border-white/5 mt-2">
                                                <span className="text-gold-500 font-bold mr-1">Admin:</span>
                                                <span className="text-gray-300">{leave.managerRemarks}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 bg-card text-center">
                            <button
                                onClick={() => setSelectedType(null)}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded text-xs transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Card({ title, value, onClick }: { title: string, value: string, onClick?: () => void }) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, rotateX: 5 }}
            className={`glass-card-3d p-6 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <TejasKPLogo size={40} className="text-gold-500" />
            </div>
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-bold">{title}</h3>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </motion.div>
    )
}

function DailyUpdatesSection() {
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/announcements', { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => {
            if (data.success) setUpdates(data.announcements);
        });
    }, []);

    return (
        <div className="mt-8 bg-card border border-theme rounded-xl p-6 min-h-[300px]">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📢</span>
                <h3 className="text-xl font-bold text-foreground">Daily Updates</h3>
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>

            <div className="space-y-4">
                {updates.length === 0 ? (
                    <p className="text-gray-500 italic">No updates for today.</p>
                ) : (
                    updates.map(update => (
                        <div key={update.id} className="bg-card border border-gold-500/30 p-4 rounded-lg hover:border-gold-500 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gold-400 text-lg">{update.title}</h4>
                                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">
                                    {update.createdAt && !isNaN(new Date(update.createdAt).getTime()) ? new Date(update.createdAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {update.content}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function TasksSection({ userId, tasks, onRefresh }: { userId: string; tasks: any[]; onRefresh: () => void }) {
    const [filter, setFilter] = useState('ALL'); // ALL, TODO, IN_PROGRESS, REVIEW, DONE
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [comment, setComment] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");

    const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

    const handleUpdateTask = async (taskId: string, status: string) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/user/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    taskId,
                    status,
                    userId,
                    comment: comment || undefined,
                    fileUrl: fileUrl || undefined,
                    fileName: fileName || undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                onRefresh();
                setSelectedTask(null);
                setComment("");
                setFileUrl("");
                setFileName("");
            }
        } catch (e) {
            console.error("Update failed", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">TASK MANAGEMENT</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Assigned Projects & Duties</p>
                </div>
                <div className="flex gap-2 bg-card p-1 rounded-xl border border-muted">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${filter === f ? 'bg-gold-500 text-black' : 'hover:bg-muted'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-panel rounded-2xl border-dashed border-2 border-muted">
                        <p className="text-muted-foreground font-orbitron tracking-widest">NO TASKS FOUND IN THIS SECTOR</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <motion.div
                            key={task.id}
                            whileHover={{ y: -5 }}
                            className="glass-card-3d p-6 relative group cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${task.priority === 'HIGH' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                    task.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                        'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                    }`}>
                                    {task.priority} PRIORITY
                                </span>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${task.status === 'DONE' ? 'bg-green-500/20 text-green-500' :
                                    task.status === 'REVIEW' ? 'bg-purple-500/20 text-purple-500' :
                                        'bg-gold-500/20 text-gold-500'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-gold-500 transition-colors">{task.title}</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{task.description}</p>
                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground border-t border-muted pt-4">
                                <span>PROJECT: {task.projectName || 'GENERAL'}</span>
                                <span>DEADLINE: {task.deadline || 'N/A'}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-card border border-gold-500/30 w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                    >
                        <div className="p-6 border-b border-muted flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{selectedTask.title}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedTask.projectName || 'No Project'}</p>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
                            <section>
                                <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-2">Description</h4>
                                <p className="text-gray-100 leading-relaxed whitespace-pre-wrap text-sm">{selectedTask.description}</p>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-2">Priority</h4>
                                    <p className="font-bold text-gray-100">{selectedTask.priority}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-2">Deadline</h4>
                                    <p className="font-bold text-gray-100">{selectedTask.deadline || 'Flexible'}</p>
                                </div>
                            </div>

                            <section>
                                <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-4">Submission & Status</h4>
                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <textarea
                                        placeholder="Add comments or notes for your submission..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-gold-500 outline-none transition-all h-24"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    ></textarea>
                                    <input
                                        type="text"
                                        placeholder="File link or name (e.g., GitHub PR, Google Drive)"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-gold-500 outline-none transition-all"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                    />
                                </div>
                            </section>

                            <section>
                                <h4 className="text-xs font-black text-gold-500 uppercase tracking-widest mb-4">Task History</h4>
                                <div className="space-y-4">
                                    {selectedTask.history?.map((h: any) => (
                                        <div key={h.id} className="flex gap-4 items-start pb-4 border-b border-muted/50 last:border-0 border-dashed">
                                            <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">{h.change}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(h.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-muted flex gap-4">
                            {selectedTask.status === 'TODO' && (
                                <button
                                    disabled={submitting}
                                    onClick={() => handleUpdateTask(selectedTask.id, 'IN_PROGRESS')}
                                    className="flex-1 bg-gold-500 text-black font-black py-3 rounded-xl hover:bg-gold-400 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    START TASK
                                </button>
                            )}
                            {selectedTask.status === 'IN_PROGRESS' && (
                                <button
                                    disabled={submitting}
                                    onClick={() => handleUpdateTask(selectedTask.id, 'REVIEW')}
                                    className="flex-1 bg-purple-600 text-white font-black py-3 rounded-xl hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    SUBMIT FOR REVIEW
                                </button>
                            )}
                            {selectedTask.status === 'REVIEW' && (
                                <p className="flex-1 text-center py-3 text-purple-400 font-bold border border-purple-500/30 rounded-xl bg-purple-500/10">
                                    PENDING ADMIN REVIEW
                                </p>
                            )}
                            {selectedTask.status === 'DONE' && (
                                <p className="flex-1 text-center py-3 text-green-400 font-bold border border-green-500/30 rounded-xl bg-green-500/10">
                                    COMPLETED
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

function NavButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-gold-500' : 'text-gray-500'}`}
        >
            {icon}
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    )
}
