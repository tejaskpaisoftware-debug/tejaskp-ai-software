import React, { forwardRef } from "react";

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
    };
    formatDate: (date: string) => string;
    duration: string;
}

const JoiningLetterTemplate = forwardRef<HTMLDivElement, JoiningLetterProps>(({ formData, formatDate, duration }, ref) => {
    return (
        <div
            id="joining-letter"
            ref={ref}
            className="w-[794px] h-[1123px] bg-white text-black shadow-2xl relative overflow-hidden shrink-0 flex flex-col"
            style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
        >
            {/* 1. PROFESSIONAL HEADER - REDUCED PADDING */}
            <div className="px-12 pt-6 pb-2 flex justify-between items-center border-b-[3px] border-[#B8860B]">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 p-1">
                        <img src="/logo.jpg" alt="Tejaskp AI Software" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">TEJASKP AI</h1>
                        <h1 className="text-xl font-black uppercase tracking-wider text-[#B8860B]">SOFTWARE</h1>
                        <p className="text-[10px] text-gray-500 tracking-[0.2em] mt-1 uppercase">Innovative Solutions for Future</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-serif italic text-gray-200 font-bold select-none opacity-50">INTERNSHIP</h2>
                    <h2 className="text-base font-bold text-[#1a1a1a] uppercase tracking-widest mt-[-8px]">Offer Letter</h2>
                </div>
            </div>

            {/* 2. MAIN BODY WRAPPER - REDUCED SPACING */}
            <div className="flex-1 px-16 py-2 relative">
                {/* Watermark Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <img src="/logo.jpg" className="w-[400px] h-[400px] object-contain grayscale" alt="" />
                </div>

                {/* RECIPIENT & DATE ROW - COMPACT */}
                <div className="flex justify-between items-start mb-4 relative z-10 font-sans">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Presented To:</p>
                        <h3 className="text-lg font-bold text-[#1a1a1a] uppercase">{formData.name}</h3>
                        <p className="text-sm text-gray-700 font-medium">{formData.email}</p>
                        <p className="text-sm text-gray-700 font-medium">{formData.mobile}</p>
                        {formData.university && <p className="text-sm text-gray-700 font-medium">{formData.university}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Issue Date:</p>
                        <h3 className="text-base font-bold text-[#1a1a1a]">{formatDate(formData.date)}</h3>
                    </div>
                </div>

                {/* LETTER CONTENT - COMPACT */}
                <div className="text-[#2d2d2d] leading-6 text-[14px] relative z-10 font-[Arial,sans-serif]">
                    <div className="mb-4 font-bold text-[#1a1a1a] underline decoration-[#B8860B] underline-offset-4 text-sm">
                        Subject: Offer for Internship
                    </div>

                    <p className="font-bold mb-4 text-base">To Whom It May Concern:</p>

                    <p className="mb-4">
                        Following your application and selection, we are pleased to inform you that you have been
                        selected for the <span className="font-bold">{duration}</span> internship program at <span className="font-bold text-[#B8860B]">Tejaskp AI Software</span>.
                        <br />Below are the internship details:
                    </p>

                    <div className="ml-4 mb-2 font-medium text-[13px]">
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-baseline">
                            <span className="text-gray-800">1.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Internship Type:</span>
                                <span>{formData.internshipType}</span>
                            </div>

                            <span className="text-gray-800">2.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Start Date:</span>
                                <span>{formatDate(formData.startDate)}</span>
                            </div>

                            <span className="text-gray-800">3.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">End Date:</span>
                                <span>{formatDate(formData.endDate)}</span>
                            </div>

                            <span className="text-gray-800">4.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Working Days:</span>
                                <span>Monday to Friday</span>
                            </div>

                            <span className="text-gray-800">5.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Reporting Mode:</span>
                                <span>Daily updates and meetings</span>
                            </div>

                            <span className="text-gray-800">6.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Reporting Manager:</span>
                                <span>{formData.reportingManager}</span>
                            </div>

                            <span className="text-gray-800">7.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Designation:</span>
                                <span>{formData.designation}</span>
                            </div>

                            <span className="text-gray-800">8.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Location:</span>
                                <span>{formData.location}</span>
                            </div>

                            <span className="text-gray-800">9.</span>
                            <div className="grid grid-cols-[140px_1fr]">
                                <span className="font-bold text-[#1a1a1a]">Stipend:</span>
                                <span>{formData.stipend}</span>
                            </div>
                        </div>
                    </div>

                    <p className="mb-4">
                        You will be engaged in real-world project work, collaborating with team members, and
                        learning various industry-level tools and practices.
                    </p>
                    <p className="mb-2">
                        We hope you will give your best effort, contribute meaningfully, and use this opportunity
                        to sharpen your skills in IT and development.
                    </p>
                </div>
            </div>

            {/* 3. SIGNATURE SECTION - COMPACT */}
            <div className="px-16 pb-2 flex justify-between items-end relative z-10">
                <div className="text-sm font-sans text-gray-600">
                    <p>Yours Sincerely,</p>
                    <p className="font-bold text-[#1a1a1a] mt-1">Human Resources</p>
                </div>

                <div className="flex flex-col items-end text-right">
                    {/* Digital Signature Image */}
                    <div className="h-16 flex items-center justify-end mb-1">
                        <img
                            src="/signature.png"
                            alt="Authorized Signatory"
                            className="h-full object-contain mix-blend-multiply opacity-90"
                        />
                    </div>

                    <div className="border-t-2 border-gray-800 w-40 mt-1 pt-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] uppercase text-xs">Tejas Patel</h4>
                    <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-wide">Proprietor & CEO</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">Tejaskp AI Software</p>
                </div>
            </div>

            {/* 4. FOOTER - COMPACT */}
            <div className="px-12 pb-24 mt-auto relative">
                {/* Bottom Right Geometric Accents */}
                <div className="absolute bottom-0 right-0 w-[350px] h-[120px] pointer-events-none overflow-hidden">
                    <div className="absolute bottom-[35px] right-[-20px] w-[500px] h-[3px] bg-[#fbb034] z-20"></div>
                    <div className="absolute bottom-[-30px] right-[-50px] w-[400px] h-[80px] bg-[#00bcd4] -rotate-6 transform origin-bottom-right z-10"></div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                    {/* Contact Details */}
                    <div className="space-y-3 font-sans text-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00bcd4] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <span className="text-sm">📞</span>
                            </div>
                            <span className="text-sm font-medium tracking-wide text-gray-700">+91 9104630598</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00bcd4] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <span className="text-sm">✉️</span>
                            </div>
                            <span className="text-sm font-medium tracking-wide text-gray-700">tejaspatel@tejaskpaisoftware.com</span>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00bcd4] flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                                <span className="text-sm">📍</span>
                            </div>
                            <span className="text-xs leading-snug text-gray-600 font-medium">
                                pramukh vandana, 441/6, Makarpura GIDC, Makarpura, Vadodara, Gujarat 390010
                            </span>
                        </div>
                    </div>

                    {/* QR Code on Right */}
                    <div className="mb-12 mr-6 relative z-30">
                        <div className="bg-white p-1.5 border-2 border-gray-100 shadow-md">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://tejaskpaisoftware.com')}`}
                                alt="QR"
                                className="w-[90px] h-[90px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
});

JoiningLetterTemplate.displayName = "JoiningLetterTemplate";

export default JoiningLetterTemplate;
