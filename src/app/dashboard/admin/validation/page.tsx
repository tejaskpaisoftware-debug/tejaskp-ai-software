"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, ScanFace, Shield, Search, UserCheck, AlertOctagon, Mic } from "lucide-react";
import AdminFaceEnrollment from "@/components/admin/AdminFaceEnrollment";
import AdminVoiceEnrollment from "@/components/admin/AdminVoiceEnrollment";

interface AdminUser {
    id: string;
    name: string;
    mobile: string;
    employeeId: string;
    isFaceEnrolled: boolean;
    voicePassphrase?: string; // Add check for voice
    createdAt: string;
}

export default function AdminValidationPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ id: string, name: string } | null>(null);

    // Form Stats
    const [newName, setNewName] = useState("");
    const [newMobile, setNewMobile] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
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

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, mobile: newMobile, password: newPassword }),
            });

            if (res.ok) {
                alert("Sub-Admin Created Successfully");
                setShowAddModal(false);
                setNewName("");
                setNewMobile("");
                setNewPassword("");
                fetchAdmins();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to create admin");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openEnrollment = (admin: AdminUser) => {
        setSelectedAdmin({ id: admin.id, name: admin.name });
        setShowEnrollModal(true);
    };

    return (
        <div className="p-8 space-y-8 bg-[#0a0a0a] min-h-screen text-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-blue-500" /> Admin Validation
                    </h1>
                    <p className="text-gray-400 mt-2">Manage Sub-Admins and Biometric Access Control</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20"
                >
                    <Plus size={20} /> Add Sub Admin
                </button>
            </div>

            {/* Stats / Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
                    <div className="text-2xl font-bold text-white mb-1">{admins.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Total Admins</div>
                </div>
                <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
                    <div className="text-2xl font-bold text-green-500 mb-1">{admins.filter(a => a.isFaceEnrolled).length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Biometrics Active</div>
                </div>
                <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
                    <div className="text-2xl font-bold text-red-500 mb-1">{admins.filter(a => !a.isFaceEnrolled).length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Pending Enrollment</div>
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wider text-gray-400 font-semibold">
                            <tr>
                                <th className="p-4">Admin Details</th>
                                <th className="p-4">Role / ID</th>
                                <th className="p-4">Biometric Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading Access Data...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No Sub-Admins Found</td></tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20">
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{admin.name}</div>
                                                    <div className="text-xs text-gray-500">{admin.mobile}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-mono text-gray-300">{admin.employeeId || 'N/A'}</div>
                                            <div className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded w-fit mt-1">SUPER ADMIN</div>
                                        </td>
                                        <td className="p-4">
                                            {admin.isFaceEnrolled ? (
                                                <div className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded-full w-fit">
                                                    <CheckCircle size={14} /> ACTIVE
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-full w-fit">
                                                    <AlertOctagon size={14} /> NOT ENROLLED
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => openEnrollment(admin)}
                                                className="flex items-center gap-2 bg-[#222] hover:bg-blue-600 hover:text-white text-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-gray-700 hover:border-blue-500"
                                            >
                                                <ScanFace size={16} />
                                                {admin.isFaceEnrolled ? "Re-Scan Face" : "Enroll Face"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAdmin({ id: admin.id, name: admin.name });
                                                    setShowVoiceModal(true);
                                                }}
                                                className="flex items-center gap-2 bg-[#222] hover:bg-green-600 hover:text-white text-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-gray-700 hover:border-green-500 ml-2"
                                            >
                                                <Mic size={16} />
                                                {admin.voicePassphrase ? "Update Voice" : "Enroll Voice"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-gray-700 p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" /> New Sub Admin
                        </h2>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                                <input
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-white mt-1 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Mobile</label>
                                <input
                                    required
                                    value={newMobile}
                                    onChange={e => setNewMobile(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-white mt-1 focus:border-blue-500 focus:outline-none"
                                    placeholder="10-digit mobile"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-white mt-1 focus:border-blue-500 focus:outline-none"
                                    placeholder="Secure password"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    Create Access
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
                    fetchAdmins(); // Refresh status
                }}
                userId={selectedAdmin?.id || ""}
                userName={selectedAdmin?.name || "Admin"}
            />

            {/* Voice Enrollment Modal - Reuse selectedAdmin state or create new if needed. Reusing for simplicity. */}
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
// Helper icon
function CheckCircle({ size, className = "" }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    )
}
