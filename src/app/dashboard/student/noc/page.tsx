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
            if (data.success && data.document) {
                setExistingDoc(data.document);
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

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">NOC Submission</h1>
                <p className="text-gray-400 mb-8">Upload your No Objection Certificate (NOC) PDF here.</p>

                {existingDoc ? (
                    <div className="bg-card border border-theme rounded-xl p-8 text-center animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            {existingDoc.status === 'APPROVED' ? '✅' : existingDoc.status === 'REJECTED' ? '❌' : '⏳'}
                        </div>
                        <h2 className="text-xl font-bold mb-2">
                            {existingDoc.status === 'APPROVED' ? 'NOC Approved' : existingDoc.status === 'REJECTED' ? 'NOC Rejected' : 'Submission Received'}
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {existingDoc.status === 'PENDING' && "Your document is under review by the admin."}
                            {existingDoc.status === 'APPROVED' && "Your NOC has been verified and approved."}
                            {existingDoc.status === 'REJECTED' && "Please contact admin or re-upload if enabled."}
                        </p>

                        <div className="bg-background/50 p-4 rounded flex items-center gap-4 text-left max-w-md mx-auto">
                            <FileText className="text-gold-500 shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold truncate text-gray-300">{existingDoc.fileName}</p>
                                <p className="text-xs text-gray-500">{new Date(existingDoc.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`ml-auto text-xs px-2 py-1 rounded font-bold ${existingDoc.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                existingDoc.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {existingDoc.status}
                            </span>
                        </div>

                        {existingDoc.status === 'REJECTED' && (
                            <button
                                onClick={() => setExistingDoc(null)}
                                className="mt-6 text-sm text-gold-500 underline hover:text-white"
                            >
                                Upload New Document
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-card border border-theme rounded-xl p-8">
                        <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center bg-background/30 hover:bg-background/50 transition-colors">
                            <Upload className="text-gold-500 mb-4 h-10 w-10" />
                            <h3 className="text-lg font-bold">Upload PDF</h3>
                            <p className="text-sm text-gray-500 mb-6">Max size: 5MB</p>

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
                                    className="px-6 py-2 bg-gold-500 text-black font-bold rounded cursor-pointer hover:bg-gold-400"
                                >
                                    Select File
                                </label>
                            ) : (
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="text-gold-500" />
                                    <span className="text-sm">{file.name}</span>
                                    <button onClick={() => setFile(null)} className="text-red-500 ml-2 hover:text-white"><AlertCircle size={16} /></button>
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
            </div>
        </div>
    );
}
