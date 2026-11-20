"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SalarySlipTemplate from "@/components/documents/SalarySlipTemplate";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { 
    CreditCard, 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Play, 
    Calendar, 
    FileText, 
    Check, 
    X, 
    Clock, 
    Sparkles 
} from "lucide-react";

export default function PayrollPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState<string>("");

    // Process State
    const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
    const hiddenRef = useRef<HTMLDivElement>(null);
    const [tempData, setTempData] = useState<any>(null);

    const [month, setMonth] = useState("January");
    const [year, setYear] = useState("2026");

    // Leave Management Modal State
    const [selectedEmployeeLeaves, setSelectedEmployeeLeaves] = useState<any>(null);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // Role Protection
    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === "TEAM_LEAD") {
                    router.replace('/dashboard/admin');
                }
            }
        } catch (e) {
            console.error("Role Check Error", e);
        }
    }, [router]);

    useEffect(() => {
        fetchEmployees();
    }, [month, year]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users?role=EMPLOYEE');
            const data = await res.json();
            if (data.users) {
                const staff = data.users.filter((u: any) => u.role === 'EMPLOYEE' && u.status === 'ACTIVE');

                const processedStaff = staff.map((u: any) => {
                    const hasSlip = u.salarySlips?.some((s: any) => s.month === month && s.year === year);

                    // 1. Calculate Total Accrued Leaves based on Accrual Date (End of Selected Month)
                    const accrualTargetDate = new Date(Number(year), ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month) + 1, 0);
                    const joiningDate = u.joiningDate ? new Date(u.joiningDate) : new Date(Number(year), 0, 1);

                    let monthsWorked = 0;
                    monthsWorked = (accrualTargetDate.getFullYear() - joiningDate.getFullYear()) * 12;
                    monthsWorked += accrualTargetDate.getMonth() - joiningDate.getMonth();
                    monthsWorked += 1;
                    monthsWorked = Math.max(0, monthsWorked);

                    const totalCLAccrued = monthsWorked * 1.0;
                    const totalSLAccrued = monthsWorked * 0.5;

                    let usedCL = 0;
                    let usedSL = 0;
                    let currentMonthLeaves: any[] = [];

                    if (u.leaves) {
                        u.leaves.forEach((leave: any) => {
                            if (leave.status === 'APPROVED') {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                if (leave.type && leave.type.includes('_HALF')) {
                                    days = 0.5;
                                }

                                const leaveMonth = start.toLocaleString('default', { month: 'long' });
                                const leaveYear = start.getFullYear().toString();

                                if (leaveMonth === month && leaveYear === year) {
                                    currentMonthLeaves.push({ ...leave, calculatedDays: days });
                                } else if (start <= accrualTargetDate) {
                                    if (leave.type && leave.type.startsWith('SL')) {
                                        usedSL += days;
                                    } else {
                                        usedCL += days;
                                    }
                                }
                            }
                        });
                    }

                    let availableCL = Math.max(0, totalCLAccrued - usedCL);
                    let availableSL = Math.max(0, totalSLAccrued - usedSL);

                    let extraLeaveDays = 0;
                    currentMonthLeaves.forEach(leave => {
                        const days = leave.calculatedDays;
                        const isSL = leave.type && leave.type.startsWith('SL');

                        if (isSL) {
                            if (availableSL >= days) {
                                availableSL -= days;
                            } else {
                                const remaining = days - availableSL;
                                availableSL = 0;
                                if (availableCL >= remaining) {
                                    availableCL -= remaining;
                                } else {
                                    extraLeaveDays += (remaining - availableCL);
                                    availableCL = 0;
                                }
                            }
                        } else {
                            if (availableCL >= days) {
                                availableCL -= days;
                            } else {
                                extraLeaveDays += (days - availableCL);
                                availableCL = 0;
                            }
                        }
                    });

                    let leaveDeduction = 0;
                    let baseDailyRate = 0;
                    if (u.salaryDetails?.basicSalary) {
                        const monthlyBase = Number(u.salaryDetails.basicSalary);
                        baseDailyRate = monthlyBase / 30;
                        leaveDeduction = Math.round(extraLeaveDays * baseDailyRate);
                    }

                    const hasPendingLeaves = u.leaves?.some((l: any) => {
                        const lDate = new Date(l.startDate);
                        return lDate.toLocaleString('default', { month: 'long' }) === month &&
                            lDate.getFullYear().toString() === year &&
                            l.status === 'PENDING';
                    });

                    return {
                        ...u,
                        paymentStatus: hasSlip ? 'PAID' : 'PENDING',
                        leavesTaken: currentMonthLeaves.reduce((acc, curr) => acc + curr.calculatedDays, 0),
                        extraLeaveDays,
                        leaveDeduction,
                        balances: { cl: availableCL, sl: availableSL },
                        hasPendingLeaves
                    };
                });

                setEmployees(processedStaff);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runBatchProcess = async () => {
        const pendingEmployees = employees.filter(e => e.paymentStatus === 'PENDING');
        if (pendingEmployees.length === 0) return alert("No pending employees to process!");

        if (!confirm(`Are you sure you want to process payroll for ${pendingEmployees.length} employees? This will generate PDF slips, record the payments, and send emails.`)) return;

        setProcessing(true);

        for (let i = 0; i < pendingEmployees.length; i++) {
            const emp = pendingEmployees[i];
            setProcessStatus(`Processing ${i + 1}/${pendingEmployees.length}: ${emp.name}`);
            setCurrentProcessingId(emp.id);

            try {
                const calculatedDeductions = [
                    ...(emp.salaryDetails?.deductions || []),
                    ...(emp.leaveDeduction > 0 ? [{ name: `Unpaid Leave (${emp.extraLeaveDays} Days)`, amount: emp.leaveDeduction }] : [])
                ];

                const totalEarnings = (emp.salaryDetails?.earnings || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0) + Number(emp.salaryDetails?.basicSalary || 0);
                const totalDeductions = calculatedDeductions.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
                const netSalary = Math.max(0, totalEarnings - totalDeductions);

                const slipData = {
                    employeeName: emp.name,
                    designation: emp.designation || "Employee",
                    month,
                    year,
                    basicSalary: Number(emp.salaryDetails?.basicSalary || 0),
                    earnings: emp.salaryDetails?.earnings || [],
                    deductions: calculatedDeductions,
                    totalEarnings,
                    totalDeductions,
                    netSalary,
                    bankDetails: emp.bankDetails || { bankName: 'N/A', accountNumber: 'N/A', ifscCode: 'N/A' },
                    extraLeaveDays: emp.extraLeaveDays,
                    balances: emp.balances
                };

                setTempData(slipData);
                await new Promise(r => setTimeout(r, 800));

                if (hiddenRef.current) {
                    const canvas = await toPng(hiddenRef.current, { quality: 0.95 });
                    const pdf = new jsPDF("p", "mm", "a4");
                    pdf.addImage(canvas, "PNG", 0, 0, 210, 297);
                    const pdfBase64 = pdf.output('datauristring').split(',')[1];

                    const savePayload = {
                        userId: emp.id,
                        ...slipData,
                        sendEmail: false
                    };

                    await fetch('/api/admin/documents/salary-slip', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });

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
                fetchEmployees();
                setIsLeaveModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update leave status");
        }
    };

    const pendingCount = employees.filter(e => e.paymentStatus === 'PENDING').length;
    const paidCount = employees.filter(e => e.paymentStatus === 'PAID').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <CreditCard className="w-3.5 h-3.5" /> Staff Compensation
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payroll Automation</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Automated leave deductions, batch salary slip generation, and employee email disbursement.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select 
                            value={month} 
                            onChange={e => setMonth(e.target.value)} 
                            className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                        >
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={year} 
                            onChange={e => setYear(e.target.value)} 
                            className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer border-l border-slate-200 pl-2"
                        >
                            {[2025, 2026, 2027].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={fetchEmployees} 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Staff</p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">{employees.length}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid This Month</p>
                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">{paidCount}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Disbursement</p>
                        <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Disbursement List & Batch Action */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-600" /> Employee Payroll Roster
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Click on any employee row to review and approve their pending leave applications.
                        </p>
                    </div>
                    <button
                        onClick={runBatchProcess}
                        disabled={processing || pendingCount === 0}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                            processing 
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                : pendingCount === 0 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:shadow'
                        }`}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        {processing ? processStatus : `Process ${pendingCount} Pending Slips`}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200">
                                <th className="p-4 pl-6">Employee</th>
                                <th className="p-4">Designation</th>
                                <th className="p-4">Salary Config</th>
                                <th className="p-4">Leaves (Excess)</th>
                                <th className="p-4">Balance Rem.</th>
                                <th className="p-4">Leave Deduct</th>
                                <th className="p-4">Email Address</th>
                                <th className="p-4 pr-6 text-center">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium animate-pulse">
                                        Loading staff payroll data...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        No active employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr 
                                        key={emp.id} 
                                        className={`hover:bg-amber-50/30 transition-colors cursor-pointer group ${emp.hasPendingLeaves ? 'bg-amber-50/40' : ''}`} 
                                        onClick={() => handleManageLeaves(emp)}
                                    >
                                        <td className="p-4 pl-6 font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${emp.hasPendingLeaves ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <div>{emp.name}</div>
                                                    <span className="block text-[10px] text-slate-400 font-normal">Click to review leaves</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">{emp.designation || 'Employee'}</td>
                                        <td className="p-4">
                                            {emp.salaryDetails ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Configured
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {emp.leavesTaken} <span className="text-slate-400">({emp.extraLeaveDays > 0 ? `+${emp.extraLeaveDays}` : '0'})</span>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-600">
                                            CL: {emp.balances?.cl} | SL: {emp.balances?.sl}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-rose-600">
                                            {emp.leaveDeduction > 0 ? `-₹${emp.leaveDeduction.toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">{emp.email || '-'}</td>
                                        <td className="p-4 pr-6 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                emp.paymentStatus === 'PAID' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Manage Employee Leaves</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Reviewing leaves for <span className="font-semibold text-amber-600">{selectedEmployeeLeaves.name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsLeaveModalOpen(false)} 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-3">
                            {selectedEmployeeLeaves.leaves && selectedEmployeeLeaves.leaves.length > 0 ? (
                                selectedEmployeeLeaves.leaves
                                    .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                                    .map((leave: any) => (
                                        <div key={leave.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${leave.type?.includes('SL') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
                                                        {leave.type?.replace(/_HALF.*/, '') || 'CL'}
                                                        {leave.type?.includes('_HALF') && (
                                                            <span className="ml-1 opacity-70">HALF</span>
                                                        )}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-900 font-semibold text-sm">
                                                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-slate-500 text-xs italic mt-0.5">"{leave.reason}"</p>
                                            </div>

                                            <div className="flex gap-2">
                                                {leave.status !== 'APPROVED' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'APPROVED'); }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        {leave.status === 'REJECTED' ? 'Re-Approve' : 'Approve'}
                                                    </button>
                                                )}
                                                {leave.status !== 'REJECTED' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'REJECTED'); }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        {leave.status === 'APPROVED' ? 'Revoke' : 'Reject'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-center text-slate-400 italic py-10">No leave requests found for this employee.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
