"use client";

import { useState, useEffect, useRef } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { motion } from "framer-motion";
import SalarySlipTemplate from "@/components/documents/SalarySlipTemplate";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";

export default function PayrollPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState<string>("");

    // Process State
    const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
    const hiddenRef = useRef<HTMLDivElement>(null);
    const [tempData, setTempData] = useState<any>(null); // Data for the hidden template to render

    const [month, setMonth] = useState("January");
    const [year, setYear] = useState("2026");

    // Leave Management Modal State
    const [selectedEmployeeLeaves, setSelectedEmployeeLeaves] = useState<any>(null);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users?role=EMPLOYEE');
            const data = await res.json();
            if (data.users) {
                // Filter Active Employees
                const staff = data.users.filter((u: any) => u.role === 'EMPLOYEE' && u.status === 'ACTIVE');

                // Process Staff with Deductions
                const processedStaff = staff.map((u: any) => {
                    const hasSlip = u.salarySlips?.some((s: any) => s.month === month && s.year === year);

                    // --- ADVANCED LEAVE ACCRUAL & DEDUCTION LOGIC ---

                    // 1. Calculate Total Accrued Leaves based on Accrual Date (End of Selected Month)
                    const accrualTargetDate = new Date(Number(year), ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month) + 1, 0);

                    // Default to Jan 1st of SELECTED YEAR if no joining date (for testing)
                    const joiningDate = u.joiningDate ? new Date(u.joiningDate) : new Date(Number(year), 0, 1);

                    let monthsWorked = 0;
                    // Calculate: (TargetYear - JoiningYear) * 12 + (TargetMonth - JoiningMonth) + 1
                    monthsWorked = (accrualTargetDate.getFullYear() - joiningDate.getFullYear()) * 12;
                    monthsWorked += accrualTargetDate.getMonth() - joiningDate.getMonth();
                    monthsWorked += 1; // Include current month in accrual
                    monthsWorked = Math.max(0, monthsWorked);

                    const totalCLAccrued = monthsWorked * 1.0;
                    const totalSLAccrued = monthsWorked * 0.5;

                    // 2. Calculate Used Leaves (ALL TIME except current month being processed)
                    let usedCL = 0;
                    let usedSL = 0;

                    // 3. Current Month Leaves (to be processed)
                    let currentMonthLeaves: any[] = [];

                    if (u.leaves) {
                        u.leaves.forEach((leave: any) => {
                            if (leave.status === 'APPROVED') {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                // Check for Half Day
                                if (leave.type && leave.type.includes('_HALF')) {
                                    days = 0.5;
                                }

                                // Check if this leave belongs to the CURRENT processing month
                                const currentMonthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month);

                                const isCurrentMonth = start.getMonth() === currentMonthIdx && start.getFullYear() === Number(year);

                                if (isCurrentMonth) {
                                    currentMonthLeaves.push({ ...leave, days });
                                } else if (start < new Date(Number(year), currentMonthIdx, 1)) {
                                    // Past leave: Add to used 
                                    if (leave.type && leave.type.includes('SL')) usedSL += days;
                                    else usedCL += days; // Default to CL
                                }
                            }
                        });
                    }

                    // 4. Calculate Available Balance BEFORE this month
                    let balanceCL = totalCLAccrued - usedCL;
                    let balanceSL = totalSLAccrued - usedSL;

                    // 5. Process Current Month Deductions
                    let deductionDays = 0;
                    let leavesTakenThisMonth = 0;

                    currentMonthLeaves.forEach(leave => {
                        leavesTakenThisMonth += leave.days;
                        if (leave.type && leave.type.includes('SL')) {
                            if (balanceSL >= leave.days) {
                                balanceSL -= leave.days; // Paid
                            } else {
                                const paidPart = Math.max(0, balanceSL);
                                const unpaidPart = leave.days - paidPart;
                                balanceSL = 0;
                                deductionDays += unpaidPart;
                            }
                        } else {
                            // Default to CL
                            if (balanceCL >= leave.days) {
                                balanceCL -= leave.days; // Paid
                            } else {
                                const paidPart = Math.max(0, balanceCL);
                                const unpaidPart = leave.days - paidPart;
                                balanceCL = 0;
                                deductionDays += unpaidPart;
                            }
                        }
                    });

                    const extraLeaveDays = deductionDays;

                    // Salary Details
                    const details = u.salaryDetails ? JSON.parse(u.salaryDetails) : { basic: 15000, hra: 6000, special: 4000 };
                    const totalMonthlySalary = (details.basic || 0) + (details.hra || 0) + (details.special || 0);

                    // Deduction Formula
                    const daysInMonth = new Date(Number(year), ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month) + 1, 0).getDate();
                    const perDaySalary = totalMonthlySalary / daysInMonth;
                    const leaveDeduction = Math.round(extraLeaveDays * perDaySalary);

                    return {
                        ...u,
                        paymentStatus: hasSlip ? 'PAID' : 'PENDING',
                        leavesTaken: leavesTakenThisMonth,
                        extraLeaveDays,
                        leaveDeduction,
                        salaryConfig: details,
                        balances: { cl: balanceCL.toFixed(1), sl: balanceSL.toFixed(1) },
                        hasPendingLeaves: u.leaves?.some((l: any) => l.status === 'PENDING')
                    };
                });

                setEmployees(processedStaff);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const runBatchProcess = async () => {
        if (!confirm(`Are you sure you want to process payroll for ${month} ${year}? This will email all pending employees.`)) return;

        setProcessing(true);
        setProcessStatus("Starting Batch Process...");

        const pendingEmployees = employees.filter(e => e.paymentStatus === 'PENDING');

        if (pendingEmployees.length === 0) {
            alert("No pending payments for this month.");
            setProcessing(false);
            return;
        }

        for (let i = 0; i < pendingEmployees.length; i++) {
            const emp = pendingEmployees[i];
            setProcessStatus(`Processing ${i + 1}/${pendingEmployees.length}: ${emp.name}...`);
            setCurrentProcessingId(emp.id);

            // 1. Prepare Data
            const details = emp.salaryConfig || { basic: 15000, hra: 6000, special: 4000, pf: 1800, pt: 200 };

            // Build full slip data object
            const slipData = {
                month,
                year,
                employeeName: emp.name,
                designation: "Employee", // Default
                employeeId: "EMP-" + emp.mobile.slice(-4),
                joiningDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "-",
                bankName: "HDFC Bank", // Default if not stored
                bankBranch: "",
                ifscCode: "",
                accountNumber: "XXXXXXXX" + emp.mobile.slice(-4),
                panNumber: "ABCDE1234F",

                basicSalary: details.basic || 0,
                hra: details.hra || 0,
                specialAllowance: details.special || 0,
                conveyance: 0,
                medical: 0,
                bonus: 0,

                pf: details.pf || 0,
                professionalTax: details.pt || 0,
                tds: 0,
                loan: 0,
                otherDeductions: 0,
                leaveDeduction: emp.leaveDeduction || 0 // Correct prop
            };

            // 2. Render Template (Update State and wait a bit for React to render)
            setTempData(slipData);
            await new Promise(r => setTimeout(r, 500)); // Wait for render

            try {
                if (hiddenRef.current) {
                    // 3. Generate PDF
                    const dataUrl = await toJpeg(hiddenRef.current, { quality: 0.8, pixelRatio: 1.5 });
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgProps = pdf.getImageProperties(dataUrl);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                    const pdfBase64 = pdf.output('datauristring');

                    // 4. Send Email & Save via API
                    // We reuse the 'email' route which sends email. 
                    // Ideally we should have a route that SAVES + EMAILS. 
                    // The 'salary-slip' POST saves. The 'email' POST emails.
                    // We need to do BOTH.

                    // Step A: Save to DB
                    const savePayload = {
                        userId: emp.id,
                        ...slipData, // Contains month, year already
                        sendEmail: false // We will call email API manually to rely on our PDF
                    };

                    await fetch('/api/admin/documents/salary-slip', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });

                    // Step B: Send Email
                    if (emp.email) {
                        await fetch('/api/admin/documents/salary-slip/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: emp.email,
                                name: emp.name,
                                month,
                                year,
                                pdfBase64
                            })
                        });
                    }

                    // Update UI
                    setEmployees(prev => prev.map(p => p.id === emp.id ? { ...p, paymentStatus: 'PAID' } : p));
                }
            } catch (err) {
                console.error(`Failed for ${emp.name}`, err);
            }
        }

        setProcessStatus("Batch Processing Complete!");
        setProcessing(false);
        setTempData(null);
        alert("Payroll Processing Completed Successfully.");
    };

    const handleManageLeaves = (emp: any) => {
        setSelectedEmployeeLeaves(emp);
        setIsLeaveModalOpen(true);
    };

    const handleLeaveAction = async (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${action} this leave?`)) return;

        try {
            const res = await fetch('/api/admin/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leaveId, status: action })
            });

            if (res.ok) {
                // Refresh Data
                fetchEmployees();
                setIsLeaveModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update leave status");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pl-64 font-sans relative z-10">
            <AdminSidebar />

            <main className="p-8">
                <header className="flex justify-between items-center mb-8 border-b border-theme pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-wider">PAYROLL AUTOMATION</h1>
                        <p className="text-gold-theme/60">Batch Process Salary Slips</p>
                    </div>
                    <div className="flex gap-4">
                        <select value={month} onChange={e => setMonth(e.target.value)} className="bg-card border border-gold-500/30 rounded p-2 text-foreground outline-none">
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <select value={year} onChange={e => setYear(e.target.value)} className="bg-card border border-gold-500/30 rounded p-2 text-foreground outline-none">
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={fetchEmployees} className="text-sm bg-gray-800 px-4 py-2 rounded text-foreground">Refresh</button>
                    </div>
                </header>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-card/50 border border-theme p-6 rounded-xl">
                        <h3 className="text-muted-foreground text-xs uppercase">Total Active Employees</h3>
                        <p className="text-3xl font-bold text-foreground">{employees.length}</p>
                    </div>
                    <div className="bg-card/50 border border-green-500/20 p-6 rounded-xl">
                        <h3 className="text-muted-foreground text-xs uppercase">Paid This Month</h3>
                        <p className="text-3xl font-bold text-green-400">{employees.filter(e => e.paymentStatus === 'PAID').length}</p>
                    </div>
                    <div className="bg-card/50 border border-red-500/20 p-6 rounded-xl">
                        <h3 className="text-muted-foreground text-xs uppercase">Pending Payment</h3>
                        <p className="text-3xl font-bold text-red-400">{employees.filter(e => e.paymentStatus === 'PENDING').length}</p>
                    </div>
                </div>

                <div className="bg-card/30 border border-gold-500/10 rounded-xl overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span>📋</span> Disbursement List
                        </h3>
                        <button
                            onClick={runBatchProcess}
                            disabled={processing || employees.filter(e => e.paymentStatus === 'PENDING').length === 0}
                            className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${processing ? 'bg-gray-600 text-gray-300 cursor-not-allowed' :
                                employees.filter(e => e.paymentStatus === 'PENDING').length === 0 ? 'bg-gray-700 text-gray-500' :
                                    'bg-gold-500 hover:bg-gold-400 text-obsidian hover:scale-105'
                                }`}
                        >
                            {processing ? processStatus : "🚀 Process All Pending Slips"}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase text-gray-500 border-b border-gray-700">
                                    <th className="p-4">Employee</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Salary Config</th>
                                    <th className="p-4">Leaves (Excess)</th>
                                    <th className="p-4">Balance Rem.</th>
                                    <th className="p-4">Deduction</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-center">Payment Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme/20">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">Loading payroll data...</td></tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp.id} className={`hover:bg-foreground/5 transition-colors cursor-pointer group ${emp.hasPendingLeaves ? 'animate-pulse bg-red-900/10' : ''}`} onClick={() => handleManageLeaves(emp)}>
                                            <td className="p-4 font-bold text-foreground group-hover:text-gold-400 transition-colors flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${emp.hasPendingLeaves ? 'bg-red-500 animate-ping' : 'bg-green-500/50'}`}></div>
                                                <div>
                                                    {emp.name}
                                                    <span className="block text-[10px] text-gray-600 font-normal">Click to Manage Leaves</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">{emp.designation || 'Employee'}</td>
                                            <td className="p-4">
                                                {emp.salaryDetails ? (
                                                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">Configured</span>
                                                ) : (
                                                    <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">Missing</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-300">
                                                    {emp.leavesTaken} <span className="text-gray-500">({emp.extraLeaveDays > 0 ? `+${emp.extraLeaveDays}` : '0'})</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-400">
                                                CL: {emp.balances?.cl} | SL: {emp.balances?.sl}
                                            </td>
                                            <td className="p-4 text-red-400 font-bold">
                                                {emp.leaveDeduction > 0 ? `-₹${emp.leaveDeduction}` : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">{emp.email || '-'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${emp.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {emp.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Hidden Container for Batch Rendering */}
            <div className="fixed top-0 left-0 opacity-0 pointer-events-none z-[-100]">
                {tempData && (
                    <div className="bg-white p-8 w-[800px]">
                        <SalarySlipTemplate ref={hiddenRef} data={tempData} />
                    </div>
                )}
            </div>
            {/* Leave Management Modal */}
            {isLeaveModalOpen && selectedEmployeeLeaves && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-gold-500/30 p-8 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-1">Manage Leaves</h2>
                                <p className="text-gray-400 text-sm">Reviewing leaves for <span className="text-gold-400">{selectedEmployeeLeaves.name}</span></p>
                            </div>
                            <button onClick={() => setIsLeaveModalOpen(false)} className="text-gray-500 hover:text-foreground text-xl">✕</button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                            {selectedEmployeeLeaves.leaves && selectedEmployeeLeaves.leaves.length > 0 ? (
                                selectedEmployeeLeaves.leaves
                                    .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                                    .map((leave: any) => (
                                        <div key={leave.id} className="bg-background/50 border border-gray-700 p-4 rounded-xl flex justify-between items-center md:flex-row flex-col gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${leave.type?.includes('SL') ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                        {leave.type?.replace(/_HALF.*/, '') || 'CL'}
                                                        {leave.type?.includes('_HALF') && (
                                                            <span className="text-[8px] bg-white/20 px-1 rounded ml-1">
                                                                {leave.type.includes('_1') ? '1st HALF' : leave.type.includes('_2') ? '2nd HALF' : 'HALF'}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${leave.status === 'APPROVED' ? 'text-green-500 border-green-500' :
                                                        leave.status === 'REJECTED' ? 'text-red-500 border-red-500' :
                                                            'text-yellow-500 border-yellow-500'
                                                        }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                <p className="text-foreground font-bold text-sm">
                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-gray-400 text-xs italic mt-1">"{leave.reason}"</p>
                                            </div>

                                            <div className="flex gap-2">
                                                {leave.status !== 'APPROVED' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'APPROVED'); }}
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-foreground text-xs font-bold rounded shadow"
                                                    >
                                                        {leave.status === 'REJECTED' ? 'Re-Approve' : 'Approve'}
                                                    </button>
                                                )}
                                                {leave.status !== 'REJECTED' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'REJECTED'); }}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-foreground text-xs font-bold rounded shadow"
                                                    >
                                                        {leave.status === 'APPROVED' ? 'Revoke (Reject)' : 'Reject'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-center text-gray-500 italic py-8">No leave history found.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
