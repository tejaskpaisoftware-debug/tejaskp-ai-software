"use client";

import { useEffect, useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SingleTabEnforcer() {
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [debugId, setDebugId] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        // 1. Get User Identity to Scope the Channel
        let userId = 'guest'; // Default to guest
        try {
            // Robustly check storage keys (Prefer Session Storage)
            const u1 = sessionStorage.getItem("user");
            const u2 = sessionStorage.getItem("currentUser");
            const u3 = localStorage.getItem("user"); // Fallback
            const u4 = localStorage.getItem("currentUser"); // Fallback

            const raw = u1 || u2 || u3 || u4;

            if (raw) {
                const parsed = JSON.parse(raw);
                // Prioritize ID, fallback to mobile if ID missing
                userId = parsed.id || parsed.mobile || 'unknown_user';
                setUserRole(parsed.role || 'User');
                setDebugId(userId.slice(-4)); // Show last 4 chars for debug
            }
        } catch (e) {
            console.error("SingleTabEnforcer: Failed to parse user", e);
        }

        // If no user is logged in (shouldn't happen inside AuthGuard), return.
        if (userId === 'guest') return;

        const channelName = `tejaskp_ai_session_${userId}`;
        console.log(`[SingleTabEnforcer] Active on channel: ${channelName}`);

        // Helper for UUID generation that works in insecure contexts (HTTP)
        const generateUUID = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        const channel = new BroadcastChannel(channelName);
        const tabId = generateUUID();

        // Listen for messages
        channel.onmessage = (event) => {
            if (event.data.type === 'CHECK_TAB' && event.data.tabId !== tabId) {
                // Another tab checking in? We are alive.
                channel.postMessage({ type: 'TAB_ALIVE', tabId: tabId });
            } else if (event.data.type === 'TAB_ALIVE' && event.data.tabId !== tabId) {
                // Another tab is ALREADY alive? We are the duplicate.
                // DOUBLE CHECK: Is it really another tab for THIS user? Yes, channel is scoped.
                console.warn(`[SingleTabEnforcer] Duplicate session detected! My Tab: ${tabId}, Other Tab: ${event.data.tabId}`);
                setIsDuplicate(true);
            }
        };

        // Ask if anyone else is alive
        channel.postMessage({ type: 'CHECK_TAB', tabId: tabId });

        return () => {
            channel.close();
        };
    }, []);

    const handleSwitchUser = async () => {
        // 1. Clear Client Storage
        sessionStorage.clear();
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");

        // 2. Call Server Logout (Best Effort)
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error("Logout failed", e);
        }

        // 3. Force Hard Reload to Login
        window.location.href = '/login';
    };

    if (!isDuplicate) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="max-w-md w-full p-8 bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl relative overflow-hidden group">

                {/* Animated Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">

                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
                        <AlertOctagon className="w-10 h-10 text-red-500" />
                    </div>

                    {/* Text Content */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold font-orbitron text-white tracking-wider">
                            SESSION CONFLICT
                        </h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Your <strong>{userRole}</strong> account is already active in another tab.
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono">
                            Session ID: ...{debugId}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        {/* Action Button - Login Different User */}
                        <button
                            onClick={handleSwitchUser}
                            className="w-full px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Login as Different User
                        </button>

                        {/* simple reload */}
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
