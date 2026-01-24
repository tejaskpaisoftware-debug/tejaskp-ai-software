"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientDashboard() {
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser");
        if (stored) {
            setUser(JSON.parse(stored));
        } else {
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8 relative z-10">
            <header className="flex justify-between items-center mb-10 border-b border-theme pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-widest">CLIENT DASHBOARD</h1>
                    <p className="text-gold-theme/60">Welcome, <span className="text-foreground font-bold">{user?.name || "Valued Partner"}</span></p>
                </div>
                <button
                    onClick={async () => {
                        try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) { }
                        sessionStorage.removeItem("currentUser");
                        sessionStorage.clear();
                        sessionStorage.clear();
                        window.location.href = "/login?logout=true";
                    }}
                    className="px-4 py-2 border border-theme rounded hover:bg-gold-theme hover:text-black transition-colors text-sm font-bold"
                >
                    LOGOUT
                </button>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                <Card title="Next Meeting" value="Tomorrow" />
            </div>

            <FinancialSection userId={user?.id || ""} />
        </div>
    );
}

function FinancialSection({ userId }: { userId: string }) {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;
        fetch(`/api/admin/invoices?user=${userId}`).then(res => res.json()).then(data => {
            if (data.invoices) setInvoices(data.invoices);
        });
    }, [userId]);

    return (
        <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="bg-card/40 border border-theme rounded-xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    💰 Financial Status
                </h3>
                {invoices.length === 0 ? (
                    <p className="text-gray-500">No invoices found.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gold-theme uppercase border-b border-theme">
                            <tr>
                                <th className="py-2">Invoice #</th>
                                <th className="py-2">Date</th>
                                <th className="py-2 text-right">Amount</th>
                                <th className="py-2 text-right">Due</th>
                                <th className="py-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme/20">
                            {invoices.map((inv) => {
                                const dueAmt = inv.total - inv.paidAmount;
                                const dueDate = new Date(inv.dueDate);
                                const today = new Date();
                                const daysLate = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                                const lateFee = daysLate * 100;
                                const totalPayable = dueAmt + lateFee;

                                return (
                                    <tr key={inv.id} className="hover:bg-foreground/5 cursor-pointer" onClick={() => window.open(`/invoice/${inv.id}`, '_blank')}>
                                        <td className="py-3 font-mono text-gold-theme">{inv.invoiceNumber}</td>
                                        <td className="py-3 text-gray-400">{dueDate.toLocaleDateString()}</td>
                                        <td className="py-3 text-right">₹{inv.total.toLocaleString()}</td>
                                        <td className="py-3 text-right font-bold text-foreground">
                                            ₹{totalPayable.toLocaleString()}
                                            {daysLate > 0 && <span className="block text-[10px] text-red-500">Includes ₹{lateFee} Late Fee ({daysLate} Days)</span>}
                                        </td>
                                        <td className="py-3 text-center">
                                            {totalPayable <= 0 ? (
                                                <span className="text-green-500 font-bold text-[10px] border border-green-500 rounded px-2 py-1">PAID</span>
                                            ) : daysLate > 0 ? (
                                                <span className="text-red-500 font-bold text-[10px] border border-red-500 rounded px-2 py-1 animate-pulse">OVERDUE</span>
                                            ) : (
                                                <span className="text-yellow-500 font-bold text-[10px] border border-yellow-500 rounded px-2 py-1">PENDING</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

function Card({ title, value }: { title: string, value: string }) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card/40 border border-theme p-6 rounded-xl">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">{title}</h3>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </motion.div>
    )
}
