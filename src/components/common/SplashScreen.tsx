"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface SplashScreenProps {
    user: {
        id: string;
        name: string;
        photoUrl?: string; // Optional if you pass it
        role?: string;
    };
    onFinish: () => void;
}

export default function SplashScreen({ user, onFinish }: SplashScreenProps) {
    const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch AI Quote
        const fetchQuote = async () => {
            try {
                const res = await fetch('/api/ai/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: user.name,
                        role: user.role || 'Employee',
                        image: user.photoUrl // Send photo for visual analysis
                    })
                });
                const data = await res.json();
                setQuote(data);
            } catch (e) {
                console.error("Failed to fetch quote", e);
                setQuote({ quote: "Ready to achieve greatness today.", author: "TejasKP AI" });
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();

        // Auto dismiss after 4.5 seconds (giving enough time to read)
        const timer = setTimeout(() => {
            onFinish();
        }, 4500);

        return () => clearTimeout(timer);
    }, [user, onFinish]);

    // Derived photo URL (handle null/undefined)
    const photoUrl = user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white px-4 overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
                {/* Floating particles or grid could go here */}
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-10 perspective-[1000px]">

                {/* Photo with Ring Animation */}
                <motion.div
                    initial={{ scale: 0.5, rotateX: 90, opacity: 0 }}
                    animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                    transition={{ duration: 1, type: "spring", bounce: 0.5 }}
                    className="relative preserve-3d"
                >
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-br from-gold-400 via-yellow-200 to-gold-700 shadow-[0_0_60px_rgba(234,179,8,0.5)] relative z-20">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-black relative">
                            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            {/* Gloss effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                        </div>
                    </div>
                    {/* 3D Ring Glow */}
                    <div className="absolute inset-0 rounded-full bg-gold-500/30 blur-md transform translate-z-[-20px] scale-110" />

                    {/* Floating Icons */}
                    <motion.div
                        animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -top-4 -right-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] z-30"
                    >
                        <Sparkles size={40} fill="currentColor" className="text-gold-300" />
                    </motion.div>
                </motion.div>

                {/* Welcome Text */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="space-y-2"
                >
                    <h2 className="text-gold-500/80 uppercase tracking-[0.3em] text-xs font-bold font-orbitron">INITIALIZING DASHBOARD...</h2>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-orbitron drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                        {user.name.toUpperCase()}
                    </h1>
                </motion.div>

                {/* AI Quote / Greeting Card */}
                <div className="w-full max-w-3xl min-h-[120px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-2"
                            >
                                <div className="w-3 h-3 bg-gold-500 rounded-full animate-bounce shadow-[0_0_10px_orange]" />
                                <div className="w-3 h-3 bg-gold-500 rounded-full animate-bounce delay-75 shadow-[0_0_10px_orange]" />
                                <div className="w-3 h-3 bg-gold-500 rounded-full animate-bounce delay-150 shadow-[0_0_10px_orange]" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="quote"
                                initial={{ opacity: 0, rotateX: -20, y: 20 }}
                                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="glass-panel px-10 py-6 rounded-2xl text-center transform hover:scale-105 transition-transform duration-500 border-white/5"
                            >
                                <p className="text-xl md:text-2xl font-light text-white/90 leading-relaxed font-orbitron tracking-wide">
                                    "{(quote as any)?.quote || (quote as any)?.greeting || (quote as any)?.text || "Welcome back! Ready to make today count?"}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Loading Bar */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-1 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 shadow-[0_0_10px_orange]"
                />
            </div>
        </motion.div>
    );
}
