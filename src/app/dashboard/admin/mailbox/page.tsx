"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Mail, Plus, Trash2, Search, User as UserIcon,
    Shield, HardDrive, Inbox, Send, AlertTriangle, CheckCircle, X
} from "lucide-react";

// Helper for Auth Header
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

import MailboxSection from "@/components/employee/MailboxSection";

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
        // Get current admin ID
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

    // Filtered lists
    const filteredMailboxes = mailboxes.filter(m =>
        m.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableUsers = users.filter(u => !mailboxes.find(m => m.userId === u.id));

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-yellow-600 uppercase">
                        Mail Server Manager
                    </h1>
                    <p className="text-muted-foreground font-bold tracking-widest text-xs uppercase mt-2 italic text-left">
                        Internal Communication Infrastructure
                    </p>
                </div>

                <div className="flex bg-muted/20 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-6 py-2 rounded-lg font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'server' ? 'bg-gold-500 text-black shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                    >
                        Server Admin
                    </button>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`px-6 py-2 rounded-lg font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'personal' ? 'bg-gold-500 text-black shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                    >
                        My Mailbox
                    </button>
                </div>

                {activeTab === 'server' && (
                    <button
                        onClick={() => setShowProvisionModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-yellow-600 text-black px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transform active:scale-95 transition-all hover:scale-105"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Provision Mailbox
                    </button>
                )}
            </header>

            {activeTab === 'personal' ? (
                <MailboxSection userId={currentAdminId} />
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card-3d p-6 border-l-4 border-gold-500">
                            <div className="flex justify-between items-start mb-4">
                                <Mail className="text-gold-500" size={24} />
                                <span className="text-3xl font-black text-white">{mailboxes.length}</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Active Mailboxes</p>
                        </div>
                        <div className="glass-card-3d p-6 border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <HardDrive className="text-blue-500" size={24} />
                                <span className="text-3xl font-black text-white">{(mailboxes.length * 5).toLocaleString()} GB</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Total Provisioned Space</p>
                        </div>
                        <div className="glass-card-3d p-6 border-l-4 border-green-500">
                            <div className="flex justify-between items-start mb-4">
                                <Shield className="text-green-500" size={24} />
                                <span className="text-3xl font-black text-white">Secure</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">System Status</p>
                        </div>
                    </div>

                    {/* Search and List */}
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search by email or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-card border border-muted p-4 pl-12 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none font-bold text-foreground"
                            />
                        </div>

                        <div className="grid gap-4">
                            {loading ? (
                                <div className="text-center p-12 text-muted-foreground font-bold italic">Loading data infrastructure...</div>
                            ) : filteredMailboxes.length === 0 ? (
                                <div className="text-center p-12 text-muted-foreground font-bold italic">No mailboxes found based on search parameters.</div>
                            ) : (
                                filteredMailboxes.map((mb) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={mb.id}
                                        className="glass-card-3d p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 hover:border-gold-500/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-muted bg-muted/20 flex items-center justify-center font-black text-xl text-gold-500">
                                                {mb.user?.photoUrl ? (
                                                    <img src={mb.user.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : mb.user?.name?.charAt(0) || <UserIcon />}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-black text-white uppercase">{mb.user?.name || "Unknown User"}</h3>
                                                <p className="text-sm font-bold text-gold-500 flex items-center gap-2 tracking-tight">
                                                    <Mail size={14} />
                                                    {mb.emailAddress}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gold-500"
                                                        style={{ width: `${(mb.storageUsed / mb.storageLimit) * 100 || 0}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">
                                                    {((mb.storageUsed || 0) / (1024 * 1024)).toFixed(1)} MB / 5 GB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(mb.id)}
                                                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Provision Modal */}
                    {showProvisionModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-card glass-morphism border border-gold-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                            >
                                <form onSubmit={handleProvision} className="p-8 space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Provision Mailbox</h2>
                                        <button type="button" onClick={() => setShowProvisionModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-gold-500 uppercase tracking-widest text-left">Select Account</label>
                                        <select
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            className="w-full bg-muted/30 border border-muted p-4 rounded-xl text-white font-bold outline-none focus:border-gold-500 appearance-none"
                                            required
                                        >
                                            <option value="" className="bg-background">Choose a user...</option>
                                            {availableUsers.map(u => (
                                                <option key={u.id} value={u.id} className="bg-background">
                                                    {u.name} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-gold-500 uppercase tracking-widest text-left">Email Identity</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="username"
                                                value={emailPrefix}
                                                onChange={(e) => setEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                                                className="flex-1 bg-muted/30 border border-muted p-4 rounded-xl text-white font-black outline-none focus:border-gold-500 transition-all text-right"
                                                required
                                            />
                                            <span className="text-muted-foreground font-black text-lg">@{domain}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gold-500/5 rounded-xl border border-gold-500/20 flex gap-3">
                                        <AlertTriangle className="text-gold-500 shrink-0" size={20} />
                                        <p className="text-[10px] font-bold text-gold-200 uppercase leading-relaxed text-left">
                                            Assigning a mailbox allows this user to communicate internally. This identity is permanent and can only be changed by infrastructure admins.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={provisioning || !selectedUserId || !emailPrefix}
                                        className="w-full bg-gradient-to-r from-gold-500 to-yellow-600 text-black p-4 rounded-xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {provisioning ? "Configuring Infrastructure..." : (
                                            <>
                                                <CheckCircle size={20} />
                                                Confirm Provisioning
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
