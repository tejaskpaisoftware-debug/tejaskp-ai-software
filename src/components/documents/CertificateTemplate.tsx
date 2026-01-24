import React, { forwardRef } from "react";

interface CertificateProps {
    name: string;
    duration: string;
    date: string;
    course?: string;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateProps>(({ name, duration, date, course }, ref) => {
    return (
        <div
            id="certificate-template"
            ref={ref}
            className="w-[1123px] h-[794px] bg-white text-black relative overflow-hidden shrink-0 flex flex-col items-center justify-center p-12"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
        >
            {/* 1. OUTER BORDER (GOLD FRAME) */}
            <div className="absolute inset-4 border-[2px] border-[#DAA520] opacity-100 pointer-events-none"></div>
            <div className="absolute inset-6 border-[1px] border-[#DAA520] opacity-50 pointer-events-none"></div>

            {/* Corner Accents - Luxury Style */}
            <div className="absolute top-6 left-6 w-32 h-32 border-t-4 border-l-4 border-[#DAA520] opacity-100 rounded-tl-3xl"></div>
            <div className="absolute top-6 right-6 w-32 h-32 border-t-4 border-r-4 border-[#DAA520] opacity-100 rounded-tr-3xl"></div>
            <div className="absolute bottom-6 left-6 w-32 h-32 border-b-4 border-l-4 border-[#DAA520] opacity-100 rounded-bl-3xl"></div>
            <div className="absolute bottom-6 right-6 w-32 h-32 border-b-4 border-r-4 border-[#DAA520] opacity-100 rounded-br-3xl"></div>

            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#DAA520_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.05] pointer-events-none"></div>

            {/* 3. CENTER CONTENT */}
            <div className="flex flex-col items-center justify-center w-full max-w-[900px] text-center relative z-10">

                {/* LOGO AREA */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 border border-[#DAA520] p-2 flex items-center justify-center mb-2 bg-white rounded-lg shadow-sm">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-xl uppercase tracking-[0.2em] text-[#333] font-bold">Tejaskp AI Software</h2>
                </div>

                {/* TITLE */}
                <div className="relative mb-8 w-full">
                    <h1 className="text-7xl text-[#DAA520] font-serif tracking-widest py-2 relative z-10 font-bold"
                        style={{
                            textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                        }}>
                        CERTIFICATE
                    </h1>
                    <div className="w-64 h-1 bg-[#DAA520] mx-auto mt-2 opacity-50"></div>
                </div>

                {/* PRESENTED TO TEXT */}
                <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-8">Of Internship Completion</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#B8860B] mb-4">Proudly Presented To</p>

                {/* RECIPIENT NAME */}
                <h2 className="text-5xl font-serif text-[#1a1a1a] uppercase mb-8 tracking-wider w-full border-b border-gray-200 pb-4">
                    {name || "SAMPLE USER"}
                </h2>

                {/* BODY TEXT */}
                <div className="max-w-[800px]">
                    <p className="text-xl text-gray-700 leading-relaxed font-light">
                        For successfully completing the internship program in <span className="font-bold text-[#B8860B]uppercase">{course || "WEB DEVELOPMENT"}</span> at <span className="font-bold text-black">TEJASKP AI SOFTWARE</span>.
                        The candidate has demonstrated exceptional dedication and skills during the period
                        <br />
                        <span className="font-bold text-black block mt-2 text-2xl">{duration || "May-June 2025"}</span>
                    </p>
                </div>

                {/* FOOTER ROW */}
                <div className="w-full flex justify-between items-end mt-16 px-16">
                    {/* LEFT: ISSUE DATE */}
                    <div className="text-left">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Issue Date</p>
                        <p className="text-lg text-[#1a1a1a] font-serif font-bold">{new Date(date).toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    {/* CENTER: GOLD SEAL */}
                    <div className="relative w-32 h-32 flex items-center justify-center -mb-8">
                        <div className="w-28 h-28 rounded-full border-4 border-[#DAA520] flex items-center justify-center relative z-10 bg-white shadow-xl">
                            <div className="w-[90%] h-[90%] rounded-full bg-[#DAA520] flex items-center justify-center border-double border-4 border-white text-white">
                                <div className="text-center font-bold">
                                    <span className="block text-[8px] uppercase tracking-widest mb-1">Genuine</span>
                                    <span className="block text-2xl">🏅</span>
                                    <span className="block text-[8px] uppercase tracking-widest mt-1">Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SIGNATURE */}
                    <div className="flex flex-col items-center">
                        <div className="w-48 h-12 flex items-end justify-center mb-2 relative">
                            {/* Standard signature visibility for white background */}
                            <img src="/signature.png" alt="Signature" className="h-[140%] object-contain absolute bottom-0 mix-blend-multiply opacity-100" />
                            <div className="w-full border-b border-gray-400"></div>
                        </div>
                        <h3 className="font-bold text-lg uppercase tracking-wide text-black">Tejas Patel</h3>
                        <p className="text-[#DAA520] text-xs uppercase tracking-widest font-bold">Founder & CEO</p>
                    </div>
                </div>

            </div>

        </div>
    );
});

CertificateTemplate.displayName = "CertificateTemplate";

export default CertificateTemplate;
