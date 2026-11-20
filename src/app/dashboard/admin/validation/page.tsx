"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Plus, Trash2, ScanFace, Shield, Search, 
    UserCheck, AlertOctagon, Mic, CheckCircle2, XCircle, X
} from "lucide-react";
import AdminFaceEnrollment from "@/components/admin/AdminFaceEnrollment";
import AdminVoiceEnrollment from "@/components/admin/AdminVoiceEnrollment";

interface AdminUser {
    id: string;
    name: string;
    mobile: string;
    employeeId: string;
    role: string;
    isFaceEnrolled: boolean;
    voicePassphrase?: string;
    createdAt: string;
}

export default function AdminValidationPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ id: string, name: string } | null>(null);
    const router = useRouter();

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
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/admins");
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveAdmin = async (id: string) => {
        if (!confirm("Are you sure you want to remove this administrative user? Their biometric access will be revoked.")) return;
        try {
            const res = await fetch(`/api/admin/admins?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                alert("User removed successfully");
                fetchAdmins();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to remove user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openEnrollment = (admin: AdminUser) => {
        setSelectedAdmin({ id: admin.id, name: admin.name });
        setShowEnrollModal(true);
    };

    const roleBadges: Record<string, string> = {
        ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
        DEVELOPMENT_MANAGER: 'bg-amber-50 text-amber-700 border-amber-200',
        TEAM_LEAD: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Administrative Validation & Biometrics
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure elevated staff access, enroll 3D facial recognition, and setup voice authentication.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shadow-amber-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Staff Access</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Admin Staff</span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">{admins.length}</div>
                    <span className="text-xs text-slate-400 mt-1 block">Active administrative accounts</span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Face ID Verified</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                        {admins.filter(a => a.isFaceEnrolled).length}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">Biometric models active</span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pending Enrollment</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600">
                        {admins.filter(a => !a.isFaceEnrolled).length}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">Requires camera face scan</span>
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold tracking-wider text-[11px]">
                            <tr>
                                <th className="py-3 px-4">Staff Member</th>
                                <th className="py-3 px-4">Role & ID</th>
                                <th className="py-3 px-4">Biometrics Status</th>
                                <th className="py-3 px-4 text-right">Access Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        Loading staff access data...
                                    </td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        No administrative staff found.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                                    {admin.name ? admin.name.slice(0, 2).toUpperCase() : 'A'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{admin.name}</p>
                                                    <p className="text-slate-400 font-mono text-[11px]">{admin.mobile}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${roleBadges[admin.role] || 'bg-slate-100 text-slate-600'}`}>
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{admin.employeeId || 'ID: Unassigned'}</p>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                {admin.isFaceEnrolled ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                        FACE ENROLLED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <AlertOctagon className="w-3 h-3 text-rose-500" />
                                                        NO FACE ID
                                                    </span>
                                                )}

                                                {admin.voicePassphrase && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <Mic className="w-2.5 h-2.5" /> VOICE
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEnrollment(admin)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                                                >
                                                    <ScanFace className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>{admin.isFaceEnrolled ? "Re-scan Face" : "Enroll Face"}</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin({ id: admin.id, name: admin.name });
                                                        setShowVoiceModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                                                >
                                                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>{admin.voicePassphrase ? "Update Voice" : "Voice ID"}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleRemoveAdmin(admin.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                                    title="Revoke Admin Access"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-amber-600" /> Add Administrative Access
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const target = e.target as typeof e.target & {
                                name: { value: string };
                                mobile: { value: string };
                                password: { value: string };
                                role: { value: string };
                            };

                            try {
                                const res = await fetch("/api/admin/admins", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        name: target.name.value,
                                        mobile: target.mobile.value,
                                        password: target.password.value,
                                        role: target.role.value
                                    }),
                                });

                                if (res.ok) {
                                    const data = await res.json();
                                    alert(data.info || "Staff Account Created Successfully");
                                    setShowAddModal(false);
                                    fetchAdmins();
                                } else {
                                    const err = await res.json();
                                    alert(err.message || "Failed to create staff");
                                }
                            } catch (error) {
                                console.error(error);
                            }
                        }} className="space-y-3.5 text-xs">
                            <div>
                                <label className="text-[11px] text-slate-500 uppercase font-semibold block mb-1">Full Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-500 uppercase font-semibold block mb-1">Mobile Number</label>
                                <input
                                    name="mobile"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    placeholder="10-digit mobile"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-500 uppercase font-semibold block mb-1">Access Role Type</label>
                                <select
                                    name="role"
                                    defaultValue="TEAM_LEAD"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                                >
                                    <option value="TEAM_LEAD">Team Lead (Restricted Operations)</option>
                                    <option value="DEVELOPMENT_MANAGER">Development Manager (Full Student Operations)</option>
                                    <option value="ADMIN">Super Admin (Unrestricted System Access)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-500 uppercase font-semibold block mb-1">Initial Password</label>
                                <input
                                    name="password"
                                    required
                                    type="password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    placeholder="Temporary password"
                                />
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs shadow-amber-500/20"
                                >
                                    Create Staff Access
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Face Enrollment Modal */}
            <AdminFaceEnrollment
                isOpen={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
                onSuccess={() => {
                    fetchAdmins();
                }}
                userId={selectedAdmin?.id || ""}
                userName={selectedAdmin?.name || "Admin"}
            />

            {/* Voice Enrollment Modal */}
            <AdminVoiceEnrollment
                isOpen={showVoiceModal}
                onClose={() => setShowVoiceModal(false)}
                onSuccess={() => {
                    fetchAdmins();
                }}
                userId={selectedAdmin?.id || ""}
                userName={selectedAdmin?.name || "Admin"}
            />
        </div>
    );
}
