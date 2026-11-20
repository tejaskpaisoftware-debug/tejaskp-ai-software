"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ShieldCheck, Eye, Calendar, User, Clock, Search, Lock, Unlock } from "lucide-react";

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
        setUsers(users.map(u => u.id === userId ? { ...u, isChatEnabled: !currentStatus } : u));

        try {
            await fetch('/api/admin/chat/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isChatEnabled: !currentStatus })
            });
        } catch (error) {
            console.error("Failed to update status");
            setUsers(users.map(u => u.id === userId ? { ...u, isChatEnabled: currentStatus } : u));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <MessageSquare className="w-3.5 h-3.5" /> Communications Gateway
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chat Server Administration</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage user instant messaging permissions and audit live internal conversations.
                    </p>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 self-start sm:self-auto">
                    <button
                        onClick={() => setActiveTab('MANAGEMENT')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'MANAGEMENT' 
                                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" /> Access Control
                    </button>
                    <button
                        onClick={() => setActiveTab('MONITORING')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'MONITORING' 
                                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Eye className="w-3.5 h-3.5" /> Live Monitor
                    </button>
                </div>
            </div>

            {activeTab === 'MANAGEMENT' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">User Messaging Permissions</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Enable or revoke instant messaging access for registered users.</p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {users.length} Active Accounts
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-slate-400 font-medium animate-pulse">Loading active users...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">No active users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5">User</th>
                                        <th className="px-6 py-3.5">Role</th>
                                        <th className="px-6 py-3.5">Contact</th>
                                        <th className="px-6 py-3.5 text-center">Chat Privileges</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.mobile}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleChatAccess(user.id, user.isChatEnabled)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                                            user.isChatEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`${
                                                                user.isChatEnabled ? 'translate-x-6' : 'translate-x-1'
                                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                                        />
                                                    </button>
                                                    <span className={`text-xs font-bold ${user.isChatEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {user.isChatEnabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">
                    {/* Conversation List */}
                    <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                            <h3 className="font-bold text-slate-900 text-sm mb-2">Live Monitor Feed</h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {conversations.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 text-xs">
                                    No conversations found for {new Date(selectedDate).toLocaleDateString()}.
                                </div>
                            ) : (
                                conversations.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => fetchFullConversation(chat.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                                            selectedChat?.id === chat.id 
                                                ? 'bg-amber-50 border-amber-300 shadow-sm' 
                                                : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-wrap gap-1">
                                                {chat.participants.map((p: any, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-bold uppercase truncate max-w-[85px]">
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                                {new Date(chat.messages[0]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 text-xs ml-1 pl-2 border-l-2 border-amber-400 truncate mt-1">
                                            {chat.messages[0]?.content || (chat.messages[0]?.type !== 'TEXT' ? `[${chat.messages[0]?.type}]` : 'No messages')}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Detail View */}
                    <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        {selectedChat ? (
                            <>
                                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 text-sm">Conversation Transcript</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedChat.participants.map((p: any, i: number) => (
                                            <span key={i} className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full shadow-2xs">
                                                {p.name} <span className="text-slate-400">({p.role})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
                                    {selectedChat.messages.map((msg: any) => {
                                        const senderIndex = selectedChat.participants.findIndex((p: any) => p.id === msg.senderId);
                                        const sender = selectedChat.participants[senderIndex];
                                        const isPrimary = senderIndex === 0;

                                        return (
                                            <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isPrimary ? 'self-start' : 'self-end items-end ml-auto'}`}>
                                                <div className="flex justify-between items-baseline gap-3">
                                                    <span className={`text-[11px] font-bold ${isPrimary ? 'text-amber-700' : 'text-slate-700'}`}>
                                                        {sender ? `${sender.name} (${sender.role})` : 'User'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-2xl text-xs text-slate-800 shadow-2xs ${
                                                    isPrimary 
                                                        ? 'bg-amber-50/70 border border-amber-200/80 rounded-tl-none' 
                                                        : 'bg-white border border-slate-200 rounded-tr-none'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <MessageSquare size={24} />
                                </div>
                                <p className="font-semibold text-slate-700 text-sm">Select a conversation thread</p>
                                <p className="text-xs text-slate-400 mt-0.5">Click any thread on the left to inspect the message ledger.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
