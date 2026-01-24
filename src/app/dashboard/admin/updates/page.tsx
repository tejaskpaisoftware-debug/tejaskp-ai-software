"use client";

import { useState, useEffect } from "react";
import { Send, Trash2, Pencil, X } from "lucide-react";
// AdminSidebar removed (handled by layout)

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
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Daily Updates Broadcast</h1>

            {/* Publish Form */}
            <div className={`border rounded-xl p-6 transition-colors ${editingId ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-card/50 border-theme'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-bold ${editingId ? 'text-indigo-400' : 'text-gold-theme'}`}>
                        {editingId ? 'Edit Broadcast' : 'Publish New Update'}
                    </h2>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-foreground flex items-center gap-1">
                            <X size={14} /> Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handlePublish} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Title / Headline</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={`w-full bg-background border rounded p-3 text-foreground outline-none focus:border-opacity-100 ${editingId ? 'border-indigo-500/50 focus:border-indigo-500' : 'border-gray-700 focus:border-gold-500'}`}
                            placeholder="e.g., Exam Schedule Released"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Update Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className={`w-full bg-background border rounded p-3 text-foreground outline-none focus:border-opacity-100 h-32 resize-none ${editingId ? 'border-indigo-500/50 focus:border-indigo-500' : 'border-gray-700 focus:border-gold-500'}`}
                            placeholder="Write your update here..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 w-full transition-all ${editingId
                            ? 'bg-indigo-600 text-foreground hover:bg-indigo-500'
                            : 'bg-gold-500 text-obsidian hover:bg-gold-400'
                            }`}
                    >
                        {loading ? 'Processing...' : (
                            editingId ? <><Pencil size={18} /> Update Broadcast</> : <><Send size={18} /> Broadcast Update</>
                        )}
                    </button>
                </form>
            </div>

            {/* Previous Updates List */}
            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Updates</h2>
                <div className="space-y-4">
                    {updates.map(update => (
                        <div key={update.id} className={`bg-white/5 border p-4 rounded-lg relative group transition-colors ${editingId === update.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10'}`}>
                            <div className="flex justify-between items-start mb-2 pr-20">
                                <h3 className={`font-bold ${editingId === update.id ? 'text-indigo-400' : 'text-gold-400'}`}>{update.title}</h3>
                                <span className="text-xs text-gray-500">{new Date(update.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{update.content}</p>

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(update)}
                                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                                    title="Edit Broadcast"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(update.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    title="Delete Broadcast"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {updates.length === 0 && <p className="text-gray-500 italic">No updates published yet.</p>}
                </div>
            </div>
        </div>
    );

}
