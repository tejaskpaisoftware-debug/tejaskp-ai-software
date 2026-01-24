"use client";

import { useEffect, useState } from "react";
// AdminSidebar removed (handled by layout)
import { motion } from "framer-motion";

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

    const fetchUsers = async () => {
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
        // Optimistic Update
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
        if (!confirm("Are you sure you want to permanently DELETE this user?")) return;

        // Optimistic Update
        setUsers(users.filter(u => u.mobile !== mobile));

        try {
            const res = await fetch("/api/admin/users/delete", {
                method: "POST", // Using POST as next.js generic handler sometimes easier
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
                    mobile: editingUser.mobile, // Original mobile as key
                    name: editingUser.name,
                    role: editingUser.role,
                    email: editingUser.email,
                    // If we wanted to support mobile change, we'd need oldMobile and newMobile logic in API, 
                    // for now let's keep it simple: Name & Role edits only or handle mobile carefully.
                    // The current API expects { mobile: 'original', ...updates }. 
                    // If we edit mobile in UI, we need to send { mobile: 'original', mobile: 'new' } which overwrites.
                    // But to find the user we need the original key. 
                    // Let's assume for this "Quick Edit" regarding governance, Name and Role are critical. 
                    // Changing mobile breaks login if not careful. Let's stick to Name/Role for safety in this iteration 
                    // unless user specifically asked to edit mobile. 
                    // "where i can edit user details" -> usually implies all.
                    // Let's rely on the ID or keep mobile read-only if risky, OR pass originalMobile separately.
                    // My DBStore update logic was: findUser(mobile). 
                    // If I change mobile in the form, I lose the key.
                    // SO: I should pass `originalMobile` to the API or use ID.
                    // My Store uses ID? Yes. But API uses mobile.
                    // Let's just allow Name and Role for now to be safe, or if I must, use ID.
                    // User asked "edit user details".
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
        <div className="max-w-6xl mx-auto relative">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-widest">SYSTEM LOGS & GOVERNANCE</h1>
                    <p className="text-gold-theme/60 mt-1">Manage user access and monitor registration activity.</p>
                </div>
                <button onClick={fetchUsers} className="text-xs text-gold-theme hover:text-foreground underline">Refresh Data</button>
            </header>

            <div className="bg-card/40 border border-theme rounded-2xl p-1 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-card/40 text-xs uppercase text-gold-theme font-bold tracking-wider">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Contact (Mobile / Email)</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-500/10 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading system data...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No registered users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <motion.tr
                                    key={user.mobile}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-foreground/5 transition-colors"
                                >
                                    <td className="p-4 font-bold text-foreground">{user.name || "N/A"}</td>
                                    <td className="p-4 text-gray-400">{user.role}</td>
                                    <td className="p-4">
                                        <div className="font-mono text-gold-200">{user.mobile}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                            user.status === 'BLOCKED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                            title="Edit Details"
                                        >
                                            ✏️
                                        </button>
                                        {user.status !== "ACTIVE" && (
                                            <button
                                                onClick={() => updateStatus(user.mobile, "ACTIVE")}
                                                className="p-2 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                                title="Approve / Activate"
                                            >
                                                ✅
                                            </button>
                                        )}
                                        {user.status !== "PENDING" && user.role !== "ADMIN" && (
                                            <button
                                                onClick={() => updateStatus(user.mobile, "PENDING")}
                                                className="p-2 hover:bg-yellow-500/20 text-yellow-500 rounded transition-colors"
                                                title="Pause / Set Pending"
                                            >
                                                ⏸
                                            </button>
                                        )}
                                        {user.status !== "BLOCKED" && user.role !== "ADMIN" && (
                                            <button
                                                onClick={() => updateStatus(user.mobile, "BLOCKED")}
                                                className="p-2 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                title="Stop / Block"
                                            >
                                                ⛔
                                            </button>
                                        )}
                                        {user.role !== "ADMIN" && (
                                            <button
                                                onClick={() => deleteUser(user.mobile)}
                                                className="p-2 hover:bg-red-900/40 text-red-400 rounded transition-colors border border-red-500/10 ml-2"
                                                title="Permanently Delete"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card border border-gold-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-foreground">✕</button>
                        <h2 className="text-2xl font-bold text-foreground mb-6">Edit User Details</h2>
                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-1 block">Full Name</label>
                                <input
                                    className="w-full bg-background/50 border border-gray-700 rounded px-4 py-2 text-foreground focus:border-gold-500 focus:outline-none"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="opacity-50 cursor-not-allowed">
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-1 block">Mobile (ID) - Cannot Change</label>
                                <input
                                    className="w-full bg-background/50 border border-gray-700 rounded px-4 py-2 text-gray-400 focus:outline-none"
                                    value={editingUser.mobile}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-1 block">Role</label>
                                <select
                                    className="w-full bg-background/50 border border-gray-700 rounded px-4 py-2 text-foreground focus:border-gold-500 focus:outline-none"
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
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-1 block">Email (Compulsory)</label>
                                <input
                                    type="email"
                                    className="w-full bg-background/50 border border-gray-700 rounded px-4 py-2 text-foreground focus:border-gold-500 focus:outline-none"
                                    value={editingUser.email || ""}
                                    // @ts-ignore
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    required
                                    placeholder="Required Email Address"
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-gray-700 text-foreground rounded hover:bg-gray-600 font-bold">CANCEL</button>
                                <button type="submit" className="flex-1 py-3 bg-gold-500 text-obsidian rounded hover:bg-gold-400 font-bold">SAVE CHANGES</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div>
    );
}
