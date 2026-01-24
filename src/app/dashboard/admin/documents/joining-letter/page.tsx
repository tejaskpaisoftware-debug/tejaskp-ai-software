"use client";

import { useState, useRef, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import JoiningLetterTemplate from "@/components/documents/JoiningLetterTemplate";
import { formatDistanceStrict } from "date-fns";

export default function JoiningLetterPage() {
    // Form State
    const initialFormState = {
        name: "",
        university: "",
        email: "",
        mobile: "",
        date: new Date().toISOString().split('T')[0],
        startDate: "",
        endDate: "",
        designation: "Intern - Web Development Intern",
        internshipType: "Offline (On-site)",
        stipend: "Unpaid / Educational",
        location: "Vadodara, Gujarat",
        reportingManager: "Mr. Tejas Patel",
        managerDesignation: "Founder and CEO"
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const letterRef = useRef<HTMLDivElement>(null);

    // Verify on Load if userId is present (View/Create Mode)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        if (userId) {
            fetchLetterByUserId(userId);
        }
    }, []);

    const fetchLetterByUserId = async (userId: string) => {
        setIsVerifying(true);
        try {
            // 1. Try fetching existing letter
            const res = await fetch(`/api/admin/documents/joining-letter?userId=${userId}`);
            const data = await res.json();

            if (data.success && data.letter) {
                setFormData(prev => ({ ...prev, ...data.letter }));
                setStep('create');
            } else {
                // 2. If no letter, try fetching user details to pre-fill
                const userRes = await fetch(`/api/admin/users/${userId}`);
                const userData = await userRes.json();

                if (userData.user) {
                    setFormData(prev => ({
                        ...prev,
                        name: userData.user.name || "",
                        email: userData.user.email || "",
                        mobile: userData.user.mobile || "",
                        university: userData.user.university || userData.user.college || initialFormState.university,
                    }));
                    setStep('create'); // Skip verify screen, go strictly to form
                } else {
                    console.warn("User not found");
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleEmail = async () => {
        if (!formData.email) return alert("Please enter an email address first.");
        if (!letterRef.current) return;

        setIsSendingEmail(true);
        try {
            // Generate PDF Blob - Optimized for Email Speed (JPEG + Lower Ratio)
            const { toJpeg } = await import('html-to-image');
            const dataUrl = await toJpeg(letterRef.current, { quality: 0.8, pixelRatio: 1.5 });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            const pdfBase64 = pdf.output('datauristring');

            const res = await fetch('/api/admin/documents/joining-letter/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    university: formData.university || "N/A",
                    designation: formData.designation,
                    pdfBase64: pdfBase64,
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Email sent successfully!");
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/documents/joining-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                alert(data.linkedUser ? "Letter saved and linked!" : "Letter saved successfully!");
            } else {
                alert("Error saving letter: " + data.error);
            }
        } catch (error) {
            alert("Failed to save letter.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm("Clear form?")) setFormData(initialFormState);
    };

    // Format Date for Letter
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const { toPng } = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;

            if (letterRef.current) {
                // Highlighting the professional nature, ensure quality
                const dataUrl = await toPng(letterRef.current, { quality: 1.0, pixelRatio: 3 });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Joining_Letter_${formData.name.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const [step, setStep] = useState<'verify' | 'create'>('verify');
    const [verificationMobile, setVerificationMobile] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch(`/api/admin/documents/joining-letter?mobile=${verificationMobile}`);
            const data = await res.json();

            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    name: data.user.name || "",
                    email: data.user.email || "",
                    university: data.user.university || data.user.college || prev.university,
                    mobile: data.user.mobile || verificationMobile,
                    designation: data.user.designation || prev.designation,
                    stipend: data.user.stipend || prev.stipend,
                    startDate: data.user.startDate || prev.startDate,
                    endDate: data.user.endDate || prev.endDate,
                    internshipType: data.user.internshipType || prev.internshipType,
                }));
                if (data.hasExistingLetter) {
                    if (confirm("A letter already exists. Create new?")) setStep('create');
                } else {
                    setStep('create');
                }
            } else {
                alert("Verification failed: " + data.error);
            }
        } catch (error) {
            alert("Verification error.");
        } finally {
            setIsVerifying(false);
        }
    };

    if (step === 'verify') {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans pl-64 flex items-center justify-center">
                <AdminSidebar />
                <div className="bg-card/40 border border-theme rounded-xl p-8 backdrop-blur-sm w-[400px] text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Verify Candidate</h2>
                    <p className="text-gray-400 mb-6 text-sm">Enter the registered mobile number to proceed.</p>

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
                    {/* Bypass for pure manual creation */}
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
                <div className="w-[400px] bg-card/40 border border-theme rounded-xl p-6 backdrop-blur-sm sticky top-8 shrink-0">
                    <div className="flex justify-between items-center mb-6 border-b border-theme pb-4">
                        <h2 className="text-xl font-bold text-foreground">Letter Details</h2>
                        <button onClick={() => setStep('verify')} className="text-xs text-gray-500 hover:text-gold-theme">Change User</button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Inputs */}
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Candidate Name</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">University / College</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} placeholder="e.g. GTU" />
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

                        {/* Calculated Duration Display */}
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Calculated Duration</label>
                            <input
                                type="text"
                                readOnly
                                className="w-full bg-background/50 border border-theme rounded p-2 text-gold-400 focus:border-gold-500 outline-none font-bold"
                                value={
                                    (formData.startDate && formData.endDate)
                                        ? formatDistanceStrict(new Date(formData.startDate), new Date(formData.endDate))
                                        : "Select Dates..."
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Designation</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Internship Type</label>
                            <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.internshipType} onChange={e => setFormData({ ...formData, internshipType: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Stipend</label>
                                <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.stipend} onChange={e => setFormData({ ...formData, stipend: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Location</label>
                                <input type="text" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-1">Letter Date</label>
                            <input type="date" className="w-full bg-background/50 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>

                        {/* Buttons */}
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
                        <button onClick={handleReset} className="w-full mt-4 border border-theme text-gold-theme hover:bg-gold-500/10 font-medium py-2 rounded transition-colors">
                            + Add New Letter
                        </button>
                    </div>
                </div>

                {/* RIGHT: LIVE PREVIEW (A4) */}
                <div className="flex-1 flex justify-center bg-gray-900/50 p-8 rounded-xl border border-white/5 overflow-auto">
                    <JoiningLetterTemplate
                        ref={letterRef}
                        formData={formData}
                        formatDate={formatDate}
                        duration={
                            (formData.startDate && formData.endDate)
                                ? formatDistanceStrict(new Date(formData.startDate), new Date(formData.endDate))
                                : "3 months"
                        }
                    />
                </div>

            </main>
        </div>
    );
}
