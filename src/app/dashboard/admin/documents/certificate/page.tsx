"use client";

import { useState, useRef, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import CertificateTemplate from "@/components/documents/CertificateTemplate";
import { formatDistanceStrict } from "date-fns";

export default function CertificatePage() {
    // Form State
    const initialFormState = {
        name: "",
        email: "",
        mobile: "",
        date: new Date().toISOString().split('T')[0], // Issue Date
        startDate: "",
        endDate: "",
        customDuration: "", // Allow manual override
        course: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/documents/certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    duration: getDurationText()
                })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.linkedUser ? "Certificate saved and linked!" : "Certificate saved successfully!");
            } else {
                alert("Error saving: " + data.error);
            }
        } catch (error) {
            alert("Failed to save certificate.");
        } finally {
            setIsSaving(false);
        }
    };

    // Verification State
    const [step, setStep] = useState<'verify' | 'create'>('verify');
    const [verificationMobile, setVerificationMobile] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const certificateRef = useRef<HTMLDivElement>(null);

    // URL Params for Auto-Fetch
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get('userId');
            if (userId) {
                fetchUserDetailsDirectly(userId);
            }
        }
    }, []);

    const fetchUserDetailsDirectly = async (userId: string) => {
        setIsVerifying(true);
        try {
            const res = await fetch(`/api/admin/documents/joining-letter?userId=${userId}&generate=true`);
            const data = await res.json();

            if (data.success && data.user) {
                setFormData(prev => ({
                    ...prev,
                    name: data.user.name || "",
                    email: data.user.email || "",
                    startDate: data.user.startDate || prev.startDate,
                    endDate: data.user.endDate || prev.endDate,
                    course: data.user.course || "",
                }));
                if (data.user.mobile) setVerificationMobile(data.user.mobile);
                setStep('create');
            } else {
                alert("User not found: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Verification error.");
        } finally {
            setIsVerifying(false);
        }
    }


    // Reusing existing API for fetching user details.
    // NOTE: The backend API already supports 'userId' so we can reuse "/api/admin/documents/joining-letter?mobile=" or "?userId="
    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            // Reusing existing API for fetching user details
            const res = await fetch(`/api/admin/documents/joining-letter?mobile=${verificationMobile}`);
            const data = await res.json();

            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    name: data.user.name || "",
                    email: data.user.email || "",
                    startDate: data.user.startDate || prev.startDate,
                    endDate: data.user.endDate || prev.endDate,
                    course: data.user.course || "",
                }));
                setStep('create');
            } else {
                alert("User not found: " + data.error);
            }
        } catch (error) {
            alert("Verification error.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const { toPng } = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;

            if (certificateRef.current) {
                // Landscape A4
                const dataUrl = await toPng(certificateRef.current, { quality: 1.0, pixelRatio: 3 });
                const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for Landscape
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Certificate_${formData.name.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEmail = async () => {
        if (!formData.email) return alert("Please enter an email address first.");
        if (!certificateRef.current) return;

        setIsSendingEmail(true);
        try {
            // Generate PDF Blob - Optimized for Email Speed
            const { toJpeg } = await import('html-to-image');
            const dataUrl = await toJpeg(certificateRef.current, { quality: 0.8, pixelRatio: 1.5 });

            const jsPDF = (await import('jspdf')).default;
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            const pdfBase64 = pdf.output('datauristring');

            const res = await fetch('/api/admin/documents/certificate/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    course: formData.course,
                    duration: getDurationText(),
                    pdfBase64: pdfBase64,
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Certificate sent successfully!");
            } else {
                alert("Failed to send email: " + data.error);
            }

        } catch (error) {
            console.error("Email Error:", error);
            alert("Error sending email.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const getDurationText = () => {
        if (formData.customDuration) return formData.customDuration;
        if (formData.startDate && formData.endDate) {
            try {
                // Format: "May-June year 2025" or similar based on date-fns
                // User example: "May-June year 2025"
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                const startMonth = start.toLocaleString('default', { month: 'long' });
                const endMonth = end.toLocaleString('default', { month: 'long' });
                const year = end.getFullYear();

                // If same year
                if (start.getFullYear() === end.getFullYear()) {
                    return `${startMonth}-${endMonth} year ${year}`;
                }
                return `${startMonth} ${start.getFullYear()} - ${endMonth} ${year}`;

            } catch (e) { return "" }
        }
        return "Duration not set";
    };

    if (step === 'verify') {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans pl-64 flex items-center justify-center">
                <AdminSidebar />
                <div className="bg-card/40 border border-theme rounded-xl p-8 backdrop-blur-sm w-[400px] text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Generate Certificate</h2>
                    <p className="text-gray-400 mb-6 text-sm">Enter mobile number to fetch candidate.</p>

                    <input
                        type="text"
                        placeholder="Enter Mobile Number"
                        className="w-full bg-background/50 border border-theme rounded p-3 text-foreground focus:border-gold-500 outline-none mb-6 text-center text-lg tracking-widest"
                        value={verificationMobile}
                        onChange={e => setVerificationMobile(e.target.value)}
                    />

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying || !verificationMobile}
                        className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold py-3 rounded transition-colors shadow-lg disabled:opacity-50"
                    >
                        {isVerifying ? "Verifying..." : "Verify & Proceed"}
                    </button>
                    <button onClick={() => setStep('create')} className="mt-4 text-xs text-gray-500 underline hover:text-foreground">Skip & Create Manually</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pl-64">
            <AdminSidebar />
            <main className="p-8 max-w-[1700px] mx-auto flex gap-8 items-start">

                {/* LEFT: FORM INPUTS */}
                <div className="w-[350px] bg-card/40 border border-theme rounded-xl p-6 backdrop-blur-sm sticky top-8 shrink-0">
                    <div className="flex justify-between items-center mb-6 border-b border-theme pb-4">
                        <h2 className="text-xl font-bold text-foreground">Details</h2>
                        <button onClick={() => setStep('verify')} className="text-xs text-gray-500 hover:text-gold-theme">Change User</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Candidate Name</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Email</label>
                                <input type="email" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Mobile</label>
                                <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Course / Internship Domain</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                placeholder="e.g. Full Stack Development"
                                value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Start Date</label>
                                <input type="date" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">End Date</label>
                                <input type="date" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Date Text Overlay (Auto)</label>
                            <input type="text" readOnly className="w-full bg-background/50 border border-theme rounded p-2 text-gray-400 focus:border-gold-500 outline-none"
                                value={getDurationText()} />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Custom Text Override</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-gold-200 focus:border-gold-500 outline-none"
                                placeholder="Overwrite auto text..."
                                value={formData.customDuration} onChange={e => setFormData({ ...formData, customDuration: e.target.value })} />
                        </div>

                        <hr className="border-gold-500/10 my-4" />

                        <div className="flex gap-4 mt-6">
                            <button onClick={handleSave} disabled={isSaving || isGenerating} className="flex-1 bg-green-600 hover:bg-green-700 text-foreground font-bold py-3 rounded transition-colors shadow-lg disabled:opacity-50">
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button onClick={handleDownload} disabled={isGenerating} className="flex-1 bg-gold-500 hover:bg-gold-400 text-obsidian font-bold py-3 rounded transition-colors shadow-lg disabled:opacity-50">
                                {isGenerating ? "Gen PDF" : "Download"}
                            </button>
                        </div>

                        <button onClick={handleEmail} disabled={isSendingEmail || isGenerating} className={`w-full mt-4 font-bold py-3 rounded transition-colors shadow-lg disabled:opacity-50 ${isSendingEmail ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-foreground"}`}>
                            {isSendingEmail ? "Sending..." : "Send Email to User"}
                        </button>
                    </div>
                </div>

                {/* RIGHT: LIVE PREVIEW (A4 Landscape) */}
                <div className="flex-1 flex justify-center bg-gray-900/50 p-8 rounded-xl border border-white/5 overflow-hidden relative">
                    <div className="scale-[0.65] origin-top shadow-2xl transform translate-y-4">
                        <CertificateTemplate
                            ref={certificateRef}
                            name={formData.name}
                            date={formData.date}
                            duration={getDurationText()}
                            course={formData.course}
                        />
                    </div>
                </div>

            </main>
        </div>
    );
}
