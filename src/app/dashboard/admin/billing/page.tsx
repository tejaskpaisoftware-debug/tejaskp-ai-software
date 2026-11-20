"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Search, Plus, Trash2, Calendar, UserCheck, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

type User = { id: string; name: string; mobile: string; role: string; };

export default function BillingPage() {
    const [users, setUsers] = useState<User[]>([]);

    // Internship Pricing Rules
    const INTERNSHIP_PRICING: Record<string, { "1": number, "3": number }> = {
        "DIGITAL MARKETING": { "1": 1300, "3": 2800 },
        "DATA ANALYTICS": { "1": 1400, "3": 2800 },
        "WEB DEVELOPMENT": { "1": 1400, "3": 2400 },
        "AI/ML": { "1": 1900, "3": 2900 },
        "MOBILE APPLICATION": { "1": 1800, "3": 2800 },
        "CYBER SECURITY": { "1": 2200, "3": 3200 },
        "WEB DEVELOPMENT (REACT)": { "1": 1600, "3": 2600 }
    };

    const DOMAINS = Object.keys(INTERNSHIP_PRICING);
    const [selectedUser, setSelectedUser] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        type: "TRAINING" as "TRAINING" | "INTERNSHIP" | "PROJECT",
        items: [{ description: "", duration: "", startDate: "", endDate: "", amount: 0 }],
        applyTax: true,
        discount: 0,
        paidAmount: 0,
        dueDate: "",
    });

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
        fetch("/api/admin/users").then(res => res.json()).then(data => {
            if (data.users) {
                setUsers(data.users.filter((u: User) => u.role === "STUDENT" || u.role === "CLIENT"));
            }
        });
    }, []);

    // Calculations
    const subtotal = formData.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const discountAmount = (subtotal * (formData.discount || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;

    const sgst = formData.applyTax ? taxableAmount * 0.09 : 0;
    const cgst = formData.applyTax ? taxableAmount * 0.09 : 0;
    const total = Math.round(taxableAmount + sgst + cgst);

    const handleAddItem = () => {
        setFormData({ ...formData, items: [...formData.items, { description: "", duration: "", startDate: "", endDate: "", amount: 0 }] });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        // @ts-ignore
        newItems[index][field] = value;

        // Auto-calculate End Date if Duration and Start Date are present
        if (field === "duration" || field === "startDate") {
            const durationStr = newItems[index].duration;
            const startDateStr = newItems[index].startDate;

            if (durationStr && startDateStr) {
                const monthsMatch = durationStr.match(/(\d+)\s*month/i);
                const daysMatch = durationStr.match(/(\d+)\s*day/i);
                const weeksMatch = durationStr.match(/(\d+)\s*week/i);

                let date = new Date(startDateStr);
                let valid = false;

                if (monthsMatch) {
                    date.setMonth(date.getMonth() + parseInt(monthsMatch[1]));
                    valid = true;
                } else if (weeksMatch) {
                    date.setDate(date.getDate() + (parseInt(weeksMatch[1]) * 7));
                    valid = true;
                } else if (daysMatch) {
                    date.setDate(date.getDate() + parseInt(daysMatch[1]));
                    valid = true;
                } else {
                    const num = parseInt(durationStr);
                    if (!isNaN(num)) {
                        date.setMonth(date.getMonth() + num);
                        valid = true;
                    }
                }

                if (valid) {
                    date.setDate(date.getDate() - 1);
                    newItems[index].endDate = date.toISOString().split('T')[0];
                }
            }
        }

        // Auto-calculate Price for INTERNSHIP
        if (formData.type === "INTERNSHIP" && (field === "description" || field === "duration")) {
            const domain = newItems[index].description;
            const durationStr = newItems[index].duration;

            if (domain && durationStr && INTERNSHIP_PRICING[domain]) {
                let months = 0;
                const monthsMatch = durationStr.match(/(\d+)\s*month/i);
                const pureNumMatch = durationStr.match(/^(\d+)$/);

                if (monthsMatch) {
                    months = parseInt(monthsMatch[1]);
                } else if (pureNumMatch) {
                    months = parseInt(pureNumMatch[1]);
                }

                if (months > 0) {
                    let price = 0;
                    if (months === 3) {
                        price = INTERNSHIP_PRICING[domain]["3"] || 0;
                    } else if (months === 6) {
                        price = (INTERNSHIP_PRICING[domain]["3"] || 0) * 2;
                    } else {
                        const oneMonthRate = INTERNSHIP_PRICING[domain]["1"] || 0;
                        price = oneMonthRate * months;
                    }

                    if (price > 0) {
                        newItems[index].amount = price;
                    }
                }
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent, action: 'SAVE' | 'GENERATE') => {
        e.preventDefault();
        if (!selectedUser) return alert("Please select a student/client");

        setIsSubmitting(true);
        try {
            const customer = users.find(u => u.id === selectedUser);

            const payload = {
                userId: selectedUser,
                customerName: customer?.name || "Unknown",
                type: formData.type,
                items: formData.items,
                subtotal,
                discount: discountAmount,
                sgst,
                cgst,
                total,
                paidAmount: Number(formData.paidAmount),
                dueDate: formData.dueDate
            };

            const res = await fetch("/api/admin/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                if (action === 'GENERATE') {
                    router.push(`/invoice/${data.invoiceId}`);
                } else {
                    alert("Payment Saved Successfully! User balance updated.");
                    setIsSubmitting(false);
                }
            } else {
                alert("Failed to save: " + (data.message || "Unknown error"));
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
            setIsSubmitting(false);
        }
    };

    const selectedCustomer = users.find(u => u.id === selectedUser);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Receipt className="w-3.5 h-3.5" /> Finance & Accounts
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Invoicing</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Generate official student fee invoices, manage discounts, and record direct payment credits.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        {/* Customer Selection */}
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-amber-600" /> Select Student / Client
                            </label>
                            <div 
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 cursor-pointer hover:border-amber-400 transition-colors flex items-center justify-between"
                            >
                                <span className={selectedCustomer ? "font-semibold text-slate-900" : "text-slate-400"}>
                                    {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.role}) — ${selectedCustomer.mobile}` : "Click to search student or client..."}
                                </span>
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* Dropdown List */}
                            {showUserDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                                    <div className="p-3 sticky top-0 bg-white border-b border-slate-100 z-10">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Type name or mobile to filter..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {users.filter(u =>
                                        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                        u.mobile.includes(userSearch)
                                    ).length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">No matching student found</div>
                                    ) : (
                                        users.filter(u =>
                                            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.mobile.includes(userSearch)
                                        ).map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => {
                                                    setSelectedUser(u.id);
                                                    setShowUserDropdown(false);
                                                    setUserSearch("");
                                                }}
                                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-amber-50/70 border-b border-slate-50 transition-colors flex items-center justify-between ${selectedUser === u.id ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'}`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-slate-900">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.mobile}</div>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {u.role}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {showUserDropdown && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                            )}
                        </div>

                        {/* Invoice Type & Due Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Invoice Type</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-amber-500"
                                    value={formData.type}
                                    // @ts-ignore
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="TRAINING">Training / Course</option>
                                    <option value="INTERNSHIP">Internship Program</option>
                                    <option value="PROJECT">Project Development</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-amber-500"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items (Courses / Programs)</label>
                                <button 
                                    type="button" 
                                    onClick={handleAddItem} 
                                    className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </button>
                            </div>

                            <div className="hidden sm:flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                                <span className="flex-1">Description / Domain</span>
                                <span className="w-36">Starts On</span>
                                <span className="w-24">Duration</span>
                                <span className="w-36">Ends On</span>
                                <span className="w-28 text-right">Fee (₹)</span>
                                <span className="w-8"></span>
                            </div>

                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-slate-50/70 p-3 sm:p-2 rounded-xl border border-slate-200">
                                    {formData.type === "INTERNSHIP" ? (
                                        <select
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 min-w-0"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                            required
                                        >
                                            <option value="">Select Domain</option>
                                            {DOMAINS.map(domain => (
                                                <option key={domain} value={domain}>{domain}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            placeholder="Description (e.g. Full Stack Bootcamp)"
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 min-w-0"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                            required
                                        />
                                    )}
                                    <input
                                        type="date"
                                        className="sm:w-36 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                                        value={item.startDate || ""}
                                        onChange={(e) => handleItemChange(idx, "startDate", e.target.value)}
                                        required
                                    />
                                    <input
                                        placeholder="e.g. 3 Months"
                                        className="sm:w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                                        value={item.duration}
                                        onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                                        required
                                    />
                                    <input
                                        readOnly
                                        placeholder="Auto End Date"
                                        className="sm:w-36 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 focus:outline-none cursor-not-allowed"
                                        value={item.endDate || ""}
                                    />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="sm:w-28 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 text-right font-medium"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(idx, "amount", Number(e.target.value))}
                                        required
                                    />
                                    <div className="sm:w-8 flex justify-center items-center">
                                        {idx > 0 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveItem(idx)} 
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tax & Discount Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-4 bg-slate-50 rounded-xl border border-slate-200/80">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.applyTax}
                                    onChange={(e) => setFormData({ ...formData, applyTax: e.target.checked })}
                                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                                />
                                <span className="text-sm font-semibold text-slate-700">Apply GST (18% : 9% SGST + 9% CGST)</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600">Discount (%)</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 text-right font-medium"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Payment & Payable Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border border-amber-200/60">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                                    Immediate Payment Received (₹)
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold text-lg focus:outline-none focus:border-amber-500 shadow-sm"
                                    value={formData.paidAmount}
                                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                                />
                                <p className="text-xs text-slate-500 mt-1.5">Enter 0 if amount is pending, or full/partial amount.</p>
                            </div>
                            <div className="flex flex-col justify-center sm:items-end sm:text-right">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Payable</p>
                                <p className="text-3xl font-extrabold text-amber-600 tracking-tight">₹{total.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Subtotal: ₹{subtotal.toLocaleString('en-IN')} {formData.applyTax ? `• GST: ₹${(sgst + cgst).toLocaleString('en-IN')}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => handleSubmit(e, 'SAVE')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {isSubmitting ? "Saving..." : "Save Payment Only"}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => handleSubmit(e, 'GENERATE')}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                            >
                                <Receipt className="w-4 h-4" />
                                {isSubmitting ? "Generating..." : "Generate Invoice PDF"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
