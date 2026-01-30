"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Home, Calendar, FileText, ClipboardList, MessageCircle, TrendingUp, Gamepad2, Video, Palette } from "lucide-react";
import StudentSubmissionsPage from "./submissions/page";
import DraggableAIButton from "@/components/common/DraggableAIButton";
import ReferralSection from "@/components/student/ReferralSection";
import MeetingSection from "@/components/common/MeetingSection";
import ThemeSelector from "@/components/common/ThemeSelector";
import TejasKPLogo from "@/components/common/TejasKPLogo";

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

export default function StudentDashboard() {
    const [user, setUser] = useState<{ id: string; name: string; mobile: string; createdAt: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser");
        if (stored) {
            setUser(JSON.parse(stored));
        } else {
            router.push("/login");
        }
    }, [router]);

    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'documents' | 'submissions' | 'earn' | 'meetings' | 'theme'>('overview');

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
        sessionStorage.clear();
        sessionStorage.clear();
        // Force hard reload to login with logout flag to bypass middleware redirects
        window.location.href = "/login?logout=true";
    };

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

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

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans p-8 transition-colors duration-500">
            <header className="flex justify-between items-center mb-8 border-b border-gold-500/20 pb-4">
                <div>
                    <h1 className="text-4xl font-black tracking-[0.1em] font-cinzel bg-clip-text text-transparent bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-800 drop-shadow-[0_1px_0_#ffeb3b] drop-shadow-[0_2px_0_#fbc02d] drop-shadow-[0_3px_0_#f57f17] drop-shadow-[0_4px_0_#e65100] drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] filter contrast-150 brightness-110 pb-2 select-none">
                        STUDENT PORTAL
                    </h1>
                    <p className="text-gold-500/80 font-cinzel text-lg mt-2">Welcome, <span className="text-white font-bold">{user?.name || "Student"}</span></p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Badge */}
                    <div className="relative cursor-pointer hover:scale-110 transition-transform" onClick={() => setActiveTab('overview')}>
                        <span className="text-2xl">🔔</span>
                        {notifications.some(n => !n.isRead) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-theme"></span>
                        )}
                    </div>

                    <button onClick={handleLogout} className="px-4 py-2 border border-theme rounded hover:bg-gold-theme hover:text-black transition-colors text-sm font-bold">LOGOUT</button>
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
                                    <p className="text-gray-300 text-sm mt-1">{n.message}</p>
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

            {/* Desktop Tabs (Hidden on Mobile) */}
            <div className="hidden md:flex gap-4 mb-8">
                {['overview', 'attendance', 'leaves', 'documents', 'submissions', 'earn', 'meetings'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === tab
                            ? 'bg-gold-theme text-black'
                            : 'bg-card text-muted-foreground hover:bg-card/80'
                            }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
                <button
                    onClick={() => router.push('/dashboard/user/chat')}
                    className="px-6 py-2 rounded-full font-bold text-sm transition-all bg-card text-gold-theme border border-theme hover:bg-gold-theme hover:text-black flex items-center gap-2"
                >
                    💬 CHAT
                </button>
                <button
                    onClick={() => router.push('/dashboard/student/ai')}
                    className="px-6 py-2 rounded-full font-bold text-sm transition-all bg-gold-theme text-black border border-gold-theme hover:bg-gold-theme/90 hover:scale-105 flex items-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                >
                    <TejasKPLogo size={20} />
                    TEJASKP AI
                </button>
                <button
                    onClick={() => router.push('/dashboard/student/games')}
                    className="px-6 py-2 rounded-full font-bold text-sm transition-all bg-foreground/5 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white flex items-center gap-2"
                >
                    🎮 GAMES
                </button>
            </div>

            {/* Content Area with bottom padding for mobile nav */}
            <div className="mb-24 md:mb-0">
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card title="Attendance" value="92%" />
                            <Card title="Assignments" value="4 Pending" />
                            <Card title="Grades" value="A+" />
                        </div>
                        <FinancialSection userId={user?.id || ""} />
                        <DailyUpdatesSection />
                    </motion.div>
                )}

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
                {activeTab === 'theme' && <ThemeSelector />}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-card border-t border-theme p-4 flex justify-between items-center md:hidden z-50 safe-area-bottom">
                <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Home size={20} />} label="Home" />
                <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Calendar size={20} />} label="Attend" />
                <NavButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} icon={<ClipboardList size={20} />} label="Tasks" />
                <NavButton active={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} icon={<Video size={20} />} label="Meet" />
                <NavButton active={activeTab === 'earn'} onClick={() => setActiveTab('earn')} icon={<TrendingUp size={20} />} label="Earn" />
                <NavButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={20} />} label="Docs" />
                <NavButton active={activeTab === 'theme'} onClick={() => setActiveTab('theme')} icon={<Palette size={20} />} label="Theme" />
                <button onClick={() => router.push('/dashboard/student/games')} className="flex flex-col items-center gap-1 text-purple-500">
                    <Gamepad2 size={20} />
                    <span className="text-[10px] font-bold">Games</span>
                </button>
                {/* Chat & AI grouped or specialized */}
                <button onClick={() => router.push('/dashboard/student/ai')} className="flex flex-col items-center gap-1 text-gold-500">
                    <TejasKPLogo size={20} />
                    <span className="text-[10px] font-bold">AI</span>
                </button>
            </div>

            {/* Draggable AI Button (Overlay) */}
            <DraggableAIButton />
        </div>
    );
}

function DocumentsSection({ userId, createdAt }: { userId: string, createdAt?: string }) {
    const router = useRouter();

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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">My Documents</h2>
            <div className="grid md:grid-cols-3 gap-6">
                <div
                    onClick={() => router.push('/dashboard/student/joining-letter')}
                    className="bg-card border border-theme rounded-xl p-6 cursor-pointer hover:border-gold-500 hover:bg-foreground/5 transition-all group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            📄
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Joining Letter</h3>
                            <p className="text-xs text-gold-theme">Official Internship Offer</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">View and download your official joining letter and internship details.</p>
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
                    className={`bg-card border border-theme rounded-xl p-6 transition-all group relative overflow-hidden ${unlocked ? 'cursor-pointer hover:border-gold-500 hover:bg-foreground/5 opacity-100' : 'opacity-60 cursor-not-allowed'}`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${unlocked ? 'bg-gold-500/10 text-gold-500' : 'bg-foreground/5 text-gray-500'}`}>
                            {unlocked ? '🎓' : '🔒'}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${unlocked ? 'text-foreground' : 'text-gray-500'}`}>Experience Certificate</h3>
                            <p className="text-xs text-gray-600">{unlocked ? 'Ready for Download' : 'Locked'}</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {unlocked ? "Your internship completion certificate is ready." : "Available after 75 days of internship tenure. Work on your skills!"}
                    </p>

                    {!unlocked && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                            Wait 75 Days
                        </div>
                    )}
                </div>

                {/* NOC Submission */}
                <div
                    onClick={() => router.push('/dashboard/student/noc')}
                    className="bg-card border border-theme rounded-xl p-6 cursor-pointer hover:border-gold-500 hover:bg-foreground/5 transition-all group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            📄
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">NOC Submission</h3>
                            <p className="text-xs text-gold-theme">University / College NOC</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">Upload your No Objection Certificate (NOC) here.</p>
                </div>
            </div>
        </motion.div>
    );
}

function AttendanceSection({ userId }: { userId: string }) {
    // ... existing AttendanceSection code ...
    const [history, setHistory] = useState<any[]>([]);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchTodayStatus();
    }, [userId]);

    const fetchHistory = () => {
        fetch(`/api/admin/attendance?date=`, { headers: { ...getAuthHeader() } }).then(res => res.json()).then(data => {
            const myData = data.filter((d: any) => d.userId === userId);
            setHistory(myData);
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
                fetchHistory();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Attendance Management</h2>

            {/* Action Card */}
            <div className="bg-card border border-theme rounded-xl p-8 flex flex-col items-center justify-center text-center">
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

            {/* Policy Note */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                    ℹ️ Attendance Policy & Correction
                </h4>
                <ul className="space-y-2 text-xs text-gray-400">
                    <li className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>
                            <strong className="text-gray-300">Mistaken Checkout:</strong> If you accidentally click "Check Out", you can use the <span className="text-gold-500">Resume Day</span> option to continue your session.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>
                            <strong className="text-gray-300">Monthly Limit:</strong> You are allowed a maximum of <strong className="text-white">4 corrections per month</strong>. Once exceeded, you cannot resume a checked-out session.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>
                            <strong className="text-gray-300">Late Mark:</strong> Check-in after 10:45 AM is marked as <span className="text-yellow-500">LATE</span>. 3 Late marks = 1 Absent.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>
                            <strong className="text-gray-300">Minimum Hours:</strong> You must complete at least 4 hours to avoid being marked <span className="text-red-500">ABSENT</span>.
                        </span>
                    </li>
                </ul>
            </div>

            <h2 className="text-2xl font-bold text-foreground mt-4">History</h2>
            <div className="bg-card border border-theme rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-foreground/5 text-gold-500">
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
                                <tr key={record.id} className="hover:bg-foreground/5">
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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, [userId]);

    const fetchLeaves = () => {
        fetch(`/api/user/leaves?userId=${userId}`).then(res => res.json()).then(data => setLeaves(data));
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
                alert("Leave application submitted!");
            }
        } catch (e) { alert("Error submitting"); }
        finally { setLoading(false); }
    };

    const completedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'REJECTED').length;
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-green-500">{completedLeaves}</span>
                    <span className="text-xs uppercase text-green-400/80 font-bold tracking-wider">Approved</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-red-500">{rejectedLeaves}</span>
                    <span className="text-xs uppercase text-red-400/80 font-bold tracking-wider">Rejected</span>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-yellow-500">{pendingLeaves}</span>
                    <span className="text-xs uppercase text-yellow-400/80 font-bold tracking-wider">Pending</span>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <div className="bg-card border border-theme rounded-xl p-6">
                        <h3 className="text-xl font-bold text-foreground mb-6">Apply for Leave</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">From</label>
                                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background/50 border border-gray-700 rounded p-2 text-white outline-none focus:border-gold-500" />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">To</label>
                                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background/50 border border-gray-700 rounded p-2 text-white outline-none focus:border-gold-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Reason</label>
                                <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-background/50 border border-gray-700 rounded p-2 text-white h-24 resize-none outline-none focus:border-gold-500" placeholder="Reason for leave..."></textarea>
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
        // Need API to list invoices by user. creating a quick client filter or endpoint logic
        // For MVP, filtering client side if we had a list, but we need an endpoint.
        // Let's assume we create /api/student/invoices?mobile=...
        // For now, mocking the fetch or relying on a new route we need
        fetch(`/api/admin/invoices?user=${userId}`).then(res => res.json()).then(data => {
            /* We need to implement this filtering in a route */
            // To unblock, I'll recommend we just fetch all and filter client side for this demo or update the admin route to filter
            if (data.invoices) setInvoices(data.invoices);
        });
    }, [userId]);

    return (
        <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="bg-card border border-theme rounded-xl p-6">
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
                                    const dueAmt = inv.total - inv.paidAmount;
                                    const dueDate = new Date(inv.dueDate);
                                    const today = new Date();
                                    const daysLate = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                                    const lateFee = daysLate * 100;
                                    const totalPayable = dueAmt + lateFee;

                                    return (
                                        <tr key={inv.id} className="hover:bg-foreground/5 cursor-pointer" onClick={() => window.open(`/invoice/${inv.id}`, '_blank')}>
                                            <td className="py-3 font-mono text-gold-200">{inv.invoiceNumber}</td>
                                            <td className="py-3 text-gray-400">{dueDate.toLocaleDateString()}</td>
                                            <td className="py-3 text-right">₹{inv.total.toLocaleString()}</td>
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

function Card({ title, value }: { title: string, value: string }) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-theme p-6 rounded-xl">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">{title}</h3>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </motion.div>
    )
}

function DailyUpdatesSection() {
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/announcements').then(res => res.json()).then(data => {
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
                        <div key={update.id} className="bg-background/50 border border-gold-500/30 p-4 rounded-lg hover:border-gold-500 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gold-400 text-lg">{update.title}</h4>
                                <span className="text-[10px] text-gray-500 bg-foreground/5 px-2 py-1 rounded">
                                    {new Date(update.createdAt).toLocaleDateString()}
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
