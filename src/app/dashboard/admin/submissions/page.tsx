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
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Weekly Submission Tracker</h1>
                    <p className="text-gray-500">Monitor student document uploads</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <label className="text-sm font-medium text-gray-700">Select Week:</label>
                    <input
                        type="date"
                        value={weekDate}
                        onChange={(e) => setWeekDate(getMonday(new Date(e.target.value)))}
                        className="border-none focus:ring-0 text-gray-800 font-medium cursor-pointer"
                    />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => setFilter("ALL")}
                    className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${filter === 'ALL' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100'}`}
                >
                    <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
                </div>
                <div
                    onClick={() => setFilter("SUBMITTED")}
                    className={`bg-green-50 p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${filter === 'SUBMITTED' ? 'border-green-500 ring-1 ring-green-500' : 'border-green-100'}`}
                >
                    <h3 className="text-green-600 text-sm font-medium">Submitted</h3>
                    <p className="text-3xl font-bold text-green-700 mt-2">{stats.submitted}</p>
                </div>
                <div
                    onClick={() => setFilter("PENDING")}
                    className={`bg-orange-50 p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${filter === 'PENDING' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-orange-100'}`}
                >
                    <h3 className="text-orange-600 text-sm font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-orange-700 mt-2">{stats.pending}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-2">
                <div className="flex gap-2">
                    {["ALL", "SUBMITTED", "PENDING"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === f ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search student..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Modal */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {preview.type === 'PDF' ? '📄 Report Preview' : '📊 Excel Data Preview'}
                            </h3>
                            <div className="flex gap-2">
                                <a
                                    href={preview.url}
                                    download
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    ⬇ Download Original
                                </a>
                                <button onClick={closePreview} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                                    ✕ Close
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            {preview.type === 'PDF' ? (
                                <iframe src={preview.url} className="w-full h-full rounded border border-gray-300 bg-white" />
                            ) : (
                                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-auto max-h-full">
                                    {preview.data ? (
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {preview.data.map((row: any[], i) => (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="border-r border-gray-100 px-4 py-2 whitespace-nowrap text-gray-700 font-mono">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">Loading Excel Data...</div>
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Student Name</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Files (View)</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Time</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReport.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <a href={`/dashboard/admin/users/${student.id}`} className="block hover:bg-gray-50 transition-colors group">
                                                <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.course}</div>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{student.mobile}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                disabled={student.status !== 'SUBMITTED' && student.status !== 'LATE'}
                                                onClick={() => student.pdfPath && handleViewPdf(student.pdfPath)}
                                                className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(student.status)} ${student.status === 'SUBMITTED' || student.status === 'LATE' ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                                            >
                                                {student.status.replace('_', ' ')}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {student.pdfPath ? (
                                                    <button
                                                        onClick={() => handleViewPdf(student.pdfPath)}
                                                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1"
                                                    >
                                                        👁 PDF
                                                    </button>
                                                ) : <span className="text-xs text-gray-400">No PDF</span>}
                                                {student.excelPath ? (
                                                    <button
                                                        onClick={() => handleViewExcel(student.excelPath)}
                                                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
                                                    >
                                                        📊 XLS
                                                    </button>
                                                ) : <span className="text-xs text-gray-400">No XLS</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {student.submittedAt ? new Date(student.submittedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(student.status === 'NOT_SUBMITTED' || student.status === 'PENDING') ? (
                                                <button
                                                    onClick={() => sendReminder(student.id, student.mobile)}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 py-1 rounded bg-indigo-50"
                                                >
                                                    📨 Remind
                                                </button>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => updateStatus(student.id, 'APPROVED')}
                                                        title="Approve"
                                                        className={`p-1 rounded hover:bg-green-100 text-green-600 ${student.status === 'APPROVED' ? 'bg-green-100 ring-1 ring-green-600' : ''}`}
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(student.id, 'REJECTED')}
                                                        title="Reject"
                                                        className={`p-1 rounded hover:bg-red-100 text-red-600 ${student.status === 'REJECTED' ? 'bg-red-100 ring-1 ring-red-600' : ''}`}
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
                            <div className="p-8 text-center text-gray-500">No students found for this filter.</div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
