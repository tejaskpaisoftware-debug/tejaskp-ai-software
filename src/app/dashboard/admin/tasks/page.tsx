"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Plus, Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle, FileText, Trash2 } from "lucide-react";

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

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectName, setProjectName] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [deadline, setDeadline] = useState("");
    const [assignedToId, setAssignedToId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tasks', { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.success) setTasks(data.tasks);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', { headers: { ...getAuthHeader() } });
            const data = await res.json();
            if (data.users) {
                // Filter only employees/users
                const filtered = data.users.filter((u: any) => u.role !== 'ADMIN');
                setUsers(filtered);
                // Auto-select if only one user
                if (filtered.length === 1 && !assignedToId) {
                    setAssignedToId(filtered[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting task:", { title, description, projectName, priority, deadline, assignedToId });
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    title, description, projectName, priority, deadline, assignedToId
                })
            });
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);

            if (data.success) {
                setShowCreateModal(false);
                fetchTasks();
                // Reset form
                setTitle("");
                setDescription("");
                setProjectName("");
                setDeadline("");
                setAssignedToId("");
                setPriority("MEDIUM");
            } else {
                alert("Error: " + (data.error || "Failed to create task"));
            }
        } catch (e: any) {
            console.error("Submission error:", e);
            alert("Submission failed: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkAsDone = async (taskId: string) => {
        try {
            const res = await fetch('/api/user/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    taskId,
                    status: 'DONE',
                    comment: 'Task approved by administrator'
                })
            });
            if (res.ok) fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            const res = await fetch(`/api/admin/tasks?taskId=${taskId}`, {
                method: 'DELETE',
                headers: { ...getAuthHeader() }
            });
            const data = await res.json();
            if (data.success) {
                fetchTasks();
            } else {
                alert(data.error || "Failed to delete task");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Connection error occurred while deleting task");
        }
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-glow tracking-tighter">TASK CONTROL CENTER</h1>
                    <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold mt-1">Direct Operations Management</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gold-500 text-black px-6 py-3 rounded-xl font-black hover:bg-gold-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                    <Plus size={20} />
                    NEW DEPLOYMENT
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-muted shadow-lg">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks or employees..."
                        className="w-full bg-background border border-muted rounded-xl py-3 pl-10 pr-4 outline-none focus:border-gold-500/50 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filterStatus === s ? 'bg-gold-500 text-black' : 'bg-muted text-muted-foreground hover:bg-white/5'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-panel rounded-2xl border-dashed border-2 border-muted">
                        <p className="text-muted-foreground font-orbitron tracking-widest uppercase">No Active Deployments Found</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-muted rounded-2xl p-6 relative group border-l-4 border-l-gold-500 shadow-xl hover:shadow-gold-500/5 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded bg-muted uppercase tracking-wider`}>
                                    {task.projectName || 'General'}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${task.status === 'DONE' ? 'bg-green-500/20 text-green-500' :
                                    task.status === 'REVIEW' ? 'bg-purple-500/20 text-purple-500' :
                                        'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-4">{task.title}</h3>

                            <div className="flex items-center gap-3 mb-6 p-3 bg-muted/20 rounded-xl">
                                <div className="w-10 h-10 rounded-full border border-muted overflow-hidden bg-background flex items-center justify-center font-bold text-sm">
                                    {task.assignedTo?.photoUrl ? (
                                        <img src={task.assignedTo.photoUrl} alt={task.assignedTo.name} className="w-full h-full object-cover" />
                                    ) : task.assignedTo?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-100 uppercase">{task.assignedTo?.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest">{task.assignedTo?.role}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase text-gray-400 mb-6">
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-gold-500" />
                                    {task.deadline || 'NO DEADLINE'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={12} className={task.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'} />
                                    {task.priority} PRIORITY
                                </div>
                            </div>

                            <div className="flex gap-2 border-t border-muted pt-4">
                                <button className="flex-1 py-2 text-[10px] font-black bg-muted rounded-lg hover:bg-white/5 transition-all uppercase tracking-widest">
                                    Details
                                </button>
                                {task.status === 'REVIEW' && (
                                    <button
                                        onClick={() => handleMarkAsDone(task.id)}
                                        className="flex-1 py-2 text-[10px] font-black bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all uppercase tracking-widest"
                                    >
                                        Approve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                                    title="Delete Task"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-card border border-gold-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                    >
                        <form onSubmit={handleCreateTask}>
                            <div className="p-6 border-b border-muted flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">NEW DEPLOYMENT</h3>
                                    <p className="text-xs text-gray-400 font-bold tracking-widest">Assign Operational Objectives</p>
                                </div>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Objective Title</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-500 outline-none focus:border-gold-500 transition-all"
                                        placeholder="Enter task name..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Assign Personnel</label>
                                        <select
                                            required
                                            className="w-full bg-background border border-muted rounded-xl p-3 outline-none focus:border-gold-500 transition-all text-sm"
                                            value={assignedToId}
                                            onChange={(e) => setAssignedToId(e.target.value)}
                                        >
                                            <option value="">Select Member</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Deadline</label>
                                        <input
                                            type="date"
                                            className="w-full bg-background border border-muted rounded-xl p-3 outline-none focus:border-gold-500 transition-all text-sm"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Project Name</label>
                                        <input
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-500 outline-none focus:border-gold-500 transition-all text-sm"
                                            placeholder="Internal/Client Code"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Priority LEVEL</label>
                                        <select
                                            className="w-full bg-background border border-muted rounded-xl p-3 outline-none focus:border-gold-500 transition-all text-sm font-bold"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gold-500 tracking-widest">Briefing Detail</label>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-500 outline-none focus:border-gold-500 transition-all h-24 text-sm"
                                        placeholder="Strategic instructions and context..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 bg-muted/30 border-t border-muted">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 transition-all active:scale-95 disabled:opacity-50 shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                                >
                                    {submitting ? 'COMMENCING DEPLOYMENT...' : 'FINALIZE ASSIGNMENT'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
