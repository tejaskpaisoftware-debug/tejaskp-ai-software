"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, X, AlertCircle, XCircle } from "lucide-react";

export default function AssessmentSubmissionPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser");
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            fetchStatus(u.id);
        } else {
            router.push("/login");
        }
    }, [router]);

    const fetchStatus = async (userId: string) => {
        try {
            const res = await fetch(`/api/student/documents/assessment?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                setHistory(data.documents);
            }
        } catch (e) {
            console.error("Failed to fetch status");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter(f => f.type === "application/pdf");

            if (validFiles.length !== newFiles.length) {
                setError("Some files were skipped. Only PDF files are allowed.");
            } else {
                setError("");
            }

            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !user) return;
        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append("files", file);
            });
            formData.append("userId", user.id);

            const res = await fetch("/api/student/documents/assessment", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                fetchStatus(user.id);
                setFiles([]);
                alert("Assessments uploaded successfully!");
            } else {
                setError(data.error || "Upload failed");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setUploading(false);
        }
    };

    const viewDocument = (base64Url: string) => {
        if (!base64Url) return;
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
            alert("Could not open document.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gold-500 hover:text-gold-400 mb-8 transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="max-w-4xl mx-auto space-y-12">
                <section>
                    <h1 className="text-3xl font-bold mb-2">Assessment Submission</h1>
                    <p className="text-muted-foreground mb-8">Upload your assessment documents (PDFs). You can upload multiple files.</p>

                    <div className="bg-card border border-theme rounded-xl p-8">
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-10 flex flex-col items-center justify-center bg-background/30 hover:bg-background/50 transition-colors relative">
                            <Upload className="text-gold-500 mb-4 h-10 w-10" />
                            <h3 className="text-lg font-bold">Upload PDFs</h3>
                            <p className="text-xs text-muted-foreground mt-2">Multiple files allowed</p>

                            <input
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                        {files.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Selected Files</h4>
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-background/50 p-3 rounded border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-gold-500" />
                                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-400">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full mt-6 bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 disabled:opacity-50 transition-colors"
                                >
                                    {uploading ? "Uploading..." : `Submit ${files.length} Assessment(s)`}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {history.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Submission History</h2>
                        <div className="bg-card border border-theme rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">File Name</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {history.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-muted/20">
                                            <td className="p-4 text-sm text-foreground">
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                                <div className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate" title={doc.fileName}>
                                                {doc.fileName || "Assessment Document"}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${doc.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                                    doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => viewDocument(doc.fileUrl)}
                                                    className="text-gold-500 hover:text-gold-400 text-sm font-bold underline bg-transparent border-0 cursor-pointer"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
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
                            <XCircle size={24} />
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
