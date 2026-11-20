"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Search, Filter, Trash2, Gift, DollarSign, UserCheck, Sparkles } from "lucide-react";

export default function AdminReferralsPage() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        try {
            const res = await fetch('/api/admin/referrals');
            const data = await res.json();
            if (data.success) {
                setReferrals(data.referrals);
            }
        } catch (e) {
            console.error("Failed to fetch referrals");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED', currentAmount: number) => {
        const amount = status === 'APPROVED' ? prompt("Confirm Commission Amount (INR):", currentAmount.toString()) : null;
        if (status === 'APPROVED' && !amount) return;

        try {
            const res = await fetch(`/api/admin/referrals/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, amount })
            });
            const data = await res.json();
            if (data.success) {
                alert("Referral Updated Successfully!");
                fetchReferrals();
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            alert("Error updating referral");
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        const matchesFilter = filter === 'ALL' || ref.status === filter;
        const matchesSearch = ref.referrer.name.toLowerCase().includes(search.toLowerCase()) ||
            ref.description?.toLowerCase().includes(search.toLowerCase()) ||
            ref.project?.title?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Gift className="w-3.5 h-3.5" /> Affiliate Rewards
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referral Program Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Track student and employee referrals, verify client leads, and approve commission disbursements.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by referrer user, client name, or project..."
                        className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="bg-white border border-slate-200/80 text-slate-800 text-xs font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-amber-500 shadow-sm cursor-pointer"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="APPROVED">Approved & Paid</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="p-4 pl-6">Date</th>
                                <th className="p-4">Referrer User</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Project / Note</th>
                                <th className="p-4">Referred Client Info</th>
                                <th className="p-4">Status & Commission</th>
                                <th className="p-4 pr-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 animate-pulse font-medium">
                                        Loading referral logs...
                                    </td>
                                </tr>
                            ) : filteredReferrals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        No referrals found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReferrals.map((ref) => (
                                    <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-xs text-slate-500">
                                            {new Date(ref.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-semibold text-slate-900">
                                            {ref.referrer.name}
                                            <span className="text-[11px] text-slate-400 font-mono block">{ref.referrer.mobile}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                ref.type === 'PROJECT' 
                                                    ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                            }`}>
                                                {ref.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs">
                                            {ref.project ? (
                                                <span className="font-semibold text-amber-700">{ref.project.title}</span>
                                            ) : (
                                                <span className="text-slate-700">{ref.description || "Student Enrollment"}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs">
                                            <div className="font-semibold text-slate-900">{ref.description?.split('|')[0] || '-'}</div>
                                            <div className="text-slate-400 font-mono text-[11px]">{ref.description?.split('|')[1] || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                ref.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                ref.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {ref.status}
                                            </span>
                                            {ref.status === 'APPROVED' && (
                                                <div className="text-xs text-emerald-600 mt-1 font-bold font-mono">+₹{Number(ref.amount).toLocaleString('en-IN')}</div>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {ref.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(ref.id, 'APPROVED', ref.amount)}
                                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                                                            title="Approve Commission"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(ref.id, 'REJECTED', 0)}
                                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                                                            title="Reject Referral"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Are you sure you want to delete this referral record?")) return;
                                                        try {
                                                            const res = await fetch(`/api/admin/referrals/${ref.id}`, { method: 'DELETE' });
                                                            if (res.ok) {
                                                                fetchReferrals();
                                                            } else {
                                                                alert("Failed to delete");
                                                            }
                                                        } catch (e) { alert("Error deleting"); }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
