"use client";

import { useState, useEffect } from "react";
import { Send, Trash2, Pencil, X, Megaphone, Bell, Calendar, Sparkles } from "lucide-react";

export default function AdminUpdatesPage() {
    const [updates, setUpdates] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (data.success) setUpdates(data.announcements);
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !content) {
            alert("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });

            const data = await res.json();

            if (res.ok) {
                alert(editingId ? "Update Edited Successfully! ✨" : "Update Broadcasted Successfully! 🚀");
                setTitle('');
                setContent('');
                setEditingId(null);
                fetchUpdates();
            } else {
                alert(`Failed: ${data.details || data.error}`);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this broadcast? It will be removed from all user dashboards.")) return;
        try {
            const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUpdates();
                if (editingId === id) {
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                }
            } else {
                alert("Failed to delete");
            }
        } catch (e) { alert("Error deleting"); }
    };

    const handleEdit = (update: any) => {
        setTitle(update.title);
        setContent(update.content);
        setEditingId(update.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setTitle('');
        setContent('');
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Megaphone className="w-3.5 h-3.5" /> Broadcast Center
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daily Updates & Announcements</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Publish company-wide announcements, policy notices, and updates visible on student and staff dashboards.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Publish Form */}
                <div className={`bg-white border rounded-2xl p-6 sm:p-8 shadow-sm transition-all ${editingId ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/80'}`}>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                {editingId ? 'Modify Existing Broadcast' : 'Publish New Update'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {editingId ? 'Updating announcement live across user portals.' : 'Send an instant feed notice to active users.'}
                            </p>
                        </div>
                        {editingId && (
                            <button 
                                onClick={cancelEdit} 
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <X size={14} /> Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handlePublish} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Title / Headline
                            </label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="e.g. Internship Evaluation Schedule & Submission Deadline"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Announcement Body Content
                            </label>
                            <textarea
                                required
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors h-32 resize-none"
                                placeholder="Write your full message here..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 w-full transition-all text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm hover:shadow disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (
                                editingId ? <><Pencil size={15} /> Update Broadcast</> : <><Send size={15} /> Broadcast to Users</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Previous Updates List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">Broadcast History</h2>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {updates.length} Broadcasts
                        </span>
                    </div>

                    <div className="space-y-3">
                        {updates.map(update => (
                            <div 
                                key={update.id} 
                                className={`bg-white border rounded-2xl p-5 shadow-sm relative group transition-all ${
                                    editingId === update.id ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200/80 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2 pr-20">
                                    <h3 className="font-bold text-slate-900 text-base">{update.title}</h3>
                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(update.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{update.content}</p>

                                <div className="absolute top-4 right-4 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(update)}
                                        className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Edit Broadcast"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(update.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Broadcast"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {updates.length === 0 && (
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-sm">
                                No previous updates broadcasted yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
