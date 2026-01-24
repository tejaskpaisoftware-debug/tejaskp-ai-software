'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'data' | 'action' | 'image';
    data?: any;
    timestamp: Date;
}

interface Session {
    id: string;
    title: string;
    updatedAt: string;
}

export default function AIConsolePage() {
    // State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'COMMAND' | 'AI'>('COMMAND');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        fetchSessions();
        // Start with a new chat state
        resetToNewChat();
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch Sessions List
    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/admin/ai/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        }
    };

    // Load Specific Session
    const loadSession = async (sessionId: string) => {
        try {
            setCurrentSessionId(sessionId);
            setLoading(true);
            const res = await fetch(`/api/admin/ai/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                // Map DB messages to UI messages
                const mappedMessages: Message[] = data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role === 'model' ? 'assistant' : m.role, // Handle legacy role name if any
                    content: m.content,
                    type: m.type,
                    data: m.data ? JSON.parse(m.data) : undefined,
                    timestamp: new Date(m.createdAt)
                }));
                setMessages(mappedMessages);
            }
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setLoading(false);
        }
    };

    // Reset to New Chat
    const resetToNewChat = () => {
        setCurrentSessionId(null);
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: "Hello Admin! I am TEJASKP AI. I can help you manage your dashboard. Try commands like 'find user Jeet', 'show revenue', or 'active students'.",
                timestamp: new Date()
            }
        ]);
        setInput('');
        fetchSessions();
    };

    // Handle Delete Session
    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        try {
            await fetch(`/api/admin/ai/sessions/${sessionId}`, { method: 'DELETE' });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                resetToNewChat();
            }
        } catch (error) {
            console.error("Failed to delete session", error);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Prepare history (last 10 messages) for context
        const rawHistory = messages.slice(-10);
        const history = rawHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        if (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        try {
            // Determine Session ID (Create new if null)
            let activeSessionId = currentSessionId;
            if (!activeSessionId) {
                const sessionRes = await fetch('/api/admin/ai/sessions', { method: 'POST' });
                if (sessionRes.ok) {
                    const newSession = await sessionRes.json();
                    activeSessionId = newSession.id;
                    setCurrentSessionId(activeSessionId);
                    setSessions(prev => [newSession, ...prev]);
                } else {
                    const errText = await sessionRes.text();
                    console.error("Session Create Failed:", errText);
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `System Error: Could not create chat session. Please restart your server. (${errText})`,
                        timestamp: new Date()
                    }]);
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch('/api/admin/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userMsg.content,
                    mode,
                    history,
                    sessionId: activeSessionId // Pass session ID
                })
            });
            const data = await res.json();

            // Refresh sessions list to update title and sorting
            fetchSessions();

            // CHECK FOR PDF ACTION
            let aiContent = data.message || "I didn't understand that command.";
            let specialAction = false; // logic flag (unused visually but kept for flow)

            // Broader check for any action JSON
            if (mode === 'AI' && aiContent.includes('"action":')) {
                try {
                    // Clean code blocks if AI wrapped in markdown
                    const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '');
                    const actionData = JSON.parse(cleanJson);

                    if (actionData.action === 'generate_pdf') {
                        specialAction = true;

                        try {
                            // Initialize with Encryption (Security)
                            const doc = new jsPDF({
                                orientation: 'p',
                                unit: 'mm',
                                format: 'a4',
                                encryption: {
                                    userPermissions: ["print"], // Only allow printing, no editing/copying
                                    ownerPassword: "TEJASKP_AI_SECURE_GENERATION_KEY_9988", // Strong password for owner access
                                    userPassword: "" // Allow opening without password
                                }
                            });

                            // --- HEADER START ---
                            const COMPANY_NAME = "TEJASKP AI SOFTWARE";
                            const COMPANY_PHONE = "Number: +91 9104630598";
                            const COMPANY_SITE = "Website: https://www.tejaskpaisoftware.com/";
                            const COMPANY_DESC = "TEJASKP AI SOFTWARE is a leading technology company based in Vadodara, specializing in intelligent digital solutions including Full Stack Development, AI/ML integration, and Cloud Infrastructure. We empower businesses with cutting-edge software while nurturing the next generation of tech talent through certified training programs.";

                            // 1. Logo (Center Top)
                            // We wait for image to load to ensure it renders
                            const addHeaderAndSave = async (imgData?: string) => {
                                // Add Logo if available
                                if (imgData) {
                                    doc.addImage(imgData, 'JPEG', 10, 10, 30, 30); // x, y, w, h
                                }

                                // Company Details
                                doc.setFontSize(18);
                                doc.setTextColor(218, 165, 32); // Gold Color
                                doc.setFont("helvetica", "bold");
                                doc.text(COMPANY_NAME, 50, 20);

                                doc.setFontSize(10);
                                doc.setTextColor(0, 0, 0); // Black
                                doc.setFont("helvetica", "normal");
                                doc.text(COMPANY_PHONE, 50, 27);
                                doc.text(COMPANY_SITE, 50, 32);

                                // Description (Wrapped)
                                const splitDesc = doc.splitTextToSize(COMPANY_DESC, 150); // Width limited
                                doc.setTextColor(80, 80, 80);
                                doc.text(splitDesc, 50, 40);

                                // Horizontal Line
                                doc.setDrawColor(200, 200, 200);
                                doc.line(10, 65, 200, 65); // x1, y1, x2, y2

                                // --- BODY CONTENT WITH EMOJI SUPPORT ---
                                // We use html-to-image to render the text as an image to preserve emojis
                                try {
                                    // Create a temporary hidden div for rendering
                                    const tempDiv = document.createElement('div');
                                    tempDiv.style.width = '700px'; // Approx width for PDF
                                    tempDiv.style.padding = '20px';
                                    tempDiv.style.fontSize = '14px';
                                    tempDiv.style.fontFamily = 'Arial, sans-serif'; // System fonts support emojis better
                                    tempDiv.style.color = '#000000';
                                    tempDiv.style.lineHeight = '1.6';
                                    tempDiv.style.whiteSpace = 'pre-wrap'; // Preserve formatting

                                    // Set content
                                    tempDiv.innerText = actionData.content;

                                    // Append to body but keep it in viewport for rendering, just hidden from user
                                    // CRITICAL: Opacity must be 1 for the image to be visible in the capture.
                                    // We place it behind everything (z-index -9999) and at top-left.
                                    tempDiv.style.position = 'fixed';
                                    tempDiv.style.top = '0';
                                    tempDiv.style.left = '0';
                                    tempDiv.style.zIndex = '-9999';
                                    tempDiv.style.opacity = '1'; // Must be visible
                                    tempDiv.style.backgroundColor = 'white';
                                    tempDiv.style.pointerEvents = 'none';
                                    document.body.appendChild(tempDiv);

                                    // Small delay to ensure rendering
                                    await new Promise(resolve => setTimeout(resolve, 100));

                                    // Generate Image
                                    const bodyImgData = await toPng(tempDiv, {
                                        quality: 1.0,
                                        pixelRatio: 2,
                                        backgroundColor: '#ffffff'
                                    });

                                    // Clean up
                                    document.body.removeChild(tempDiv);

                                    // Add image to PDF
                                    // Calculate height ratio to fit width
                                    const props = doc.getImageProperties(bodyImgData);
                                    const pdfWidth = 190; // A4 width (210) - margins (10*2)
                                    const pdfHeight = (props.height * pdfWidth) / props.width;

                                    // Multi-page logic
                                    let heightLeft = pdfHeight;
                                    let position = 75; // Start Y position on first page
                                    let pageHeight = 295; // A4 height approx

                                    // First page
                                    doc.addImage(bodyImgData, 'PNG', 10, position, pdfWidth, pdfHeight);
                                    heightLeft -= (pageHeight - position);

                                    // Check if we need more pages
                                    while (heightLeft > 0) {
                                        doc.addPage();
                                        const prevShownHeight = pdfHeight - heightLeft;
                                        doc.addImage(bodyImgData, 'PNG', 10, -(prevShownHeight) + 10, pdfWidth, pdfHeight);
                                        heightLeft -= (pageHeight - 20);
                                    }

                                } catch (imgErr) {
                                    console.error("Error generating body image:", imgErr);
                                    // Fallback to text (no emojis)
                                    doc.setFontSize(12);
                                    doc.setTextColor(0, 0, 0);
                                    const splitBody = doc.splitTextToSize(actionData.content, 180);
                                    doc.text(splitBody, 10, 75);
                                }

                                doc.save(actionData.filename || 'TEJASKP_Document.pdf');
                            };

                            // Check if logo exists and fetch it
                            fetch('/tejaskp-logo.jpg')
                                .then(response => response.blob())
                                .then(blob => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        addHeaderAndSave(reader.result as string);
                                    };
                                    reader.readAsDataURL(blob);
                                })
                                .catch(err => {
                                    console.error("Logo fetch failed", err);
                                    addHeaderAndSave(); // Save without logo if fail
                                });

                            aiContent = `✅ I have generated the PDF "**${actionData.filename || 'TEJASKP_Document.pdf'}**" with the official company header.`;
                        } catch (pdfErr) {
                            console.error("PDF Generation Failed", pdfErr);
                            aiContent = "Error: Could not generate PDF. Please try again.";
                        }
                    }

                    if (actionData.action === 'generate_image') {
                        specialAction = true;
                        // Use our own server-side proxy to bypass browser-based hotlink protection/placeholders
                        const imageUrl = `/api/admin/ai/image-proxy?prompt=${encodeURIComponent(actionData.prompt)}`;
                        aiContent = `Here is the image you requested based on: "**${actionData.prompt}**"`;
                        data.data = { imageUrl: imageUrl, prompt: actionData.prompt };
                        data.type = 'image';
                    }

                } catch (e) {
                    console.error("PDF Gen Error:", e);
                    aiContent = "Error generating PDF. The AI returned invalid data.";
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiContent,
                type: data.type || 'text',
                data: data.data,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Error: Failed to process command.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] bg-card/40 backdrop-blur-xl rounded-3xl border border-gold-theme/10 overflow-hidden shadow-2xl relative z-10">

            {/* Sidebar (25%) */}
            <div className="w-1/4 min-w-[250px] border-r border-gold-theme/10 bg-foreground/20 flex flex-col">
                <div className="p-4 border-b border-gold-theme/10">
                    <button
                        onClick={resetToNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-gold-theme/10 hover:bg-gold-theme/20 text-gold-theme font-medium py-3 rounded-xl transition-all border border-theme hover:border-gold-theme/50"
                    >
                        <span className="text-xl">+</span> New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-xs">No history yet</div>
                    )}
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-gold-theme/10 border border-gold-theme/30 text-foreground' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}
                            onClick={() => loadSession(session.id)}
                        >
                            <div className="truncate text-xs font-medium max-w-[80%]">
                                {session.title || 'New Chat'}
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
                                title="Delete Chat"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area (75%) */}
            <div className="flex-1 flex flex-col bg-transparent">
                {/* Header */}
                <div className="p-6 border-b border-gold-theme/10 bg-gradient-to-r from-gold-900/10 to-transparent flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-gold-theme to-white">
                            <span className="text-3xl animate-pulse">🧠</span>
                            TEJASKP AI Command Center
                        </h1>
                        <p className="text-xs text-gold-theme/60 font-mono ml-11">v1.0 • {mode} MODE ACTIVE</p>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex bg-card/40 p-1 rounded-xl border border-theme">
                        <button
                            onClick={() => setMode('COMMAND')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'COMMAND' ? 'bg-gold-theme text-black shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            ⚡ Command Mode
                        </button>
                        <button
                            onClick={() => setMode('AI')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'AI' ? 'bg-purple-600 text-foreground shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            🤖 AI Search Mode
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-xl border ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-gold-theme/20 to-gold-theme/10 border-gold-theme/30 text-foreground rounded-br-none'
                                : 'bg-foreground/5 border-white/10 text-gray-200 rounded-bl-none'
                                }`}>

                                {/* Role Label */}
                                <div className={`text-[10px] font-bold mb-1 tracking-wider uppercase ${msg.role === 'user' ? 'text-gold-theme text-right' : 'text-purple-400'}`}>
                                    {msg.role === 'user' ? 'ADMIN' : 'SYSTEM AI'}
                                </div>

                                {/* Content */}
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </div>

                                {/* Data Card (User Profile / Stats) */}
                                {msg.type === 'data' && msg.data && (
                                    <div className="mt-4 bg-card/40 rounded-xl p-4 border border-white/10 overflow-hidden">
                                        <pre className="text-[10px] text-green-400 overflow-x-auto font-mono">
                                            {JSON.stringify(msg.data, null, 2)}
                                        </pre>
                                        {msg.data.users && (
                                            <div className="mt-2 space-y-2">
                                                {msg.data.users.map((u: any) => (
                                                    <div key={u.id} className="flex justify-between items-center border-t border-white/5 pt-2">
                                                        <span className="font-bold text-gold-theme">{u.name}</span>
                                                        <span className="text-xs text-muted-foreground">{u.mobile}</span>
                                                        <span className={`text-[10px] px-2 rounded ${u.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{u.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {msg.data.revenue && (
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div className="text-center bg-green-500/10 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Income</div>
                                                    <div className="text-xl font-bold text-green-400">₹{msg.data.revenue.income}</div>
                                                </div>
                                                <div className="text-center bg-red-500/10 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Exp</div>
                                                    <div className="text-xl font-bold text-red-400">₹{msg.data.revenue.expense}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Image Generation Output */}
                                {(msg.type === 'image' || (msg.data && msg.data.imageUrl)) && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-white/20 shadow-2xl relative group">
                                        <div className="absolute top-2 right-2 bg-background/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            AI GENERATED
                                        </div>
                                        <img
                                            src={msg.data.imageUrl}
                                            alt={msg.data.prompt}
                                            className="w-full max-w-sm h-auto object-cover rounded-lg transform transition-transform hover:scale-105 duration-500"
                                            loading="lazy"
                                        />
                                        <div className="p-3 bg-card/40 backdrop-blur-md">
                                            <p className="text-[10px] text-muted-foreground italic line-clamp-2">" {msg.data.prompt} "</p>
                                        </div>
                                    </div>
                                )}

                            </div>
                            <span className="text-[10px] text-gray-600 mt-2 px-2">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-3 text-gold-theme/50 p-4">
                            <div className="w-2 h-2 bg-gold-theme rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gold-theme rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gold-theme rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-xs animate-pulse">Thinking...</span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-card/40 border-t border-gold-theme/10">
                    <form onSubmit={handleSend} className="relative">
                        <textarea
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a command or ask a question..."
                            className="w-full bg-foreground/5 border border-theme rounded-2xl py-4 pl-6 pr-14 text-foreground placeholder-muted-foreground focus:outline-none focus:border-gold-theme focus:ring-1 focus:ring-gold-theme/50 transition-all font-medium resize-none min-h-[60px] max-h-[200px] overflow-y-auto scrollbar-hide"
                            autoFocus
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gold-theme text-black rounded-xl hover:bg-gold-theme/90 disabled:opacity-50 disabled:hover:bg-gold-theme transition-all shadow-lg hover:shadow-gold-theme/25"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                    <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500 font-mono opacity-60">
                        <span>Try: "Find user Jeet"</span>
                        <span>"My revenue"</span>
                        <span>"Active students"</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
