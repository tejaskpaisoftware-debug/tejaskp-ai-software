import React, { forwardRef } from "react";

export type ExperienceTheme = "official" | "gold" | "navy" | "emerald" | "minimal" | "indigo";

export const THEME_CONFIGS: Record<ExperienceTheme, {
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

export interface ExperienceCertificateProps {
    formData: {
        name: string;
        email?: string;
        mobile?: string;
        internId?: string;
        refNo?: string;
        designation: string;
        department: string;
        startDate: string;
        endDate: string;
        duration?: string;
        technologies?: string;
        conductRemark?: string;
        date: string; // Issue Date
        theme?: ExperienceTheme;
    };
    formatDate: (date: string) => string;
    theme?: ExperienceTheme;
}

const ExperienceCertificateTemplate = forwardRef<HTMLDivElement, ExperienceCertificateProps>(({ formData, formatDate, theme }, ref) => {
    const selectedTheme: ExperienceTheme = theme || formData.theme || "official";
    const t = THEME_CONFIGS[selectedTheme] || THEME_CONFIGS.official;

    const internId = formData.internId || "TKP-INT-2026";
    const refNo = formData.refNo || "TKP/EXP/2026/01";
    const durationText = formData.duration || "6 Months";
    const techStack = formData.technologies || "React.js, Next.js, Node.js, Tailwind CSS, REST APIs & Database Design";
    const conduct = formData.conductRemark || "sincere, dedicated, and hardworking with strong problem-solving skills and professional teamwork";

    return (
        <div
            id="experience-certificate"
            ref={ref}
            className="w-[794px] h-[1123px] bg-white text-slate-900 shadow-2xl relative overflow-hidden shrink-0 flex flex-col justify-between"
            style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
            {/* Top Right Decorative Swoop Banner */}
            <div className="absolute top-0 right-0 w-[420px] h-[135px] pointer-events-none z-10">
                <svg viewBox="0 0 420 135" className="w-full h-full" preserveAspectRatio="none">
                    <path
                        d="M 30,0 C 70,60 120,98 220,118 L 420,128 L 420,0 Z"
                        fill={t.goldAccent}
                    />
                    <path
                        d="M 52,0 C 88,58 135,94 235,113 L 420,122 L 420,0 Z"
                        fill={t.primaryNavy}
                    />
                </svg>
                <div className="absolute top-6 right-10 text-right z-20">
                    <p className="text-[11px] tracking-[0.24em] text-slate-200 font-semibold uppercase leading-tight">
                        PROFESSIONAL
                    </p>
                    <h2 className="text-[21px] font-black tracking-wider text-white uppercase mt-0.5 leading-tight">
                        EXPERIENCE LETTER
                    </h2>
                </div>
            </div>

            {/* Centered Watermark */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <div className="w-[300px] h-[300px] flex items-center justify-center opacity-[0.035]">
                    <img
                        src="/logo.jpg"
                        alt="Watermark Logo"
                        className="w-full h-full object-contain filter grayscale"
                    />
                </div>
            </div>

            {/* Document Content */}
            <div className="relative z-10 px-10 pt-8 pb-4 flex flex-col justify-between flex-1">
                {/* Header Block: Logo & Company Name */}
                <div>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 p-1.5 flex items-center justify-center bg-white rounded-lg shadow-sm border"
                            style={{ borderColor: t.goldAccent }}
                        >
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="border-l-2 pl-4" style={{ borderColor: t.goldAccent }}>
                            <h1 className="text-[20px] font-black tracking-wider text-slate-900 uppercase leading-none">
                                TEJASKP AI SOFTWARE
                            </h1>
                            <p className="text-[9.5px] tracking-[0.25em] text-slate-500 font-bold uppercase mt-1">
                                INNOVATIVE SOLUTIONS FOR FUTURE
                            </p>
                        </div>
                    </div>

                    {/* Metadata Bar: Ref No & Issue Date */}
                    <div className="mt-7 flex justify-between items-center border-b pb-3 border-slate-200">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                                Reference Number
                            </span>
                            <span className="text-[12px] font-mono font-bold text-slate-800">
                                {refNo}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                                Date of Issue
                            </span>
                            <span className="text-[12px] font-bold text-slate-800">
                                {formatDate(formData.date)}
                            </span>
                        </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center my-5">
                        <span
                            className="inline-block text-[14px] font-black uppercase tracking-[0.2em] px-6 py-1.5 rounded-full border shadow-xs"
                            style={{
                                color: t.primaryNavy,
                                borderColor: t.goldAccent,
                                backgroundColor: t.badgeBg
                            }}
                        >
                            TO WHOMSOEVER IT MAY CONCERN
                        </span>
                    </div>

                    {/* Formal Certificate Paragraph */}
                    <div className="space-y-3.5 text-[12.5px] leading-[1.75] text-slate-700 text-justify">
                        <p>
                            This is to certify that <strong className="text-slate-950 font-bold text-[13.5px] uppercase">{formData.name || "CANDIDATE NAME"}</strong> (Intern ID: <span className="font-mono font-bold text-slate-900">{internId}</span>) has successfully completed their <strong className="text-slate-900 font-bold">{durationText}</strong> Internship cum Practical Work Experience at <strong className="text-slate-900 font-bold">TEJASKP AI SOFTWARE</strong> from <strong className="text-slate-900">{formatDate(formData.startDate) || "START DATE"}</strong> to <strong className="text-slate-900">{formatDate(formData.endDate) || "END DATE"}</strong>.
                        </p>

                        {/* Structured Tenure & Role Summary Box */}
                        <div className="my-2 border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                                <div className="text-white px-3.5 py-1.5 flex items-center font-medium text-[11px]" style={{ backgroundColor: t.primaryNavy }}>
                                    Candidate Name:
                                </div>
                                <div className="px-3.5 py-1.5 bg-slate-50 font-bold text-slate-900 text-[11.5px] uppercase">
                                    {formData.name || "CANDIDATE NAME"}
                                </div>
                            </div>
                            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                                <div className="text-white px-3.5 py-1.5 flex items-center font-medium text-[11px]" style={{ backgroundColor: t.primaryNavy }}>
                                    Designation / Role:
                                </div>
                                <div className="px-3.5 py-1.5 bg-white font-medium text-slate-900 text-[11.5px]">
                                    {formData.designation || "Intern - Web Development & AI Solutions"}
                                </div>
                            </div>
                            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                                <div className="text-white px-3.5 py-1.5 flex items-center font-medium text-[11px]" style={{ backgroundColor: t.primaryNavy }}>
                                    Department:
                                </div>
                                <div className="px-3.5 py-1.5 bg-slate-50 font-medium text-slate-900 text-[11.5px]">
                                    {formData.department || "Software Engineering & IT"}
                                </div>
                            </div>
                            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                                <div className="text-white px-3.5 py-1.5 flex items-center font-medium text-[11px]" style={{ backgroundColor: t.primaryNavy }}>
                                    Tenure Period:
                                </div>
                                <div className="px-3.5 py-1.5 bg-white font-semibold text-slate-900 text-[11.5px]">
                                    {formatDate(formData.startDate) || "START DATE"} to {formatDate(formData.endDate) || "END DATE"} ({durationText})
                                </div>
                            </div>
                            <div className="grid grid-cols-[160px_1fr]">
                                <div className="text-white px-3.5 py-1.5 flex items-center font-medium text-[11px]" style={{ backgroundColor: t.primaryNavy }}>
                                    Work Location:
                                </div>
                                <div className="px-3.5 py-1.5 bg-slate-50 font-medium text-slate-900 text-[11.5px]">
                                    Vadodara, Gujarat (On-site / Offline)
                                </div>
                            </div>
                        </div>

                        {/* Work Profile & Key Responsibilities */}
                        <p>
                            During the tenure of their 6-month internship, <strong className="text-slate-900">{formData.name || "the candidate"}</strong> was an integral member of our technical development unit. They were assigned to live development workflows and actively participated in building responsive user interfaces, backend API services, and system optimization. They demonstrated hands-on technical proficiency in <span className="font-semibold text-slate-900">{techStack}</span>.
                        </p>

                        {/* Performance & Conduct Evaluation */}
                        <p>
                            Throughout their tenure, we found them to be <span className="font-semibold text-slate-900">{conduct}</span>. They exhibited a strong eagerness to learn, effectively collaborated in team discussions, and consistently met project delivery milestones with high quality and diligence.
                        </p>

                        {/* Relieving / Exit Clearance Clause */}
                        <p>
                            They have handed over all project responsibilities, code repositories, and company assets in accordance with our organization policies. There are no outstanding dues, and they stand formally relieved from their duties upon successful completion of their tenure.
                        </p>

                        <p>
                            We appreciate their hard work and dedication during their time with us, and we wish them great success and excellence in all their future academic and professional endeavors.
                        </p>
                    </div>
                </div>

                {/* Signatory & Authorization Row */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">Warm Regards,</p>
                        <p className="text-[13px] font-bold text-slate-900 mt-0.5">Tejas Patel</p>
                        <p className="text-[11px] text-slate-600">Founder & Director</p>
                        <p className="text-[11px] font-black tracking-wide mt-0.5" style={{ color: t.goldAccent }}>
                            TEJASKP AI SOFTWARE
                        </p>
                    </div>

                    {/* Official Signatory Stamp & Signature */}
                    <div className="text-center flex flex-col items-center">
                        <div className="h-10 flex items-center justify-center mb-0.5">
                            <img
                                src="/signature.png"
                                alt="Authorized Signatory"
                                className="h-full object-contain mix-blend-multiply"
                            />
                        </div>
                        <div className="w-36 border-t-2" style={{ borderColor: t.goldAccent }}></div>
                        <p className="text-[9.5px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
                            Authorized Signatory
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="relative z-20 shrink-0">
                <div className="h-[4px] w-full relative overflow-hidden" style={{ backgroundColor: t.goldAccent }}>
                    <div className="absolute top-0 right-0 w-32 h-full bg-white transform -skew-x-45"></div>
                </div>

                <div
                    className="px-8 py-3.5 flex justify-between items-center text-white"
                    style={{ backgroundColor: t.footerBg }}
                >
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                                </svg>
                                <span>+91 9104630598</span>
                            </div>

                            <span style={{ color: t.goldAccent }}>|</span>

                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                                <span>salesandmarketing@tejaskpaisoftware.com</span>
                            </div>

                            <span style={{ color: t.goldAccent }}>|</span>

                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                                <span>www.tejaskpaisoftware.com</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-300">
                            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: t.goldAccent }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span>pramukh vandana, 441/6, Makarpura GIDC, Makarpura, Vadodara, Gujarat 390010</span>
                        </div>
                    </div>

                    <div className="bg-white p-1 rounded-sm shadow-md border" style={{ borderColor: t.goldAccent }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://tejaskpaisoftware.com')}`}
                            alt="QR"
                            className="w-[60px] h-[60px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

ExperienceCertificateTemplate.displayName = "ExperienceCertificateTemplate";

export default ExperienceCertificateTemplate;
