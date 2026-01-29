"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Inbox, Send, FileText, Trash2, Star, Archive,
    Search, Plus, MoreVertical, Reply, CornerUpRight,
    ChevronLeft, Paperclip, Send as SendIcon, Clock,
    User as UserIcon, Mail as MailIcon, ShieldAlert, X, RefreshCcw
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

interface MailboxSectionProps {
    userId: string;
}

export default function MailboxSection({ userId }: MailboxSectionProps) {
    const [activeFolder, setActiveFolder] = useState("INBOX");
    const [emails, setEmails] = useState<any[]>([]);
    const [mailbox, setMailbox] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [showCompose, setShowCompose] = useState(false);

    // Compose State
    const [composeTo, setComposeTo] = useState("");
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchMailbox();
    }, [activeFolder]);

    const fetchMailbox = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/user/mailbox?userId=${userId}&folder=${activeFolder}`, {
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (data.success) {
                setEmails(data.emails);
                setMailbox(data.mailbox);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch("/api/user/mailbox", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                body: JSON.stringify({
                    senderUserId: userId,
                    toEmails: composeTo,
                    subject: composeSubject,
                    content: composeBody
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowCompose(false);
                setComposeTo("");
                setComposeSubject("");
                setComposeBody("");
                if (activeFolder === "SENT") fetchMailbox();
            } else {
                alert(data.error || "Failed to send email");
            }
        } catch (e) {
            alert("Connection error");
        } finally {
            setSending(false);
        }
    };

    const handleAction = async (recipientId: string, action: { isRead?: boolean, isStarred?: boolean, folder?: string }) => {
        try {
            await fetch("/api/user/mailbox/email", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                body: JSON.stringify({ recipientId, ...action })
            });
            // Refetch current view
            fetchMailbox();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (recipientId: string) => {
        try {
            await fetch(`/api/user/mailbox/email?id=${recipientId}`, {
                method: "DELETE",
                headers: getAuthHeader()
            });
            fetchMailbox();
            if (selectedEmailId === recipientId) setSelectedEmailId(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleReply = () => {
        if (!selectedEmail) return;
        const sender = selectedEmail.email.isExternal ? selectedEmail.email.externalSender : (selectedEmail.email.sender?.emailAddress || "");
        setComposeTo(sender);
        setComposeSubject(selectedEmail.email.subject.startsWith("Re:") ? selectedEmail.email.subject : `Re: ${selectedEmail.email.subject}`);
        setComposeBody(`\n\n\n--- On ${new Date(selectedEmail.email.createdAt).toLocaleString()} ${sender} wrote: ---\n${selectedEmail.email.body}`);
        setShowCompose(true);
    };

    const handleForward = () => {
        if (!selectedEmail) return;
        setComposeTo("");
        setComposeSubject(selectedEmail.email.subject.startsWith("Fwd:") ? selectedEmail.email.subject : `Fwd: ${selectedEmail.email.subject}`);
        setComposeBody(`\n\n\n--- Forwarded message ---\nFrom: ${selectedEmail.email.isExternal ? selectedEmail.email.externalSender : (selectedEmail.email.sender?.emailAddress || "Unknown")}\nDate: ${new Date(selectedEmail.email.createdAt).toLocaleString()}\nSubject: ${selectedEmail.email.subject}\n\n${selectedEmail.email.body}`);
        setShowCompose(true);
    };

    const selectedEmail = emails.find(item => item.id === selectedEmailId);

    if (!mailbox && !loading) {
        return (
            <div className="glass-card-3d p-12 text-center space-y-4">
                <ShieldAlert className="mx-auto text-gold-500" size={48} />
                <h2 className="text-2xl font-black text-white uppercase">Mailbox Not Provisioned</h2>
                <p className="text-muted-foreground font-bold tracking-tight max-w-md mx-auto italic">
                    Your internal portal mailbox identity has not been configured yet. Please contact the administrator to assign your @portal email address.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[700px] overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-64 glass-card-3d p-4 flex flex-col gap-2 shrink-0 border border-white/5">
                <button
                    onClick={() => setShowCompose(true)}
                    className="bg-gradient-to-r from-gold-500 to-yellow-600 text-black w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg mb-6 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} strokeWidth={3} />
                    New Message
                </button>

                <button
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const res = await fetch("/api/user/mailbox/sync", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                                body: JSON.stringify({ userId })
                            });
                            await fetchMailbox();
                            const data = await res.json();
                            if (data.count > 0) alert(`Synced ${data.count} new messages!`);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 border border-gold-500/50 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs mb-4 flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                >
                    <RefreshCcw size={16} />
                    Sync External
                </button>

                {[
                    { id: "INBOX", name: "Inbox", icon: Inbox },
                    { id: "SENT", name: "Sent", icon: Send },
                    { id: "DRAFTS", name: "Drafts", icon: FileText },
                    { id: "STARRED", name: "Starred", icon: Star },
                    { id: "TRASH", name: "Trash", icon: Trash2 },
                    { id: "ARCHIVE", name: "Archive", icon: Archive },
                ].map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => { setActiveFolder(folder.id); setSelectedEmailId(null); }}
                        className={`flex items-center justify-between p-3 rounded-xl font-bold transition-all ${activeFolder === folder.id ? 'bg-gold-500 text-black shadow-lg' : 'hover:bg-muted/50 text-muted-foreground'}`}
                    >
                        <div className="flex items-center gap-3">
                            <folder.icon size={18} />
                            <span className="text-sm uppercase tracking-widest">{folder.name}</span>
                        </div>
                    </button>
                ))}

                <div className="mt-auto p-4 bg-muted/20 rounded-xl space-y-2 text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Storage Status</p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${((mailbox?.storageUsed || 0) / (mailbox?.storageLimit || 5368709120)) * 100}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                        {((mailbox?.storageUsed || 0) / (1024 * 1024)).toFixed(1)} MB / 5 GB
                    </p>
                </div>
            </div>

            {/* Email List or Detailed View */}
            <div className="flex-1 glass-card-3d overflow-hidden flex flex-col border border-white/5 shadow-2xl">
                {!selectedEmailId ? (
                    <>
                        <div className="p-4 border-b border-muted bg-muted/5 flex items-center justify-between">
                            <h2 className="text-lg font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <MailIcon size={18} className="text-gold-500" />
                                {activeFolder}
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    className="bg-card/50 border border-muted py-2 pl-9 pr-4 rounded-lg text-xs font-bold outline-none focus:border-gold-500 w-48 md:w-64 text-foreground"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="p-12 text-center text-muted-foreground font-black italic">Polling secure data stream...</div>
                            ) : emails.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground font-black italic">No transmissions found in {activeFolder.toLowerCase()}.</div>
                            ) : (
                                <div className="divide-y divide-muted/10">
                                    {emails.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => { setSelectedEmailId(item.id); if (!item.isRead) handleAction(item.id, { isRead: true }); }}
                                            className={`p-4 hover:bg-gold-500/5 cursor-pointer transition-colors flex items-center justify-between group ${!item.isRead ? 'bg-gold-500/5 border-l-4 border-gold-500' : 'bg-transparent border-l-4 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 ${!item.isRead ? 'bg-gold-500 text-black shadow-md' : 'bg-muted/30 text-muted-foreground'}`}>
                                                    {item.email.sender?.user?.photoUrl ? (
                                                        <img src={item.email.sender.user.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                                    ) : ((item.email.isExternal ? item.email.externalName : item.email.sender?.user?.name) || '?').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm tracking-tight truncate max-w-[120px] md:max-w-[200px] ${!item.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                            {activeFolder === 'SENT'
                                                                ? `To: ${item.email.recipients.filter((r: any) => r.folder === 'INBOX').map((r: any) => r.mailbox.emailAddress).join(', ') || 'External'}`
                                                                : (item.email.isExternal ? (item.email.externalName || item.email.externalSender) : (item.email.sender?.user?.name || item.email.sender?.emailAddress))}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold opacity-70">
                                                            {new Date(item.email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs truncate max-w-[200px] md:max-w-md ${!item.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{item.email.subject}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, { isStarred: !item.isStarred }); }}
                                                    className={`p-2 hover:text-gold-500 transition-colors ${item.isStarred ? 'text-gold-500' : 'text-muted-foreground'}`}
                                                >
                                                    <Star size={16} fill={item.isStarred ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                    className="p-2 hover:text-red-500 transition-colors text-muted-foreground"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 transition-all duration-300">
                        <div className="p-4 border-b border-muted bg-muted/10 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedEmailId(null)}
                                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-white transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                            >
                                <ChevronLeft size={18} />
                                Back to List
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction(selectedEmail.id, { isStarred: !selectedEmail.isStarred })}
                                    className={`p-2 transition-colors ${selectedEmail.isStarred ? 'text-gold-500' : 'text-muted-foreground hover:text-gold-500'}`}
                                >
                                    <Star size={18} fill={selectedEmail.isStarred ? "currentColor" : "none"} />
                                </button>
                                <button className="p-2 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(selectedEmailId)}><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar text-left text-foreground">
                            <h1 className="text-3xl font-black mb-6 tracking-tighter uppercase leading-tight text-foreground">{selectedEmail?.email.subject}</h1>

                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-muted/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-gold-500/30 overflow-hidden shrink-0">
                                        <img src={selectedEmail?.email.sender?.user?.photoUrl || `https://ui-avatars.com/api/?name=${(selectedEmail?.email.isExternal ? selectedEmail?.email.externalName : selectedEmail?.email.sender?.user?.name) || 'User'}&background=random`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase tracking-tight text-foreground mb-0.5">
                                            {selectedEmail.email.isExternal ? (selectedEmail.email.externalName || "External User") : (selectedEmail.email.sender?.user?.name || "Portal User")}
                                        </p>
                                        <p className="text-[10px] font-bold text-gold-600 opacity-100">
                                            &lt;{selectedEmail.email.isExternal ? selectedEmail.email.externalSender : selectedEmail.email.sender?.emailAddress}&gt;
                                        </p>
                                        {activeFolder === 'SENT' && (
                                            <p className="text-[10px] font-bold text-muted-foreground mt-2">
                                                TO: {selectedEmail?.email.recipients.filter((r: any) => r.folder === 'INBOX').map((r: any) => r.mailbox.emailAddress).join(', ') || 'External Recipient(s)'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                        {new Date(selectedEmail?.email.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase opacity-60 flex items-center gap-1">
                                        <Clock size={10} /> {new Date(selectedEmail?.email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="prose max-w-none text-foreground font-bold leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                {selectedEmail?.email.body}
                            </div>
                        </div>
                        <div className="p-4 border-t border-muted bg-muted/10 flex gap-4">
                            <button onClick={handleReply} className="flex-1 py-4 bg-muted/30 hover:bg-gold-500/10 rounded-xl font-black uppercase tracking-widest text-[10px] text-foreground transition-all flex items-center justify-center gap-2">
                                <Reply size={14} /> Reply
                            </button>
                            <button onClick={handleForward} className="flex-1 py-4 bg-muted/30 hover:bg-gold-500/10 rounded-xl font-black uppercase tracking-widest text-[10px] text-foreground transition-all flex items-center justify-center gap-2">
                                <CornerUpRight size={14} /> Forward
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {showCompose && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-card border border-gold-500/30 w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col h-[600px]"
                        >
                            <form onSubmit={handleSend} className="flex flex-col h-full text-left">
                                <div className="p-6 border-b border-muted bg-muted/30 flex justify-between items-center shrink-0">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">New Transmission</h2>
                                    <button type="button" onClick={() => setShowCompose(false)} className="text-muted-foreground hover:text-white transition-all"><X size={24} /></button>
                                </div>

                                <div className="p-4 space-y-4 shrink-0 shadow-lg bg-card">
                                    {/* FROM Field */}
                                    <div className="flex items-center gap-4 border-b border-muted/50 pb-4">
                                        <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest w-20">From</span>
                                        <div className="flex-1 text-gray-400 font-bold p-2 text-sm bg-muted/10 rounded-lg">
                                            {mailbox?.emailAddress || "portal@tejaskp.com"}
                                        </div>
                                    </div>
                                    {/* TO Field */}
                                    <div className="flex items-center gap-4 border-b border-muted/50 pb-4">
                                        <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest w-20">To Whome</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. user@tejaskpaiportal.com or external@gmail.com"
                                            className="flex-1 bg-transparent text-white font-bold outline-none placeholder:text-gray-600 p-2"
                                            value={composeTo}
                                            onChange={(e) => setComposeTo(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 border-b border-muted/50 pb-4">
                                        <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest w-20">Subject</span>
                                        <input
                                            type="text"
                                            placeholder="Secure Subject Line"
                                            className="flex-1 bg-transparent text-white font-black outline-none placeholder:text-gray-600 uppercase tracking-tighter p-2"
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 p-6 overflow-hidden bg-card">
                                    <textarea
                                        placeholder="Start typing your secure message..."
                                        className="w-full h-full bg-transparent text-gray-300 font-bold outline-none resize-none no-scrollbar leading-relaxed text-lg"
                                        value={composeBody}
                                        onChange={(e) => setComposeBody(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="p-6 border-t border-muted bg-muted/30 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-4">
                                        <button type="button" className="p-3 text-muted-foreground hover:text-gold-400 transition-all"><Paperclip size={20} /></button>
                                        <button type="button" className="p-3 text-muted-foreground hover:text-blue-400 transition-all"><Clock size={20} /></button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="bg-gradient-to-r from-gold-500 to-yellow-600 text-black px-12 py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                                    >
                                        {sending ? "Transmitting..." : (
                                            <>
                                                <SendIcon size={18} />
                                                Transmit Securely
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
