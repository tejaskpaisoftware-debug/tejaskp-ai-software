"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceRecord {
    id?: string;
    date: string;
    status: string;
    isSunday: boolean;
    loginTime?: string;
    logoutTime?: string;
}

interface AttendanceChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export default function AttendanceChartModal({ isOpen, onClose, userId, userName }: AttendanceChartModalProps) {
    const [chartData, setChartData] = useState<AttendanceRecord[]>([]);
    const [view, setView] = useState<'CHART' | 'REPORT'>('CHART');
    const [insight, setInsight] = useState<string>("");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [insightLoading, setInsightLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [shareResult, setShareResult] = useState<{ success: boolean; msg: string } | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            setView('CHART');
            fetchChartData();
        } else {
            // Reset
            setChartData([]);
            setInsight("");
            setStats(null);
            setShareResult(null);
        }
    }, [isOpen, userId]);

    useEffect(() => {
        if (chartData.length > 0) {
            const newStats = {
                present: chartData.filter(d => d.status === 'PRESENT').length,
                late: chartData.filter(d => d.status === 'LATE').length,
                absent: chartData.filter(d => d.status === 'ABSENT').length,
                off: chartData.filter(d => d.status === 'OFF').length
            };
            setStats(newStats);
        }
    }, [chartData]);

    const fetchChartData = async () => {
        setLoading(true);
        setInsightLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/attendance-chart`);
            if (res.ok) {
                const data = await res.json();
                setChartData(data.chartData);
                fetchInsight(data.chartData);
            }
        } catch (error) {
            console.error("Failed to fetch chart", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsight = async (data: AttendanceRecord[]) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/attendance-insights`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chartData: data })
            });
            if (res.ok) {
                const result = await res.json();
                setInsight(result.insight || result.fallbackInsight);
                setStats(result.stats);
            }
        } catch (error) {
            console.error("Failed to fetch AI insight", error);
            setInsight("AI is currently unavailable to analyze patterns.");
        } finally {
            setInsightLoading(false);
        }
    };

    const handleToggleStatus = async (date: string, currentStatus: string) => {
        // Only toggle these interactive statuses
        const statusMap: Record<string, string> = {
            'PRESENT': 'LATE',
            'LATE': 'ABSENT',
            'ABSENT': 'OFF',
            'OFF': 'PRESENT',
            'WEEKEND': 'PRESENT',
            'NOT_JOINED': 'PRESENT'
        };

        const newStatus = statusMap[currentStatus] || 'PRESENT';

        // Optimistic UI update
        setChartData(prev => prev.map(day =>
            day.date === date ? { ...day, status: newStatus } : day
        ));

        try {
            const res = await fetch(`/api/admin/users/${userId}/attendance-update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, status: newStatus })
            });

            if (res.ok) {
                // Refresh data and insights to be sure
                const updatedData = chartData.map(day =>
                    day.date === date ? { ...day, status: newStatus } : day
                );
                fetchInsight(updatedData);
            } else {
                // Revert on error
                console.error("Failed to update status");
                fetchChartData();
            }
        } catch (error) {
            console.error("Network error updating status", error);
            fetchChartData();
        }
    };

    const handleShare = async () => {
        const finalInsight = insight || "AI insight is currently unavailable for this report.";
        const finalStats = stats || {
            present: chartData.filter(d => d.status === 'PRESENT').length,
            late: chartData.filter(d => d.status === 'LATE').length,
            absent: chartData.filter(d => d.status === 'ABSENT').length,
            off: chartData.filter(d => d.status === 'OFF').length
        };

        console.log(`[Share] Initiating for User: ${userId}`, { stats: finalStats, insight: finalInsight });

        setIsSharing(true);
        setShareResult(null);
        try {
            const res = await fetch(`/api/admin/users/${userId}/attendance-share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stats: finalStats, insight: finalInsight })
            });
            const data = await res.json();
            if (data.success) {
                setShareResult({ success: true, msg: "Successfully delivered via WhatsApp!" });
            } else {
                console.error("[Share] API Error:", data.error);
                setShareResult({ success: false, msg: data.error || "Failed to deliver message." });
            }
        } catch (error) {
            console.error("[Share] Network Error:", error);
            setShareResult({ success: false, msg: "Network error during share." });
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-teal-900/20 to-transparent">
                            <div className="flex items-center gap-4">
                                {view === 'REPORT' && (
                                    <button
                                        onClick={() => setView('CHART')}
                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                                    >
                                        ←
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                                        {view === 'CHART' ? '📊 Attendance Chart' : '📜 Detailed Report'}
                                    </h2>
                                    <p className="text-sm text-gray-400 mt-1">30-Day Activity for <span className="text-teal-400 font-bold">{userName}</span></p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-20 text-center animate-pulse text-teal-500 font-medium">Aggregating Records...</div>
                            ) : (
                                <>
                                    {view === 'CHART' ? (
                                        <>
                                            {/* Legend */}
                                            <div className="flex gap-4 text-xs font-bold text-gray-400 mb-2 justify-center">
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Present</div>
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Late</div>
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Absent</div>
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-600"></div> Off / NA</div>
                                            </div>

                                            {/* Grid */}
                                            <div className="grid grid-cols-7 gap-2 bg-black/30 p-4 rounded-xl border border-white/5">
                                                {chartData.map((day, idx) => {
                                                    let bg = "bg-gray-800 border-gray-700";
                                                    let title = "Not Joined / Weekend";

                                                    if (day.status === "PRESENT") { bg = "bg-green-500/20 border-green-500 text-green-400"; title = "Present"; }
                                                    else if (day.status === "LATE") { bg = "bg-yellow-500/20 border-yellow-500 text-yellow-400"; title = "Late"; }
                                                    else if (day.status === "ABSENT") { bg = "bg-red-500/20 border-red-500 text-red-400"; title = "Absent"; }
                                                    else if (day.status === "OFF") { bg = "bg-gray-500/20 border-gray-500 text-gray-400"; title = "Off Day"; }

                                                    const d = new Date(day.date);
                                                    const dateNum = d.getDate();
                                                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                                    const monthName = monthNames[d.getMonth()];

                                                    return (
                                                        <div
                                                            key={idx}
                                                            title={`${day.date} - ${title} (Click to toggle)`}
                                                            onClick={() => handleToggleStatus(day.date, day.status)}
                                                            className={`aspect-square rounded shadow-sm border flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer select-none ${bg}`}
                                                        >
                                                            <span className="text-[8px] opacity-60 uppercase font-bold leading-none">{monthName}</span>
                                                            <span className="text-[11px] font-extrabold">{dateNum}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-center text-gray-500 font-medium">💡 Click any date to manually toggle status</p>
                                        </>
                                    ) : (
                                        /* Detailed Report View */
                                        <div className="space-y-2">
                                            {chartData.slice().reverse().map((day, idx) => {
                                                if (day.status === 'NOT_JOINED' || day.status === 'WEEKEND') return null;

                                                const formatTime = (time?: string) => {
                                                    if (!time) return '--:--';
                                                    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                };

                                                return (
                                                    <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center group hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-8 rounded-full ${day.status === 'PRESENT' ? 'bg-green-500' :
                                                                day.status === 'LATE' ? 'bg-yellow-500' :
                                                                    day.status === 'ABSENT' ? 'bg-red-500' : 'bg-gray-500'
                                                                }`} />
                                                            <div>
                                                                <div className="font-bold text-sm text-white">
                                                                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{day.status}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-6 text-right">
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase">Login</div>
                                                                <div className="text-xs font-mono text-gray-300">{formatTime(day.loginTime)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase">Logout</div>
                                                                <div className="text-xs font-mono text-gray-300">{formatTime(day.logoutTime)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* AI Insights Section (Always visible but condensed in report view?) */}
                                    <div className={`bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden transition-all ${view === 'REPORT' ? 'opacity-50 hover:opacity-100' : ''}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">✨</div>
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-3 text-sm tracking-widest uppercase">
                                            ✨ Gemini AI Insight
                                        </div>

                                        {insightLoading ? (
                                            <div className="animate-pulse text-gray-400 text-sm">Analyzing attendance patterns...</div>
                                        ) : (
                                            <div className="text-gray-200 text-sm leading-relaxed">
                                                {insight}
                                            </div>
                                        )}

                                        {stats && !insightLoading && (
                                            <div className="mt-4 pt-4 border-t border-indigo-500/20 flex gap-6 text-sm">
                                                <div><span className="text-gray-400">P:</span> <span className="font-bold text-green-400">{stats.present}</span></div>
                                                <div><span className="text-gray-400">L:</span> <span className="font-bold text-yellow-400">{stats.late}</span></div>
                                                <div><span className="text-gray-400">A:</span> <span className="font-bold text-red-400">{stats.absent}</span></div>
                                                <div><span className="text-gray-400">O:</span> <span className="font-bold text-gray-400">{stats.off || 0}</span></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bar */}
                                    {shareResult && (
                                        <div className={`text-center text-xs font-bold p-2 mb-2 rounded ${shareResult.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                            {shareResult.msg}
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setView(view === 'CHART' ? 'REPORT' : 'CHART')}
                                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                                        >
                                            {view === 'CHART' ? '📜 Detailed Report' : '📊 Back to Chart'}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            disabled={insightLoading || isSharing}
                                            className="flex-[2] py-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                                        >
                                            {isSharing ? "Dispatching..." : "📲 Share Report"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
