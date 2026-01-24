"use client";

import { useEffect, useState } from "react";
// AdminSidebar removed (handled by layout)
import { useRouter } from "next/navigation";

// Updated type to include ID
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
    const [selectedUser, setSelectedUser] = useState(""); // Stores User ID now
    const [userSearch, setUserSearch] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        type: "TRAINING" as "TRAINING" | "INTERNSHIP",
        items: [{ description: "", duration: "", startDate: "", endDate: "", amount: 0 }],
        applyTax: true,
        discount: 0,
        paidAmount: 0,
        dueDate: "",
    });

    useEffect(() => {
        // Fetch Students only
        fetch("/api/admin/users").then(res => res.json()).then(data => {
            if (data.users) {
                setUsers(data.users.filter((u: User) => u.role === "STUDENT" || u.role === "CLIENT"));
            }
        });
    }, []);

    // Calculations
    const subtotal = formData.items.reduce((sum, item) => sum + Number(item.amount), 0);
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
                    // Try parsing just a number as months by default if no unit
                    const num = parseInt(durationStr);
                    if (!isNaN(num)) {
                        date.setMonth(date.getMonth() + num);
                        valid = true;
                    }
                }

                if (valid) {
                    // Subtract 1 day for end date (e.g. 1st Jan to 31st Jan is 1 month)
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
                // Extract number of months
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
                        // Double the 3 months price
                        price = (INTERNSHIP_PRICING[domain]["3"] || 0) * 2;
                    } else {
                        // For any other duration (1, 2, 4, 5 etc.), use 1-month rate * months
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
            // Find user by ID now
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
                    // Optional: Reset form or keep it? 
                    // Usually "Save" implies staying on page.
                    // Let's at least reset isSubmitting.
                    setIsSubmitting(false);
                    // Reset fields for next entry could be nice?
                    // setFormData({ ...formData, items: [...], paidAmount: 0 }); 
                    // Let's keep it simple for now, maybe user wants to edit and save again.
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

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase">Billing & Invoicing</h1>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="bg-card/40 border border-theme rounded-2xl p-6 backdrop-blur-sm">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        {/* Customer Selection */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-2 block">Select Student / Client</label>
                            <input
                                type="text"
                                placeholder="Search by Name or Mobile..."
                                className="w-full bg-background/50 border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-500"
                                value={selectedUser ? (users.find(u => u.id === selectedUser)?.name + " - " + users.find(u => u.id === selectedUser)?.mobile) : ""}
                                onChange={(e) => {
                                    // If user tries to type here, we should probably clear the selection to let them search fresh?
                                    // Or better: This input is read-only for display, and we use a separate search input inside the dropdown?
                                    // Actually, standard pattern is: Input IS the search.
                                    // Let's implement a proper "search term" state.
                                    // Re-thinking: I'll use a local search state.
                                }}
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                readOnly // Start with readonly to act as "Select", toggle dropdown on click
                            />

                            {/* Dropdown List */}
                            {showUserDropdown && (
                                <div
                                    style={{ backgroundColor: 'var(--background)' }}
                                    className="absolute top-full left-0 right-0 mt-2 border border-theme rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto"
                                >
                                    <div className="p-2 sticky top-0 bg-background border-b border-gold-theme/10 z-10">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Type to search..."
                                            className="w-full bg-background border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    {users.filter(u =>
                                        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                        u.mobile.includes(userSearch)
                                    ).length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No match found</div>
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
                                                    setUserSearch(""); // Reset search
                                                }}
                                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-gold-500/10 transition-colors ${selectedUser === u.id ? 'bg-gold-500/20 text-gold-theme' : 'text-gray-300'}`}
                                            >
                                                <div className="font-bold">{u.name}</div>
                                                <div className="text-xs opacity-60">{u.role} • {u.mobile}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {/* Overlay to close when clicking outside */}
                            {showUserDropdown && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-2 block">Invoice Type</label>
                                <select
                                    className="w-full bg-background/50 border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none"
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
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-2 block">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-background/50 border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none [color-scheme:dark]"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">Line Items (Courses / Projects)</label>
                                <button type="button" onClick={handleAddItem} className="text-xs text-green-400 font-bold hover:underline">+ Add Row</button>
                            </div>
                            <div className="flex gap-2 text-[10px] text-gray-500 uppercase tracking-widest px-1">
                                <span className="flex-1">Description</span>
                                <span className="w-36">Starts On</span>
                                <span className="w-24">Duration</span>
                                <span className="w-36">Ends On</span>
                                <span className="w-28 text-right">Fees</span>
                                <span className="w-6"></span>
                            </div>
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    {formData.type === "INTERNSHIP" ? (
                                        <select
                                            className="flex-1 bg-background/50 border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none min-w-0"
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
                                            placeholder="Description (e.g. React Training)"
                                            className="flex-1 bg-background/50 border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none min-w-0"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                            required
                                        />
                                    )}
                                    <input
                                        type="date"
                                        className="w-36 bg-background/50 border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none [color-scheme:dark]"
                                        value={item.startDate || ""}
                                        onChange={(e) => handleItemChange(idx, "startDate", e.target.value)}
                                        required
                                    />
                                    <input
                                        placeholder="e.g. 3 Months"
                                        className="w-24 bg-background/50 border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none"
                                        value={item.duration}
                                        onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                                        required
                                    />
                                    <input
                                        readOnly
                                        placeholder="End Date"
                                        className="w-36 bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
                                        value={item.endDate || ""}
                                    />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-28 bg-background/50 border border-theme rounded px-3 py-2 text-sm text-foreground focus:outline-none text-right"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(idx, "amount", Number(e.target.value))}
                                        required
                                    />
                                    <div className="w-6 flex justify-center">
                                        {idx > 0 && (
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-400 font-bold text-xl leading-none">×</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 py-2 border-t border-gold-500/10">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.applyTax}
                                    onChange={(e) => setFormData({ ...formData, applyTax: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Apply GST (18%)</span>
                            </label>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm text-gray-300">Discount (%)</span>
                                <input
                                    type="number"
                                    className="w-20 bg-background/50 border border-theme rounded px-2 py-1 text-sm text-foreground focus:outline-none text-right"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider mb-2 block">Payment For This Invoice (₹)</label>
                                <input
                                    type="number"
                                    className="w-full bg-background/50 border border-theme rounded-lg px-4 py-3 text-foreground focus:outline-none"
                                    value={formData.paidAmount}
                                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Total Payable</p>
                                <p className="text-3xl font-bold text-gold-theme">₹{total.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => handleSubmit(e, 'SAVE')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-foreground font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {isSubmitting ? "SAVING..." : "SAVE PAYMENT ONLY"}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => handleSubmit(e, 'GENERATE')}
                                className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {isSubmitting ? "GENERATING..." : "GENERATE INVOICE"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
