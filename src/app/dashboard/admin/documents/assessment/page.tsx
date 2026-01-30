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
            const res = await fetch("/api/admin/documents/assessment");
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
            <h1 className="text-3xl font-black text-foreground">
                Assessment Submissions
            </h1>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card border border-theme p-4 rounded-xl backdrop-blur-md">
                <Search className="text-muted-foreground" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, mobile or course..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-foreground w-full placeholder-muted-foreground"
                />
            </div>

            {/* Table */}
            <div className="bg-card border border-theme rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-gold-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-6">Student</th>
                                <th className="p-6">Course</th>
                                <th className="p-6">Submission Date</th>
                                <th className="p-6">Document</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading submissions...</td></tr>
                            ) : filteredDocs.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No submissions found.</td></tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-bold text-foreground">{doc.user.name}</div>
                                            <div className="text-xs text-muted-foreground">{doc.user.mobile}</div>
                                            <div className="text-xs text-blue-500">{doc.user.email}</div>
                                        </td>
                                        <td className="p-6 text-muted-foreground font-medium">
                                            {doc.user.course || "N/A"}
                                        </td>
                                        <td className="p-6 text-muted-foreground text-sm">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                            <br />
                                            <span className="text-[10px] text-muted-foreground/70">{new Date(doc.createdAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => viewDocument(doc.fileUrl)}
                                                className="flex items-center gap-2 text-gold-500 hover:text-gold-400 hover:underline transition-all bg-transparent border-0 cursor-pointer"
                                            >
                                                <FileText size={16} />
                                                <span className="text-sm font-bold truncate max-w-[150px]">{doc.fileName || "View PDF"}</span>
                                            </button>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${doc.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            {doc.status === 'PENDING' || editingId === doc.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(doc.id, 'APPROVED')}
                                                        className="p-2 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                                                        className="p-2 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingId(doc.id)}
                                                    className="p-2 rounded hover:bg-theme/10 text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Edit Status"
                                                >
                                                    <Edit2 size={18} />
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
            {/* PDF Viewer Modal */}
            {viewingUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-5xl h-[85vh] bg-white rounded-lg overflow-hidden flex flex-col items-center relative">
                        <button
                            onClick={() => {
                                setViewingUrl(null);
                                if (viewingUrl.startsWith('blob:')) URL.revokeObjectURL(viewingUrl);
                            }}
                            className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-10 shadow-lg"
                        >
                            <X size={24} />
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
