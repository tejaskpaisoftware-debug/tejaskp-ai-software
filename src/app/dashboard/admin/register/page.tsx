"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

    // Fallback Data - Comprehensive List of Gujarat Colleges & Universities
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
                setTimeout(() => setStatus("IDLE"), 3000);
            } else {
                const data = await res.json();
                setErrorMessage(data.message || "Registration Failed");
                setStatus("ERROR");
            }
        } catch (err) {
            setErrorMessage("Network Error");
            setStatus("ERROR");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans w-full p-8 md:p-12">
            <main className="max-w-4xl mx-auto">
                <header className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tighter uppercase">Register New Account</h1>
                    <p className="text-gold-theme/70 mt-2 font-medium">Create system access for Students, Staff, and Managers.</p>
                </header>

                <div className="bg-card/30 border border-gold-theme/20 rounded-3xl p-6 md:p-10 backdrop-blur-md shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {["STUDENT", "EMPLOYEE", "TEAM_LEAD", "CLIENT", "DEVELOPMENT_MANAGER"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role as Role })}
                                    className={`py-3 rounded-xl text-[10px] md:text-xs font-black tracking-widest transition-all border-2 ${formData.role === role
                                        ? "bg-gold-theme text-black border-gold-theme shadow-lg scale-105"
                                        : "bg-transparent text-muted-foreground border-white/5 hover:border-gold-theme/30"
                                        }`}
                                >
                                    {role.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium"
                                    placeholder="e.g. Aryan Sharma"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">Connect Mobile</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium"
                                    placeholder="e.g. 98250XXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">Email Address</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium"
                                placeholder="official@company.com"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">Date of Joining</label>
                                <input
                                    type="date"
                                    value={formData.joiningDate}
                                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">Assigned Domain</label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium appearance-none"
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

                        <div className="space-y-3 relative">
                            <label className="text-[10px] font-black text-gold-theme/80 uppercase tracking-widest block ml-1">
                                {formData.role === "STUDENT" ? "Academic Institution" : "Physical Address / KYC"}
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
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium"
                                        placeholder="Type to search colleges..."
                                    />
                                    {showDropdown && filteredColleges.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 border border-white/10 bg-[#0a0a0a] rounded-2xl mt-2 max-h-52 overflow-y-auto z-50 shadow-2xl p-2 space-y-1">
                                            {filteredColleges.map((college, i) => (
                                                <div
                                                    key={i}
                                                    className="px-4 py-3 hover:bg-gold-theme/10 rounded-xl text-sm cursor-pointer transition-colors"
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
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-gold-theme/50 transition-all font-medium resize-none"
                                    placeholder="Enter full residential address or department details..."
                                />
                            )}
                        </div>

                        {status === "SUCCESS" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/30 text-green-400 p-5 rounded-2xl text-center font-bold text-sm tracking-wide">
                                Account Created Successfully! Approval Pending.
                            </motion.div>
                        )}

                        {status === "ERROR" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-2xl text-center font-bold text-sm tracking-wide">
                                ⚠ {errorMessage}
                            </motion.div>
                        )}

                        <button className="w-full bg-gradient-to-r from-gold-theme to-gold-theme/70 text-black font-black py-5 rounded-2xl shadow-xl hover:shadow-gold-theme/20 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-[0.2em] uppercase">
                            Initialize User Account
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
