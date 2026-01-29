"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, XCircle, FileText, Search, Edit2 } from "lucide-react";

export default function AdminNocPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch("/api/admin/documents/noc");
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
            const res = await fetch("/api/admin/documents/noc", {
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

        // Convert Base64 to Blob for reliable opening
        const win = window.open();
        if (win) {
            win.document.write(
                `<iframe src="${base64Url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
            );
            win.document.title = "NOC Document Viewer";
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
                NOC Submissions
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
                                                <span className="text-sm font-bold">View PDF</span>
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
        </div>
    );
}
