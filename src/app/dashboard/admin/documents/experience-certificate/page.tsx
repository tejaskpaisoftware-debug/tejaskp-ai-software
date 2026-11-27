"use client";

import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import ExperienceCertificateTemplate, {
    ExperienceTheme,
    THEME_CONFIGS
} from "@/components/documents/ExperienceCertificateTemplate";
import { formatDistanceStrict } from "date-fns";

export default function ExperienceCertificatePage() {
    const todayStr = new Date().toISOString().split("T")[0];

    const initialFormState = {
        name: "",
        email: "",
        mobile: "",
        internId: "TKP-INT-2026",
        refNo: "TKP/EXP/2026/01",
        date: todayStr,
        startDate: "",
        endDate: "",
        customDuration: "6 Months",
        designation: "Intern - Web Development & AI Solutions",
        department: "Software Engineering & IT",
        technologies: "React.js, Next.js, Node.js, Tailwind CSS, REST APIs & Database Design",
        conductRemark: "sincere, dedicated, and hardworking with strong problem-solving skills and professional teamwork",
        theme: "official" as ExperienceTheme,
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedTheme, setSelectedTheme] = useState<ExperienceTheme>("official");
    const [step, setStep] = useState<"verify" | "create">("verify");
    const [verificationMobile, setVerificationMobile] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const docRef = useRef<HTMLDivElement>(null);

    // Auto-fetch if query param present
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get("userId");
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
                populateUser(data.user);
            } else {
                alert("User not found: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Verification error.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationMobile) return;
        setIsVerifying(true);
        try {
            const res = await fetch(`/api/admin/documents/joining-letter?mobile=${verificationMobile}`);
            const data = await res.json();
            if (data.success && data.user) {
                populateUser(data.user);
            } else {
                alert("User not found with this mobile number.");
            }
        } catch (e) {
            console.error(e);
            alert("Verification failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    const populateUser = (user: any) => {
        const idNumber = user.id ? String(user.id).slice(-4) : Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
            mobile: user.mobile || "",
            startDate: user.startDate ? new Date(user.startDate).toISOString().split("T")[0] : prev.startDate,
            endDate: user.endDate ? new Date(user.endDate).toISOString().split("T")[0] : prev.endDate,
            internId: `TKP-INT-${idNumber}`,
            refNo: `TKP/EXP/2026/${idNumber}`,
            department: user.department || user.course || prev.department,
            designation: user.designation || (user.course ? `Intern - ${user.course}` : prev.designation),
        }));
        if (user.mobile) setVerificationMobile(user.mobile);
        setStep("create");
    };

    const formatDate = (d: string) => {
        if (!d) return "";
        try {
            const parts = d.split("-");
            if (parts.length === 3 && parts[0].length === 4) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const dt = new Date(year, month, day);
                if (!isNaN(dt.getTime())) {
                    return dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
                }
            }
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) {
                return dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
            }
        } catch (e) {}
        return d;
    };

    const getDurationText = () => {
        if (formData.customDuration) return formData.customDuration;
        if (formData.startDate && formData.endDate) {
            try {
                return formatDistanceStrict(new Date(formData.endDate), new Date(formData.startDate));
            } catch (e) {
                return "6 Months";
            }
        }
        return "6 Months";
    };

    const generatePdfBlob = async (): Promise<{ pdf: jsPDF; base64: string } | null> => {
        if (!docRef.current) return null;
        const dataUrl = await toPng(docRef.current, {
            quality: 1,
            pixelRatio: 3,
            cacheBust: true,
            skipFonts: false,
        });

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 210;
        const imgHeight = 297;
        pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
        const base64 = pdf.output("datauristring");
        return { pdf, base64 };
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const res = await generatePdfBlob();
            if (res) {
                const safeName = formData.name ? formData.name.replace(/\s+/g, "_") : "Candidate";
                res.pdf.save(`Experience_Certificate_${safeName}.pdf`);
            }
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!formData.email) {
            alert("Please provide candidate email address first.");
            return;
        }

        setIsSendingEmail(true);
        try {
            const pdfResult = await generatePdfBlob();
            if (!pdfResult) throw new Error("Could not generate PDF for email");

            const res = await fetch("/api/admin/documents/experience-certificate/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name || "Intern",
                    designation: formData.designation,
                    duration: getDurationText(),
                    pdfBase64: pdfResult.base64,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`✅ Experience Certificate successfully sent to ${formData.email}!`);
            } else {
                alert("Failed to send email: " + (data.error || "Unknown error"));
            }
        } catch (error: any) {
            console.error("Email sending error:", error);
            alert("Failed to send email: " + error.message);
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (step === "verify") {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
                        💼
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Generate Experience Certificate</h2>
                    <p className="text-slate-500 mb-6 text-xs">
                        Enter 10-digit mobile number to auto-fetch 6-month intern and project details.
                    </p>

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
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-xs disabled:opacity-50 text-sm cursor-pointer"
                    >
                        {isVerifying ? "Verifying..." : "Verify & Proceed"}
                    </button>
                    <button
                        onClick={() => setStep("create")}
                        className="mt-4 text-xs text-slate-500 hover:text-slate-900 underline block mx-auto cursor-pointer"
                    >
                        Skip & Create Manually
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start pb-16">
            {/* LEFT: FORM INPUTS */}
            <div className="w-full lg:w-[410px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6 shrink-0">
                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Experience Letter Details</h2>
                        <p className="text-xs text-slate-500">Configure 6-Month Experience & Relieving Certificate</p>
                    </div>
                    <button
                        onClick={() => setStep("verify")}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                        Change User
                    </button>
                </div>

                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Theme Selector */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                            Letter Theme Style
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(THEME_CONFIGS) as ExperienceTheme[]).map(key => {
                                const cfg = THEME_CONFIGS[key];
                                const isSelected = selectedTheme === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTheme(key);
                                            setFormData(prev => ({ ...prev, theme: key }));
                                        }}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            isSelected
                                                ? "border-amber-500 bg-slate-900 text-white font-bold shadow-xs"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.goldAccent }}></span>
                                        <span className="truncate">{cfg.name.split(" ")[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Candidate Name */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            Candidate Name
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
                            value={formData.name}
                            placeholder="e.g. Vijay Ghodadra"
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Intern ID & Reference Number */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Intern / Emp ID
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden font-mono"
                                value={formData.internId}
                                placeholder="TKP-INT-2026"
                                onChange={e => setFormData({ ...formData, internId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Reference No.
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden font-mono"
                                value={formData.refNo}
                                placeholder="TKP/EXP/2026/01"
                                onChange={e => setFormData({ ...formData, refNo: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Email & Mobile */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.email}
                                placeholder="candidate@gmail.com"
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Mobile
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.mobile}
                                placeholder="9876543210"
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Designation */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            Designation / Job Role
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                            value={formData.designation}
                            placeholder="e.g. Intern - Web Development & AI Solutions"
                            onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            Department
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                            value={formData.department}
                            placeholder="e.g. Software Engineering & IT"
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        />
                    </div>

                    {/* Dates: Start & End */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Duration & Issue Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Tenure Duration
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.customDuration}
                                placeholder="6 Months"
                                onChange={e => setFormData({ ...formData, customDuration: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Technologies & Responsibilities */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            Technologies / Responsibilities
                        </label>
                        <textarea
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden resize-none"
                            value={formData.technologies}
                            placeholder="React.js, Next.js, Node.js, Tailwind CSS, REST APIs..."
                            onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                        />
                    </div>

                    {/* Conduct & Performance Remark */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            Conduct & Performance Remark
                        </label>
                        <textarea
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white outline-hidden resize-none"
                            value={formData.conductRemark}
                            onChange={e => setFormData({ ...formData, conductRemark: e.target.value })}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col gap-2.5">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                        >
                            <span>📥</span>
                            {isGenerating ? "Generating PDF..." : "Download Official PDF"}
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail || !formData.email}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 border border-slate-700"
                        >
                            <span>✉️</span>
                            {isSendingEmail ? "Sending via Email..." : "Send Email to Candidate"}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="flex-1 overflow-auto flex justify-center bg-slate-100/80 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                <div className="scale-75 sm:scale-85 md:scale-95 lg:scale-100 origin-top shadow-2xl rounded-sm">
                    <ExperienceCertificateTemplate
                        ref={docRef}
                        formData={{
                            ...formData,
                            duration: getDurationText(),
                            theme: selectedTheme,
                        }}
                        formatDate={formatDate}
                        theme={selectedTheme}
                    />
                </div>
            </div>
        </div>
    );
}
