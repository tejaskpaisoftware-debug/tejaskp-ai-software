import React, { forwardRef } from "react";

export type JoiningLetterTheme = "official" | "gold" | "navy" | "emerald" | "minimal" | "indigo";

export interface CustomFieldItem {
    id: string;
    category: "enrollment" | "sp_id" | "paid_stipend" | "custom";
    label: string;
    value: string;
    placement?: "header" | "details";
}

export const THEME_CONFIGS: Record<JoiningLetterTheme, {
    name: string;
    primaryNavy: string;
    goldAccent: string;
    tableHeaderBg: string;
    badgeBg: string;
    footerBg: string;
}> = {
    official: {
        name: "Official Tejaskp Design",
        primaryNavy: "#0A192F",
        goldAccent: "#D49520",
        tableHeaderBg: "#0B1B36",
        badgeBg: "#EBF3FE",
        footerBg: "#0A192F",
    },
    gold: {
        name: "Luxury Gold",
        primaryNavy: "#1A1A1A",
        goldAccent: "#B8860B",
        tableHeaderBg: "#1F1F1F",
        badgeBg: "#FEF9C3",
        footerBg: "#141414",
    },
    navy: {
        name: "Corporate Navy",
        primaryNavy: "#0F2942",
        goldAccent: "#3B82F6",
        tableHeaderBg: "#0F2942",
        badgeBg: "#EFF6FF",
        footerBg: "#0B1D30",
    },
    emerald: {
        name: "Emerald Executive",
        primaryNavy: "#064E3B",
        goldAccent: "#10B981",
        tableHeaderBg: "#064E3B",
        badgeBg: "#ECFDF5",
        footerBg: "#04382A",
    },
    minimal: {
        name: "Classic Minimal",
        primaryNavy: "#111827",
        goldAccent: "#4B5563",
        tableHeaderBg: "#1F2937",
        badgeBg: "#F3F4F6",
        footerBg: "#111827",
    },
    indigo: {
        name: "Tech Indigo",
        primaryNavy: "#1E1B4B",
        goldAccent: "#6366F1",
        tableHeaderBg: "#1E1B4B",
        badgeBg: "#EEF2FF",
        footerBg: "#131033",
    }
};

interface JoiningLetterProps {
    formData: {
        name: string;
        email: string;
        mobile: string;
        date: string;
        university?: string;
        startDate: string;
        endDate: string;
        designation: string;
        internshipType: string;
        stipend: string;
        location: string;
        reportingManager: string;
        managerDesignation: string;
        officeTiming?: string;
        customFields?: CustomFieldItem[];
        theme?: JoiningLetterTheme;
    };
    formatDate: (date: string) => string;
    duration: string;
    theme?: JoiningLetterTheme;
}

const JoiningLetterTemplate = forwardRef<HTMLDivElement, JoiningLetterProps>(({ formData, formatDate, duration, theme }, ref) => {
    const selectedTheme: JoiningLetterTheme = theme || formData.theme || "official";
    const t = THEME_CONFIGS[selectedTheme] || THEME_CONFIGS.official;

    // Process custom fields
    const customFields = formData.customFields || [];

    // Fields to show in Candidate info (Header)
    const headerFields = customFields.filter(f =>
        f.value && (f.placement === "header" || (!f.placement && (f.category === "enrollment" || f.category === "sp_id")))
    );

    // Fields to show in table
    const listFields = customFields.filter(f =>
        f.value && (f.placement === "details" || (!f.placement && f.category === "custom"))
    );

    // Custom Stipend handling
    const paidStipendField = customFields.find(f => f.category === "paid_stipend" && f.value);
    const stipendDisplay = paidStipendField
        ? `Paid (${paidStipendField.value})`
        : (formData.stipend || "Unpaid (Educational)");

    return (
        <div
            id="joining-letter"
            ref={ref}
            className="w-[794px] h-[1123px] bg-white text-slate-900 shadow-2xl relative overflow-hidden shrink-0 flex flex-col justify-between"
            style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
            {/* ================= TOP RIGHT DECORATIVE SWOOP BANNER ================= */}
            <div className="absolute top-0 right-0 w-[420px] h-[135px] pointer-events-none z-10">
                <svg viewBox="0 0 420 135" className="w-full h-full" preserveAspectRatio="none">
                    {/* Gold accent border wave */}
                    <path
                        d="M 30,0 C 70,60 120,98 220,118 L 420,128 L 420,0 Z"
                        fill={t.goldAccent}
                    />
                    {/* Navy main wave */}
                    <path
                        d="M 52,0 C 88,58 135,94 235,113 L 420,122 L 420,0 Z"
                        fill={t.primaryNavy}
                    />
                </svg>
                <div className="absolute top-6 right-10 text-right z-20">
                    <p className="text-[12px] tracking-[0.26em] text-slate-200 font-semibold uppercase leading-tight">
                        INTERNSHIP
                    </p>
                    <h2 className="text-[23px] font-black tracking-wider text-white uppercase mt-0.5 leading-tight">
                        OFFER LETTER
                    </h2>
                </div>
            </div>

            {/* ================= WATERMARK BACKGROUND (CENTERED IN MIDDLE, ULTRA-CLEAN & SUBTLE) ================= */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <div className="flex flex-col items-center opacity-[0.06] select-none">
                    <img
                        src="/assets/watermark-clean.png"
                        alt="Watermark"
                        className="w-[480px] h-[480px] object-contain"
                    />
                </div>
            </div>

            {/* ================= HEADER SECTION ================= */}
            <div>
                <div className="px-10 pt-7 pb-2 flex items-center relative z-20">
                    <div className="flex items-center gap-4">
                        {/* Logo Box with Gold Frame */}
                        <div
                            className="w-[72px] h-[72px] p-1.5 rounded-lg flex items-center justify-center bg-black border-2 shadow-sm"
                            style={{ borderColor: t.goldAccent }}
                        >
                            <img src="/logo.jpg" alt="Tejaskp AI Software" className="w-full h-full object-contain" />
                        </div>

                        {/* Gold Vertical Divider */}
                        <div className="w-[2px] h-14 bg-gradient-to-b from-[#D49520] to-[#E5A823]"></div>

                        {/* Company Name & Tagline */}
                        <div>
                            <h1 className="text-[23px] font-black tracking-wide text-[#0A192F] leading-none">
                                TEJASKP AI
                            </h1>
                            <h1
                                className="text-[23px] font-black tracking-wide leading-none mt-1"
                                style={{ color: t.goldAccent }}
                            >
                                SOFTWARE
                            </h1>
                            <p className="text-[9px] font-bold text-slate-600 tracking-[0.24em] uppercase mt-1.5">
                                INNOVATIVE SOLUTIONS FOR FUTURE
                            </p>
                        </div>
                    </div>
                </div>

                {/* Horizontal Gold Accent Line */}
                <div className="px-10">
                    <div
                        className="w-[440px] h-[3px] bg-gradient-to-r to-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, ${t.goldAccent}, transparent)` }}
                    ></div>
                </div>

                {/* ================= CANDIDATE & ISSUE DATE ROW ================= */}
                <div className="px-10 pt-5 pb-1 flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 mb-0.5">Presented to:</p>
                        <h3 className="text-[24px] font-black text-[#0A192F] uppercase tracking-wide leading-tight">
                            {formData.name || "CANDIDATE NAME"}
                        </h3>
                        {formData.university && (
                            <p className="text-[13px] text-slate-600 font-medium mt-0.5">{formData.university}</p>
                        )}
                        {(formData.email || formData.mobile) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-slate-600 font-medium mt-0.5">
                                {formData.email && (
                                    <span className="flex items-center gap-1">
                                        <span className="font-bold text-[#0A192F]">Email:</span>
                                        <span>{formData.email}</span>
                                    </span>
                                )}
                                {formData.email && formData.mobile && (
                                    <span className="text-slate-300 font-bold">•</span>
                                )}
                                {formData.mobile && (
                                    <span className="flex items-center gap-1">
                                        <span className="font-bold text-[#0A192F]">Mobile:</span>
                                        <span className="font-mono">{formData.mobile}</span>
                                    </span>
                                )}
                            </div>
                        )}
                        {headerFields.map(field => (
                            <p key={field.id} className="text-[12px] text-slate-600 font-medium mt-0.5">
                                <span className="font-bold text-[#0A192F]">{field.label}:</span> {field.value}
                            </p>
                        ))}
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                        {/* Calendar Icon Box */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-[#0A192F]">
                            <svg className="w-4.5 h-4.5 text-[#0A192F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-500 leading-tight">Issue Date:</p>
                            <p className="text-[13px] font-bold text-[#0A192F] leading-tight mt-0.5">
                                {formatDate(formData.date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= LETTER BODY & DETAILS TABLE ================= */}
                <div className="px-10 pt-3 relative z-10 text-[13px] text-slate-800 leading-relaxed">
                    <h4 className="text-[15px] font-bold text-[#0A192F] mb-2">
                        Subject: Offer for Internship
                    </h4>

                    <p className="font-bold text-[14px] text-slate-900 mb-1.5">
                        To Whom It May Concern:
                    </p>

                    <p className="text-[12.5px] text-slate-700 mb-2 leading-relaxed">
                        Following your application and selection, we are pleased to inform you that you have been
                        selected for the <span className="font-bold text-slate-900">{duration || "3 months"}</span> internship program at{" "}
                        <span className="font-bold" style={{ color: t.goldAccent }}>Tejaskp AI Software</span>.
                    </p>

                    <p className="text-[12.5px] font-semibold text-slate-700 mb-2.5">
                        Below are the internship details:
                    </p>

                    {/* TWO-COLUMN DETAILS TABLE (SOLID, CLEAN & SHARP) */}
                    <div className="w-[520px] border border-slate-300 rounded-xl overflow-hidden shadow-xs mb-3 text-[12px] bg-white">
                        {/* Row 1: Internship Type */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                                </svg>
                                <span>Internship Type:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formData.internshipType || "Offline (On-site)"}
                            </div>
                        </div>

                        {/* Row 2: Start Date */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Start Date:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formatDate(formData.startDate)}
                            </div>
                        </div>

                        {/* Row 3: End Date */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>End Date:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formatDate(formData.endDate)}
                            </div>
                        </div>

                        {/* Row 4: Working Days */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Working Days:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                Monday to Friday
                            </div>
                        </div>

                        {/* Row: Office Timing */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Office Timing:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formData.officeTiming || "10:30AM to 4:30PM"}
                            </div>
                        </div>

                        {/* Row 5: Reporting Mode */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <span>Reporting Mode:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                Daily updates and meetings
                            </div>
                        </div>

                        {/* Row 6: Reporting Manager */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>Reporting Manager:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formData.reportingManager || "Mr. Tejas Patel"}
                            </div>
                        </div>

                        {/* Row 7: Designation */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                                <span>Designation:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formData.designation || "Intern – Web Development Intern"}
                            </div>
                        </div>

                        {/* Row 8: Location */}
                        <div className="grid grid-cols-[180px_1fr] border-b border-slate-200">
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                    <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                <span>Location:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {formData.location || "Vadodara, Gujarat"}
                            </div>
                        </div>

                        {/* Row 9: Stipend */}
                        <div className={`grid grid-cols-[180px_1fr] ${listFields.length > 0 ? "border-b border-slate-200" : ""}`}>
                            <div
                                className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                style={{ backgroundColor: t.primaryNavy }}
                            >
                                <svg className="w-3.5 h-3.5 text-slate-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                                <span>Stipend:</span>
                            </div>
                            <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                {stipendDisplay}
                            </div>
                        </div>

                        {/* Additional custom list items */}
                        {listFields.map((field, idx) => (
                            <div
                                key={field.id}
                                className={`grid grid-cols-[180px_1fr] ${idx < listFields.length - 1 ? "border-b border-slate-200" : ""}`}
                            >
                                <div
                                    className="text-white px-3.5 py-1.5 flex items-center gap-2.5 font-medium border-r border-slate-700/30"
                                    style={{ backgroundColor: t.primaryNavy }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D49520]"></span>
                                    <span>{field.label}:</span>
                                </div>
                                <div className="px-3.5 py-1.5 font-semibold text-slate-800 bg-white">
                                    {field.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-[12px] text-slate-700 leading-relaxed mb-1">
                        You will be engaged in real-world project work, collaborating with team members, and
                        learning various industry-level tools and practices.
                    </p>
                    <p className="text-[12px] text-slate-700 leading-relaxed mb-6">
                        We hope you will give your best effort, contribute meaningfully, and use this opportunity
                        to sharpen your skills in IT and development.
                    </p>

                    {/* ================= MOTIVATIONAL BLUE BANNER ================= */}
                    <div
                        className="w-full rounded-xl py-2 px-4 flex items-center gap-3.5 mb-7 shadow-2xs border"
                        style={{ backgroundColor: t.badgeBg, borderColor: "#BFDBFE" }}
                    >
                        <span className="text-[20px] select-none">🏆</span>
                        <div className="w-[2px] h-6" style={{ backgroundColor: t.goldAccent }}></div>
                        <p className="text-[12px] font-semibold italic text-[#1E3A8A]">
                            We wish you a successful and rewarding internship journey with us!
                        </p>
                    </div>

                    {/* ================= SIGNATURE SECTION ================= */}
                    <div className="flex justify-between items-end pt-4 pb-2">
                        <div>
                            <p className="text-[12px] text-slate-600">Yours Sincerely,</p>
                            <p className="text-[13px] font-bold text-[#0A192F] mt-0.5">Human Resources</p>
                            <p
                                className="text-[12px] font-black tracking-wide mt-0.5"
                                style={{ color: t.goldAccent }}
                            >
                                TEJASKP AI SOFTWARE
                            </p>
                        </div>

                        <div className="text-center flex flex-col items-center">
                            <div className="h-10 flex items-center justify-center mb-0.5">
                                <img
                                    src="/signature.png"
                                    alt="Authorized Signatory"
                                    className="h-full object-contain mix-blend-multiply"
                                />
                            </div>
                            <div
                                className="w-36 border-t-2"
                                style={{ borderColor: t.goldAccent }}
                            ></div>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                Authorized Signatory
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= FOOTER SECTION ================= */}
            <div className="relative z-20 shrink-0">
                {/* Angled Gold Top Border / Accent */}
                <div className="h-[4px] w-full relative overflow-hidden" style={{ backgroundColor: t.goldAccent }}>
                    <div className="absolute top-0 right-0 w-32 h-full bg-white transform -skew-x-45"></div>
                </div>

                {/* Dark Navy Footer Container */}
                <div
                    className="px-8 py-3.5 flex justify-between items-center text-white"
                    style={{ backgroundColor: t.footerBg }}
                >
                    {/* Contact Details */}
                    <div className="space-y-1.5">
                        {/* Row 1: Phone | Email | Website */}
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-200">
                            {/* Phone */}
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                                </svg>
                                <span>+91 9104630598</span>
                            </div>

                            <span style={{ color: t.goldAccent }}>|</span>

                            {/* Email */}
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                                <span>tejaspatel@tejaskpaisoftware.com</span>
                            </div>

                            <span style={{ color: t.goldAccent }}>|</span>

                            {/* Website */}
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                                <span>www.tejaskpaisoftware.com</span>
                            </div>
                        </div>

                        {/* Row 2: Location Address */}
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-300">
                            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span>pramukh vandana, 441/6, Makarpura GIDC, Makarpura, Vadodara, Gujarat 390010</span>
                        </div>
                    </div>

                    {/* QR Code on Far Right */}
                    <div className="bg-white p-1 rounded-sm shadow-md border" style={{ borderColor: t.goldAccent }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://tejaskpaisoftware.com')}`}
                            alt="QR"
                            className="w-[64px] h-[64px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

JoiningLetterTemplate.displayName = "JoiningLetterTemplate";

export default JoiningLetterTemplate;
