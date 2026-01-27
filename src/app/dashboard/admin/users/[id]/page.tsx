"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, DollarSign, Calendar, FileCheck, Award, User, Clock, Check, X, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Preview State
    const [preview, setPreview] = useState<{ type: 'PDF' | 'EXCEL', url: string, data?: any[] } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${id}`);
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, [id]);

    const handleViewPdf = (path: string) => {
        setPreview({ type: 'PDF', url: path });
    };

    const handleViewExcel = async (path: string) => {
        setLoadingPreview(true);
        try {
            console.log("Fetching Excel:", path);
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
            const arrayBuffer = await res.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setPreview({ type: 'EXCEL', url: path, data });
        } catch (error: any) {
            console.error("Excel Error:", error);
            if (error.message && (error.message.includes("password") || error.message.includes("encrypted"))) {
                if (confirm("This Excel file is password protected and cannot be previewed. Do you want to download it instead?")) {
                    window.open(path, '_blank');
                }
            } else {
                alert(`Failed to parse Excel file: ${error.message}`);
            }
        } finally {
            setLoadingPreview(false);
        }
    };

    const closePreview = () => setPreview(null);

    if (!user) return <div className="p-8 text-center text-gray-500">Loading user details...</div>;

    const tabs = [
        { id: "overview", label: "Overview", icon: User },
        { id: "submissions", label: "Submissions", icon: FileText },
        { id: "billing", label: "Billing", icon: DollarSign },
        { id: "attendance", label: "Attendance", icon: Clock },
        { id: "documents", label: "Documents", icon: FileCheck },
    ];

    // Helper to get course name
    const getCourseName = () => {
        if (user.course) return user.course;
        if (user.joiningLetters && user.joiningLetters.length > 0) {
            // Prioritize designation as per user request
            return user.joiningLetters[0].designation || user.joiningLetters[0].internshipType;
        }
        return '-';
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                        <p className="text-gray-500 text-sm">{user.email} • {user.mobile}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {user.status}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="font-semibold text-gray-800">{user.role}</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? "bg-white border-b-2 border-indigo-600 text-indigo-600"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                            <div className="space-y-3 text-sm">
                                <InfoRow label="Course" value={getCourseName()} />
                                <InfoRow label="Joining Date" value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : '-'} />
                                <InfoRow label="Duration" value={user.duration || '-'} />
                                <InfoRow label="College" value={user.college || '-'} />
                                <InfoRow label="University" value={user.university || '-'} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Financial Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Total Fees" value={user.totalFees} prefix="₹" />
                                <StatCard label="Paid Amount" value={user.paidAmount} prefix="₹" color="text-green-600" />
                                <StatCard label="Pending" value={(user.totalFees || 0) - (user.paidAmount || 0)} prefix="₹" color="text-red-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBMISSIONS TAB */}
                {activeTab === "submissions" && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Weekly Submissions ({user.submissions?.length || 0})</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Week</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Files</th>
                                        <th className="px-4 py-3">Submitted At</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(user.submissions || []).map((sub: any) => (
                                        <tr key={sub.id} className="border-b hover:bg-gray-50 parent-row">
                                            <td className="px-4 py-3 font-medium text-gray-900">{sub.weekStartDate}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        sub.status === 'LATE' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 flex gap-2">
                                                {sub.pdfPath && <button onClick={() => handleViewPdf(sub.pdfPath)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                    <FileText className="w-3 h-3" /> PDF
                                                </button>}
                                                {sub.excelPath && <button onClick={() => handleViewExcel(sub.excelPath)} className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:bg-green-50 px-2 py-1 rounded border border-green-100">
                                                    <FileText className="w-3 h-3" /> XLS
                                                </button>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {new Date(sub.submittedAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {/* Approve */}
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Approve this submission?')) return;
                                                            await fetch(`/api/admin/submissions/${sub.id}`, {
                                                                method: 'PATCH',
                                                                body: JSON.stringify({ status: 'APPROVED' })
                                                            });
                                                            // Refresh logic needed, but for now simple reload or parent fetch
                                                            window.location.reload();
                                                        }}
                                                        title="Approve"
                                                        className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>

                                                    {/* Reject */}
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Reject this submission?')) return;
                                                            await fetch(`/api/admin/submissions/${sub.id}`, {
                                                                method: 'PATCH',
                                                                body: JSON.stringify({ status: 'REJECTED' })
                                                            });
                                                            window.location.reload();
                                                        }}
                                                        title="Reject"
                                                        className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Permanently delete this submission?')) return;
                                                            await fetch(`/api/admin/submissions/${sub.id}`, { method: 'DELETE' });
                                                            window.location.reload();
                                                        }}
                                                        title="Delete"
                                                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors ml-2 border-l border-gray-200 pl-3"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(user.submissions || []).length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-4 text-gray-400">No submissions found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* BILLING TAB */}
                {activeTab === "billing" && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Invoices ({user.invoices?.length || 0})</h3>
                        <div className="space-y-3">
                            {(user.invoices || []).map((inv: any) => (
                                <div key={inv.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">{inv.invoiceNumber}</p>
                                        <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">₹{inv.total}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === "attendance" && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Attendance Log ({user.attendance?.length || 0})</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {(user.attendance || []).map((att: any) => (
                                <div key={att.id} className="flex justify-between p-2 border-b text-sm">
                                    <span>{att.date}</span>
                                    <span className={att.status === 'PRESENT' || att.status === 'APPROVED' ? 'text-green-600' : 'text-red-500'}>
                                        {att.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === "documents" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.joiningLetters?.length > 0 && (
                            <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                                <h4 className="font-semibold text-blue-800 mb-2">Joining Letters</h4>
                                {user.joiningLetters.map((jl: any) => (
                                    <div key={jl.id} className="text-sm mb-1">
                                        Isued: {jl.date} - <span className="font-medium">{jl.designation}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {user.certificates?.length > 0 && (
                            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-100">
                                <h4 className="font-semibold text-yellow-800 mb-2">Certificates</h4>
                                {user.certificates.map((cert: any) => (
                                    <div key={cert.id} className="text-sm mb-1">
                                        {cert.name} - {cert.course}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SALARY SLIPS SECTION (Grouped by Year) */}
                        {(user.salarySlips?.length || 0) > 0 && (
                            <div className="p-4 border rounded-lg bg-green-50 border-green-100 col-span-1 md:col-span-2">
                                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Salary Slip History
                                </h4>

                                {Object.entries(
                                    (user.salarySlips || []).reduce((acc: any, slip: any) => {
                                        const year = slip.year || "Unknown Year";
                                        if (!acc[year]) acc[year] = [];
                                        acc[year].push(slip);
                                        return acc;
                                    }, {})
                                ).sort(([yearA], [yearB]) => Number(yearB) - Number(yearA)) // Sort Years Descending
                                    .map(([year, slips]: [string, any]) => (
                                        <div key={year} className="mb-6 last:mb-0">
                                            <h5 className="font-bold text-gray-700 mb-2 border-b border-green-200 pb-1 flex justify-between items-center">
                                                <span>{year}</span>
                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{slips.length} Months</span>
                                            </h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {slips.sort((a: any, b: any) => {
                                                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                                    return months.indexOf(b.month) - months.indexOf(a.month);
                                                }).map((slip: any) => (
                                                    <div key={slip.id} className="bg-white p-3 rounded border border-green-200 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="font-bold text-gray-800">{slip.month}</p>
                                                            <span className="text-[10px] text-gray-400">{new Date(slip.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-green-600 font-medium">Net: ₹{(
                                                            (slip.basicSalary + slip.hra + slip.special + slip.conveyance + slip.medical + slip.bonus) -
                                                            (slip.pf + slip.professionalTax + slip.tds + slip.loan + slip.otherDeductions)
                                                        ).toLocaleString()}</p>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Are you sure you want to delete this salary slip?')) {
                                                                    try {
                                                                        const res = await fetch(`/api/admin/documents/salary-slip/${slip.id}`, { method: 'DELETE' });
                                                                        const data = await res.json();
                                                                        if (data.success) {
                                                                            window.location.reload();
                                                                        } else {
                                                                            alert(data.error || "Failed to delete");
                                                                        }
                                                                    } catch (e) {
                                                                        alert("Network error");
                                                                    }
                                                                }
                                                            }}
                                                            className="mt-2 self-end p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Salary Slip"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {user.joiningLetters?.length === 0 && user.certificates?.length === 0 && (!user.salarySlips || user.salarySlips.length === 0) && (
                            <p className="text-gray-400">No official documents issued yet.</p>
                        )}
                    </div>
                )}

            </div>

            {/* Preview Modal */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {preview.type === 'PDF' ? '📄 Report Preview' : '📊 Excel Data Preview'}
                            </h3>
                            <div className="flex gap-2">
                                <a
                                    href={preview.url}
                                    download
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    ⬇ Download Original
                                </a>
                                <button onClick={closePreview} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                                    ✕ Close
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            {preview.type === 'PDF' ? (
                                <iframe src={preview.url} className="w-full h-full rounded border border-gray-300 bg-white" />
                            ) : (
                                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-auto max-h-full">
                                    {preview.data ? (
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {preview.data.map((row: any[], i) => (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="border-r border-gray-100 px-4 py-2 whitespace-nowrap text-gray-700 font-mono">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">Loading Excel Data...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
        </div>
    );
}

function StatCard({ label, value, prefix = "", color = "text-gray-900" }: any) {
    return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{prefix}{value || 0}</p>
        </div>
    );
}
