"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Link from "next/link";
import { Invoice } from "@/lib/db-store";

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

    useEffect(() => {
        fetch("/api/admin/invoices")
            .then(res => res.json())
            .then(data => {
                if (data.invoices) {
                    setInvoices(data.invoices);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setInvoices(invoices.filter(inv => inv.id !== id));
            } else {
                alert("Failed to delete invoice");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting invoice");
        }
    };

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter Logic
    const filteredAndSortedInvoices = invoices
        .filter(inv => {
            // Status Filter Logic
            const balance = inv.total - inv.paidAmount;
            const status = balance <= 0 ? "PAID" : "PENDING";
            if (statusFilter !== 'ALL' && status !== statusFilter) return false;

            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();

            const customerName = (inv.user?.name || inv.customerName || "").toLowerCase();
            const invoiceNum = (inv.invoiceNumber || "").toLowerCase();
            const mobile = (inv.user?.mobile || inv.userId || "").toLowerCase();
            const amount = inv.total.toString();
            const date = new Date(inv.createdAt).toLocaleDateString();

            return (
                customerName.includes(query) ||
                invoiceNum.includes(query) ||
                mobile.includes(query) ||
                amount.includes(query) ||
                date.includes(query)
            );
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;

            const { key, direction } = sortConfig;
            let aValue: any = a[key as keyof Invoice];
            let bValue: any = b[key as keyof Invoice];

            // Specific field handling
            if (key === 'user') {
                aValue = a.user?.name || a.customerName || "";
                bValue = b.user?.name || b.customerName || "";
            } else if (key === 'amount') {
                aValue = a.total;
                bValue = b.total;
            } else if (key === 'date') {
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <span className="ml-1 text-gray-600">⇵</span>;
        return <span className="ml-1 text-gold-theme">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pl-64 relative z-10">
            <AdminSidebar />
            <main className="p-8 max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase shrink-0">All Invoices</h1>

                    {/* Status Filter Buttons */}
                    <div className="flex bg-card border border-theme rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'ALL'
                                ? 'bg-gold-500 text-obsidian shadow-lg'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('PAID')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'PAID'
                                ? 'bg-green-500 text-obsidian shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                }`}
                        >
                            Paid
                        </button>
                        <button
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'PENDING'
                                ? 'bg-red-500 text-foreground shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                        >
                            Pending
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md relative">
                        <input
                            type="text"
                            placeholder="Search by Invoice #, Name, Mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-theme text-foreground rounded-lg py-2 px-4 focus:outline-none focus:border-gold-500 placeholder-gray-600"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <Link href="/dashboard/admin/billing" className="bg-gold-500 text-obsidian px-6 py-2 rounded font-bold hover:bg-gold-400 shrink-0">
                        + NEW INVOICE
                    </Link>
                </header>

                <div className="bg-card/40 border border-theme rounded-2xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-left">
                        <thead className="bg-card text-gold-theme uppercase text-xs tracking-wider">
                            <tr>
                                <th onClick={() => handleSort('invoiceNumber')} className="p-4 cursor-pointer hover:text-foreground transition-colors select-none">
                                    Invoice # <SortIcon column="invoiceNumber" />
                                </th>
                                <th onClick={() => handleSort('date')} className="p-4 cursor-pointer hover:text-foreground transition-colors select-none">
                                    Date <SortIcon column="date" />
                                </th>
                                <th onClick={() => handleSort('user')} className="p-4 cursor-pointer hover:text-foreground transition-colors select-none">
                                    Customer <SortIcon column="user" />
                                </th>
                                <th onClick={() => handleSort('amount')} className="p-4 text-right cursor-pointer hover:text-foreground transition-colors select-none">
                                    Amount <SortIcon column="amount" />
                                </th>
                                <th className="p-4 text-center min-w-[200px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>Status</span>
                                        <div className="flex bg-card border border-theme rounded p-0.5 gap-0.5 scale-90">
                                            <button
                                                onClick={() => setStatusFilter('ALL')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === 'ALL'
                                                    ? 'bg-gold-500 text-obsidian shadow'
                                                    : 'text-gray-400 hover:text-foreground hover:bg-white/5'
                                                    }`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter('PAID')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === 'PAID'
                                                    ? 'bg-green-500 text-obsidian shadow'
                                                    : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                                    }`}
                                            >
                                                Paid
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter('PENDING')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === 'PENDING'
                                                    ? 'bg-red-500 text-foreground shadow'
                                                    : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                                    }`}
                                            >
                                                Pending
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10 text-sm text-gray-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Loading records...</td>
                                </tr>
                            ) : filteredAndSortedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        {invoices.length === 0 ? "No invoices generated yet." : "No matching invoices found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedInvoices.map((inv) => {
                                    const balance = inv.total - inv.paidAmount;
                                    const status = balance <= 0 ? "PAID" : "PENDING";
                                    return (
                                        <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-foreground">{inv.invoiceNumber}</td>
                                            <td className="p-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-foreground">{inv.user?.name || inv.customerName || "Unknown"}</div>
                                                <div className="text-xs text-gray-500 font-mono">{inv.user?.mobile || inv.userId}</div>
                                            </td>
                                            <td className="p-4 text-right font-mono text-gold-theme">₹{inv.total.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${status === 'PAID'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/30'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Link href={`/invoice/${inv.id}?mode=admin`} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-foreground">
                                                    VIEW ➜
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-1 rounded ml-2 border border-red-500/20"
                                                >
                                                    DELETE
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
