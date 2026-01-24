"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { motion } from "framer-motion";

export default function ChatServerPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'MONITORING'>('MANAGEMENT');

    useEffect(() => {
        fetchUsers();
        fetchConversations();
    }, []);

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedChat, setSelectedChat] = useState<any>(null);

    // Refresh conversations when date changes
    useEffect(() => {
        if (activeTab === 'MONITORING') {
            fetchConversations();
        }
    }, [selectedDate, activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/chat/users');
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch(`/api/admin/chat/monitor?date=${selectedDate}`);
            const data = await res.json();
            if (data.success) setConversations(data.conversations);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFullConversation = async (conversationId: string) => {
        try {
            const res = await fetch(`/api/admin/chat/monitor?conversationId=${conversationId}`);
            const data = await res.json();
            if (data.success) setSelectedChat(data.conversation);
        } catch (error) {
            console.error("Failed to load details", error);
        }
    };

    const toggleChatAccess = async (userId: string, currentStatus: boolean) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, isChatEnabled: !currentStatus } : u));

        try {
            await fetch('/api/admin/chat/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isChatEnabled: !currentStatus })
            });
        } catch (error) {
            console.error("Failed to update status");
            // Revert on error
            setUsers(users.map(u => u.id === userId ? { ...u, isChatEnabled: currentStatus } : u));
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pl-64 relative z-10">
            <AdminSidebar />

            <main className="p-8 max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-end border-b border-theme pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-widest">CHAT SERVER</h1>
                        <p className="text-gold-theme/60 mt-1">Manage user access and monitor system-wide communications.</p>
                    </div>
                    <div className="flex bg-card rounded-lg p-1 border border-theme">
                        <button
                            onClick={() => setActiveTab('MANAGEMENT')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'MANAGEMENT' ? 'bg-gold-500 text-obsidian' : 'text-gray-400 hover:text-foreground'}`}
                        >
                            Access Control
                        </button>
                        <button
                            onClick={() => setActiveTab('MONITORING')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'MONITORING' ? 'bg-gold-500 text-obsidian' : 'text-gray-400 hover:text-foreground'}`}
                        >
                            Live Monitor
                        </button>
                    </div>
                </header>

                {activeTab === 'MANAGEMENT' && (
                    <div className="bg-card/40 border border-theme rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-gold-500/10">
                            <h2 className="text-xl font-bold text-foreground">User Access Management</h2>
                            <p className="text-gray-400 text-sm mt-1">Enable chat for specific users. Only active users are listed.</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gold-theme animate-pulse">Loading Users...</div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">No active users found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-foreground/5 text-gold-theme/80 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Mobile</th>
                                            <th className="px-6 py-4 text-center">Chat Access</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-foreground/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-foreground">{user.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-foreground/10 text-gray-300">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{user.mobile}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleChatAccess(user.id, user.isChatEnabled)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.isChatEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                                                    >
                                                        <span
                                                            className={`${user.isChatEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                        />
                                                    </button>
                                                    <span className={`ml-3 text-xs font-bold ${user.isChatEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                                                        {user.isChatEnabled ? 'ENABLED' : 'DISABLED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'MONITORING' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        {/* Conversation List */}
                        <div className="lg:col-span-1 bg-card/40 border border-theme rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
                            <div className="p-4 border-b border-gold-500/10 bg-foreground/5">
                                <h3 className="font-bold text-foreground mb-2">Live Monitor</h3>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-card/40 border border-theme rounded p-2 text-sm text-foreground focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {conversations.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 text-sm">
                                        No conversations found for this date.
                                    </div>
                                ) : (
                                    conversations.map((chat) => (
                                        <motion.button
                                            key={chat.id}
                                            onClick={() => fetchFullConversation(chat.id)}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${selectedChat?.id === chat.id ? 'bg-gold-500/20 border-gold-500/50' : 'bg-foreground/5 border-transparent hover:bg-foreground/10'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {chat.participants.map((p: any, i: number) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-card/40 rounded text-[10px] text-gray-300 font-bold uppercase truncate max-w-[80px]">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gold-theme/70 font-mono whitespace-nowrap">
                                                    {new Date(chat.messages[0]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 text-xs ml-1 pl-2 border-l-2 border-gold-500/30 truncate">
                                                {chat.messages[0]?.content || (chat.messages[0]?.type !== 'TEXT' ? `[${chat.messages[0]?.type}]` : 'No messages')}
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat Detail View */}
                        <div className="lg:col-span-2 bg-card/40 border border-theme rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
                            {selectedChat ? (
                                <>
                                    <div className="p-4 border-b border-gold-500/10 bg-foreground/5 flex justify-between items-center">
                                        <h3 className="font-bold text-foreground">
                                            Conversation History
                                        </h3>
                                        <div className="flex gap-2 text-xs">
                                            {selectedChat.participants.map((p: any, i: number) => (
                                                <span key={i} className="text-gold-400 border border-theme px-2 py-1 rounded-full">{p.name} ({p.role})</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                                        {selectedChat.messages.map((msg: any) => {
                                            const senderIndex = selectedChat.participants.findIndex((p: any) => p.id === msg.senderId);
                                            const sender = selectedChat.participants[senderIndex];
                                            const isPrimary = senderIndex === 0; // First participant gets Primary Color (Gold), Second gets Secondary (Blue/Cyan)

                                            // Colors
                                            const nameColor = isPrimary ? "text-gold-theme" : "text-cyan-400";
                                            const borderColor = isPrimary ? "border-theme" : "border-cyan-500/20";
                                            const bgColor = isPrimary ? "bg-gold-500/5" : "bg-cyan-900/10";

                                            return (
                                                <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${isPrimary ? 'self-start' : 'self-end items-end'}`}>
                                                    <div className="flex justify-between items-baseline gap-4">
                                                        <span className={`text-xs font-bold tracking-wide ${nameColor}`}>
                                                            {sender ? `${sender.name} (${sender.role})` : 'Unknown User'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                            {new Date(msg.createdAt).toLocaleString([], {
                                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className={`p-3 rounded-lg text-sm text-gray-300 border ${borderColor} ${bgColor}`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                    <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-2xl mb-4">🔍</div>
                                    <p>Select a conversation to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
