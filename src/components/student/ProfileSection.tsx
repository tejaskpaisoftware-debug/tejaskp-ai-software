
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Save, ShieldCheck } from "lucide-react";

interface ProfileSectionProps {
    userId: string;
}

export default function ProfileSection({ userId }: ProfileSectionProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        try {
            const res = await fetch(`/api/user/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, ...profile })
            });
            if (res.ok) {
                alert("Profile updated successfully!");
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            alert("Error saving profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse font-bold">Loading Profile...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                <header className="mb-8 border-b border-white/5 pb-6">
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-600 flex items-center gap-3">
                        <User className="text-yellow-500" size={32} /> PERSONAL PROFILE
                    </h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium tracking-wide">Manage your personal and parent/guardian contact information for automated alerts.</p>
                </header>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Student Info */}
                    <section>
                        <h3 className="text-xs font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            Student Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                    <input
                                        type="text"
                                        value={profile.name}
                                        disabled
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                    <input
                                        type="text"
                                        value={profile.mobile}
                                        disabled
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Parent Info - UPDATABLE */}
                    <section className="bg-white/5 border border-white/5 rounded-2xl p-6 relative group border-dashed">
                        <div className="absolute -top-3 left-6 px-3 bg-[#111] text-yellow-500 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-full">
                            Guardian / Parent Details
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider">Parent/Guardian Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50" size={18} />
                                    <input
                                        type="text"
                                        value={profile.parentName}
                                        onChange={(e) => setProfile({ ...profile, parentName: e.target.value })}
                                        placeholder="Enter Parent Name"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider">Parent Mobile (For Alerts)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50" size={18} />
                                    <input
                                        type="text"
                                        value={profile.parentMobile}
                                        onChange={(e) => setProfile({ ...profile, parentMobile: e.target.value })}
                                        placeholder="Enter Parent Mobile"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500/50 outline-none transition-all placeholder:text-gray-700 font-medium font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider">Parent Email (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50" size={18} />
                                    <input
                                        type="email"
                                        value={profile.parentEmail}
                                        onChange={(e) => setProfile({ ...profile, parentEmail: e.target.value })}
                                        placeholder="Enter Parent Email"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                            <ShieldCheck className="text-yellow-500 shrink-0" size={20} />
                            <p className="text-[10px] text-yellow-500/70 leading-relaxed font-medium">
                                <strong>Privacy Note:</strong> These details are used strictly for automated attendance warnings and emergency communications. Ensure the mobile number is active to receive SMS/WhatsApp alerts.
                            </p>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black py-4 rounded-xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? "SAVING CHANGES..." : "UPDATE PROFILE"}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
