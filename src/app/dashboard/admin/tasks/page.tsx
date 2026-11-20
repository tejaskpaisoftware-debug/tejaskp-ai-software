"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
    X, Plus, Search, Filter, MessageSquare, Clock, 
    CheckCircle2, AlertCircle, FileText, Trash2, Calendar,
    User, Folder, AlertTriangle, Check
} from "lucide-react";

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
                const filtered = data.users.filter((u: any) => u.role !== 'ADMIN');
                setUsers(filtered);
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
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    title, description, projectName, priority, deadline, assignedToId
                })
            });
            const data = await res.json();

            if (data.success) {
                setShowCreateModal(false);
                fetchTasks();
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

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.assignedTo && t.assignedTo.name && t.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statusPills: Record<string, string> = {
        DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
        IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
        TODO: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const priorityPills: Record<string, string> = {
        HIGH: 'text-rose-600 bg-rose-50 border-rose-200',
        MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
        LOW: 'text-slate-600 bg-slate-100 border-slate-200',
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Task Operations Center
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Assign project deliverables, set deadlines, and track milestones across teams.
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shadow-amber-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search tasks or assignees..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                                filterStatus === s
                                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks Grid */}
            {loading ? (
                <div className="text-center py-24 text-slate-500 bg-white rounded-2xl border border-slate-200/80">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Loading tasks...</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">There are currently no tasks matching the selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTasks.map(task => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200">
                                        {task.projectName || 'General'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusPills[task.status] || 'bg-slate-100 text-slate-700'}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">
                                    {task.title}
                                </h3>

                                {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                                        {task.description}
                                    </p>
                                )}

                                {/* Assignee Pill */}
                                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                                        {task.assignedTo?.photoUrl ? (
                                            <img src={task.assignedTo.photoUrl} alt={task.assignedTo.name} className="w-full h-full object-cover" />
                                        ) : task.assignedTo?.name ? task.assignedTo.name.slice(0, 2).toUpperCase() : '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{task.assignedTo?.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight truncate">{task.assignedTo?.role}</p>
                                    </div>
                                </div>

                                {/* Meta: Deadline and Priority */}
                                <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span className="truncate">{task.deadline || 'No deadline'}</span>
                                    </div>
                                    <div className={`flex items-center justify-center font-semibold p-2 rounded-lg border text-[10px] uppercase tracking-wider ${priorityPills[task.priority] || 'text-slate-600 bg-slate-50'}`}>
                                        {task.priority} Priority
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                {task.status !== 'DONE' && (
                                    <button
                                        onClick={() => handleMarkAsDone(task.id)}
                                        className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Mark Done</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                    title="Delete task"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Task Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <h3 className="text-base font-bold text-slate-900">Create New Task Assignment</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Build Payment Gateway Integration"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. TEJASKP Portal"
                                            value={projectName}
                                            onChange={e => setProjectName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Assignee</label>
                                        <select
                                            required
                                            value={assignedToId}
                                            onChange={e => setAssignedToId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                        >
                                            <option value="">Select Assignee</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Deadline Date</label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Task Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Detailed requirements, acceptance criteria, or reference links..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs shadow-amber-500/20 disabled:opacity-50"
                                    >
                                        {submitting ? "Creating..." : "Deploy Task"}
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
