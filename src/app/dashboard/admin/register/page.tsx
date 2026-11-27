"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2, AlertCircle, Building2, MapPin, Calendar, Mail, Phone, User, Briefcase, Lock, KeyRound, Eye, EyeOff, ShieldCheck, ExternalLink } from "lucide-react";

type Role = "STUDENT" | "EMPLOYEE" | "CLIENT" | "TEAM_LEAD" | "DEVELOPMENT_MANAGER";

export default function RegisterUserPage() {
    const [formData, setFormData] = useState({
        role: "STUDENT" as Role,
        fullName: "",
        username: "",
        password: "",
        mobile: "",
        email: "",
        address: "",
        details: "",
        joiningDate: new Date().toISOString().split('T')[0],
        department: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
    const [lastCreatedUser, setLastCreatedUser] = useState<{
        fullName: string;
        role: string;
        username: string;
        mobile: string;
        password: string;
    } | null>(null);

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
            const loginUsername = formData.username.trim() || formData.mobile.trim();
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    username: loginUsername,
                    password: formData.password.trim()
                }),
            });

            if (res.ok) {
                setLastCreatedUser({
                    fullName: formData.fullName,
                    role: formData.role,
                    username: loginUsername,
                    mobile: formData.mobile.trim(),
                    password: formData.password.trim()
                });
                setStatus("SUCCESS");
                setFormData(prev => ({
                    ...prev,
                    fullName: "",
                    username: "",
                    password: "",
                    mobile: "",
                    email: "",
                    address: "",
                    details: "",
                    joiningDate: new Date().toISOString().split('T')[0],
                }));
                setCollegeSearch("");
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
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Domain / Department (e.g. Web Development)"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                                />
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

                        {/* Portal Login Credentials Section */}
                        <div className="p-5 bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200 rounded-2xl space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-amber-200/60">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                                    <KeyRound className="w-4 h-4 text-amber-600" />
                                    Portal Login Credentials ({formData.role === "STUDENT" ? "Student Portal" : `${formData.role.replace('_', ' ')} Portal`})
                                </div>
                                <span className="text-[11px] text-amber-700 font-medium">User will log in at <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">/login</code></span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Portal Username */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Username / Login ID
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-normal lowercase">(optional: defaults to mobile)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                                        placeholder={formData.mobile ? `e.g. ${formData.mobile}` : "e.g. aryan_ai or 98250XXXXX"}
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1.5">
                                        Custom portal username. The user can log in with this ID or their mobile number.
                                    </p>
                                </div>

                                {/* Portal Password */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5 text-amber-600" /> Set Portal Password
                                        </span>
                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Required</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-slate-900 text-sm focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                                            placeholder="Set initial password for user"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1.5">
                                        Enter a password for the user to sign in to their portal dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {status === "SUCCESS" && lastCreatedUser && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-2xl space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        User Account Created & Activated Successfully!
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Status: ACTIVE
                                    </span>
                                </div>

                                <div className="bg-white/90 p-4 rounded-xl border border-emerald-200 text-xs space-y-2 text-slate-800">
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500 font-medium">Name:</span>
                                        <span className="font-bold text-slate-900">{lastCreatedUser.fullName.toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500 font-medium">Role Portal:</span>
                                        <span className="font-bold text-amber-700">{lastCreatedUser.role}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500 font-medium">Portal Login ID / Username:</span>
                                        <span className="font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 border border-emerald-200">{lastCreatedUser.username}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500 font-medium">Mobile Number:</span>
                                        <span className="font-mono text-slate-900">{lastCreatedUser.mobile}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500 font-medium">Portal Password:</span>
                                        <span className="font-bold font-mono bg-amber-50 px-2 py-0.5 rounded text-amber-900 border border-amber-200">{lastCreatedUser.password}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-slate-500 font-medium">Student Login URL:</span>
                                        <a href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 underline">
                                            http://localhost:3000/login <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                <p className="text-[11px] text-emerald-700">
                                    💡 <strong>How to open portal:</strong> The student can open <a href="/login" target="_blank" className="underline font-bold">/login</a>, choose <strong>{lastCreatedUser.role}</strong>, enter their Login ID & Password, and they will immediately enter their dashboard.
                                </p>
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
