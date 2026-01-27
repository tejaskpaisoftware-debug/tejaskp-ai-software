'use client';


import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// AdminSidebar removed (handled by layout)
import SalarySlipTemplate from '@/components/documents/SalarySlipTemplate';
import jsPDF from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import UserCard from "./UserCard";

interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    status: string;
    createdAt: string;
    course?: string; // Opt
    paymentMode?: string;
    totalFees?: number;
    paidAmount?: number;
    pendingAmount?: number;
    joiningDate?: string;
    salarySlips?: any[];
    salaryDetails?: string; // JSON
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [activeRole, setActiveRole] = useState("STUDENT"); // Default tab
    const [loading, setLoading] = useState(true);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMsg, setUploadMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Salary Slip View State
    const [salarySlipModal, setSalarySlipModal] = useState<{ isOpen: boolean, step: 'SELECT' | 'VIEW', userId: string, userName: string, userEmail?: string, data?: any } | null>(null);
    const [viewMonth, setViewMonth] = useState("January");
    const [viewYear, setViewYear] = useState("2026");
    const [viewLoading, setViewLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const salarySlipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('uploading');
        setUploadMsg('Uploading and processing...');

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch('/api/admin/students/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setUploadStatus('success');
                setUploadMsg(data.message || 'Data imported successfully!');
                fetchUsers(); // Refresh list
                setTimeout(() => setUploadStatus('idle'), 3000);
            } else {
                setUploadStatus('error');
                setUploadMsg(data.error || 'Upload failed');
            }
        } catch (err: any) {
            setUploadStatus('error');
            setUploadMsg(err.message || "Network error");
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        setUploadStatus('uploading');
        setUploadMsg("Deleting user...");

        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setUploadStatus('success');
                setUploadMsg('User deleted successfully');
                fetchUsers();
                setTimeout(() => setUploadStatus('idle'), 3000);
            } else {
                setUploadStatus('error');
                setUploadMsg(data.error || 'Failed to delete user');
            }
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
            setUploadMsg('Network error during deletion');
        }
    };

    const handleUpdateStatus = async (userId: string, newStatus: string) => {
        setUploadStatus('uploading');
        setUploadMsg(`Updating status to ${newStatus}...`);

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                setUploadStatus('success');
                setUploadMsg('User status updated');
                // Optimistic update
                setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
                setTimeout(() => setUploadStatus('idle'), 2000);
            } else {
                setUploadStatus('error');
                setUploadMsg(data.error || 'Failed to update status');
            }
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
            setUploadMsg('Network error');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setUploadStatus('uploading');
        setUploadMsg("Updating user...");

        // Parse salary details if it's a string from input
        let finalBody = { ...editingUser };
        console.log("Saving User Data:", finalBody);

        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            const data = await res.json();

            if (data.success) {
                setUploadStatus('success');
                setUploadMsg('User updated successfully');
                setEditingUser(null); // Close modal
                fetchUsers();
                setTimeout(() => setUploadStatus('idle'), 3000);
            } else {
                setUploadStatus('error');
                setUploadMsg(data.error + (data.details ? `: ${data.details}` : '') || 'Failed to update user');
            }
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
            setUploadMsg('Network error');
        }
    };

    // Filter users based on Search Query
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(query)) ||
            (user.mobile && user.mobile.includes(query)) ||
            (user.course && user.course.toLowerCase().includes(query)) ||
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.id && user.id.toLowerCase().includes(query))
        );
    });

    // Recent 5 Users Widget Data
    const recentFiveUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const openSalarySlipModal = (user: User) => {
        setSalarySlipModal({
            isOpen: true,
            step: 'SELECT',
            userId: user.id,
            userName: user.name,
            userEmail: user.email
        });
        // Reset defaults
        setViewMonth("January");
        setViewYear(new Date().getFullYear().toString());
    };

    const handleFetchSalarySlip = async () => {
        if (!salarySlipModal) return;
        setViewLoading(true);
        try {
            // Fetch fresh user data to get relations
            const res = await fetch(`/api/admin/users/${salarySlipModal.userId}`);
            const data = await res.json();

            if (data.user && data.user.salarySlips) {
                // Find matching slip
                const slip = data.user.salarySlips.find((s: any) =>
                    s.month === viewMonth && s.year === viewYear
                );

                if (slip) {
                    // Map to Template Data
                    const templateData = {
                        month: slip.month,
                        year: slip.year,
                        employeeName: data.user.name,
                        designation: "Employee",
                        employeeId: "EMP-" + data.user.mobile.slice(-4),
                        joiningDate: data.user.joiningDate ? new Date(data.user.joiningDate).toLocaleDateString() : new Date(data.user.createdAt).toLocaleDateString(),
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
                    setSalarySlipModal(prev => prev ? ({ ...prev, step: 'VIEW', data: templateData }) : null);
                } else {
                    alert(`No salary slip found for ${viewMonth} ${viewYear}`);
                }
            } else {
                alert("Could not fetch user data. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error fetching salary slip");
        } finally {
            setViewLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            if (salarySlipRef.current) {
                const dataUrl = await toPng(salarySlipRef.current, { quality: 1.0, pixelRatio: 2 });
                const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for Portrait
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`SalarySlip_${salarySlipModal?.userName?.replace(/\s+/g, '_')}_${viewMonth}_${viewYear}.pdf`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!salarySlipModal?.data || !salarySlipRef.current) return;

        const email = salarySlipModal.userEmail;
        if (!email) {
            alert("User email not found. Cannot send email.");
            return;
        }

        if (!confirm(`Send Salary Slip to ${email}?`)) return;

        setIsSendingEmail(true);
        try {
            const dataUrl = await toJpeg(salarySlipRef.current, { quality: 0.8, pixelRatio: 1.5 });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            const pdfBase64 = pdf.output('datauristring');

            const res = await fetch('/api/admin/documents/salary-slip/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    name: salarySlipModal.userName,
                    month: viewMonth,
                    year: viewYear,
                    pdfBase64: pdfBase64,
                })
            });

            const result = await res.json();
            if (result.success) {
                setUploadStatus('success');
                setUploadMsg("Email sent successfully!");
                setTimeout(() => setUploadStatus('idle'), 3000);
            } else {
                alert("Failed to send email: " + result.error);
            }
        } catch (error) {
            console.error("Email Error:", error);
            alert("Error sending email.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <>
            {/* Hidden Input */}
            <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Notification Toast */}
            <AnimatePresence>
                {uploadStatus !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className={`fixed top-10 left-1/2 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md z-50 border 
                            ${uploadStatus === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                                uploadStatus === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                    'bg-gold-500/20 border-gold-500/50 text-gold-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            {uploadStatus === 'uploading' && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                            <span className="font-bold">{uploadMsg}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Salary Slip Modal */}
            <AnimatePresence>
                {salarySlipModal?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        {/* SELECT STEP */}
                        {salarySlipModal.step === 'SELECT' && (
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="bg-gray-900 border border-gold-theme/30 p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
                            >
                                <button onClick={() => setSalarySlipModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span>📄</span> View Salary Slip
                                </h2>
                                <p className="text-gray-400 text-sm mb-6">Select the period to view for <span className="text-gold-400 font-bold">{salarySlipModal.userName}</span></p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase text-gray-500 mb-1">Month</label>
                                        <select value={viewMonth} onChange={e => setViewMonth(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-gray-100 outline-none focus:border-gold-500">
                                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-gray-500 mb-1">Year</label>
                                        <select value={viewYear} onChange={e => setViewYear(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-gray-100 outline-none focus:border-gold-500">
                                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                <option key={y} value={String(y)}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleFetchSalarySlip}
                                        disabled={viewLoading}
                                        className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition-all mt-4 disabled:opacity-50"
                                    >
                                        {viewLoading ? "Searching..." : "View Salary Slip"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW STEP */}
                        {salarySlipModal.step === 'VIEW' && salarySlipModal.data && (
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="bg-gray-100 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative"
                            >
                                <div className="bg-card p-4 flex justify-between items-center border-b border-gray-700 shrink-0">
                                    <h3 className="text-foreground font-bold">Salary Slip Preview</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isGenerating}
                                            className="px-3 py-1 bg-gold-500 text-obsidian font-bold text-sm rounded hover:bg-gold-400 disabled:opacity-50"
                                        >
                                            {isGenerating ? "Saving..." : "⬇ Save PDF"}
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={isSendingEmail || isGenerating}
                                            className="px-3 py-1 bg-blue-600 text-foreground font-bold text-sm rounded hover:bg-blue-500 disabled:opacity-50"
                                        >
                                            {isSendingEmail ? "Sending..." : "✉ Email"}
                                        </button>
                                        <button
                                            onClick={() => setSalarySlipModal(prev => prev ? ({ ...prev, step: 'SELECT' }) : null)}
                                            className="px-3 py-1 bg-gray-700 text-foreground text-sm rounded hover:bg-gray-600"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setSalarySlipModal(null)}
                                            className="px-3 py-1 bg-red-600 text-foreground text-sm rounded hover:bg-red-500"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-200">
                                    <div className="shadow-2xl">
                                        <SalarySlipTemplate ref={salarySlipRef} data={salarySlipModal.data} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-card border border-gold-theme/30 p-8 rounded-2xl w-full max-w-lg shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 mb-6">
                                Edit User
                            </h2>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editingUser.name || ''}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        className="w-full bg-background border border-theme rounded p-2 text-foreground focus:border-gold-theme outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Mobile</label>
                                        <input
                                            type="text"
                                            value={editingUser.mobile || ''}
                                            onChange={e => setEditingUser({ ...editingUser, mobile: e.target.value })}
                                            className="w-full bg-background border border-theme rounded p-2 text-foreground focus:border-gold-theme outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editingUser.email || ''}
                                            onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                            className="w-full bg-background border border-theme rounded p-2 text-foreground focus:border-gold-theme outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Course</label>
                                    <input
                                        type="text"
                                        value={editingUser.course || ''}
                                        onChange={e => setEditingUser({ ...editingUser, course: e.target.value })}
                                        className="w-full bg-black/30 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Total Fees</label>
                                        <input
                                            type="number"
                                            value={editingUser.totalFees || 0}
                                            onChange={e => setEditingUser({ ...editingUser, totalFees: Number(e.target.value) })}
                                            className="w-full bg-black/30 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Paid Amount</label>
                                        <input
                                            type="number"
                                            value={editingUser.paidAmount || 0}
                                            onChange={e => setEditingUser({ ...editingUser, paidAmount: Number(e.target.value) })}
                                            className="w-full bg-black/30 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                                    <select
                                        value={editingUser.status}
                                        onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                                        className="w-full bg-black/30 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="BLOCKED">BLOCKED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full bg-black/30 border border-theme rounded p-2 text-foreground focus:border-gold-500 outline-none"
                                    >
                                        <option value="STUDENT">STUDENT</option>
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="CLIENT">CLIENT</option>
                                    </select>
                                </div>

                                {editingUser.role === 'EMPLOYEE' && (
                                    <div className="border-t border-white/10 pt-4 mt-4">
                                        <h3 className="text-gold-400 font-bold mb-4">Salary Structure (Monthly)</h3>
                                        {(() => {
                                            const details = editingUser.salaryDetails ? JSON.parse(editingUser.salaryDetails) : { basic: 15000, hra: 6000, special: 4000, pf: 1800, pt: 200 };
                                            const updateDetails = (key: string, val: number) => {
                                                const newDetails = { ...details, [key]: val };
                                                setEditingUser({ ...editingUser, salaryDetails: JSON.stringify(newDetails) });
                                            };
                                            return (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Basic Salary</label>
                                                        <input type="number" value={details.basic || 0} onChange={e => updateDetails('basic', Number(e.target.value))} className="w-full bg-black/30 border border-theme rounded p-2 text-foreground outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">HRA</label>
                                                        <input type="number" value={details.hra || 0} onChange={e => updateDetails('hra', Number(e.target.value))} className="w-full bg-black/30 border border-theme rounded p-2 text-foreground outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Special Allowance</label>
                                                        <input type="number" value={details.special || 0} onChange={e => updateDetails('special', Number(e.target.value))} className="w-full bg-black/30 border border-theme rounded p-2 text-foreground outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">PF (Deduction)</label>
                                                        <input type="number" value={details.pf || 0} onChange={e => updateDetails('pf', Number(e.target.value))} className="w-full bg-black/30 border border-theme rounded p-2 text-foreground outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Prof. Tax</label>
                                                        <input type="number" value={details.pt || 0} onChange={e => updateDetails('pt', Number(e.target.value))} className="w-full bg-black/30 border border-theme rounded p-2 text-foreground outline-none" />
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}

                                <div className="flex gap-4 mt-8 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gold-500 hover:bg-gold-400 text-obsidian font-bold py-2 rounded transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recent Users Widget Box */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10 glass-card-3d p-8 relative overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 flex items-center gap-3 relative z-10">
                    <span className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500 border border-yellow-500/20 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]">✨</span>
                    Recently Added Users <span className="text-sm font-normal text-gray-400 ml-auto block md:inline">(Last 5)</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 relative z-10">
                    {recentFiveUsers.map((u, i) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}
                            className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-yellow-500/40 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    u.role === 'EMPLOYEE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        u.role === 'CLIENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {u.role}
                                </span>
                                <span className="text-[10px] text-gray-400">{new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="font-bold text-white text-sm truncate mb-1 group-hover:text-yellow-400 transition-colors">{u.name}</div>
                            <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                                <span className="opacity-50">📱</span> {u.mobile}
                            </div>
                        </motion.div>
                    ))}
                    {recentFiveUsers.length === 0 && (
                        <div className="col-span-5 text-center text-gray-500 py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                            No recent users found.
                        </div>
                    )}
                </div>
            </motion.div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-3d tracking-wide pb-2">
                        All Users
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide drop-shadow-md">Manage all registered users categorized by their role.</p>
                </div>
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="relative group w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-3d w-full md:w-64 pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadStatus === 'uploading'}
                        className="btn-3d px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 group disabled:opacity-50"
                    >
                        <span>📂</span> Upload Excel
                    </button>
                    <button
                        onClick={fetchUsers}
                        className="btn-3d-primary px-6 py-2.5 rounded-xl transition-all"
                    >
                        Refresh List
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm("DANGER: Are you sure you want to delete ALL students, invoices, and attendance data?\n\nThis action CANNOT be undone.")) {
                                if (confirm("Please confirm again: This will wipe the entire database (except Admin accounts and Company Expenses).")) {
                                    setUploadStatus('uploading');
                                    setUploadMsg('Resetting Database...');
                                    try {
                                        const res = await fetch('/api/admin/reset-data', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            setUploadStatus('success');
                                            setUploadMsg('Database Successfully Reset');
                                            fetchUsers();
                                            setTimeout(() => setUploadStatus('idle'), 3000);
                                        } else {
                                            setUploadStatus('error');
                                            setUploadMsg(data.error || 'Reset Failed');
                                        }
                                    } catch (e) {
                                        setUploadStatus('error');
                                        setUploadMsg('Network Error');
                                    }
                                }
                            }
                        }}
                        className="relative overflow-hidden bg-gradient-to-b from-red-900/80 to-red-950 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-xl font-bold hover:bg-red-900 transition-all shadow-[0_4px_6px_rgba(0,0,0,0.3)] active:scale-95 text-xs md:text-sm"
                    >
                        ⚠️ Clear All Data
                    </button>
                </div>
            </header>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-4 border-b border-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {["ALL", "RECENT", "STUDENT", "EMPLOYEE", "CLIENT", "ADMIN", "PENDING_FEES"].map((role) => {
                    const count = role === "ALL" ? filteredUsers.length :
                        role === "RECENT" ? filteredUsers.filter(u => new Date(u.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length :
                            role === "PENDING_FEES" ? filteredUsers.filter(u => (u.pendingAmount || 0) > 0).length :
                                filteredUsers.filter(u => u.role === role).length;

                    const isActive = activeRole === role;

                    return (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`
                                relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300
                                ${isActive
                                    ? "bg-gradient-to-b from-yellow-500 to-yellow-600 text-black shadow-[0_5px_15px_rgba(234,179,8,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] transform -translate-y-1"
                                    : "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/5 text-gray-400 hover:text-white hover:border-yellow-500/30 hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                                }
                            `}
                        >
                            <span className={`tracking-wide text-sm uppercase ${isActive ? "drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]" : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"}`}>
                                {role === "ALL" ? "All Users" :
                                    role === "RECENT" ? "Recently Added" :
                                        role === "STUDENT" ? "Students" :
                                            role === "EMPLOYEE" ? "Employees" :
                                                role === "CLIENT" ? "Clients" :
                                                    role === "PENDING_FEES" ? "Pending Fees" : "Admins"}
                            </span>
                            <span className={`
                                text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-inner
                                ${isActive
                                    ? "bg-black/20 text-black"
                                    : "bg-black/40 text-gray-500"
                                }
                            `}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gold-theme animate-pulse">Loading users...</div>
            ) : (
                <div className="space-y-12">
                    {/* Render Selected Role Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeRole}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {filteredUsers
                                .filter(u => activeRole === "ALL" || (activeRole === "RECENT" ? new Date(u.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : activeRole === "PENDING_FEES" ? (u.pendingAmount || 0) > 0 : u.role === activeRole))
                                .length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground border border-dashed border-theme rounded-xl">
                                    <p className="text-xl">No {activeRole === "ALL" ? "users" : activeRole === "RECENT" ? "recent users" : activeRole === "PENDING_FEES" ? "pending payments" : activeRole.toLowerCase() + "s"} found.</p>
                                    <p className="text-sm mt-2">Try adjusting your search{activeRole !== "PENDING_FEES" && ` or add a new ${activeRole === "ALL" ? "user" : activeRole.toLowerCase()}`}.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                    {filteredUsers
                                        .filter(u => activeRole === "ALL" || (activeRole === "RECENT" ? new Date(u.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : activeRole === "PENDING_FEES" ? (u.pendingAmount || 0) > 0 : u.role === activeRole))
                                        .map((user) => (
                                            <UserCard
                                                key={user.id}
                                                user={user}
                                                onEdit={setEditingUser}
                                                onStatusUpdate={handleUpdateStatus}
                                                onDelete={handleDelete}
                                                onSalarySlip={openSalarySlipModal}
                                            />
                                        ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

        </>
    );
}
