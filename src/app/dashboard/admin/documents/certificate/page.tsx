"use client";

import { useState, useRef, useEffect } from "react";
// AdminSidebar removed (handled by layout)
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
                    course: data.user.course || data.user.department || "",
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
                    course: data.user.course || data.user.department || "",
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

    const computeDuration = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return "";
        try {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const startMonth = start.toLocaleString('default', { month: 'long' });
            const endMonth = end.toLocaleString('default', { month: 'long' });
            const year = end.getFullYear();

            if (start.getFullYear() === end.getFullYear()) {
                return `${startMonth}-${endMonth} year ${year}`;
            }
            return `${startMonth} ${start.getFullYear()} - ${endMonth} ${year}`;
        } catch (e) {
            return "";
        }
    };

    const getDurationText = () => {
        if (formData.customDuration) return formData.customDuration;
        return computeDuration(formData.startDate, formData.endDate) || "Duration not set";
    };

    if (step === 'verify') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-4 text-xl">
                        🎓
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Generate Certificate</h2>
                    <p className="text-slate-500 mb-6 text-xs">Enter mobile number to fetch candidate and internship details.</p>

                    <input
                        type="text"
                        placeholder="10-digit Mobile Number"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden mb-5 text-center text-base tracking-widest font-mono transition-colors"
                        value={verificationMobile}
                        onChange={e => setVerificationMobile(e.target.value)}
                    />

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying || !verificationMobile}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-xs disabled:opacity-50 text-sm"
                    >
                        {isVerifying ? "Verifying..." : "Verify & Proceed"}
                    </button>
                    <button onClick={() => setStep('create')} className="mt-4 text-xs text-slate-500 hover:text-slate-900 underline block mx-auto">
                        Skip & Create Manually
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* LEFT: FORM INPUTS */}
            <div className="w-full lg:w-[380px] bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs lg:sticky lg:top-6 shrink-0">
                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Certificate Details</h2>
                        <p className="text-xs text-slate-500">Configure certificate parameters</p>
                    </div>
                    <button onClick={() => setStep('verify')} className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        Change User
                    </button>
                </div>

                <div className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Candidate Name</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Email</label>
                            <input type="email" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Mobile</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Course / Internship Domain</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            placeholder="e.g. Full Stack Development"
                            value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Start Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value, customDuration: "" })} />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">End Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value, customDuration: "" })} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                Date Text Overlay
                            </label>
                            {formData.customDuration && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, customDuration: "" })}
                                    className="text-[10px] text-amber-600 hover:text-amber-700 underline font-semibold"
                                >
                                    Reset to Auto
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors font-medium"
                            placeholder="e.g. November-December year 2026"
                            value={formData.customDuration !== "" ? formData.customDuration : computeDuration(formData.startDate, formData.endDate)}
                            onChange={e => setFormData({ ...formData, customDuration: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Issue Date</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>

                    <div className="flex gap-2.5 pt-3">
                        <button onClick={handleSave} disabled={isSaving || isGenerating} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-xs">
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={handleDownload} disabled={isGenerating} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-xs">
                            {isGenerating ? "Gen PDF" : "Download"}
                        </button>
                    </div>

                    <button onClick={handleEmail} disabled={isSendingEmail || isGenerating} className={`w-full font-bold py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-xs ${isSendingEmail ? "bg-slate-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                        {isSendingEmail ? "Sending..." : "✉ Send Email to User"}
                    </button>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW (A4 Landscape) */}
            <div className="flex-1 w-full flex justify-center items-start bg-slate-200/80 p-8 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative min-h-[600px]">
                <div className="scale-[0.62] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.72] xl:scale-[0.8] origin-top shadow-2xl">
                    <CertificateTemplate
                        ref={certificateRef}
                        name={formData.name}
                        date={formData.date}
                        duration={getDurationText()}
                        course={formData.course}
                    />
                </div>
            </div>

        </div>
    );

}
