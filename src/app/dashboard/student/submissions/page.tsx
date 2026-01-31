"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, nextFriday, set, isFriday, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isAfter, isBefore, addMonths, subMonths, subDays, parseISO } from "date-fns";
import { Clock, Calendar as CalendarIcon, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, X, Eye, ChevronDown, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

export default function StudentSubmissionsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submittingWeek, setSubmittingWeek] = useState<string>("");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelData, setExcelData] = useState<any[][]>([]);
    const [isExcelLoading, setIsExcelLoading] = useState(false);

    // --- Deadline Logic ---
    const getNextDeadline = () => {
        const now = new Date();
        // Set deadline to Friday 3:30 PM
        let deadline = set(now, { hours: 15, minutes: 30, seconds: 0, milliseconds: 0 });

        if (!isFriday(now)) {
            deadline = nextFriday(now);
            deadline = set(deadline, { hours: 15, minutes: 30, seconds: 0, milliseconds: 0 });
        } else {
            // It is Friday. check if 3:30 PM passed
            if (isAfter(now, deadline)) {
                deadline = nextFriday(now);
                deadline = set(deadline, { hours: 15, minutes: 30, seconds: 0, milliseconds: 0 });
            }
        }
        return deadline;
    };

    const deadlineDate = getNextDeadline();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = deadlineDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Helpers
    const getMonday = (d: Date) => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    };

    const currentMonday = getMonday(new Date());

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

    const fetchSubmissions = async () => {
        try {
            const res = await fetch('/api/student/submissions', { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleViewExcel = async (url: string) => {
        setIsExcelLoading(true);
        setShowExcelModal(true);
        setActiveDropdown(null);
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const wb = XLSX.read(arrayBuffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setExcelData(data as any[][]);
        } catch (error) {
            console.error("Error reading excel:", error);
            setMessage({ type: 'error', text: 'Failed to preview Excel file.' });
            setShowExcelModal(false);
        } finally {
            setIsExcelLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!pdfFile || !excelFile) {
            setMessage({ type: 'error', text: 'Both PDF and Excel files are required.' });
            return;
        }

        // Open Modal to confirm week
        setSubmittingWeek(currentMonday); // Default to current
        setShowModal(true);
    };

    const confirmSubmit = async () => {
        setShowModal(false);
        setIsLoading(true);
        const formData = new FormData();
        formData.append('pdf', pdfFile!);
        formData.append('excel', excelFile!);
        formData.append('weekDate', submittingWeek);

        try {
            const res = await fetch('/api/student/submissions', {
                method: 'POST',
                headers: { ...getAuthHeader() },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Documents submitted successfully!' });
                setPdfFile(null);
                setExcelFile(null);
                // Reset file inputs manually if needed or just rely on state
                fetchSubmissions();
            } else {
                setMessage({ type: 'error', text: data.error || 'Submission failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Something went wrong.' });
        } finally {
            setIsLoading(false);
        }
    };

    const currentSubmission = submissions.find(s => s.weekStartDate === currentMonday);

    const getStatusColor = (status: string | undefined) => {
        if (!status) return 'bg-blue-50 text-blue-600';
        if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        if (status === 'REJECTED') return 'bg-red-100 text-red-700 border border-red-200';
        if (status === 'SUBMITTED') return 'bg-green-100 text-green-700';
        if (status === 'LATE') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-foreground">Weekly Document Submission</h1>
                <p className="text-muted-foreground">Submit your work report (PDF) and data sheet (Excel) every <span className="text-gold-500 font-bold">Friday by 3:30 PM</span>.</p>

                {/* Countdown Timer */}
                {timeLeft && (
                    <div className="mt-6 flex flex-wrap gap-6 items-center">
                        <div className="bg-card border border-theme p-4 rounded-xl flex items-center gap-4 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                                <Clock className="text-red-500" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Deadline In</p>
                                <div className="text-2xl font-mono font-bold text-foreground flex gap-2">
                                    <span>{String(timeLeft.days).padStart(2, '0')}d</span>:
                                    <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
                                    <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
                                    <span className="text-red-500">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-gold-500/5 border border-gold-500/20 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <h3 className="text-gold-500 font-bold flex items-center gap-2"><CalendarIcon size={16} /> Next Submission Date</h3>
                                <p className="text-2xl font-bold text-foreground mt-1">{format(deadlineDate, "EEEE, MMMM do, yyyy")}</p>
                                <p className="text-sm text-gray-400">Time: 03:30 PM</p>
                            </div>
                            <div className="hidden md:block">
                                <span className="px-3 py-1 bg-gold-500 text-black font-bold text-xs rounded uppercase">Priority High</span>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CALENDAR COLUMN */}
                <div className="lg:col-span-1 space-y-6">
                    <SubmissionCalendar submissions={submissions} currentMonday={currentMonday} />
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                        {/* Submission Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card p-6 rounded-xl shadow-lg border border-theme"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-foreground">Current Week: {currentMonday}</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSubmission?.status)}`}>
                                    {currentSubmission ? currentSubmission.status.replace('_', ' ') : 'Pending'}
                                </span>
                            </div>

                            {currentSubmission?.status === 'REJECTED' && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    ⚠ Your submission was rejected. Please review and upload correct documents.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* ... form fields ... */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Detailed Report (PDF)</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 rounded-lg bg-background border border-theme focus:border-gold-theme focus:ring-2 focus:ring-gold-500/20 transition-all text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Data Sheet (Excel)</label>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 rounded-lg bg-background border border-theme focus:border-gold-theme focus:ring-2 focus:ring-gold-500/20 transition-all text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-500 hover:file:bg-green-500/20"
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 px-6 rounded-lg text-white font-medium shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                                        }`}
                                >
                                    {isLoading ? 'Uploading...' : 'Submit Documents'}
                                </button>
                            </form>
                        </motion.div>

                        {/* History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card p-6 rounded-xl shadow-lg border border-theme"
                        >
                            <h2 className="text-xl font-semibold mb-6 text-foreground">Submission History</h2>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {submissions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No submissions found.</p>
                                ) : (
                                    submissions.map((sub) => (
                                        <div key={sub.id} className="p-4 rounded-lg bg-card/50 border border-theme flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-card/80 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Week: {sub.weekStartDate}</p>
                                                <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium mb-1 ${getStatusColor(sub.status)}`}>
                                                    {sub.status.replace('_', ' ')}
                                                </span>
                                                <div className="flex gap-2 mt-1 items-center justify-end relative">
                                                    {(sub.pdfPath || sub.excelPath) && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveDropdown(activeDropdown === sub.id ? null : sub.id)}
                                                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-700 transition-colors"
                                                            >
                                                                <Eye size={12} /> View <ChevronDown size={12} />
                                                            </button>

                                                            {activeDropdown === sub.id && (
                                                                <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-gold-500/30 rounded-lg shadow-xl overflow-hidden z-20">
                                                                    {sub.pdfPath && (
                                                                        <a
                                                                            href={sub.pdfPath}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
                                                                        >
                                                                            <FileText size={12} className="text-indigo-400" /> PDF
                                                                        </a>
                                                                    )}
                                                                    {sub.excelPath && (
                                                                        <button
                                                                            onClick={() => handleViewExcel(sub.excelPath)}
                                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors"
                                                                        >
                                                                            <FileSpreadsheet size={12} className="text-green-500" /> Excel
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Week Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-gold-500/30 w-full max-w-md p-6 rounded-2xl shadow-2xl relative"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2">Confirm Submission Week</h2>
                        <p className="text-gray-300 text-sm mb-6">
                            Please select the week you are submitting these documents for.
                            <span className="block mt-1 text-gold-500 font-bold text-xs">* Submitting for past weeks may be marked as LATE.</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Select Week Starting On</label>
                                <select
                                    value={submittingWeek}
                                    onChange={(e) => setSubmittingWeek(e.target.value)}
                                    className="w-full bg-zinc-800 border border-gold-500/30 rounded-lg p-3 text-white focus:border-gold-500 transition-colors"
                                >
                                    <option value={currentMonday}>Current Week ({currentMonday})</option>
                                    <option value={subDays(parseISO(currentMonday), 7).toISOString().split('T')[0]}>
                                        Last Week ({subDays(parseISO(currentMonday), 7).toISOString().split('T')[0]})
                                    </option>
                                    <option value={subDays(parseISO(currentMonday), 14).toISOString().split('T')[0]}>
                                        2 Weeks Ago ({subDays(parseISO(currentMonday), 14).toISOString().split('T')[0]})
                                    </option>
                                </select>
                            </div>

                            <button
                                onClick={confirmSubmit}
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 shadow-lg"
                            >
                                {isLoading ? 'Processing...' : 'Confirm & Submit'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Excel Preview Modal */}
            {showExcelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-theme w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl relative flex flex-col"
                    >
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileSpreadsheet className="text-green-500" /> Excel Preview
                            </h2>
                            <button
                                onClick={() => setShowExcelModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-zinc-950/50">
                            {isExcelLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="animate-spin mb-2 text-gold-500" size={32} />
                                    Loading Spreadsheet...
                                </div>
                            ) : (
                                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr>
                                                {excelData[0]?.map((head: any, i: number) => (
                                                    <th key={i} className="px-4 py-3 bg-zinc-800 text-gold-500 font-bold border-b border-r border-zinc-700 last:border-r-0 whitespace-nowrap">
                                                        {head || `Col ${i + 1}`}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {excelData.slice(1).map((row, i) => (
                                                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                    {row.map((cell: any, j: number) => (
                                                        <td key={j} className="px-4 py-2 text-gray-300 border-r border-zinc-800/50 last:border-r-0 whitespace-nowrap">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {excelData.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">No data found in worksheet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function SubmissionCalendar({ submissions, currentMonday }: { submissions: any[], currentMonday: string }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = new Date();

    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    return (
        <div className="bg-card border border-theme rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={20} className="text-gray-400" />
                </button>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CalendarIcon size={18} className="text-gold-500" />
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight size={20} className="text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: getDay(startDate) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {days.map(day => {
                    // Logic to see if this day is a submission day (Friday)
                    const isSubmissionDay = isFriday(day);

                    // Allow checking status logic later if needed
                    // For now, highlight Fridays

                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`
                                aspect-square rounded-lg flex flex-col items-center justify-center relative border cursor-pointer
                                ${isToday ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-transparent text-gray-400'}
                                ${isSubmissionDay ? 'bg-indigo-500/10 border-indigo-500/30' : ''}
                                hover:bg-white/5 transition-colors group
                            `}
                        >
                            <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{format(day, 'd')}</span>

                            {isSubmissionDay && (
                                <div className="absolute bottom-1 group-hover:scale-125 transition-transform">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span>Submission Day (Friday)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-gold-500/20 border border-gold-500"></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    )
}
