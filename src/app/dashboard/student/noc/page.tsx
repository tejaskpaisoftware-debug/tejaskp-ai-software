"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentNOCPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [existingDoc, setExistingDoc] = useState<any>(null);
    const [error, setError] = useState("");

    const [history, setHistory] = useState<any[]>([]);

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
            const res = await fetch(`/api/student/documents/noc?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                if (data.document) setExistingDoc(data.document);
                if (data.documents) setHistory(data.documents);
            }
        } catch (e) {
            console.error("Failed to fetch status");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            if (f.type !== "application/pdf") {
                setError("Only PDF files are allowed.");
                setFile(null);
                return;
            }
            setError("");
            setFile(f);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;
        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user.id);

            const res = await fetch("/api/student/documents/noc", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setExistingDoc(data.document);
                fetchStatus(user.id); // Refresh history
                setFile(null);
            } else {
                setError(data.error || "Upload failed");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gold-500 hover:text-gold-400 mb-8 transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="max-w-4xl mx-auto space-y-12">
                <section>
                    <h1 className="text-3xl font-bold mb-2">NOC Submission</h1>
                    <p className="text-muted-foreground mb-8">Upload your No Objection Certificate (NOC) PDF here.</p>

                    {existingDoc ? (
                        <div className="bg-card border border-theme rounded-xl p-8 text-center animate-in fade-in zoom-in">
                            <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                                {existingDoc.status === 'APPROVED' ? '✅' : existingDoc.status === 'REJECTED' ? '❌' : '⏳'}
                            </div>
                            <h2 className="text-xl font-bold mb-2">
                                {existingDoc.status === 'APPROVED' ? 'NOC Approved' : existingDoc.status === 'REJECTED' ? 'NOC Rejected' : 'Submission Received'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {existingDoc.status === 'PENDING' && "Your document is under review by the admin."}
                                {existingDoc.status === 'APPROVED' && "Your NOC has been verified and approved."}
                                {existingDoc.status === 'REJECTED' && "Please contact admin or re-upload if enabled."}
                            </p>

                            <div className="bg-background/50 p-4 rounded flex items-center gap-4 text-left max-w-md mx-auto">
                                <FileText className="text-gold-500 shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold truncate text-foreground">{existingDoc.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(existingDoc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`ml-auto text-xs px-2 py-1 rounded font-bold ${existingDoc.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                    existingDoc.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {existingDoc.status}
                                </span>
                            </div>

                            <a
                                href={existingDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-4 text-sm text-gold-500 hover:text-gold-400 font-bold underline"
                            >
                                View Submitted Document
                            </a>

                            {existingDoc.status === 'REJECTED' && (
                                <button
                                    onClick={() => setExistingDoc(null)}
                                    className="block mx-auto mt-6 text-sm text-muted-foreground underline hover:text-foreground"
                                >
                                    Upload New Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-card border border-theme rounded-xl p-8">
                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-10 flex flex-col items-center justify-center bg-background/30 hover:bg-background/50 transition-colors">
                                <Upload className="text-gold-500 mb-4 h-10 w-10" />
                                <h3 className="text-lg font-bold">Upload PDF</h3>

                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="noc-upload"
                                />

                                {!file ? (
                                    <label
                                        htmlFor="noc-upload"
                                        className="mt-4 px-6 py-2 bg-gold-500 text-black font-bold rounded cursor-pointer hover:bg-gold-400"
                                    >
                                        Select File
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-2 mt-4 mb-4">
                                        <FileText className="text-gold-500" />
                                        <span className="text-sm">{file.name}</span>
                                        <button onClick={() => setFile(null)} className="text-red-500 ml-2 hover:text-foreground"><AlertCircle size={16} /></button>
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                            {file && (
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full mt-6 bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 disabled:opacity-50 transition-colors"
                                >
                                    {uploading ? "Uploading..." : "Submit NOC"}
                                </button>
                            )}
                        </div>
                    )}
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
                                                {doc.fileName || "NOC Document"}
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
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gold-500 hover:text-gold-400 text-sm font-bold underline"
                                                >
                                                    View
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
