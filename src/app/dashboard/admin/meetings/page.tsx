"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MeetingDashboard() {
    const router = useRouter();

    const startInstantMeeting = () => {
        // Create a readable unique ID
        const prefix = "TEJASKPAI-MEET";
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newId = `${prefix}-${randomStr}`;
        router.push(`/meeting/${newId}?host=true`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pl-64">
            <AdminSidebar />

            <main className="p-8 max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-foreground tracking-widest">ONLINE MEETINGS</h1>
                    <p className="text-gold-theme/60 mt-1">Host secure video conferences with students and clients.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Meeting Card */}
                    <div className="bg-card/40 border border-theme rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                        <h2 className="text-xl font-bold text-gold-theme mb-6 flex items-center gap-2">
                            📹 Host a Meeting
                        </h2>

                        <div className="space-y-6">
                            <p className="text-gray-400 text-sm">
                                Start a new secure meeting instantly. You can invite others from inside the meeting room.
                            </p>

                            <button
                                onClick={startInstantMeeting}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-lg shadow-lg transition-all"
                            >
                                Start Instant Meeting
                            </button>
                        </div>
                    </div>

                    {/* Join / Info Card */}
                    <div className="bg-card/40 border border-theme rounded-2xl p-8 backdrop-blur-sm shadow-xl flex flex-col justify-center items-center text-center">
                        <div className="w-20 h-20 bg-gold-theme/10 rounded-full flex items-center justify-center mb-6">
                            <span className="text-4xl">🌐</span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Instant Collaboration</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            Features available in your personal portal meeting room:
                        </p>
                        <ul className="text-left text-sm space-y-2 text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> HD Video & Audio</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Screen Sharing</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> In-meeting Chat</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> No Time Limits</li>
                            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Secure & Encrypted</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
