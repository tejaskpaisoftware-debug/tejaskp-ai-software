"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "../stars.css"; // Import the CSS stars
// import { Canvas } from "@react-three/fiber"; // Removed for mobile stability
// import { Stars } from "@react-three/drei";

type Role = "ADMIN" | "STUDENT" | "EMPLOYEE" | "CLIENT";

export default function LoginPage() {
    const [activeRole, setActiveRole] = useState<Role>("STUDENT");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState(""); // For first time setup
    const [confirmPassword, setConfirmPassword] = useState("");

    // Auth State: 'LOGIN' | 'SET_PASSWORD'
    const [authStep, setAuthStep] = useState<"LOGIN" | "SET_PASSWORD">("LOGIN");

    const [error, setError] = useState("");
    const router = useRouter();

    // 🛡️ SECURITY: Clear any stale session data on mount
    useEffect(() => {
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("user");
        localStorage.removeItem("currentUser"); // Clean old flows
        localStorage.removeItem("user");
        sessionStorage.clear();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // ADMIN LOGIN (Handled via API now)

        try {
            // SET PASSWORD FLOW
            if (authStep === "SET_PASSWORD") {
                if (newPassword !== confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }
                if (newPassword.length < 6) {
                    setError("Password must be at least 6 characters.");
                    return;
                }

                const res = await fetch("/api/auth/set-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile, password: newPassword }),
                });

                if (res.ok) {
                    alert("Password Set Successfully! Logging in...");
                    setAuthStep("LOGIN");
                    setPassword(""); // Clear for user to re-enter or we could auto-login
                    // For better UX, let's ask them to re-login to confirm they remembered it
                } else {
                    const data = await res.json();
                    setError(data.message || "Failed to set password");
                }
                return;
            }

            // STANDARD LOGIN / CHECK FLOW
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobile: mobile.trim(),
                    password: password.trim(),
                    role: activeRole
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.status === "PENDING_SETUP") {
                    setAuthStep("SET_PASSWORD");
                } else if (data.status === "SUCCESS") {
                    // Save User Session Client-Side (SessionStorage for Tab Isolation)
                    // data.user now contains { ..., token: "Request-Token" }
                    sessionStorage.setItem("currentUser", JSON.stringify(data.user));

                    // Redirect based on role
                    // Redirect based on returned user role
                    const role = data.user.role;
                    if (role === "ADMIN") router.push("/dashboard/admin");
                    else if (role === "STUDENT") router.push("/dashboard/student");
                    else if (role === "EMPLOYEE") router.push("/dashboard/employee");
                    else if (role === "CLIENT") router.push("/dashboard/client");
                    else router.push("/dashboard");
                }
            } else {
                setError(data.message || "Login failed");
            }

        } catch (err) {
            console.error(err);
            setError("Connection Error");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gold-100 font-sans flex items-center justify-center relative overflow-hidden">
            {/* CSS-Only Stars Background (Mobile Optimized, Visually Identical) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] opacity-80" />
                <div className="stars-small" />
                <div className="stars-medium" />
                <div className="stars-large" />
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4 grid md:grid-cols-2 gap-8 items-center">
                {/* Left Side: Branding & Info */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="hidden md:block space-y-6"
                >
                    <div className="flex items-center gap-4">
                        <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full border-2 border-yellow-500 shadow-[0_0_20px_rgba(255,215,0,0.3)]" />
                        <div>
                            <h1 className="text-3xl font-bold text-[#FFD700] tracking-wider drop-shadow-md">TEJASKP AI</h1>
                            <p className="text-yellow-200 tracking-[0.2em] text-sm font-medium">FUTURE IS HERE</p>
                        </div>
                    </div>
                    <p className="text-gray-200 leading-relaxed text-lg font-light">
                        Access your secure portal to manage data, view analytics, and experience the power of next-gen AI software.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="bg-[#1a1a1a] border border-yellow-500/30 p-4 rounded-xl backdrop-blur-sm">
                            <div className="text-2xl font-bold text-[#FFD700]">99.9%</div>
                            <div className="text-xs text-white uppercase tracking-wider font-semibold">Uptime</div>
                        </div>
                        <div className="bg-[#1a1a1a] border border-yellow-500/30 p-4 rounded-xl backdrop-blur-sm">
                            <div className="text-2xl font-bold text-[#FFD700]">SECURE</div>
                            <div className="text-xs text-white uppercase tracking-wider font-semibold">Encryption</div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Login Panel */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="bg-[#121212]/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Role Tabs */}
                        <div className="flex border-b border-yellow-500/20">
                            {["STUDENT", "EMPLOYEE", "CLIENT"].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => { setActiveRole(role as Role); setAuthStep("LOGIN"); setError(""); }}
                                    className={`flex-1 py-4 text-xs font-bold tracking-wider transition-all relative ${activeRole === role
                                        ? "text-black bg-[#FFD700]"
                                        : "text-gray-300 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    {role}
                                    {activeRole === role && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Login Form */}
                        <div className="p-8">
                            <motion.div
                                key={activeRole + authStep} // Re-animate on role or step change
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        {authStep === "SET_PASSWORD" ? "Setup Password" :
                                            activeRole === 'ADMIN' ? 'System Administration' :
                                                activeRole === 'STUDENT' ? 'Student Portal' :
                                                    activeRole === 'EMPLOYEE' ? 'Staff Access' : 'Client Dashboard'}
                                    </h2>
                                    <p className="text-gray-300 text-sm">
                                        {authStep === "SET_PASSWORD"
                                            ? "Create a secure password for your account"
                                            : "Please sign in with your mock credentials"}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={handleLogin}>
                                    {/* Mobile/User Input */}
                                    {authStep === "LOGIN" && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
                                                Mobile or Username
                                            </label>
                                            <input
                                                type="text"
                                                value={mobile}
                                                onChange={(e) => setMobile(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-yellow-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all font-medium border-opacity-50"
                                                placeholder="Enter mobile or username"
                                            />
                                        </div>
                                    )}

                                    {/* Password Input (Active for Admin or Normal Login) */}
                                    {authStep === "LOGIN" && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Password</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-yellow-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all font-medium border-opacity-50"
                                                placeholder={activeRole === "ADMIN" ? "admin123" : "pass123 (or leave blank to test setup)"}
                                            />
                                            {activeRole !== "ADMIN" && <p className="text-[11px] text-gray-400 font-medium">*First time? Enter mobile & leave password blank</p>}
                                        </div>
                                    )}

                                    {/* Set Password Inputs */}
                                    {authStep === "SET_PASSWORD" && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-[#1a1a1a] border border-yellow-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                                                    placeholder="Minimum 6 characters"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-[#1a1a1a] border border-yellow-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                                                    placeholder="Re-enter password"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {error && <p className="text-red-500 text-xs text-center font-bold tracking-wide">{error}</p>}

                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                            <input type="checkbox" className="rounded border-gray-600 bg-transparent text-yellow-500 focus:ring-offset-0 focus:ring-yellow-500" />
                                            Remember me
                                        </label>
                                        <a href="#" className="hover:text-yellow-400 transition-colors">Forgot Password?</a>
                                    </div>

                                    <button className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-black font-extrabold py-4 rounded-lg shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all transform active:scale-95 text-base tracking-wide">
                                        {authStep === "SET_PASSWORD" ? "SET PASSWORD & LOGIN" : "ACCESS DASHBOARD"}
                                    </button>

                                    {authStep === "SET_PASSWORD" && (
                                        <button
                                            type="button"
                                            onClick={() => setAuthStep("LOGIN")}
                                            className="w-full text-xs text-gold-500 hover:text-white underline"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </form>
                            </motion.div>
                        </div>

                        <div className="bg-obsidian/50 p-4 text-center border-t border-gold-500/10">
                            <p className="text-xs text-gray-500">
                                Protected by TEJASKP Security Systems v1.0
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
