"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2, AlertCircle, Building2, MapPin, Calendar, Mail, Phone, User, Briefcase } from "lucide-react";

type Role = "STUDENT" | "EMPLOYEE" | "CLIENT" | "TEAM_LEAD" | "DEVELOPMENT_MANAGER";

export default function RegisterUserPage() {
    const [formData, setFormData] = useState({
        role: "STUDENT" as Role,
        fullName: "",
        mobile: "",
        email: "",
        address: "",
        details: "",
        joiningDate: new Date().toISOString().split('T')[0],
        department: ""
    });
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

    // College Search Logic
    const [colleges, setColleges] = useState<string[]>([]);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Fallback Data
    const FALLBACK_COLLEGES = [
        "Gujarat University", "GTU", "Nirma University", "PDEU", "DA-IICT", "SVNIT", "Parul University", "Marwadi University", "RK University", "AU", "MSU"
    ];

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const res = await fetch("https://universities.hipolabs.com/search?country=India");
                if (res.ok) {
                    const data = await res.json();
                    let names = Array.from(new Set(data.map((c: any) => c.name))).sort();
                    setColleges(names as string[]);
                }
            } catch (err) {
                setColleges(FALLBACK_COLLEGES.sort());
            }
        };

        const fetchCurrentUserInfo = async () => {
            try {
                const userStr = sessionStorage.getItem("user") || localStorage.getItem("user");
                if (userStr) {
                    const currentUser = JSON.parse(userStr);
                    if (currentUser.role === "TEAM_LEAD") {
                        const res = await fetch(`/api/admin/users/${currentUser.id}`);
                        const data = await res.json();
                        if (data.user?.department) {
                            setFormData(prev => ({ ...prev, department: data.user.department }));
                        }
                    }
                }
            } catch (e) { console.error(e); }
        };

        fetchColleges();
        fetchCurrentUserInfo();
    }, []);

    const filteredColleges = colleges.filter(c =>
        c.toLowerCase().includes(collegeSearch.toLowerCase())
    ).slice(0, 50);

    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("IDLE");
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus("SUCCESS");
                setFormData({
                    ...formData,
                    fullName: "",
                    mobile: "",
                    email: "",
                    address: "",
                    details: "",
                    joiningDate: new Date().toISOString().split('T')[0],
                });
                setCollegeSearch("");
                setTimeout(() => setStatus("IDLE"), 4000);
            } else {
                const data = await res.json();
                setErrorMessage(data.message || "Registration Failed");
                setStatus("ERROR");
            }
        } catch (err) {
            setErrorMessage("Network error during registration");
            setStatus("ERROR");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <UserPlus className="w-3.5 h-3.5" /> Identity & Access Management
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Provision User Account</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Create credentials and assign domain responsibilities for Students, Employees, and Leads.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 block">
                                Target Account Role
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {(["STUDENT", "EMPLOYEE", "TEAM_LEAD", "CLIENT", "DEVELOPMENT_MANAGER"] as const).map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role })}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold tracking-wider transition-all border ${
                                            formData.role === role
                                                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {role.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Full Name & Mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Aryan Sharma"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number
                                </label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. 98250XXXXX"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> Official Email Address
                            </label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="official@company.com"
                            />
                        </div>

                        {/* Joining Date & Domain */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Joining
                                </label>
                                <input
                                    type="date"
                                    value={formData.joiningDate}
                                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Assigned Department / Domain
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                                >
                                    <option value="">Select Domain</option>
                                    <option value="Web Development">Web Development</option>
                                    <option value="AI/ML – Python">AI/ML – Python</option>
                                    <option value="Data Analytics">Data Analytics</option>
                                    <option value="Cyber Security – AWS">Cyber Security – AWS</option>
                                    <option value="Game Development">Game Development</option>
                                    <option value="Development Manager">Development Manager</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* College / Address */}
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                {formData.role === "STUDENT" ? (
                                    <>
                                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> Academic University / College
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Residential Address / Location
                                    </>
                                )}
                            </label>

                            {formData.role === "STUDENT" ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.address || collegeSearch}
                                        onChange={(e) => {
                                            setFormData({ ...formData, address: e.target.value });
                                            setCollegeSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Type to search university or college..."
                                    />
                                    {showDropdown && filteredColleges.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 border border-slate-200 bg-white rounded-xl mt-1.5 max-h-52 overflow-y-auto z-50 shadow-xl p-1.5 space-y-0.5">
                                            {filteredColleges.map((college, i) => (
                                                <div
                                                    key={i}
                                                    className="px-3.5 py-2 hover:bg-amber-50 rounded-lg text-xs cursor-pointer transition-colors text-slate-800 font-semibold"
                                                    onMouseDown={() => {
                                                        setFormData({ ...formData, address: college });
                                                        setCollegeSearch(college);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {college}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                                    placeholder="Enter complete residential address or department location..."
                                />
                            )}
                        </div>

                        {status === "SUCCESS" && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center font-semibold text-xs tracking-wide flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Account Created Successfully! Approval pending by administrator.
                            </motion.div>
                        )}

                        {status === "ERROR" && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-center font-semibold text-xs tracking-wide flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                {errorMessage}
                            </motion.div>
                        )}

                        <button 
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" /> Provision Account
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
