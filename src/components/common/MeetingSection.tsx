"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Users, ExternalLink, Play } from "lucide-react";

export default function MeetingSection({ userId, userName }: { userId: string, userName?: string }) {
    const router = useRouter();
    const [joinId, setJoinId] = useState("");

    const startInstantMeeting = () => {
        // Create a readable unique ID
        const prefix = "TEJASKPAI-MEET";
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newId = `${prefix}-${randomStr}`;
        // Instant redirect
        router.push(`/meeting/${newId}?host=true`);
    };

    const handleJoin = () => {
        if (!joinId) return;
        // Clean up ID if full URL is pasted
        let cleanId = joinId;
        if (joinId.includes("/meeting/")) {
            cleanId = joinId.split("/meeting/")[1].split("?")[0];
        }
        router.push(`/meeting/${cleanId}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-4">
                <span className="p-3 bg-gold-theme/10 rounded-full text-gold-theme text-2xl">📹</span>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Online Meetings</h2>
                    <p className="text-muted-foreground text-sm">Host or join secure video conferences instantly.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Host Meeting Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-card border border-theme rounded-2xl p-8 shadow-lg relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-theme/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-gold-theme/10 transition-all"></div>

                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <Video className="text-gold-theme" /> Host a Meeting
                    </h3>

                    <div className="space-y-6">
                        <p className="text-gray-400 text-sm">
                            Start a new secure meeting instantly. You can invite others from inside the meeting room.
                        </p>

                        <button
                            onClick={startInstantMeeting}
                            className="w-full bg-gold-theme text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                            <Play size={20} /> Start Instant Meeting
                        </button>
                    </div>
                </motion.div>

                {/* Join Meeting Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-card border border-theme rounded-2xl p-8 shadow-lg relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <ExternalLink className="text-blue-400" /> Join a Meeting
                    </h3>

                    <div className="space-y-6">
                        <p className="text-gray-400 text-sm">
                            Enter a meeting ID or paste a link to join an existing session.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Meeting ID or Link</label>
                                <input
                                    type="text"
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    placeholder="e.g. TEJASKPAI-MEET-XXXXXX"
                                    className="w-full mt-2 bg-black/20 border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={!joinId}
                                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${joinId
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Users size={20} /> Join Meeting
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="bg-gold-theme/5 border border-gold-theme/10 rounded-xl p-4 flex flex-wrap gap-4 justify-center text-xs text-gold-theme/60 text-center">
                <span className="flex items-center gap-1">🔒 Secure Encryption</span>
                <span className="w-1 h-1 bg-gold-theme/40 rounded-full self-center"></span>
                <span className="flex items-center gap-1">⏱️ No Time Limits</span>
                <span className="w-1 h-1 bg-gold-theme/40 rounded-full self-center"></span>
                <span className="flex items-center gap-1">📱 Mobile Friendly</span>
                <span className="w-1 h-1 bg-gold-theme/40 rounded-full self-center"></span>
                <span className="flex items-center gap-1">💬 In-Meeting Chat</span>
            </div>
        </div>
    );
}
