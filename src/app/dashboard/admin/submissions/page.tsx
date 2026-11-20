"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

import * as XLSX from "xlsx"; // Import XLSX

export default function AdminSubmissionsPage() {
    const [weekDate, setWeekDate] = useState("");
    const [report, setReport] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState("ALL"); // ALL, SUBMITTED, PENDING
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [preview, setPreview] = useState<{ type: 'PDF' | 'EXCEL', url: string, data?: any[] } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Helper: Get Monday of the current week or given date
    const getMonday = (d: Date) => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    };

    useEffect(() => {
        const currentMonday = getMonday(new Date());
        setWeekDate(currentMonday);
    }, []);

    const fetchReport = async (date: string) => {
        if (!date) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/submissions?week=${date}`);
            const data = await res.json();
            if (data.success) {
                setReport(data.report);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (weekDate) {
            fetchReport(weekDate);
        }
    }, [weekDate]);

    // Preview Handlers
    const handleViewPdf = (path: string) => {
        setPreview({ type: 'PDF', url: path });
    };

    const handleViewExcel = async (path: string) => {
        setLoadingPreview(true);
        try {
            console.log("Fetching Excel:", path);
            const res = await fetch(path);
            if (!res.ok) {
                throw new Error(`Failed to fetch file: ${res.statusText}`);
            }
            const arrayBuffer = await res.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setPreview({ type: 'EXCEL', url: path, data });
        } catch (error: any) {
            console.error("Excel Error:", error);
            if (error.message && (error.message.includes("password") || error.message.includes("encrypted"))) {
                if (confirm("This Excel file is password protected and cannot be previewed. Do you want to download it instead?")) {
                    window.open(path, '_blank');
                }
            } else {
                alert(`Failed to parse Excel file: ${error.message}`);
            }
        } finally {
            setLoadingPreview(false);
        }
    };

    const closePreview = () => {
        setPreview(null);
    };

    const filteredReport = report.filter(item => {
        const matchesFilter =
            (filter === "ALL") ||
            (filter === "SUBMITTED" && (item.status === "SUBMITTED" || item.status === "LATE")) ||
            (filter === "PENDING" && (item.status === "PENDING" || item.status === "NOT_SUBMITTED"));

        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch =
            (item.name || "").toLowerCase().includes(lowerTerm) ||
            (item.mobile || "").includes(lowerTerm) ||
            (item.course || "").toLowerCase().includes(lowerTerm);

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: report.length,
        submitted: report.filter(i => i.status === "SUBMITTED" || i.status === "LATE").length,
        pending: report.filter(i => i.status === "PENDING" || i.status === "NOT_SUBMITTED").length
    };

    const sendReminder = async (userId: string, mobile: string) => {
        if (!confirm(`Send reminder to ${mobile}?`)) return;

        try {
            const res = await fetch('/api/admin/submissions/remind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, mobile })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to send reminder");
        }
    };

    const updateStatus = async (userId: string, newStatus: string) => {
        if (!confirm(`Mark submission as ${newStatus}?`)) return;

        try {
            const res = await fetch('/api/admin/submissions/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, weekDate, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh data
                fetchReport(weekDate);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        if (status === 'REJECTED') return 'bg-red-100 text-red-700 border border-red-200';
        if (status === 'SUBMITTED') return 'bg-blue-100 text-blue-700';
        if (status === 'LATE') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Submission Tracker</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Monitor and approve student document & worksheet uploads</p>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200/80">
                    <label className="text-xs font-semibold text-slate-600">Select Week:</label>
                    <input
                        type="date"
                        value={weekDate}
                        onChange={(e) => setWeekDate(getMonday(new Date(e.target.value)))}
                        className="border-none focus:ring-0 text-slate-900 text-xs font-bold cursor-pointer bg-transparent outline-hidden"
                    />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => setFilter("ALL")}
                    className={`bg-white p-5 rounded-xl shadow-xs border cursor-pointer transition-all ${filter === 'ALL' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                >
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Students</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1.5">{stats.total}</p>
                </div>
                <div
                    onClick={() => setFilter("SUBMITTED")}
                    className={`bg-white p-5 rounded-xl shadow-xs border cursor-pointer transition-all ${filter === 'SUBMITTED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                >
                    <h3 className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Submitted</h3>
                    <p className="text-2xl font-bold text-emerald-700 mt-1.5">{stats.submitted}</p>
                </div>
                <div
                    onClick={() => setFilter("PENDING")}
                    className={`bg-white p-5 rounded-xl shadow-xs border cursor-pointer transition-all ${filter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                >
                    <h3 className="text-amber-700 text-xs font-bold uppercase tracking-wider">Pending</h3>
                    <p className="text-2xl font-bold text-amber-700 mt-1.5">{stats.pending}</p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex gap-2">
                    {["ALL", "SUBMITTED", "PENDING"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filter === f
                                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs shadow-amber-500/20 font-bold"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                    />
                </div>
            </div>

            {/* Modal */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <header className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                {preview.type === 'PDF' ? '📄 Report Preview' : '📊 Excel Data Preview'}
                            </h3>
                            <div className="flex gap-2">
                                <a
                                    href={preview.url}
                                    download
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                    ⬇ Download Original
                                </a>
                                <button onClick={closePreview} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                                    ✕ Close
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto bg-slate-100 p-4">
                            {preview.type === 'PDF' ? (
                                <iframe src={preview.url} className="w-full h-full rounded-xl border border-slate-300 bg-white" />
                            ) : (
                                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-auto max-h-full">
                                    {preview.data ? (
                                        <table className="w-full text-xs text-left">
                                            <tbody>
                                                {preview.data.map((row: any[], i) => (
                                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="border-r border-slate-100 px-3.5 py-2 whitespace-nowrap text-slate-700 font-mono">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-xs">Loading Excel Data...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden"
            >
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400 text-xs">Loading data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold">Student Name</th>
                                    <th className="px-5 py-3.5 font-bold">Contact</th>
                                    <th className="px-5 py-3.5 font-bold">Status</th>
                                    <th className="px-5 py-3.5 font-bold">Files</th>
                                    <th className="px-5 py-3.5 font-bold">Submitted Time</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReport.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <a href={`/dashboard/admin/users/${student.id}`} className="block group">
                                                <div className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">{student.name}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{student.course}</div>
                                            </a>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600 font-medium">{student.mobile}</td>
                                        <td className="px-5 py-3.5">
                                            <button
                                                disabled={student.status !== 'SUBMITTED' && student.status !== 'LATE'}
                                                onClick={() => student.pdfPath && handleViewPdf(student.pdfPath)}
                                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(student.status)} ${student.status === 'SUBMITTED' || student.status === 'LATE' ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                                            >
                                                {student.status.replace('_', ' ')}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                {student.pdfPath ? (
                                                    <button
                                                        onClick={() => handleViewPdf(student.pdfPath)}
                                                        className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-md hover:bg-amber-100 border border-amber-200 font-semibold flex items-center gap-1"
                                                    >
                                                        👁 PDF
                                                    </button>
                                                ) : <span className="text-[11px] text-slate-400">No PDF</span>}
                                                {student.excelPath ? (
                                                    <button
                                                        onClick={() => handleViewExcel(student.excelPath)}
                                                        className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-100 border border-emerald-200 font-semibold flex items-center gap-1"
                                                    >
                                                        📊 XLS
                                                    </button>
                                                ) : <span className="text-[11px] text-slate-400">No XLS</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[11px] text-slate-500">
                                            {student.submittedAt ? new Date(student.submittedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            {(student.status === 'NOT_SUBMITTED' || student.status === 'PENDING') ? (
                                                <button
                                                    onClick={() => sendReminder(student.id, student.mobile)}
                                                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md bg-amber-50 shadow-2xs"
                                                >
                                                    📨 Remind
                                                </button>
                                            ) : (
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => updateStatus(student.id, 'APPROVED')}
                                                        title="Approve"
                                                        className={`p-1 rounded-md hover:bg-emerald-50 text-emerald-600 ${student.status === 'APPROVED' ? 'bg-emerald-50 ring-1 ring-emerald-500' : ''}`}
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(student.id, 'REJECTED')}
                                                        title="Reject"
                                                        className={`p-1 rounded-md hover:bg-rose-50 text-rose-600 ${student.status === 'REJECTED' ? 'bg-rose-50 ring-1 ring-rose-500' : ''}`}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredReport.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs">No students found for this filter.</div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
