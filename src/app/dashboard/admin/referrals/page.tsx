"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Search, Filter, Trash2 } from "lucide-react";

export default function AdminReferralsPage() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
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
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-foreground mb-8">Referral Management</h1>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by referrer user..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-theme text-foreground focus:border-gold-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="bg-card border border-theme text-foreground rounded-lg px-4 py-2 outline-none focus:border-gold-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-card/50 border border-theme rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-foreground/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Referrer</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Description / Project</th>
                            <th className="p-4">Client Details</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {filteredReferrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-foreground/5 text-gray-300">
                                <td className="p-4">{new Date(ref.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 font-bold text-foreground">
                                    {ref.referrer.name}<br />
                                    <span className="text-xs text-gray-500">{ref.referrer.mobile}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${ref.type === 'PROJECT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {ref.type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {ref.project ? (
                                        <span className="text-gold-theme font-bold">{ref.project.title}</span>
                                    ) : (
                                        ref.description || "Student Enrollment"
                                    )}
                                </td>
                                <td className="p-4 text-xs">
                                    {ref.type === 'PROJECT' && (
                                        <>
                                            <div className="text-foreground font-bold">{ref.description?.split('|')[0] || '-'}</div> {/* Client Name */}
                                            <div className="text-gray-500">{ref.description?.split('|')[1] || '-'}</div> {/* Client Mobile */}
                                        </>
                                    )}
                                    {ref.type === 'ENROLLMENT' && (
                                        <>
                                            <div className="text-foreground font-bold">{ref.description?.split('|')[0] || '-'}</div> {/* Student Name */}
                                            <div className="text-gray-500">{ref.description?.split('|')[1] || '-'}</div> {/* Student Mobile */}
                                        </>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${ref.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                        ref.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {ref.status}
                                    </span>
                                    {ref.status === 'APPROVED' && <div className="text-xs text-green-500 mt-1 font-bold">+ ₹{ref.amount}</div>}
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    {ref.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(ref.id, 'APPROVED', ref.amount)}
                                                className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-black transition-colors"
                                                title="Approve & Pay"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(ref.id, 'REJECTED', 0)}
                                                className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-foreground transition-colors"
                                                title="Reject"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
                                    {/* Delete Button (Always Visible) */}
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this referral? It will be removed from the user's dashboard as well.")) return;
                                            try {
                                                const res = await fetch(`/api/admin/referrals/${ref.id}`, { method: 'DELETE' });
                                                if (res.ok) {
                                                    fetchReferrals();
                                                    alert("Deleted successfully");
                                                } else {
                                                    alert("Failed to delete");
                                                }
                                            } catch (e) { alert("Error deleting"); }
                                        }}
                                        className="p-2 bg-gray-500/20 text-gray-400 rounded hover:bg-red-500 hover:text-foreground transition-colors"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredReferrals.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No referrals found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
