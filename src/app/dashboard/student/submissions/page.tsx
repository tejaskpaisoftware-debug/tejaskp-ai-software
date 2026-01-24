"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function StudentSubmissionsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    const fetchSubmissions = async () => {
        try {
            const res = await fetch('/api/student/submissions');
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
            }
        } catch (error) {
            console.error(error);
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

        setIsLoading(true);
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('excel', excelFile);
        formData.append('weekDate', currentMonday);

        try {
            const res = await fetch('/api/student/submissions', {
                method: 'POST',
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
                <p className="text-muted-foreground">Submit your work report (PDF) and data sheet (Excel) every Friday by 3:30 PM.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                        <div className="flex gap-2 mt-1">
                                            {sub.pdfPath && <a href={sub.pdfPath} download className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">PDF</a>}
                                            {sub.excelPath && <a href={sub.excelPath} download className="text-green-600 hover:text-green-800 text-xs font-semibold">Excel</a>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
