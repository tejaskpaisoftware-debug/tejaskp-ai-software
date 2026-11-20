"use client";

import { useState, useRef, useEffect } from "react";
// AdminSidebar removed (handled by layout)
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import JoiningLetterTemplate, { CustomFieldItem, JoiningLetterTheme, THEME_CONFIGS } from "@/components/documents/JoiningLetterTemplate";
import { formatDistanceStrict } from "date-fns";

export default function JoiningLetterPage() {
    // Form State
    const initialFormState = {
        userId: "",
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
        managerDesignation: "Founder and CEO",
        customFields: [] as CustomFieldItem[],
        theme: "official" as JoiningLetterTheme
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedTheme, setSelectedTheme] = useState<JoiningLetterTheme>("official");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const letterRef = useRef<HTMLDivElement>(null);

    const handleAddCustomField = () => {
        const newField: CustomFieldItem = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
            category: "enrollment",
            label: "Enrollment Number",
            value: "",
            placement: "header"
        };
        setFormData(prev => ({
            ...prev,
            customFields: [...(prev.customFields || []), newField]
        }));
    };

    const handleRemoveCustomField = (id: string) => {
        setFormData(prev => ({
            ...prev,
            customFields: (prev.customFields || []).filter(f => f.id !== id)
        }));
    };

    const handleCategoryChange = (id: string, category: "enrollment" | "sp_id" | "paid_stipend" | "custom") => {
        setFormData(prev => {
            const fields = (prev.customFields || []).map(f => {
                if (f.id !== id) return f;
                let label = f.label;
                let placement = f.placement;
                if (category === "enrollment") {
                    label = "Enrollment Number";
                    placement = "header";
                } else if (category === "sp_id") {
                    label = "SP ID";
                    placement = "header";
                } else if (category === "paid_stipend") {
                    label = "Monthly Stipend";
                    placement = "details";
                } else if (category === "custom") {
                    label = "";
                    placement = "details";
                }
                return {
                    ...f,
                    category,
                    label,
                    placement
                };
            });
            return { ...prev, customFields: fields };
        });
    };

    const handleFieldUpdate = (id: string, key: "label" | "value" | "placement", val: string) => {
        setFormData(prev => {
            const fields = (prev.customFields || []).map(f => {
                if (f.id !== id) return f;
                return { ...f, [key]: val };
            });
            return { ...prev, customFields: fields };
        });
    };

    // Verify on Load if userId is present (View/Create Mode)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        if (userId) {
            setFormData(prev => ({ ...prev, userId })); // Store userId immediately
            fetchLetterByUserId(userId);
        }
    }, []);

    const fetchLetterByUserId = async (userId: string) => {
        setIsVerifying(true);
        try {
            // 1. Try fetching existing letter
            const res = await fetch(`/api/admin/documents/joining-letter?userId=${userId}&t=${new Date().getTime()}`);
            const data = await res.json();

            if (data.success && data.letter) {
                setFormData(prev => ({ ...prev, ...data.letter, userId }));
                if (data.letter.theme) {
                    setSelectedTheme(data.letter.theme);
                }
                setStep('create');
            } else {
                // 2. If no letter, try fetching user details to pre-fill
                const userRes = await fetch(`/api/admin/users/${userId}`);
                const userData = await userRes.json();

                if (userData.user) {
                    setFormData(prev => ({
                        ...prev,
                        userId, // Ensure preserved
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
                body: JSON.stringify({ ...formData, theme: selectedTheme })
            });
            const data = await res.json();

            if (data.success) {
                let msg = "Letter saved successfully!";
                if (data.linkedUser) msg += " (Linked to User)";
                if (data.syncError) msg += `\n\nWARNING: User Profile NOT updated: ${data.syncError}`;
                else if (data.linkedUser) msg += "\nUser Profile Updated.";

                alert(msg);
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
        if (confirm("Clear form?")) {
            setFormData(initialFormState);
            setSelectedTheme("official");
        }
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
                    userId: data.user.id, // Capture User ID (Critical for Sync)
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
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-4 text-xl">
                        📄
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Verify Candidate</h2>
                    <p className="text-slate-500 mb-6 text-xs">Enter the registered candidate mobile number to prefill their details.</p>

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
                    {/* Bypass for pure manual creation */}
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
            <div className="w-full lg:w-[420px] bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs lg:sticky lg:top-6 shrink-0">
                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Joining Letter Details</h2>
                        <p className="text-xs text-slate-500">Configure internship information</p>
                    </div>
                    <button onClick={() => setStep('verify')} className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        Change User
                    </button>
                </div>

                <div className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Theme Selector */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700">
                                Letter Theme Style
                            </label>
                            <span className="text-[10px] font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                                {THEME_CONFIGS[selectedTheme]?.name}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(Object.entries(THEME_CONFIGS) as [JoiningLetterTheme, typeof THEME_CONFIGS[JoiningLetterTheme]][]).map(([key, config]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setSelectedTheme(key);
                                        setFormData(prev => ({ ...prev, theme: key }));
                                    }}
                                    className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        selectedTheme === key
                                            ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-400/40"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs" style={{ backgroundColor: config.goldAccent }} />
                                    <span className="truncate">{config.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Candidate Name</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">University / College</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} placeholder="e.g. GTU" />
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Start Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">End Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                    </div>

                    {/* Calculated Duration Display */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Calculated Duration</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-amber-800 outline-hidden font-bold"
                            value={
                                (formData.startDate && formData.endDate)
                                    ? formatDistanceStrict(new Date(formData.startDate), new Date(formData.endDate))
                                    : "Select Dates..."
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Designation</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Internship Type</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.internshipType} onChange={e => setFormData({ ...formData, internshipType: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Stipend</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.stipend} onChange={e => setFormData({ ...formData, stipend: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Location</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Letter Date</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>

                    {/* CUSTOM FIELDS / EXTRA DETAILS */}
                    <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-700">Custom Fields</label>
                                <p className="text-[10px] text-slate-400">Enrollment No, SP ID, Stipend, etc.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCustomField}
                                className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            >
                                + Add Field
                            </button>
                        </div>

                        {(!formData.customFields || formData.customFields.length === 0) ? (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-2.5 text-center text-[11px] text-slate-500">
                                Click <span className="font-semibold text-amber-700">+ Add Field</span> to add Enrollment Number, SP ID, or Stipend details.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {formData.customFields.map((field) => (
                                    <div key={field.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <select
                                                value={field.category}
                                                onChange={e => handleCategoryChange(field.id, e.target.value as any)}
                                                className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 font-semibold focus:border-amber-500 outline-none flex-1"
                                            >
                                                <option value="enrollment">Enrollment Number</option>
                                                <option value="sp_id">SP ID</option>
                                                <option value="paid_stipend">Paid Internship with Monthly Stipend</option>
                                                <option value="custom">Custom Field...</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomField(field.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded font-bold text-xs transition-colors"
                                                title="Remove field"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {field.category === 'custom' && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Field Label (e.g. Project Title, Mentor)"
                                                    value={field.label}
                                                    onChange={e => handleFieldUpdate(field.id, 'label', e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={
                                                    field.category === 'enrollment' ? 'e.g. 210200107001' :
                                                    field.category === 'sp_id' ? 'e.g. SP202611' :
                                                    field.category === 'paid_stipend' ? 'e.g. ₹5,000 / month' :
                                                    'Enter Value'
                                                }
                                                value={field.value}
                                                onChange={e => handleFieldUpdate(field.id, 'value', e.target.value)}
                                                className="flex-1 bg-white border border-slate-300 rounded-md p-1.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
                                            />

                                            {(field.category === 'enrollment' || field.category === 'sp_id' || field.category === 'custom') && (
                                                <select
                                                    value={field.placement || (field.category === 'custom' ? 'details' : 'header')}
                                                    onChange={e => handleFieldUpdate(field.id, 'placement', e.target.value as any)}
                                                    className="bg-white border border-slate-300 rounded-md px-1.5 py-1 text-[11px] text-slate-600 focus:border-amber-500 outline-none"
                                                    title="Placement"
                                                >
                                                    <option value="header">In Header</option>
                                                    <option value="details">In List</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
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
                    <button onClick={handleReset} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs transition-colors shadow-2xs">
                        + Add New Letter
                    </button>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW (A4) */}
            <div className="flex-1 w-full flex justify-center bg-slate-200/80 p-8 rounded-xl border border-slate-200 shadow-inner overflow-auto min-h-[850px]">
                <div className="shadow-2xl">
                    <JoiningLetterTemplate
                        ref={letterRef}
                        formData={formData}
                        formatDate={formatDate}
                        theme={selectedTheme}
                        duration={
                            (formData.startDate && formData.endDate)
                                ? formatDistanceStrict(new Date(formData.startDate), new Date(formData.endDate))
                                : "3 months"
                        }
                    />
                </div>
            </div>

        </div>
    );

}
