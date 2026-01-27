"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import SalarySlipTemplate from "@/components/documents/SalarySlipTemplate";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export default function EmployeeSalarySlipsPage() {
    const { data: session } = useSession();
    const [slips, setSlips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const slipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchSlips();
        }
    }, [session]);

    const fetchSlips = async () => {
        try {
            const res = await fetch(`/api/employee/documents/salary-slips?userId=${session?.user?.id}`);
            if (res.ok) {
                const data = await res.json();
                setSlips(data);
            }
        } catch (error) {
            console.error("Error fetching slips:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        if (slipRef.current && selectedSlip) {
            try {
                const dataUrl = await toPng(slipRef.current, { quality: 1.0, pixelRatio: 2 });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`SalarySlip_${selectedSlip.month}_${selectedSlip.year}.pdf`);
            } catch (error) {
                console.error("PDF generation failed", error);
                alert("Failed to generate PDF");
            }
        }
        setIsGenerating(false);
    };

    const getTemplateData = (slip: any) => {
        if (!session?.user) return null;
        return {
            month: slip.month,
            year: slip.year,
            employeeName: session.user.name,
            designation: "Employee", // Could fetch from profile if needed
            employeeId: "EMP-" + (session.user as any).mobile?.slice(-4),
            joiningDate: new Date().toLocaleDateString(), // Placeholder, ideally fetch form profile
            bankName: slip.bankName,
            bankBranch: slip.bankBranch,
            ifscCode: slip.ifscCode,
            accountNumber: slip.accountNumber,
            panNumber: slip.panNumber,
            basicSalary: slip.basicSalary,
            hra: slip.hra,
            specialAllowance: slip.special,
            conveyance: slip.conveyance,
            medical: slip.medical,
            bonus: slip.bonus,
            pf: slip.pf,
            professionalTax: slip.professionalTax,
            tds: slip.tds,
            loan: slip.loan,
            otherDeductions: slip.otherDeductions
        };
    };

    if (loading) return <div className="text-center py-20 text-gold-500 animate-pulse">Loading salary slips...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-white mb-8">
                My Salary Slips
            </h1>

            {slips.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-400">No salary slips found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slips.map((slip) => (
                        <motion.div
                            key={slip.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-gold-500/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{slip.month} {slip.year}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Generated on {new Date(slip.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/20">
                                    PAID
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Net Salary</span>
                                    <span className="font-bold text-gold-400">
                                        ₹{(slip.basicSalary + slip.hra + slip.special + slip.conveyance + slip.medical + slip.bonus - (slip.pf + slip.professionalTax + slip.tds + slip.loan + slip.otherDeductions)).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedSlip(slip)}
                                className="w-full bg-gold-500/10 hover:bg-gold-500 text-gold-400 hover:text-black border border-gold-500/30 font-bold py-2 rounded-lg transition-all"
                            >
                                View & Download
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* View Modal */}
            <AnimatePresence>
                {selectedSlip && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedSlip(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                                <h2 className="font-bold text-white">Salary Slip: {selectedSlip.month} {selectedSlip.year}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isGenerating}
                                        className="bg-gold-500 text-black px-4 py-1.5 rounded font-bold text-sm hover:bg-gold-400 disabled:opacity-50"
                                    >
                                        {isGenerating ? "Downloading..." : "Download PDF"}
                                    </button>
                                    <button
                                        onClick={() => setSelectedSlip(null)}
                                        className="bg-white/10 text-white px-4 py-1.5 rounded font-bold text-sm hover:bg-white/20"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-8 bg-gray-100 flex justify-center">
                                <div className="shadow-2xl">
                                    <SalarySlipTemplate ref={slipRef} data={getTemplateData(selectedSlip)} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
