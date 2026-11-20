"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
    ShieldAlert, 
    RefreshCw, 
    Pencil, 
    CheckCircle2, 
    PauseCircle, 
    Ban, 
    Trash2, 
    X, 
    User, 
    Mail, 
    Phone, 
    ShieldCheck 
} from "lucide-react";

type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED";
type User = {
    id: string;
    name: string;
    mobile: string;
    email: string;
    role: string;
    status: UserStatus;
    password?: string;
    createdAt: string;
};

export default function SystemLogsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (res.ok) setUsers(data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (mobile: string, status: UserStatus) => {
        setUsers(users.map(u => u.mobile === mobile ? { ...u, status } : u));
        try {
            const res = await fetch("/api/admin/users/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, status }),
            });
            if (!res.ok) fetchUsers();
        } catch (err) { fetchUsers(); }
    };

    const deleteUser = async (mobile: string) => {
        if (!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;

        setUsers(users.filter(u => u.mobile !== mobile));

        try {
            const res = await fetch("/api/admin/users/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile }),
            });
            if (!res.ok) {
                alert("Failed to delete user");
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
            fetchUsers();
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await fetch("/api/admin/users/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobile: editingUser.mobile,
                    name: editingUser.name,
                    role: editingUser.role,
                    email: editingUser.email,
                }),
            });
            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to update user.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Governance & Security
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Logs & Governance</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Audit user lifecycles, enforce permission boundaries, and manage account statuses.
                    </p>
                </div>

                <button 
                    onClick={fetchUsers} 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl transition-colors self-start sm:self-auto"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Roster
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4 pl-6">User Name</th>
                                <th className="p-4">Assigned Role</th>
                                <th className="p-4">Contact (Mobile / Email)</th>
                                <th className="p-4">Account Status</th>
                                <th className="p-4 pr-6 text-center">Governance Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium animate-pulse">
                                        Loading registered accounts...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        No registered users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.mobile} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-4 pl-6 font-semibold text-slate-900">{user.name || "N/A"}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-xs font-semibold text-slate-900">{user.mobile}</div>
                                            <div className="text-[11px] text-slate-400">{user.email || "No email"}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                user.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                                    title="Quick Edit Details"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {user.status !== "ACTIVE" && (
                                                    <button
                                                        onClick={() => updateStatus(user.mobile, "ACTIVE")}
                                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                                                        title="Approve / Activate Account"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                )}
                                                {user.status !== "PENDING" && user.role !== "ADMIN" && (
                                                    <button
                                                        onClick={() => updateStatus(user.mobile, "PENDING")}
                                                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-colors"
                                                        title="Suspend / Mark Pending"
                                                    >
                                                        <PauseCircle size={14} />
                                                    </button>
                                                )}
                                                {user.status !== "BLOCKED" && user.role !== "ADMIN" && (
                                                    <button
                                                        onClick={() => updateStatus(user.mobile, "BLOCKED")}
                                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                                                        title="Block Account"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                )}
                                                {user.role !== "ADMIN" && (
                                                    <button
                                                        onClick={() => deleteUser(user.mobile)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setEditingUser(null)} 
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Edit Account Credentials</h2>
                        <p className="text-xs text-slate-500 mb-5">Update personal details and permission role.</p>

                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">Full Name</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="opacity-60">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Mobile Identifier (Fixed)</label>
                                <input
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed font-mono"
                                    value={editingUser.mobile}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">Assigned Role</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-amber-500 focus:outline-none cursor-pointer"
                                    value={editingUser.role}
                                    // @ts-ignore
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="EMPLOYEE">EMPLOYEE</option>
                                    <option value="CLIENT">CLIENT</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                                    value={editingUser.email || ""}
                                    // @ts-ignore
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    required
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingUser(null)} 
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
