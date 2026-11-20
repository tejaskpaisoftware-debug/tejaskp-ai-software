"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, XCircle, FileText, Search, Edit2, X } from "lucide-react";

export default function AdminAssessmentPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch("/api/admin/documents/assessment", { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (e) {
            console.error("Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        // Optimistic UI
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
        setEditingId(null);

        try {
            const res = await fetch("/api/admin/documents/assessment", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch (e) {
            alert("Failed to update status");
            fetchDocuments(); // Revert on error
        }
    };

    // Helper to safely view Base64 PDF
    const viewDocument = (base64Url: string) => {
        if (!base64Url) return;

        // If it's a regular URL (not base64), just open it
        if (!base64Url.startsWith('data:')) {
            window.open(base64Url, '_blank');
            return;
        }

        try {
            if (base64Url.startsWith('data:')) {
                const arr = base64Url.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const url = URL.createObjectURL(blob);
                setViewingUrl(url);
            } else {
                setViewingUrl(base64Url);
            }
        } catch (e) {
            console.error("PDF View Error:", e);
            alert("Could not open document. Try downloading it.");
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.user.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.user.mobile.includes(search) ||
        doc.user.course?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Assessment Submissions
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Review, verify, and approve candidate assessment documents</p>
                </div>
                <button
                    onClick={fetchDocuments}
                    className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
                >
                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh List
                </button>
            </header>

            {/* Filters */}
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-xl shadow-xs">
                <Search className="text-slate-400 ml-1" size={18} />
                <input
                    type="text"
                    placeholder="Search by candidate name, mobile or course..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-slate-900 w-full placeholder-slate-400 text-xs sm:text-sm"
                />
            </div>

            {/* Table (Desktop) */}
            <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="p-4 pl-6">Student</th>
                                <th className="p-4">Course</th>
                                <th className="p-4">Submission Date</th>
                                <th className="p-4">Document</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading submissions...</td></tr>
                            ) : filteredDocs.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No submissions found.</td></tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-semibold text-slate-900 text-sm">{doc.user.name}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{doc.user.mobile}</div>
                                            <div className="text-[11px] text-blue-600">{doc.user.email}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {doc.user.course || "N/A"}
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                            <div className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => viewDocument(doc.fileUrl)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                            >
                                                <FileText size={14} />
                                                <span className="truncate max-w-[150px]">{doc.fileName || "View PDF"}</span>
                                            </button>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-1.5">
                                            {doc.status === 'PENDING' || editingId === doc.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(doc.id, 'APPROVED')}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingId(doc.id)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Edit Status"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards (Visible only on mobile) */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 py-8 text-xs">Loading...</div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center text-slate-400 py-8 text-xs">No submissions found.</div>
                ) : (
                    filteredDocs.map((doc) => (
                        <div key={doc.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{doc.user.name}</h3>
                                    <p className="text-xs text-slate-500">{doc.user.course || "N/A"}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                    {doc.status}
                                </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-0.5">
                                <p>{doc.user.mobile}</p>
                                <p className="text-blue-600">{doc.user.email}</p>
                                <p className="text-slate-400 text-[10px]">{new Date(doc.createdAt).toLocaleDateString()} at {new Date(doc.createdAt).toLocaleTimeString()}</p>
                            </div>

                            <button
                                onClick={() => viewDocument(doc.fileUrl)}
                                className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200"
                            >
                                <FileText size={16} />
                                <span className="text-xs font-semibold truncate flex-1">{doc.fileName || "View PDF"}</span>
                            </button>

                            {(doc.status === 'PENDING' || editingId === doc.id) && (
                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => handleStatusUpdate(doc.id, 'APPROVED')}
                                        className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                                        className="flex-1 bg-rose-50 text-rose-700 py-2 rounded-lg font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* PDF Viewer Modal */}
            {viewingUrl && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl overflow-hidden flex flex-col items-center relative shadow-2xl border border-slate-200">
                        <button
                            onClick={() => {
                                setViewingUrl(null);
                                if (viewingUrl.startsWith('blob:')) URL.revokeObjectURL(viewingUrl);
                            }}
                            className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-950 z-10 shadow-lg"
                        >
                            <X size={20} />
                        </button>
                        <iframe
                            src={viewingUrl}
                            className="w-full h-full"
                            title="Document Viewer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
