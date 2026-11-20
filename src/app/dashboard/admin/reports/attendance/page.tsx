"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, 
    Search, 
    Download, 
    User, 
    AlertTriangle, 
    Clock, 
    CheckCircle,
    FileSpreadsheet,
    Users
} from "lucide-react";

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" /> Performance Reports
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Comprehensive monthly student punctuality, late entries, task discipline, and attendance metrics.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm focus-within:border-amber-500 transition-colors">
                    <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-slate-900 font-semibold text-sm"
                    />
                </div>
                <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm focus-within:border-amber-500 transition-colors sm:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search student by name or enrollment ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-slate-900 text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Generating Student Attendance Report...</p>
                </div>
            ) : filteredReport.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                    <AlertTriangle className="mx-auto mb-3 text-slate-400" size={36} />
                    <p className="text-slate-700 font-bold">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting a different month or adjusting your search term.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <SummaryCard 
                            title="Total Students" 
                            value={report.length} 
                            icon={<Users className="w-5 h-5 text-slate-600" />} 
                            bgIcon="bg-slate-100"
                        />
                        <SummaryCard
                            title="Total Late Entries"
                            value={report.reduce((acc, curr) => acc + (curr.stats?.late || 0), 0)}
                            icon={<Clock className="w-5 h-5 text-amber-600" />}
                            bgIcon="bg-amber-50"
                        />
                        <SummaryCard
                            title="Total Absences"
                            value={report.reduce((acc, curr) => acc + (curr.stats?.absent || 0), 0)}
                            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
                            bgIcon="bg-rose-50"
                        />
                        <SummaryCard
                            title="Attendance Average"
                            value={Math.round(report.reduce((acc, curr) => acc + ((curr.stats?.present || 0) / (curr.stats?.totalDays || 1)), 0) / (report.length || 1) * 100) + "%"}
                            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
                            bgIcon="bg-emerald-50"
                        />
                    </div>

                    {/* Detailed Matrix Table */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">Monthly Punctuality & Task Ledger</h2>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {filteredReport.length} Students
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead className="bg-slate-50/90 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 pl-6">Student Name</th>
                                        <th className="p-4 text-center">Present</th>
                                        <th className="p-4 text-center">Late Entries</th>
                                        <th className="p-4 text-center">Absent</th>
                                        <th className="p-4 text-center">No Task Days</th>
                                        <th className="p-4">Parent / Guardian</th>
                                        <th className="p-4 pr-6 text-center">Export</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredReport.map((item) => (
                                        <tr key={item.studentId} className="hover:bg-slate-50/70 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">{item.name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.studentId}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="text-emerald-600 font-extrabold">{item.stats?.present || 0}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Days</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`font-extrabold ${(item.stats?.late || 0) > 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                    {item.stats?.late || 0}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Entries</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`font-extrabold ${(item.stats?.absent || 0) > 3 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                    {item.stats?.absent || 0}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Days</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`font-extrabold ${(item.stats?.daysWithNoTask || 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {item.stats?.daysWithNoTask || 0}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Untracked</div>
                                            </td>
                                            <td className="p-4">
                                                {item.parentContact?.name ? (
                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-800">{item.parentContact.name}</div>
                                                        <div className="text-xs text-slate-400 font-mono">{item.parentContact.mobile}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Not on file</span>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <button 
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Download student attendance report"
                                                >
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

function SummaryCard({ title, value, icon, bgIcon }: { title: string, value: any, icon: any, bgIcon: string }) {
    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
            </div>
            <div className={`w-11 h-11 rounded-xl ${bgIcon} flex items-center justify-center`}>
                {icon}
            </div>
        </div>
    );
}
