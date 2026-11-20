'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Bot, Plus, Trash2, Send, Sparkles, Terminal, FileText, Image as ImageIcon, CheckCircle2, ChevronRight } from 'lucide-react';

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
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'COMMAND' | 'AI'>('COMMAND');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSessions();
        resetToNewChat();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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

    const loadSession = async (sessionId: string) => {
        try {
            setCurrentSessionId(sessionId);
            setLoading(true);
            const res = await fetch(`/api/admin/ai/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                const mappedMessages: Message[] = data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role === 'model' ? 'assistant' : m.role,
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

    const resetToNewChat = () => {
        setCurrentSessionId(null);
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: "Hello Admin! I am TEJASKP AI Command Assistant. I can help query database metrics, manage tasks, or draft PDF letters. Try queries like 'find user Jeet', 'show revenue', or 'active students'.",
                timestamp: new Date()
            }
        ]);
        setInput('');
        fetchSessions();
    };

    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat session?")) return;

        try {
            const res = await fetch(`/api/admin/ai/sessions/${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (currentSessionId === sessionId) {
                    resetToNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to delete session", error);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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

        try {
            const endpoint = mode === 'COMMAND' ? '/api/admin/ai/command' : '/api/admin/ai/search';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userMsg.content,
                    sessionId: currentSessionId
                })
            });

            const data = await res.json();

            if (data.sessionId && !currentSessionId) {
                setCurrentSessionId(data.sessionId);
                fetchSessions();
            }

            let aiContent = data.response;
            let specialAction = false;

            if (aiContent && aiContent.includes('{') && aiContent.includes('}')) {
                try {
                    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                    const actionData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

                    if (actionData && actionData.action === 'generate_pdf') {
                        specialAction = true;
                        try {
                            const doc = new jsPDF();
                            const addHeaderAndSave = async (logoBase64?: string) => {
                                if (logoBase64) {
                                    doc.addImage(logoBase64, 'JPEG', 10, 10, 25, 25);
                                }
                                doc.setFontSize(22);
                                doc.setTextColor(40, 40, 40);
                                doc.setFont("helvetica", "bold");
                                doc.text("TEJASKP AI SOFTWARE", 40, 20);

                                doc.setFontSize(10);
                                doc.setTextColor(100, 100, 100);
                                doc.setFont("helvetica", "normal");
                                doc.text("Official Administrative Communication", 40, 26);
                                doc.text("Email: contact@tejaskpai.com | Web: https://tejaskpai.com", 40, 31);

                                doc.setDrawColor(200, 200, 200);
                                doc.setLineWidth(0.5);
                                doc.line(10, 38, 200, 38);

                                doc.setFontSize(14);
                                doc.setTextColor(0, 0, 0);
                                doc.setFont("helvetica", "bold");
                                doc.text(actionData.title || "Document", 10, 48);

                                doc.setFontSize(10);
                                doc.setTextColor(100, 100, 100);
                                doc.setFont("helvetica", "normal");
                                doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 55);

                                try {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.style.width = '750px';
                                    tempDiv.style.padding = '20px';
                                    tempDiv.style.fontSize = '16px';
                                    tempDiv.style.fontFamily = 'Arial, sans-serif';
                                    tempDiv.style.color = '#000000';
                                    tempDiv.style.lineHeight = '1.6';
                                    tempDiv.style.whiteSpace = 'pre-wrap';
                                    tempDiv.innerText = actionData.content;
                                    tempDiv.style.position = 'fixed';
                                    tempDiv.style.top = '0';
                                    tempDiv.style.left = '0';
                                    tempDiv.style.zIndex = '-9999';
                                    tempDiv.style.opacity = '1';
                                    tempDiv.style.backgroundColor = 'white';
                                    tempDiv.style.pointerEvents = 'none';
                                    document.body.appendChild(tempDiv);

                                    await new Promise(resolve => setTimeout(resolve, 100));

                                    const bodyImgData = await toPng(tempDiv, {
                                        quality: 1.0,
                                        pixelRatio: 2,
                                        backgroundColor: '#ffffff'
                                    });

                                    document.body.removeChild(tempDiv);

                                    const props = doc.getImageProperties(bodyImgData);
                                    const pdfWidth = 190;
                                    const pdfHeight = (props.height * pdfWidth) / props.width;

                                    let heightLeft = pdfHeight;
                                    let position = 75;
                                    let pageHeight = 295;

                                    doc.addImage(bodyImgData, 'PNG', 10, position, pdfWidth, pdfHeight);
                                    heightLeft -= (pageHeight - position);

                                    while (heightLeft > 0) {
                                        doc.addPage();
                                        const prevShownHeight = pdfHeight - heightLeft;
                                        doc.addImage(bodyImgData, 'PNG', 10, -(prevShownHeight) + 10, pdfWidth, pdfHeight);
                                        heightLeft -= (pageHeight - 20);
                                    }

                                } catch (imgErr) {
                                    console.error("Error generating body image:", imgErr);
                                    doc.setFontSize(12);
                                    doc.setTextColor(0, 0, 0);
                                    const splitBody = doc.splitTextToSize(actionData.content, 180);
                                    doc.text(splitBody, 10, 75);
                                }

                                doc.save(actionData.filename || 'TEJASKP_Document.pdf');
                            };

                            fetch('/tejaskp-logo.jpg')
                                .then(response => response.blob())
                                .then(blob => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        addHeaderAndSave(reader.result as string);
                                    };
                                    reader.readAsDataURL(blob);
                                })
                                .catch(() => {
                                    addHeaderAndSave();
                                });

                            aiContent = `✅ I have generated the PDF "**${actionData.filename || 'TEJASKP_Document.pdf'}**" with the official company header.`;
                        } catch (pdfErr) {
                            console.error("PDF Generation Failed", pdfErr);
                            aiContent = "Error: Could not generate PDF. Please try again.";
                        }
                    }

                    if (actionData && actionData.action === 'generate_image') {
                        specialAction = true;
                        const imageUrl = `/api/admin/ai/image-proxy?prompt=${encodeURIComponent(actionData.prompt)}`;
                        aiContent = `Here is the image you requested based on: "**${actionData.prompt}**"`;
                        data.data = { imageUrl: imageUrl, prompt: actionData.prompt };
                        data.type = 'image';
                    }

                } catch (e) {
                    console.error("PDF Gen Error:", e);
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
        <div className="space-y-4">
            <div className="flex h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                {/* Sidebar Sessions (25%) */}
                <div className="w-1/4 min-w-[240px] max-w-[300px] border-r border-slate-200 bg-slate-50/60 flex flex-col">
                    <div className="p-3.5 border-b border-slate-200">
                        <button
                            onClick={resetToNewChat}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-all border border-amber-200 shadow-2xs"
                        >
                            <Plus className="w-4 h-4" /> Start New Conversation
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Chat History</p>
                        {sessions.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-xs">No previous sessions yet</div>
                        )}
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                                    currentSessionId === session.id 
                                        ? 'bg-amber-50 border border-amber-300 text-slate-900 font-bold shadow-2xs' 
                                        : 'hover:bg-slate-100 text-slate-600'
                                }`}
                                onClick={() => loadSession(session.id)}
                            >
                                <div className="truncate text-xs max-w-[80%]">
                                    {session.title || 'New Session'}
                                </div>
                                <button
                                    onClick={(e) => deleteSession(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-opacity"
                                    title="Delete Session"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Console (75%) */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="p-4 px-6 border-b border-slate-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900">
                                    TEJASKP AI Command Assistant
                                </h1>
                                <p className="text-[11px] text-slate-400 font-mono">Platform v2.4 • {mode} MODE ACTIVE</p>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setMode('COMMAND')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    mode === 'COMMAND' 
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Terminal className="w-3.5 h-3.5" /> Command Mode
                            </button>
                            <button
                                onClick={() => setMode('AI')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    mode === 'AI' 
                                        ? 'bg-purple-600 text-white shadow-2xs' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" /> AI Search Mode
                            </button>
                        </div>
                    </div>

                    {/* Messages Thread */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5" ref={scrollRef}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-2xs border ${
                                    msg.role === 'user'
                                        ? 'bg-amber-50/80 border-amber-200 text-slate-900 rounded-br-none'
                                        : 'bg-slate-50/80 border-slate-200 text-slate-800 rounded-bl-none'
                                }`}>
                                    <div className={`text-[10px] font-bold mb-1 tracking-wider uppercase ${
                                        msg.role === 'user' ? 'text-amber-700 text-right' : 'text-slate-500'
                                    }`}>
                                        {msg.role === 'user' ? 'ADMIN' : 'AI ASSISTANT'}
                                    </div>

                                    <div className="whitespace-pre-wrap text-xs leading-relaxed">
                                        {msg.content}
                                    </div>

                                    {/* Data Output */}
                                    {msg.type === 'data' && msg.data && (
                                        <div className="mt-3 bg-white rounded-xl p-3 border border-slate-200 overflow-hidden text-xs">
                                            {msg.data.users && (
                                                <div className="space-y-1.5">
                                                    {msg.data.users.map((u: any) => (
                                                        <div key={u.id} className="flex justify-between items-center border-b border-slate-100 pb-1.5 pt-0.5">
                                                            <span className="font-bold text-slate-900">{u.name}</span>
                                                            <span className="text-[11px] text-slate-400 font-mono">{u.mobile}</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                                u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                            }`}>{u.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {msg.data.revenue && (
                                                <div className="grid grid-cols-2 gap-3 mt-1">
                                                    <div className="text-center bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                                        <div className="text-[10px] font-bold uppercase text-emerald-700">Income</div>
                                                        <div className="text-lg font-extrabold text-emerald-700">₹{msg.data.revenue.income}</div>
                                                    </div>
                                                    <div className="text-center bg-rose-50 p-2 rounded-lg border border-rose-200">
                                                        <div className="text-[10px] font-bold uppercase text-rose-700">Expenses</div>
                                                        <div className="text-lg font-extrabold text-rose-700">₹{msg.data.revenue.expense}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Image Output */}
                                    {(msg.type === 'image' || (msg.data && msg.data.imageUrl)) && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-white">
                                            <div className="absolute top-2 right-2 bg-slate-900/70 text-white backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono">
                                                AI GENERATED
                                            </div>
                                            <img
                                                src={msg.data.imageUrl}
                                                alt={msg.data.prompt}
                                                className="w-full max-w-sm h-auto object-cover rounded-lg"
                                                loading="lazy"
                                            />
                                            <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                                                <p className="text-[10px] text-slate-500 italic line-clamp-2">"{msg.data.prompt}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-2">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-400 p-2 text-xs">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                <span className="text-xs ml-1 font-medium text-slate-500">Processing inquiry...</span>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-200">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'COMMAND' ? "Type command: 'find user Jeet', 'show revenue', 'active students'..." : "Ask any question regarding students or courses..."}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-slate-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-medium"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg disabled:opacity-40 transition-all shadow-2xs"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                            <span>Shortcuts:</span>
                            <span className="hover:text-amber-700 cursor-pointer" onClick={() => setInput("find user Jeet")}>"find user Jeet"</span>
                            <span className="hover:text-amber-700 cursor-pointer" onClick={() => setInput("show revenue")}>"show revenue"</span>
                            <span className="hover:text-amber-700 cursor-pointer" onClick={() => setInput("active students")}>"active students"</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
