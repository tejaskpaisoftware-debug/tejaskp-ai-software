"use client";

import { useRouter } from "next/navigation";
import { Video, ShieldCheck, Monitor, MessageCircle, Clock, Lock, Sparkles, Check } from "lucide-react";

export default function MeetingDashboard() {
    const router = useRouter();

    const startInstantMeeting = () => {
        const prefix = "TEJASKPAI-MEET";
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newId = `${prefix}-${randomStr}`;
        router.push(`/meeting/${newId}?host=true`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Video className="w-3.5 h-3.5" /> Virtual Collaboration
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Online Video Conferences</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Host instant encrypted video conferences with students, team leads, and external clients.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                {/* Create Meeting Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5">
                            <Video className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Host an Instant Conference</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            Launch a secure virtual meeting room instantly with one click. Invite participants by sharing the generated link directly.
                        </p>
                    </div>

                    <button
                        onClick={startInstantMeeting}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <Video className="w-4 h-4" /> Start Instant Meeting
                    </button>
                </div>

                {/* Features & Specifications Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Enterprise Ready
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">Conference Room Features</h2>
                        <p className="text-xs text-slate-500 mb-5">
                            High-fidelity infrastructure engineered for remote reviews, mentoring, and administrative interviews.
                        </p>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-700">
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>HD 1080p WebRTC Low-Latency Audio & Video</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>Multi-Monitor Screen Sharing & Code Review</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>Real-Time In-Meeting Chat & File Links</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>No Session Time Caps or Forced Disconnects</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>Peer-to-Peer End-to-End Encryption</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
