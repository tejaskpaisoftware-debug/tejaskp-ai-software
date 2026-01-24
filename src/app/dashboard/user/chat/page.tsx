"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";

export default function UserChatPage() {
    const [user, setUser] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeContact, setActiveContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const lastCheckTime = useRef<number>(Date.now());

    // Initialize notification sound
    useEffect(() => {
        notificationSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    }, []);

    const requestPermission = () => {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Notifications Enabled", { body: "You will catch new messages now!" });
                    notificationSound.current?.play().catch(e => alert("Audio blocked. Please interact with the page first."));
                }
            });
        }
    };

    // Auth Check
    useEffect(() => {
        const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser");
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            fetchContacts(userData.id);

            // Poll contacts for real-time updates and notifications
            const interval = setInterval(() => fetchContacts(userData.id), 5000);
            return () => clearInterval(interval);
        } else {
            window.location.href = "/login";
        }
    }, []);

    // Fetch Messages Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user && activeContact) {
            fetchMessages(); // Initial fetch
            interval = setInterval(fetchMessages, 3000); // 3s polling
        }
        return () => clearInterval(interval);
    }, [user, activeContact]);

    // Scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchContacts = async (userId: string) => {
        try {
            const res = await fetch(`/api/user/chat/contacts?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                // Check for new messages since last check
                checkForNewMessages(data.contacts, userId);
                setContacts(data.contacts);
            } else if (data.error === "Chat disabled for this user") {
                alert("Chat access is disabled for your account. Please contact Admin.");
                window.location.href = "/dashboard";
            }
        } catch (error) {
            console.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    const checkForNewMessages = (updatedContacts: any[], currentUserId: string) => {
        const now = Date.now();
        let hasNewMessage = false;

        updatedContacts.forEach(contact => {
            if (contact.lastMessageTime) {
                const msgTime = new Date(contact.lastMessageTime).getTime();

                // Debug log
                // console.log(`Checking ${contact.name}: MsgTime ${msgTime} > LastCheck ${lastCheckTime.current}?`);

                // If message is newer than last check AND sender is NOT me
                // Buffer of 1000ms to avoid edge cases
                if (msgTime > lastCheckTime.current && contact.lastMessageSenderId !== currentUserId) {
                    hasNewMessage = true;
                    console.log(`[CHAT] New message detected from ${contact.name}`);

                    // Trigger notification
                    if (Notification.permission === "granted") {
                        new Notification(`New message from ${contact.name}`, {
                            body: contact.lastMessage,
                            icon: "/icon.png"
                        });
                    }
                }
            }
        });

        if (hasNewMessage) {
            try {
                // Reset time to 0 to force play logic to run
                if (notificationSound.current) {
                    notificationSound.current.currentTime = 0;
                    notificationSound.current.play().catch(e => console.log("Audio play failed (interaction needed):", e));
                }
            } catch (e) {
                console.error("Sound error", e);
            }
        }

        lastCheckTime.current = now;
    };

    const fetchMessages = async () => {
        if (!user || !activeContact) return;
        try {
            const res = await fetch(`/api/user/chat/messages?userId=${user.id}&contactId=${activeContact.id}`);
            const data = await res.json();
            if (data.success) {
                // Only update if different to avoid flickering (though simple replacement is fine for MVP)
                // Ideally deep compare or only append new, but replacement is safest for sync
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Failed to load messages");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/user/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.id,
                    recipientId: activeContact.id,
                    content: newMessage,
                    type: "TEXT"
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage("");
            } else {
                alert(`Failed to send: ${data.error || "Unknown error"}`);
                console.error("Send error:", data);
            }
        } catch (error) {
            console.error("Failed to send");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-64">
                <Header title="Internal Chat" />

                <main className="flex-1 flex overflow-hidden p-6 gap-6">
                    {/* Contacts Sidebar */}
                    <div className="w-80 bg-card/40 border border-theme rounded-2xl flex flex-col">
                        <div className="p-4 border-b border-theme flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground">Contacts</h2>
                            {/* Test Button for User */}
                            <button
                                onClick={requestPermission}
                                className="text-[10px] bg-foreground/10 hover:bg-foreground/20 px-2 py-1 rounded text-gold-theme"
                                title="Click to enable sound & notifications"
                            >
                                🔔 Test / Enable
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="text-center text-sm text-gray-500 py-4">Loading...</div>
                            ) : contacts.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-4">No contacts available.</div>
                            ) : (
                                contacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => setActiveContact(contact)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeContact?.id === contact.id ? 'bg-gold-theme/20 text-gold-theme border border-theme' : 'hover:bg-foreground/5 text-gray-400'}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center font-bold text-foreground uppercase text-xs">
                                                {contact.name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="text-left w-full overflow-hidden">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="font-bold text-sm truncate text-foreground">{contact.name}</div>
                                                <span className={`text-[9px] font-bold ${contact.lastMessageTime ? 'text-gold-theme' : 'hidden'}`}>
                                                    {contact.lastMessageTime ? new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="text-[11px] text-gray-400 truncate max-w-[80%]">
                                                    {contact.lastMessage || <span className="text-gray-600 italic">No messages yet</span>}
                                                </div>
                                                {contact.isOnline && (
                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-card/40 border border-theme rounded-2xl flex flex-col relative overflow-hidden backdrop-blur-sm">
                        {activeContact ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-theme flex items-center gap-3 bg-card/60">
                                    <div className="w-8 h-8 rounded-full bg-gold-theme flex items-center justify-center font-bold text-black text-sm">
                                        {activeContact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{activeContact.name}</h3>
                                        <div className={`text-xs flex items-center gap-2 ${activeContact.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${activeContact.isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                                            {activeContact.isOnline ? 'Active Now' : 'Offline'}
                                            <span className="text-gray-600">|</span>
                                            <span className="text-gray-400 uppercase text-[10px]">{activeContact.designation}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-3xl">👋</div>
                                            <p>Say hello to start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.senderId === user.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-gold-theme text-black rounded-tr-none' : 'bg-foreground/10 text-foreground rounded-tl-none'}`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-muted-foreground'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-card/60 border-t border-theme">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-foreground/5 border border-theme rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme/50 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="bg-gold-theme text-black px-6 py-3 rounded-xl font-bold hover:bg-gold-theme/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center text-4xl mb-4">💬</div>
                                <h3 className="text-xl font-bold text-gray-400">Select a contact</h3>
                                <p>Choose a user from the sidebar to start chatting.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
