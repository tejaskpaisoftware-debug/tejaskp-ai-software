"use client";

import { useEffect, useState } from "react";
// AdminSidebar removed (handled by layout)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Invoice } from "@/lib/db-store";

export default function AdminInvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

    // Role Protection
    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === "TEAM_LEAD") {
                    router.replace('/dashboard/admin');
                }
            }
        } catch (e) {
            console.error("Role Check Error", e);
        }
    }, [router]);

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
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track, audit, and generate billing invoices and fee receipts</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/billing"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                    >
                        <span>+</span> New Invoice
                    </Link>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {/* Status Filter Buttons */}
                <div className="flex bg-white border border-slate-200/80 rounded-xl p-1 gap-1 shadow-2xs">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'ALL'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        All ({invoices.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('PAID')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'PAID'
                            ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                    >
                        Paid
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'PENDING'
                            ? 'bg-rose-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                    >
                        Pending
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-md relative">
                    <input
                        type="text"
                        placeholder="Search by invoice #, customer name, mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 shadow-2xs transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                <th onClick={() => handleSort('invoiceNumber')} className="p-4 pl-6 cursor-pointer hover:text-slate-900 transition-colors select-none">
                                    Invoice # <SortIcon column="invoiceNumber" />
                                </th>
                                <th onClick={() => handleSort('date')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors select-none">
                                    Date <SortIcon column="date" />
                                </th>
                                <th onClick={() => handleSort('user')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors select-none">
                                    Customer <SortIcon column="user" />
                                </th>
                                <th onClick={() => handleSort('amount')} className="p-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none">
                                    Total Amount <SortIcon column="amount" />
                                </th>
                                <th className="p-4 text-center">
                                    Status
                                </th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">Loading invoice records...</td>
                                </tr>
                            ) : filteredAndSortedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        {invoices.length === 0 ? "No invoices generated yet." : "No matching invoices found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedInvoices.map((inv) => {
                                    const balance = inv.total - inv.paidAmount;
                                    const status = balance <= 0 ? "PAID" : "PENDING";
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 pl-6 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                                            <td className="p-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900 text-sm">{inv.user?.name || inv.customerName || "Unknown"}</div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inv.user?.mobile || inv.userId}</div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-900 text-sm">₹{inv.total.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status === 'PAID'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/invoice/${inv.id}?mode=admin`} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-semibold text-slate-700 transition-colors">
                                                        View ➜
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(inv.id)}
                                                        className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-md border border-rose-200 font-semibold transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

}
