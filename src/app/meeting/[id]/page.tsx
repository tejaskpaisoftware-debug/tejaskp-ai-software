"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function MeetingRoom({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: meetingId } = use(params);

    useEffect(() => {
        // Construct the secure meeting URL
        // meet.ffmuc.net is a reliable, open, HTTPS-enabled Jitsi instance
        const meetingUrl = `https://meet.ffmuc.net/${meetingId}`;

        // Automatically redirect to the secure meeting room
        // Using window.location.href ensures we move to the HTTPS context of the provider,
        // which solves "WebRTC not available" errors that occur in HTTP/iframe contexts.
        const timer = setTimeout(() => {
            window.location.href = meetingUrl;
        }, 1500); // 1.5s delay to show the "Joining" message

        return () => clearTimeout(timer);
    }, [meetingId]);

    const manualJoin = () => {
        const meetingUrl = `https://meet.ffmuc.net/${meetingId}`;
        window.location.href = meetingUrl;
    };

    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>

            <div className="z-10 flex flex-col items-center max-w-md w-full">
                <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 bg-gold-theme/20 rounded-full animate-ping"></div>
                    <div className="relative z-10 w-full h-full bg-black border-2 border-gold-theme rounded-full flex items-center justify-center">
                        <span className="text-4xl">📹</span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Joining Secure Meeting...</h1>
                <p className="text-gray-400 text-sm mb-8">
                    Redirecting you to the secure meeting room. Connection is encrypted.
                </p>

                <div className="flex flex-col gap-4 w-full">
                    <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                        <div className="h-full bg-gold-theme animate-indetermiate-bar w-1/3 rounded-full"></div>
                    </div>

                    <button
                        onClick={manualJoin}
                        className="mt-4 w-full bg-gold-theme text-black font-bold py-3 rounded-lg shadow-lg hover:bg-gold-theme/90 transition-all flex items-center justify-center gap-2"
                    >
                        Click here if not redirected
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 text-sm hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes indeterminate-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                .animate-indetermiate-bar {
                    animation: indeterminate-bar 1.5s infinite linear;
                }
            `}</style>
        </div>
    );
}
