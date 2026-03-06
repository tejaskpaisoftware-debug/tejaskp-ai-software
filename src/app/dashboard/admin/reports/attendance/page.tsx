
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Search, Download, User, AlertTriangle, Clock, CheckCircle } from "lucide-react";

export default function AttendanceReportsPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchReport();
    }, [month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/attendance?month=${month}`);
            const data = await res.json();
            if (data.success) {
                setReport(data.report);
            }
        } catch (error) {
            console.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const filteredReport = report.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-[#FFF5C3] via-[#FDB931] to-[#9F6900] uppercase tracking-widest drop-shadow-md">
                    Attendance Reports
                </h1>
                <p className="text-gray-500 font-bold mt-2">Comprehensive Monthly Student Punctuality & Performance Summary</p>
            </header>

            {/* Filters */}
            <div className="grid md:grid-cols-3 gap-6 mb-8 group">
                <div className="bg-[#1a1a1a] border border-white/10 p-4 rounded-xl flex items-center gap-4 focus-within:border-yellow-500/50 transition-all">
                    <Calendar className="text-yellow-500" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-white font-bold"
                    />
                </div>
                <div className="bg-[#1a1a1a] border border-white/10 p-4 rounded-xl flex items-center gap-4 focus-within:border-yellow-500/50 transition-all md:col-span-2">
                    <Search className="text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 animate-pulse font-bold uppercase tracking-widest">Generating Report...</p>
                </div>
            ) : filteredReport.length === 0 ? (
                <div className="text-center p-12 bg-[#1a1a1a] rounded-2xl border border-dashed border-white/10">
                    <AlertTriangle className="mx-auto mb-4 text-gray-600" size={40} />
                    <p className="text-gray-500 font-bold">No data found for this period.</p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-4 gap-6">
                        <SummaryCard title="Total Students" value={report.length} icon={<User className="text-blue-400" />} />
                        <SummaryCard
                            title="Total Lates"
                            value={report.reduce((acc, curr) => acc + curr.stats.late, 0)}
                            icon={<Clock className="text-yellow-400" />}
                        />
                        <SummaryCard
                            title="Total Absents"
                            value={report.reduce((acc, curr) => acc + curr.stats.absent, 0)}
                            icon={<AlertTriangle className="text-red-400" />}
                        />
                        <SummaryCard
                            title="Present Avg"
                            value={Math.round(report.reduce((acc, curr) => acc + (curr.stats.present / curr.stats.totalDays), 0) / report.length * 100) + "%"}
                            icon={<CheckCircle className="text-green-400" />}
                        />
                    </div>

                    {/* Detailed Matrix */}
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead className="bg-[#222] text-yellow-500 uppercase text-xs font-black tracking-widest">
                                    <tr>
                                        <th className="p-5 border-b border-white/5">Student Name</th>
                                        <th className="p-5 border-b border-white/5 text-center">Present</th>
                                        <th className="p-5 border-b border-white/5 text-center">Late Entries</th>
                                        <th className="p-5 border-b border-white/5 text-center">Absent</th>
                                        <th className="p-5 border-b border-white/5 text-center">No Task Days</th>
                                        <th className="p-5 border-b border-white/5">Parent Contact</th>
                                        <th className="p-5 border-b border-white/5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredReport.map((item) => (
                                        <tr key={item.studentId} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5">
                                                <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">{item.name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.studentId}</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="text-green-400 font-black">{item.stats.present}</div>
                                                <div className="text-[10px] text-gray-600 uppercase">Days</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className={`font-black ${item.stats.late > 2 ? 'text-yellow-500 scale-110' : 'text-gray-400'}`}>
                                                    {item.stats.late}
                                                </div>
                                                <div className="text-[10px] text-gray-600 uppercase">Entries</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className={`font-black ${item.stats.absent > 3 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {item.stats.absent}
                                                </div>
                                                <div className="text-[10px] text-gray-600 uppercase">Days</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className={`font-black ${item.stats.daysWithNoTask > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                                                    {item.stats.daysWithNoTask}
                                                </div>
                                                <div className="text-[10px] text-gray-600 uppercase">Untracked</div>
                                            </td>
                                            <td className="p-5">
                                                {item.parentContact.name ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-gray-300">{item.parentContact.name}</div>
                                                        <div className="text-xs text-gray-500">{item.parentContact.mobile}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-red-500/50 italic">Missing Info</span>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, value, icon }: { title: string, value: any, icon: any }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow-lg hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
                <div className="text-2xl font-black text-white">{value}</div>
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
        </div>
    );
}
