"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    Activity,
    DollarSign,
    Clock,
    ShieldCheck,
    MessageCircle,
    QrCode,
    Smartphone,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    ChevronRight,
    Terminal,
    Copy,
    Check,
    Server
} from "lucide-react";

export default function AdminDashboard() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({
        revenue: 0,
        users: 0,
        pendingAmount: 0,
        activeSessions: 0,
        revenueGrowth: "---",
        usersGrowth: "---",
        graph: [] as number[]
    });
    const [userRole, setUserRole] = useState<string>("ADMIN");
    const [pairingMobile, setPairingMobile] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState<{
        isReady: boolean;
        qrCode: string | null;
        pairingCode: string | null;
        cooldownUntil: number;
        initError: string | null;
        logs: string[];
    }>({
        isReady: false,
        qrCode: null,
        pairingCode: null,
        cooldownUntil: 0,
        initError: null,
        logs: []
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout;

        const fetchStats = async () => {
            try {
                // Fetch Main Stats
                const res = await fetch(`/api/admin/dashboard/stats?year=${year}`, {
                    signal: controller.signal,
                    cache: 'no-store'
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();
                if (data.success && isMounted) {
                    setStats(data.stats);
                }

                // Fetch WhatsApp Background Service Status
                const waRes = await fetch('/api/admin/whatsapp/status', {
                    signal: controller.signal,
                    cache: 'no-store'
                });
                if (waRes.ok) {
                    const waData = await waRes.json();
                    if (isMounted && !waData.error) {
                        setWhatsappStatus({
                            isReady: waData.isReady,
                            qrCode: waData.qrCode,
                            pairingCode: waData.pairingCode,
                            cooldownUntil: waData.cooldownUntil || 0,
                            initError: waData.initError || null,
                            logs: waData.logs || []
                        });
                    }
                }

            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("Failed to load dashboard stats", error);
                }
            } finally {
                if (isMounted) {
                    timeoutId = setTimeout(fetchStats, 20000);
                }
            }
        };

        fetchStats();

        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "ADMIN");
            }
        } catch (e) {
            console.error(e);
        }

        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [year]);

    const handleRequestPairing = async () => {
        if (!pairingMobile) return alert("Enter mobile number with country code (e.g. 919876543210)");
        try {
            const res = await fetch("/api/admin/whatsapp/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: pairingMobile })
            });
            if (res.ok) {
                const data = await res.json();
                setWhatsappStatus(prev => ({ ...prev, pairingCode: data.pairingCode }));
                alert("Pairing code requested! Please wait a few seconds.");
            } else {
                const err = await res.json();
                alert(err.message || err.error || "Failed to generate code");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error");
        }
    };

    const handleClearWhatsApp = async () => {
        if (!confirm("This will FORCE RESTART the WhatsApp server and clear all sessions. Use this if linking is stuck. Continue?")) return;
        try {
            const res = await fetch("/api/admin/whatsapp/reset", { method: "POST" });
            if (res.ok) {
                alert("Server reset successful! Please wait 15 seconds then refresh the page.");
                window.location.reload();
            } else {
                alert("Reset failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error during reset.");
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const isCooldownActive = whatsappStatus.cooldownUntil > Date.now();

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Executive Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Welcome back, <span className="font-semibold text-amber-600">
                            {userRole === 'TEAM_LEAD' ? 'Team Lead' :
                                userRole === 'DEVELOPMENT_MANAGER' ? 'Development Manager' :
                                    'Super Administrator'}
                        </span>. System overview and real-time operations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/dashboard/admin/users"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-xs shadow-amber-500/20"
                    >
                        <span>Manage Users</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Summary KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
                <KPICard
                    title="Total Users"
                    value={stats.users.toLocaleString()}
                    badge={stats.usersGrowth || "+0%"}
                    badgeType="neutral"
                    icon={Users}
                    href="/dashboard/admin/users"
                />
                
                <KPICard
                    title="Active Today"
                    value={stats.activeSessions.toLocaleString()}
                    badge="Live Daily"
                    badgeType="success"
                    icon={Activity}
                    href="/dashboard/admin/attendance"
                />

                {(userRole === 'ADMIN' || userRole === 'DEVELOPMENT_MANAGER') && (
                    <>
                        <KPICard
                            title="Total Revenue"
                            value={formatCurrency(stats.revenue)}
                            badge={stats.revenueGrowth}
                            badgeType="gold"
                            icon={DollarSign}
                            highlight
                            href="/dashboard/admin/revenue"
                        />
                        <KPICard
                            title="Pending Dues"
                            value={formatCurrency(stats.pendingAmount || 0)}
                            badge="Uncollected"
                            badgeType="warning"
                            icon={Clock}
                            href="/dashboard/admin/billing"
                        />
                    </>
                )}

                <KPICard
                    title="System Health"
                    value="99.9%"
                    badge="Stable"
                    badgeType="success"
                    icon={ShieldCheck}
                />
            </div>

            {/* WhatsApp Notification Server Panel */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            whatsappStatus.isReady ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">WhatsApp Notification Server</h2>
                            <p className="text-xs text-slate-500">Automated student alerts, fee reminders, and attendance dispatch</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            whatsappStatus.isReady
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${whatsappStatus.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {whatsappStatus.isReady ? 'Connected & Active' : 'Disconnected'}
                        </span>

                        <button
                            onClick={handleClearWhatsApp}
                            className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                            title="Force clear session and restart Puppeteer"
                        >
                            Reset Server
                        </button>
                    </div>
                </div>

                {whatsappStatus.isReady ? (
                    <div className="py-6 flex items-center gap-4 text-emerald-800 bg-emerald-50/50 rounded-xl px-4 mt-4 border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">WhatsApp Automation Service is operating normally</p>
                            <p className="text-xs text-emerald-600/80">Ready to dispatch automated fee invoices, attendance slips, and notifications.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        
                        {/* Option A: Link with Phone Number */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5 relative overflow-hidden">
                            {isCooldownActive && (
                                <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs text-white">
                                    <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
                                    <div className="text-sm font-bold text-amber-400 uppercase tracking-wide">Cooldown Active</div>
                                    <p className="text-xs text-slate-300 max-w-xs mt-1">Please wait before requesting a new code:</p>
                                    <div className="text-3xl font-mono font-black text-white mt-2">
                                        {Math.ceil((whatsappStatus.cooldownUntil - currentTime.getTime()) / 60000)}m {Math.ceil(((whatsappStatus.cooldownUntil - currentTime.getTime()) / 1000) % 60)}s
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                                <Smartphone className="w-4 h-4 text-amber-600" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Option A: Link with Phone Number</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Enter your phone number with country code to generate an 8-character pairing code directly on your mobile device.
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. 919876543210"
                                    value={pairingMobile}
                                    onChange={(e) => setPairingMobile(e.target.value)}
                                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                                />
                                <button
                                    onClick={handleRequestPairing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs"
                                >
                                    GET CODE
                                </button>
                            </div>

                            {whatsappStatus.pairingCode && (
                                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">Pairing Code</span>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="text-3xl font-black font-mono tracking-widest text-slate-900">
                                            {whatsappStatus.pairingCode}
                                        </div>
                                        <button
                                            onClick={() => handleCopyCode(whatsappStatus.pairingCode!)}
                                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded bg-white border border-slate-200"
                                            title="Copy code"
                                        >
                                            {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2">
                                        WhatsApp &rarr; Linked Devices &rarr; Link a Device &rarr; <em>Link with phone number instead</em>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Option B: Scan QR Code */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 mb-3">
                                <QrCode className="w-4 h-4 text-amber-600" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Option B: Scan QR Code</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
                                Scan the QR code using your WhatsApp camera on Linked Devices
                            </p>

                            <div className="w-36 h-36 bg-white rounded-xl p-2 border border-slate-200 shadow-xs flex items-center justify-center">
                                {whatsappStatus.qrCode ? (
                                    <img src={whatsappStatus.qrCode} alt="WhatsApp QR" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                                        <span className="text-[11px]">Generating QR...</span>
                                    </div>
                                )}
                            </div>

                            {whatsappStatus.initError && (
                                <p className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg max-w-sm">
                                    {whatsappStatus.initError}
                                </p>
                            )}

                            {/* Logs Accordion */}
                            {whatsappStatus.logs && whatsappStatus.logs.length > 0 && (
                                <div className="w-full mt-4 text-left">
                                    <button
                                        onClick={() => setShowLogs(!showLogs)}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium mx-auto"
                                    >
                                        <Terminal className="w-3 h-3" />
                                        <span>{showLogs ? "Hide server logs" : "View diagnostic logs"}</span>
                                    </button>

                                    {showLogs && (
                                        <div className="mt-2 p-2 bg-slate-900 text-slate-300 rounded-lg font-mono text-[10px] max-h-28 overflow-y-auto space-y-1">
                                            {whatsappStatus.logs.map((log, idx) => (
                                                <div key={idx} className="border-b border-slate-800 pb-0.5">{log}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>


        </div>
    );
}

// KPI Card Component
interface KPICardProps {
    title: string;
    value: string;
    badge: string;
    badgeType: 'success' | 'warning' | 'gold' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    href?: string;
}

function KPICard({ title, value, badge, badgeType, icon: Icon, highlight, href }: KPICardProps) {
    const badgeStyles = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-rose-50 text-rose-700 border-rose-200',
        gold: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
        neutral: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    const content = (
        <div className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
            highlight
                ? 'bg-gradient-to-br from-amber-50/70 via-white to-white border-amber-300 shadow-xs hover:shadow-md'
                : 'bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300'
        } ${href ? 'cursor-pointer' : ''}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    highlight ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-600'
                }`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className={`text-2xl sm:text-3xl font-black mt-3 tracking-tight ${highlight ? 'text-amber-900' : 'text-slate-900'}`}>
                {value}
            </div>

            <div className="mt-3 flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 text-[10px] rounded-md font-semibold border ${badgeStyles[badgeType]}`}>
                    {badge}
                </span>
                <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }
    return content;
}
