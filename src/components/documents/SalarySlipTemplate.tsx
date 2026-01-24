import React, { forwardRef } from "react";

interface SalarySlipProps {
    data: {
        month: string;
        year: string;
        employeeName: string;
        designation: string;
        employeeId: string; // Mobile or generated ID
        joiningDate: string;
        bankName: string;
        bankBranch?: string;
        accountNumber: string;
        ifscCode?: string;
        panNumber: string;
        // Earnings
        basicSalary: number;
        hra: number;
        specialAllowance: number;
        conveyance: number;
        medical: number;
        bonus: number;
        // Deductions
        pf: number;
        professionalTax: number;
        tds: number;
        loan: number;
        otherDeductions: number;
        leaveDeduction?: number; // New field
    };
}

const SalarySlipTemplate = forwardRef<HTMLDivElement, SalarySlipProps>(({ data }, ref) => {

    // Calculations
    const totalEarnings = (
        Number(data.basicSalary) +
        Number(data.hra) +
        Number(data.specialAllowance) +
        Number(data.conveyance) +
        Number(data.medical) +
        Number(data.bonus)
    );

    const totalDeductions = (
        Number(data.pf) +
        Number(data.professionalTax) +
        Number(data.tds) +
        Number(data.loan) +
        Number(data.otherDeductions) +
        Number(data.leaveDeduction || 0)
    );

    const netPay = totalEarnings - totalDeductions;

    // Number to words (simplified for demo, ideally use library)
    const amountInWords = (amount: number) => {
        // Placeholder for complexity, for now just returning formatted
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    return (
        <div
            id="salary-slip"
            ref={ref}
            className="w-[794px] h-[1123px] bg-white text-black shadow-2xl relative overflow-hidden shrink-0 flex flex-col"
            style={{ fontFamily: '"Calibri", "Arial", sans-serif' }}
        >
            {/* 1. HEADER - GOLD & OBSIDIAN THEME */}
            <div className="bg-[#1a1a1a] text-[#B8860B] px-12 py-6 flex justify-between items-center border-b-[4px] border-[#B8860B]">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black/50 rounded-full p-1 border border-[#B8860B]">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest text-white">TEJASKP AI</h1>
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-[#B8860B]">SOFTWARE</h2>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-3xl font-bold text-white uppercase tracking-wider">PAYSLIP</h3>
                    <p className="text-sm text-[#B8860B] font-medium uppercase tracking-wide">
                        {data.month}, {data.year}
                    </p>
                </div>
            </div>

            {/* 2. COMPANY DETAILS */}
            <div className="px-12 py-4 text-center border-b border-gray-200 bg-gray-50">
                <p className="text-sm font-bold text-gray-800">TEJASKP AI SOFTWARE</p>
                <p className="text-xs text-gray-500">pramukh vandana, 441/6, Makarpura GIDC, Makarpura, Vadodara, Gujarat 390010</p>
                <p className="text-xs text-gray-500">HR-Email: hinalpatel@tejaskpaisoftware.com | Ph: +91 9104630598</p>
            </div>

            {/* 3. EMPLOYEE DETAILS GRID */}
            <div className="px-12 py-8">
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-[#1a1a1a] text-[#B8860B] px-4 py-2 text-sm font-bold uppercase tracking-wider">
                        Employee Summary
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        {/* Column 1 */}
                        <div className="p-4 border-r border-gray-200 space-y-3">
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-gray-500 font-medium">Name:</span>
                                <span className="font-bold text-gray-800 uppercase">{data.employeeName}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-gray-500 font-medium">Designation:</span>
                                <span className="font-bold text-gray-800">{data.designation}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-gray-500 font-medium">Joining Date:</span>
                                <span className="text-gray-800">{data.joiningDate}</span>
                            </div>
                        </div>
                        {/* Column 2 */}
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-gray-500 font-medium">Employee ID:</span>
                                <span className="font-bold text-gray-800">{data.employeeId}</span>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase">Bank Details</p>
                                <p className="text-gray-800 font-medium">{data.bankName || '-'}</p>
                                <p className="text-gray-600 text-xs">{data.bankBranch ? `${data.bankBranch} Branch` : ''}</p>
                                <p className="text-gray-800 font-medium text-xs mt-1">A/C: {data.accountNumber || '-'}</p>
                                <p className="text-gray-600 text-xs">IFSC: {data.ifscCode || '-'}</p>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-gray-500 font-medium">PAN No:</span>
                                <span className="text-gray-800 uppercase">{data.panNumber || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. SALARY DETAILS TABLE */}
            <div className="px-12 pb-8 flex-1">
                <div className="flex border border-gray-300 rounded-lg overflow-hidden h-full max-h-[500px]">

                    {/* EARNINGS SECTION */}
                    <div className="w-1/2 border-r border-gray-300 flex flex-col">
                        <div className="bg-green-50 px-4 py-2 text-sm font-bold text-green-800 uppercase border-b border-green-100 flex justify-between">
                            <span>Earnings</span>
                            <span>Amount (₹)</span>
                        </div>
                        <div className="p-4 flex-1 space-y-3 text-sm">
                            <Row label="Basic Salary" value={data.basicSalary} />
                            <Row label="House Rent Allowance (HRA)" value={data.hra} />
                            <Row label="Conveyance Allowance" value={data.conveyance} />
                            <Row label="Medical Allowance" value={data.medical} />
                            <Row label="Special Allowance" value={data.specialAllowance} />
                            <Row label="Performance Bonus" value={data.bonus} />
                        </div>
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-800">
                            <span>Total Earnings (A)</span>
                            <span>₹ {totalEarnings.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* DEDUCTIONS SECTION */}
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-red-50 px-4 py-2 text-sm font-bold text-red-800 uppercase border-b border-red-100 flex justify-between">
                            <span>Deductions</span>
                            <span>Amount (₹)</span>
                        </div>
                        <div className="p-4 flex-1 space-y-3 text-sm">
                            <Row label="Provident Fund (PF)" value={data.pf} />
                            <Row label="Professional Tax" value={data.professionalTax} />
                            <Row label="TDS / Income Tax" value={data.tds} />
                            <Row label="Loan Repayment" value={data.loan} />
                            <Row label="Leave Deduction" value={data.leaveDeduction || 0} />
                            <Row label="Other Deductions" value={data.otherDeductions} />
                        </div>
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-800">
                            <span>Total Deductions (B)</span>
                            <span>₹ {totalDeductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. NET PAY SUMMARY */}
            <div className="px-12 pb-8">
                <div className="bg-[#1a1a1a] text-white p-6 rounded-lg flex justify-between items-center shadow-lg border border-[#B8860B]">
                    <div>
                        <p className="text-[#B8860B] text-xs uppercase tracking-widest font-bold mb-1">Net Salary Payable</p>
                        <p className="text-xs text-gray-300 italic">
                            (Total Earnings - Total Deductions)
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold tracking-wider text-white">₹ {netPay.toLocaleString()}</p>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center font-medium italic">
                    ** This is a computer-generated document and does not require a physical signature. **
                </p>
            </div>


            {/* 6. FOOTER/SIGNATURE */}
            <div className="px-12 pb-12 mt-auto flex justify-between items-end">
                <div className="text-xs text-gray-500 w-1/2">
                    <p className="font-bold text-black mb-1">Note:</p>
                    <p>Unless verified, this salary slip is just a draft. Any discrepancies should be reported to HR immediately.</p>
                </div>
                <div className="flex flex-col items-center">
                    <img src="/signature.png" alt="Sign" className="h-12 object-contain mix-blend-multiply opacity-80" />
                    <div className="w-32 border-t border-gray-400 mt-1"></div>
                    <p className="text-[10px] font-bold uppercase mt-1 text-gray-600">Authorized Signatory</p>
                </div>
            </div>

            {/* DECORATIVE ELEMENTS */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B] transform rotate-45 translate-x-16 -translate-y-16 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1a1a1a] transform rotate-45 -translate-x-16 translate-y-16 opacity-10"></div>
        </div>
    );
});

function Row({ label, value }: { label: string, value: number }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">{label}</span>
            <span className="text-gray-800 font-mono font-bold tracking-tight">
                {value > 0 ? `₹ ${value.toLocaleString()}` : '-'}
            </span>
        </div>
    )
}

SalarySlipTemplate.displayName = "SalarySlipTemplate";

export default SalarySlipTemplate;
