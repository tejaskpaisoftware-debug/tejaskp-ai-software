"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Save, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ProfileSectionProps {
    userId: string;
}

export default function ProfileSection({ userId }: ProfileSectionProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [profile, setProfile] = useState({
        name: "",
        mobile: "",
        parentName: "",
        parentMobile: "",
        parentEmail: ""
    });

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/user/me?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                setProfile({
                    name: data.user.name || "",
                    mobile: data.user.mobile || "",
                    parentName: data.user.parentName || "",
                    parentMobile: data.user.parentMobile || "",
                    parentEmail: data.user.parentEmail || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`/api/user/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, ...profile })
            });
            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            alert("Error saving profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600">Loading Profile Details...</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                {/* Header */}
                <header className="mb-8 border-b border-slate-100 pb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                PERSONAL PROFILE
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                                Manage your personal and parent/guardian contact information for automated alerts.
                            </p>
                        </div>
                    </div>

                    {saveSuccess && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Saved Successfully</span>
                        </div>
                    )}
                </header>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Student Info */}
                    <section>
                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Student Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={profile.name}
                                        disabled
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-600 cursor-not-allowed font-medium text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={profile.mobile}
                                        disabled
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-600 cursor-not-allowed font-medium text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Parent Info - UPDATABLE */}
                    <section className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-6 relative group">
                        <div className="absolute -top-3 left-6 px-3 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                            Guardian / Parent Details
                        </div>

                        <div className="grid md:grid-cols-2 gap-5 mt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Parent/Guardian Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={profile.parentName}
                                        onChange={(e) => setProfile({ ...profile, parentName: e.target.value })}
                                        placeholder="Enter Parent Name"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-sm shadow-2xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Parent Mobile (For Alerts)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={profile.parentMobile}
                                        onChange={(e) => setProfile({ ...profile, parentMobile: e.target.value })}
                                        placeholder="Enter Parent Mobile"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-sm font-mono shadow-2xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Parent Email (Optional)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        value={profile.parentEmail}
                                        onChange={(e) => setProfile({ ...profile, parentEmail: e.target.value })}
                                        placeholder="Enter Parent Email"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-sm shadow-2xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 p-3.5 bg-white border border-amber-200/90 rounded-xl flex items-start gap-3 shadow-2xs">
                            <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                <strong>Privacy Note:</strong> These details are used strictly for automated attendance warnings and emergency communications. Ensure the mobile number is active to receive SMS/WhatsApp alerts.
                            </p>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer text-sm disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{saving ? "SAVING CHANGES..." : "UPDATE PROFILE"}</span>
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
