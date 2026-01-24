"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SalarySlipTemplate from "@/components/documents/SalarySlipTemplate";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

import { INDIAN_BANKS } from "@/data/indian-banks";
import { BANK_HIERARCHY, ALL_STATES as STATIC_STATES } from "@/data/bank-hierarchy";

export default function SalarySlipGenerator() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const slipRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Bank Search State
    const [bankSearch, setBankSearch] = useState("");
    const [showBankList, setShowBankList] = useState(false);

    // Form State
    const [month, setMonth] = useState("January");
    const [year, setYear] = useState("2026");

    // Earnings
    const [salary, setSalary] = useState({
        basic: 0,
        hra: 0,
        special: 0,
        conveyance: 0,
        medical: 0,
        bonus: 0
    });

    // Deductions
    const [deductions, setDeductions] = useState({
        pf: 0,
        pt: 0,
        tds: 0,
        loan: 0,
        other: 0
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            // Fetch users with ROLE=EMPLOYEE. 
            // Ideally API needs update, filtering client side for MVP speed if API returns all
            const res = await fetch('/api/admin/users?role=EMPLOYEE');
            const data = await res.json();
            if (data.users) {
                // Client side filter just in case API upgrade lags
                const staff = data.users.filter((u: any) => u.role === 'EMPLOYEE');
                setEmployees(staff);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        const emp = employees.find(u => u.id === empId);
        setSelectedEmployee(emp);
    };

    // Bank & PAN Details (Editable)
    const [details, setDetails] = useState({
        bankName: "HDFC Bank",
        bankState: "",
        bankCity: "",
        bankArea: "", // Added Area
        bankBranch: "",
        ifscCode: "",
        accountNumber: "",
        panNumber: ""
    });

    // Dynamic Lists based on hierarchy
    const [availableStates, setAvailableStates] = useState<string[]>(STATIC_STATES);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableAreas, setAvailableAreas] = useState<string[]>([]); // Added Area List
    const [availableBranches, setAvailableBranches] = useState<any[]>([]);

    useEffect(() => {
        if (selectedEmployee) {
            setDetails(prev => ({
                ...prev,
                bankName: selectedEmployee.bankName || "HDFC Bank",
                bankState: selectedEmployee.bankState || "",
                bankCity: selectedEmployee.bankCity || "",
                bankArea: selectedEmployee.bankArea || "",
                bankBranch: selectedEmployee.bankBranch || "",
                ifscCode: selectedEmployee.ifscCode || "",
                accountNumber: selectedEmployee.accountNumber || "XXXXXXXX" + selectedEmployee.mobile.slice(-4),
                panNumber: selectedEmployee.panNumber || "ABCDE1234F"
            }));

            // Auto-populate Salary Details
            if (selectedEmployee.salaryDetails) {
                try {
                    const savedSalary = JSON.parse(selectedEmployee.salaryDetails);
                    setSalary({
                        basic: savedSalary.basic || 0,
                        hra: savedSalary.hra || 0,
                        special: savedSalary.special || 0,
                        conveyance: savedSalary.conveyance || 0,
                        medical: savedSalary.medical || 0,
                        bonus: savedSalary.bonus || 0
                    });
                    setDeductions({
                        pf: savedSalary.pf || 0,
                        pt: savedSalary.professionalTax || 0,
                        tds: savedSalary.tds || 0,
                        loan: savedSalary.loan || 0,
                        other: savedSalary.other || 0
                    });
                } catch (e) {
                    console.error("Failed to parse salary details", e);
                }
            } else {
                // Reset to 0 if no saved details
                setSalary({ basic: 0, hra: 0, special: 0, conveyance: 0, medical: 0, bonus: 0 });
                setDeductions({ pf: 0, pt: 0, tds: 0, loan: 0, other: 0 });
            }
        }
    }, [selectedEmployee]);

    // Dependent Dropdown Logic
    useEffect(() => {
        // When Bank Changes, check if we have data for it
        if (details.bankName && BANK_HIERARCHY[details.bankName]) {
            setAvailableStates(Object.keys(BANK_HIERARCHY[details.bankName]).sort());
        } else {
            setAvailableStates(STATIC_STATES.sort());
        }
    }, [details.bankName]);

    useEffect(() => {
        // When State Changes, fetch Cities
        if (details.bankName && details.bankState && BANK_HIERARCHY[details.bankName]?.[details.bankState]) {
            setAvailableCities(Object.keys(BANK_HIERARCHY[details.bankName][details.bankState]).sort());
        } else {
            setAvailableCities([]);
        }
    }, [details.bankName, details.bankState]);

    useEffect(() => {
        // When City Changes, fetch Areas
        if (details.bankName && details.bankState && details.bankCity && BANK_HIERARCHY[details.bankName]?.[details.bankState]?.[details.bankCity]) {
            setAvailableAreas(Object.keys(BANK_HIERARCHY[details.bankName][details.bankState][details.bankCity]).sort());
        } else {
            setAvailableAreas([]);
        }
    }, [details.bankName, details.bankState, details.bankCity]);

    useEffect(() => {
        // When Area Changes, fetch Branches
        if (details.bankName && details.bankState && details.bankCity && details.bankArea && BANK_HIERARCHY[details.bankName]?.[details.bankState]?.[details.bankCity]?.[details.bankArea]) {
            const branches = BANK_HIERARCHY[details.bankName][details.bankState][details.bankCity][details.bankArea];
            setAvailableBranches(branches.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            setAvailableBranches([]);
        }
    }, [details.bankName, details.bankState, details.bankCity, details.bankArea]);

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const branchName = e.target.value;
        setDetails(prev => ({ ...prev, bankBranch: branchName }));

        // Auto-find IFSC
        const branchObj = availableBranches.find(b => b.name === branchName);
        if (branchObj) {
            setDetails(prev => ({ ...prev, bankBranch: branchName, ifscCode: branchObj.ifsc }));
        }
    };


    // Derived filtered banks
    const filteredBanks = INDIAN_BANKS.filter(bank =>
        bank.toLowerCase().includes(bankSearch.toLowerCase())
    );

    const handleAction = async (action: 'save' | 'email') => {
        if (!selectedEmployee) return;
        setIsDownloading(true);

        try {
            // 1. Generate PDF Blob (Client Side) - Optional if we just send HTML to server, but let's capture the view
            // For email, we might just send the HTML body or data.
            // Let's call the API to SAVE first.

            const payload = {
                userId: selectedEmployee.id,
                month,
                year,
                basicSalary: salary.basic,
                hra: salary.hra,
                special: salary.special,
                conveyance: salary.conveyance,
                medical: salary.medical,
                bonus: salary.bonus,
                pf: deductions.pf,
                professionalTax: deductions.pt,
                tds: deductions.tds,
                loan: deductions.loan,
                otherDeductions: deductions.other,
                bankName: details.bankName,
                bankState: details.bankState,
                bankCity: details.bankCity,
                bankBranch: details.bankBranch,
                ifscCode: details.ifscCode,
                accountNumber: details.accountNumber,
                panNumber: details.panNumber,
                sendEmail: action === 'email' // Toggle email sending
            };

            const res = await fetch('/api/admin/documents/salary-slip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.success) {
                if (action === 'save') alert("Salary Slip Saved Successfully!");
                if (action === 'email') alert("Salary Slip Saved & Emailed Successfully!");

                // Refresh employees to get updated bank details
                await fetchEmployees();
            } else {
                alert("Failed: " + result.message);
            }

        } catch (e) {
            console.error(e);
            alert("Error processing request");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedEmployee) return;
        setIsDownloading(true);
        try {
            if (slipRef.current) {
                const dataUrl = await toPng(slipRef.current, { quality: 1.0, pixelRatio: 3 });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`SalarySlip_${selectedEmployee.name}_${month}_${year}.pdf`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    // Derived Data for Template
    const slipData = selectedEmployee ? {
        month,
        year,
        employeeName: selectedEmployee.name,
        designation: "Software Engineer", // Placeholder or fetch from 'details' JSON if stored
        employeeId: "EMP-" + selectedEmployee.mobile.slice(-4),
        joiningDate: new Date(selectedEmployee.createdAt).toLocaleDateString(),
        bankName: details.bankName,
        bankBranch: details.bankBranch,
        ifscCode: details.ifscCode,
        accountNumber: details.accountNumber,
        panNumber: details.panNumber,

        basicSalary: salary.basic,
        hra: salary.hra,
        specialAllowance: salary.special,
        conveyance: salary.conveyance,
        medical: salary.medical,
        bonus: salary.bonus,

        pf: deductions.pf,
        professionalTax: deductions.pt,
        tds: deductions.tds,
        loan: deductions.loan,
        otherDeductions: deductions.other
    } : null;

    return (
        <div className="min-h-screen bg-background text-foreground p-8 pl-72">
            <header className="mb-8 border-b border-theme pb-4">
                <h1 className="text-3xl font-bold text-foreground tracking-widest">GENERATE SALARY SLIP</h1>
                <p className="text-gold-theme/60">Professional Payroll Document Generation</p>
            </header>

            <div className="grid lg:grid-cols-[400px_1fr] gap-8">
                {/* LEFT: CONTROLS */}
                <div className="space-y-6">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-card/40 border border-theme p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-foreground mb-4 border-b border-gray-700 pb-2">Employee Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Select Employee</label>
                                <select
                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground outline-none focus:border-gold-500"
                                    onChange={handleEmployeeChange}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Choose Employee --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} (Mobile: {emp.mobile})</option>
                                    ))}
                                </select>
                                {employees.length === 0 && <p className="text-xs text-red-400 mt-1">No employees found. Register users with role 'EMPLOYEE'.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Month</label>
                                    <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-background border border-gray-700 rounded p-2 text-foreground outline-none focus:border-gold-500">
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Year</label>
                                    <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-background border border-gray-700 rounded p-2 text-foreground outline-none focus:border-gold-500">
                                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {selectedEmployee && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card/40 border border-theme p-6 rounded-xl space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">

                            {/* BANK & PAN DETAILS */}
                            <div>
                                <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                                    🏦 Bank & Tax Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <label className="block text-xs uppercase text-gray-500 mb-1">Bank Name</label>
                                        <div
                                            className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus-within:border-gold-500 cursor-pointer flex justify-between items-center"
                                            onClick={() => setShowBankList(!showBankList)}
                                        >
                                            {details.bankName || "Select Bank"}
                                            <span className="text-xs">▼</span>
                                        </div>
                                        {showBankList && (
                                            <div
                                                style={{ backgroundColor: 'var(--background)' }}
                                                className="absolute z-[100] w-full border border-gold-500/30 rounded mt-1 max-h-48 overflow-y-auto shadow-2xl"
                                            >
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Search Bank..."
                                                    className="w-full sticky top-0 p-2 bg-background text-foreground border-b border-gray-700 outline-none text-sm"
                                                    value={bankSearch}
                                                    onChange={(e) => setBankSearch(e.target.value)}
                                                />
                                                {filteredBanks.map((bank, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-2 hover:bg-gold-500/20 cursor-pointer text-sm text-gray-300 hover:text-foreground"
                                                        onClick={() => {
                                                            setDetails({ ...details, bankName: bank });
                                                            setShowBankList(false);
                                                            setBankSearch("");
                                                        }}
                                                    >
                                                        {bank}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Drill Down Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase text-gray-500 mb-1">State</label>
                                            <select
                                                className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                value={details.bankState}
                                                onChange={e => {
                                                    setDetails({ ...details, bankState: e.target.value, bankCity: "", bankArea: "", bankBranch: "", ifscCode: "" });
                                                }}
                                            >
                                                <option value="">Select State</option>
                                                {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase text-gray-500 mb-1">City</label>
                                            {availableCities.length > 0 ? (
                                                <select
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                    value={details.bankCity}
                                                    onChange={e => setDetails({ ...details, bankCity: e.target.value, bankArea: "", bankBranch: "", ifscCode: "" })}
                                                >
                                                    <option value="">Select City</option>
                                                    {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter City"
                                                    value={details.bankCity}
                                                    onChange={e => setDetails({ ...details, bankCity: e.target.value })}
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase text-gray-500 mb-1">Area</label>
                                            {availableAreas.length > 0 ? (
                                                <select
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                    value={details.bankArea}
                                                    onChange={e => setDetails({ ...details, bankArea: e.target.value, bankBranch: "", ifscCode: "" })}
                                                >
                                                    <option value="">Select Area</option>
                                                    {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter Area"
                                                    value={details.bankArea}
                                                    onChange={e => setDetails({ ...details, bankArea: e.target.value })}
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase text-gray-500 mb-1">Branch</label>
                                            {availableBranches.length > 0 ? (
                                                <select
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                    value={details.bankBranch}
                                                    onChange={handleBranchChange}
                                                >
                                                    <option value="">Select Branch</option>
                                                    {availableBranches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Enter Branch"
                                                    value={details.bankBranch}
                                                    onChange={e => setDetails({ ...details, bankBranch: e.target.value })}
                                                    className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase text-gray-500 mb-1">IFSC Code</label>
                                            <input type="text" placeholder="e.g. SBIN0001234" value={details.ifscCode} onChange={e => setDetails({ ...details, ifscCode: e.target.value })} className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500" />
                                        </div>
                                        <div>
                                            {/* Spacer/Account Number comes here later */}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase text-gray-500 mb-1">Account Number</label>
                                        <input type="text" value={details.accountNumber} onChange={e => setDetails({ ...details, accountNumber: e.target.value })} className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-gray-500 mb-1">PAN Number</label>
                                        <input type="text" value={details.panNumber} onChange={e => setDetails({ ...details, panNumber: e.target.value })} className="w-full bg-background border border-gray-700 rounded p-2 text-foreground text-sm outline-none focus:border-gold-500" />
                                    </div>                </div>
                            </div>

                            {/* EARNINGS */}
                            <div>
                                <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                                    💰 Earnings
                                </h3>
                                <div className="space-y-3">
                                    <InputGroup label="Basic Salary" value={salary.basic} onChange={v => setSalary({ ...salary, basic: v })} />
                                    <InputGroup label="HRA" value={salary.hra} onChange={v => setSalary({ ...salary, hra: v })} />
                                    <InputGroup label="Special Allowance" value={salary.special} onChange={v => setSalary({ ...salary, special: v })} />
                                    <InputGroup label="Conveyance" value={salary.conveyance} onChange={v => setSalary({ ...salary, conveyance: v })} />
                                    <InputGroup label="Medical" value={salary.medical} onChange={v => setSalary({ ...salary, medical: v })} />
                                    <InputGroup label="Bonus / Incentives" value={salary.bonus} onChange={v => setSalary({ ...salary, bonus: v })} />
                                </div>
                            </div>

                            {/* DEDUCTIONS */}
                            <div>
                                <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                                    📉 Deductions
                                </h3>
                                <div className="space-y-3">
                                    <InputGroup label="Provident Fund (PF)" value={deductions.pf} onChange={v => setDeductions({ ...deductions, pf: v })} />
                                    <InputGroup label="Professional Tax" value={deductions.pt} onChange={v => setDeductions({ ...deductions, pt: v })} />
                                    <InputGroup label="TDS (Tax)" value={deductions.tds} onChange={v => setDeductions({ ...deductions, tds: v })} />
                                    <InputGroup label="Loan Repayment" value={deductions.loan} onChange={v => setDeductions({ ...deductions, loan: v })} />
                                    <InputGroup label="Other Deductions" value={deductions.other} onChange={v => setDeductions({ ...deductions, other: v })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction('save')}
                                        disabled={isDownloading}
                                        className="flex-1 bg-green-600/20 text-green-400 border border-green-500/50 font-bold py-3 rounded-lg hover:bg-green-600 hover:text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDownloading ? "..." : "💾 SAVE ONLY"}
                                    </button>
                                    <button
                                        onClick={() => handleAction('email')}
                                        disabled={isDownloading}
                                        className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-500/50 font-bold py-3 rounded-lg hover:bg-blue-600 hover:text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDownloading ? "..." : "📧 SEND EMAIL"}
                                    </button>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="w-full bg-gray-800 text-gray-300 font-bold py-2 rounded-lg hover:bg-gray-700 transition-all text-sm"
                                >
                                    Downloads PDF (No Save)
                                </button>
                            </div>

                        </motion.div>
                    )}
                </div>

                {/* RIGHT: PREVIEW */}
                <div className="bg-checkered flex items-center justify-center p-8 bg-gray-900 rounded-xl overflow-hidden relative min-h-[800px]">
                    <div className="absolute top-4 right-4 text-xs text-gray-500 font-mono">LIVE PREVIEW</div>

                    {!selectedEmployee ? (
                        <div className="text-center text-gray-500">
                            <div className="text-6xl mb-4 opacity-20">💳</div>
                            <p>Select an employee to generate salary slip</p>
                        </div>
                    ) : (
                        <div className="transform scale-90 origin-top shadow-2xl">
                            {/* @ts-ignore */}
                            <SalarySlipTemplate ref={slipRef} data={slipData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-gray-400 font-medium">{label}</label>
            <div className="relative w-32">
                <span className="absolute left-2 top-1.5 text-gray-500 text-xs">₹</span>
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-background border border-gray-700 rounded py-1 pl-6 pr-2 text-right text-foreground text-sm outline-none focus:border-gold-500"
                />
            </div>
        </div>
    )
}
