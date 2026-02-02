"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvengersThemeProps {
    character: "iron-man" | "spider-man" | "captain-america" | "thor" | "hulk" | "black-widow";
}

export function AvengersTheme({ character }: AvengersThemeProps) {
    const [isBooted, setIsBooted] = useState(character !== "iron-man");
    const [playBootSound, setPlayBootSound] = useState(false);

    useEffect(() => {
        // Reset boot state when character changes to Iron Man
        if (character === "iron-man") {
            setIsBooted(false);
        } else {
            setIsBooted(true);
        }
    }, [character]);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [voiceError, setVoiceError] = useState("");

    // Spider-Man Interaction State
    const [spiderClickCount, setSpiderClickCount] = useState(0);
    const [isSwinging, setIsSwinging] = useState(false);

    const handleSpiderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Trigger 3D Spin visually
        const target = e.currentTarget;
        // Simple 360 spin effect
        target.animate([
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(360deg)' }
        ], { duration: 1000, easing: 'ease-in-out' });

        // Logic for 3-Click Swing
        const newCount = spiderClickCount + 1;
        setSpiderClickCount(newCount);

        if (newCount >= 3) {
            console.log("🕸️ THWIP! Swinging started!");
            const audio = new Audio("https://www.myinstants.com/media/sounds/thwip_1.mp3"); // Classic Thwip sound
            audio.volume = 0.6;
            audio.play().catch(() => { });

            setIsSwinging(true);
            setSpiderClickCount(0);

            // Reset after animation matches duration
            setTimeout(() => {
                setIsSwinging(false);
            }, 6000);
        }
    };

    const handleReactorClick = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1659/1659-preview.mp3"); // Sci-fi power up sound
        audio.volume = 0.5;
        audio.play().catch(() => { });
        setPlayBootSound(true);
        setVoiceError(""); // Reset error

        // Start Voice Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsListening(true);
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                const command = event.results[0][0].transcript.toLowerCase();
                setTranscript(command);
                console.log("🎤 Voice Command:", command);

                if (command.includes("dashboard") || command.includes("home")) {
                    window.location.href = "/";
                } else if (command.includes("settings") || command.includes("config")) {
                    window.location.href = "/dashboard/admin/settings";
                }
                else if (command.includes("profile")) {
                    // specific route if needed, else stay
                }

                // Unlock after command or default
                setTimeout(() => {
                    setIsListening(false);
                    setIsBooted(true);
                }, 1000);
            };

            recognition.onerror = (event: any) => {
                console.warn("Speech recognition (expected if offline/unsupported):", event.error);
                setVoiceError("VOICE OFFLINE - MANUAL BYPASS");
                setIsListening(false);
                setTimeout(() => setIsBooted(true), 1500);
            };

            recognition.start();
        } else {
            // Fallback for non-supported browsers
            setVoiceError("VOICE UNAVAILABLE");
            setTimeout(() => setIsBooted(true), 1000);
        }
    };

    // This component will handle the visual theming for the selected character
    return (
        <div className={`fixed inset-0 z-0 overflow-hidden ${!isBooted ? "z-50 bg-black" : "pointer-events-none"}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={character}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Character Specific Backgrounds */}
                    {character === "iron-man" && (
                        <div className="w-full h-full relative">
                            {/* LOCKED STATE: Full Screen Reactor Overlay */}
                            {!isBooted && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000">
                                    <button
                                        onClick={handleReactorClick}
                                        className="relative group cursor-pointer pointer-events-auto transform hover:scale-105 transition-transform duration-300"
                                    >
                                        {/* Glow Layer */}
                                        <div className={`absolute inset-0 bg-cyan-500 blur-[60px] opacity-20 group-hover:opacity-40 animate-pulse rounded-full ${isListening ? "bg-red-500 opacity-50 duration-75" : ""}`} />

                                        {/* Arc Reactor CSS Implementation */}
                                        <div className={`w-64 h-64 rounded-full border-4 ${isListening ? "border-red-500 shadow-[0_0_80px_red]" : "border-cyan-900/50 shadow-[0_0_50px_rgba(6,182,212,0.5)]"} bg-black/80 flex items-center justify-center relative transition-all duration-300`}>
                                            {/* Outer Ring with lights */}
                                            <div className={`absolute inset-2 rounded-full border ${isListening ? "border-red-500/50" : "border-cyan-500/30"}`}>
                                                {[...Array(8)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`absolute w-3 h-3 rounded-full shadow-[0_0_10px_#22d3ee] ${isListening ? "bg-red-400 shadow-red-500" : "bg-cyan-200"}`}
                                                        style={{
                                                            top: '50%', left: '50%',
                                                            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-110px)`
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Inner Ring (Triangle shape hint) */}
                                            <div className={`w-40 h-40 border-[6px] ${isListening ? "border-red-400 shadow-red-500 bg-red-900/20" : "border-cyan-400 shadow-[0_0_20px_#06b6d4] bg-cyan-900/10"} rounded-full flex items-center justify-center relative transition-all duration-300`}>
                                                <div className="absolute inset-0 border border-white/20 rounded-full animate-spin-slow" />
                                                <div className={`w-24 h-24 bg-gradient-to-br ${isListening ? "from-white via-red-200 to-red-600 shadow-red-500" : "from-white via-cyan-200 to-cyan-500 shadow-[0_0_40px_white]"} rounded-full animate-pulse transition-all duration-300`} />
                                            </div>
                                        </div>
                                        <div className={`absolute -bottom-24 left-1/2 -translate-x-1/2 font-mono tracking-[0.2em] text-lg animate-pulse whitespace-nowrap ${voiceError ? "text-red-600 font-bold" : (isListening ? "text-red-500" : "text-cyan-500")}`}>
                                            {voiceError ? voiceError : (isListening ? `LISTENING... ${transcript ? `"${transcript}"` : ""}` : "CLICK TO INITIALIZE")}
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* UNLOCKED STATE: HUD Background */}
                            <div className={`w-full h-full bg-gradient-to-br from-[#1a0505] via-[#2c0b0b] to-[#1a0505] transition-all duration-1000 ${isBooted ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}>
                                {/* HUD Overlay */}
                                <div className="absolute inset-0 border-[20px] border-yellow-600/20 rounded-[40px] m-6 pointer-events-none" />

                                {/* HUD Circles */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full opacity-50 animate-[spin_10s_linear_infinite]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-cyan-500/10 rounded-full opacity-30 animate-[spin_15s_linear_infinite_reverse]" />

                                <div className="absolute bottom-10 right-10 text-yellow-500/20 font-mono text-4xl font-bold tracking-[1em]">JARVIS.OS</div>

                                {/* Decorative HUD lines */}
                                <div className="absolute top-20 left-10 w-64 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                                <div className="absolute bottom-20 right-10 w-64 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                            </div>
                        </div>
                    )}

                    {character === "spider-man" && (
                        <div className="w-full h-full bg-gradient-to-br from-red-800 via-blue-900 to-red-900 relative overflow-hidden">
                            {/* Web Pattern Overlay */}
                            <div className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, transparent 20%, #fff 21%, transparent 22%), 
                                                      conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 15deg, #fff 16deg, transparent 17deg, transparent 30deg, #fff 31deg, transparent 32deg)`
                                }}
                            />
                            <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-blue-500/10 blur-3xl" />

                            {/* --- SPIDER-MAN 3D INTERACTIVE MODELS --- */}

                            {/* MODEL 1: Iron Spider (Latest Tech) - Floating Right */}
                            <motion.div
                                className="absolute top-1/2 right-10 w-80 h-auto z-[60] cursor-pointer perspective-1000 pointer-events-auto"
                                initial={{ y: -20, rotateY: 0 }}
                                animate={{ y: 20 }}
                                transition={{
                                    y: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                                }}
                                whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
                                onClick={(e) => {
                                    // Trigger 3D Spin
                                    const target = e.currentTarget;
                                    target.style.transition = "transform 1s ease-in-out";
                                    target.style.transform = target.style.transform === "rotateY(360deg)" ? "rotateY(0deg)" : "rotateY(360deg)";
                                }}
                            >
                                <motion.img
                                    src="https://pngimg.com/d/spider_man_PNG87.png"
                                    alt="Iron Spider 3D Model"
                                    className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter contrast-125"
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    whileTap={{ rotateY: 180, scale: 0.9 }}
                                // "Not like poster" -> Add strong shadow and interaction
                                />
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-cyan-400 font-mono text-sm tracking-widest opacity-70 bg-black/50 px-2 rounded backdrop-blur-sm">
                                    IRON SPIDER <br /> MK-50
                                </div>
                            </motion.div>

                            {/* MODEL 2: Upgraded Suit (Far From Home) - Standing Left -> Becomes Swinging on Trigger */}
                            <motion.div
                                className="absolute z-[60] cursor-pointer pointer-events-auto"
                                initial={{ opacity: 0, x: -100, bottom: 40, left: 40 }}
                                // Conditional Animation: Static vs Swinging
                                animate={isSwinging ? {
                                    x: [0, window.innerWidth + 200], // Fly across screen
                                    y: [0, -400, -100, -600], // Arc motion
                                    rotate: [0, 15, 45, 60],
                                    scale: [1, 0.8, 0.6, 0.5],
                                    opacity: [1, 1, 1, 0]
                                } : {
                                    opacity: 1,
                                    x: 0,
                                    y: 0,
                                    rotate: 0,
                                    scale: 1,
                                    bottom: 40,
                                    left: 40
                                }}
                                transition={isSwinging ? {
                                    duration: 4,
                                    ease: "easeInOut",
                                    times: [0, 1]
                                } : { duration: 1 }}
                                whileHover={!isSwinging ? { scale: 1.05 } : {}}
                                onClick={handleSpiderClick}
                            >
                                <motion.img
                                    src="https://pngimg.com/d/spider_man_PNG10.png"
                                    alt="Upgraded Suit 3D Model"
                                    className="w-72 drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                                // Remove local animate/whileTap to let parent control motion during swing
                                />
                                {/* Web Line Visual (Only when swinging) */}
                                {isSwinging && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 2000, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute -top-[20px] right-20 w-1 bg-white/80 blur-[1px] origin-bottom -rotate-45"
                                        style={{ transformOrigin: "bottom center" }}
                                    />
                                )}

                                {!isSwinging && (
                                    <div className="absolute top-1/2 -right-20 text-red-500 font-mono text-xs tracking-widest -rotate-90 origin-left opacity-60 bg-black/50 px-2 rounded backdrop-blur-sm">
                                        ADVANCED SUIT <br /> SYSTEM ACTIVE
                                    </div>
                                )}
                            </motion.div>

                        </div>
                    )}

                    {character === "captain-america" && (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-800 to-red-900">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[50px] border-red-600/20 rounded-full" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[50px] border-white/10 rounded-full" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-600/20 rounded-full blur-xl" />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
