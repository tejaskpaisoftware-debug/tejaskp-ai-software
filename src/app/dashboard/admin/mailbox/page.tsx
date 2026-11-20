"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail, Plus, Trash2, Search, User as UserIcon,
    Shield, HardDrive, Inbox, Send, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import MailboxSection from "@/components/employee/MailboxSection";

const getAuthHeader = (): HeadersInit => {
    const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) return { 'Authorization': `Bearer ${user.token}` };
        } catch (e) { console.error(e); }
    }
    return {};
};

export default function AdminMailboxManager() {
    const [activeTab, setActiveTab] = useState<'server' | 'personal'>('server');
    const [currentAdminId, setCurrentAdminId] = useState<string>("");

    const [mailboxes, setMailboxes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Provision Form State
    const [selectedUserId, setSelectedUserId] = useState("");
    const [emailPrefix, setEmailPrefix] = useState("");
    const [domain] = useState("tejaskpaiportal.com");
    const [provisioning, setProvisioning] = useState(false);

    useEffect(() => {
        fetchData();
        const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentAdminId(user.id);
            } catch (e) { console.error(e); }
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mbRes, uRes] = await Promise.all([
                fetch("/api/admin/mailbox", { headers: getAuthHeader() }),
                fetch("/api/admin/users", { headers: getAuthHeader() })
            ]);

            const mbData = await mbRes.json();
            const uData = await uRes.json();

            if (mbData.success) setMailboxes(mbData.mailboxes);
            if (uData.users) setUsers(uData.users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !emailPrefix) return;

        setProvisioning(true);
        try {
            const res = await fetch("/api/admin/mailbox", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                body: JSON.stringify({
                    userId: selectedUserId,
                    emailAddress: `${emailPrefix.toLowerCase()}@${domain}`
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowProvisionModal(false);
                setSelectedUserId("");
                setEmailPrefix("");
                fetchData();
            } else {
                alert(data.error || "Failed to provision mailbox");
            }
        } catch (e) {
            alert("Error connecting to server");
        } finally {
            setProvisioning(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this mailbox? This will NOT delete the user account.")) return;

        try {
            const res = await fetch(`/api/admin/mailbox?id=${id}`, {
                method: "DELETE",
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredMailboxes = mailboxes.filter(m =>
        m.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.user?.name && m.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const availableUsers = users.filter(u => !mailboxes.find(m => m.userId === u.id));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Internal Mail Server Manager
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Provision corporate mailboxes, oversee inbox quota limits, and manage communication routing.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setActiveTab('server')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === 'server'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Server Infrastructure
                        </button>
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === 'personal'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Admin Inbox
                        </button>
                    </div>

                    {activeTab === 'server' && (
                        <button
                            onClick={() => setShowProvisionModal(true)}
                            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shadow-amber-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Provision Mailbox</span>
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'personal' ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                    <MailboxSection userId={currentAdminId} />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Mailboxes</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Mail className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900">{mailboxes.length}</div>
                            <span className="text-xs text-slate-400 mt-1 block">Provisioned user accounts</span>
                        </div>

                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Capacity</span>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <HardDrive className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900">
                                {(mailboxes.length * 5).toLocaleString()} GB
                            </div>
                            <span className="text-xs text-slate-400 mt-1 block">Total allocated volume</span>
                        </div>

                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Server Security</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-emerald-600">Active & TLS</div>
                            <span className="text-xs text-slate-400 mt-1 block">Encrypted mail relay</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Filter by email address or user name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200/90 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs"
                        />
                    </div>

                    {/* Mailbox List Cards */}
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs font-medium">Loading mailboxes...</p>
                        </div>
                    ) : filteredMailboxes.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                            <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-700">No mailboxes found</p>
                            <p className="text-xs text-slate-400 mt-1">Adjust search or provision a new mailbox above.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3.5">
                            {filteredMailboxes.map((mb) => {
                                const storageMB = ((mb.storageUsed || 0) / (1024 * 1024)).toFixed(1);
                                const percentage = Math.min(100, Math.round(((mb.storageUsed || 0) / (mb.storageLimit || 5368709120)) * 100));

                                return (
                                    <motion.div
                                        key={mb.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
                                                {mb.user?.photoUrl ? (
                                                    <img src={mb.user.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : mb.user?.name ? mb.user.name.slice(0, 2).toUpperCase() : <Mail className="w-4 h-4 text-slate-400" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                                                    {mb.user?.name || "Unknown Account"}
                                                </h3>
                                                <p className="text-xs text-amber-600 font-mono font-medium flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span>{mb.emailAddress}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5 justify-between md:justify-end">
                                            <div className="text-right">
                                                <div className="w-32 sm:w-40 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                                                    {storageMB} MB used of 5 GB
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(mb.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                                title="Delete mailbox"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Provision Modal */}
                    <AnimatePresence>
                        {showProvisionModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6"
                                >
                                    <form onSubmit={handleProvision} className="space-y-4 text-xs">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                            <h2 className="text-base font-bold text-slate-900">Provision Internal Mailbox</h2>
                                            <button type="button" onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-700">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Target Account</label>
                                            <select
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                required
                                            >
                                                <option value="">Select a user account...</option>
                                                {availableUsers.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.role}) - {u.mobile}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Assigned Email Identity</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="username"
                                                    value={emailPrefix}
                                                    onChange={(e) => setEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                                                    className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-900 font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                    required
                                                />
                                                <span className="text-slate-500 font-mono text-xs font-semibold px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                                                    @{domain}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <p>
                                                This mailbox allows the user to exchange internal company communications and receive automated notification dispatches.
                                            </p>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setShowProvisionModal(false)}
                                                className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={provisioning || !selectedUserId || !emailPrefix}
                                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs shadow-amber-500/20 disabled:opacity-50"
                                            >
                                                {provisioning ? "Provisioning..." : "Confirm Provisioning"}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
