"use client";

import React, { useEffect, useState } from 'react';

export default function JarvisOverlay() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden font-orbitron text-cyan-400 select-none">

            {/* --- BACKGROUND VIGNETTE --- */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000000_90%)] z-0"></div>

            {/* --- CENTRAL IRON MAN WIREFRAME SVG --- */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 w-[600px] h-[700px] z-0 pointer-events-none">
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,234,255,0.5)]">
                    <defs>
                        <linearGradient id="hologram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00eaff" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#004cff" stopOpacity="0.3" />
                        </linearGradient>
                        <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
                            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(0, 234, 255, 0.2)" strokeWidth="0.1" />
                        </pattern>
                    </defs>

                    {/* Simplified Tech Mask Wireframe */}
                    {/* Jaw */}
                    <path d="M 30,80 L 40,105 L 60,105 L 70,80 L 65,70 L 35,70 Z" fill="url(#grid)" stroke="#00eaff" strokeWidth="0.5" className="animate-pulse" />

                    {/* Face Plate */}
                    <path d="M 20,30 L 80,30 L 85,60 L 70,80 L 30,80 L 15,60 Z" fill="none" stroke="#00eaff" strokeWidth="0.8" />

                    {/* Eyes */}
                    <path d="M 25,45 L 45,45 L 45,50 L 25,48 Z" fill="#cffafe" className="animate-pulse drop-shadow-[0_0_5px_#fff]" />
                    <path d="M 55,45 L 75,45 L 75,48 L 55,50 Z" fill="#cffafe" className="animate-pulse drop-shadow-[0_0_5px_#fff]" />

                    {/* Forehead Details */}
                    <path d="M 35,30 L 35,10 L 65,10 L 65,30" fill="none" stroke="#00eaff" strokeWidth="0.5" />
                    <circle cx="50" cy="20" r="5" fill="none" stroke="orange" strokeWidth="0.5" strokeDasharray="2 1" className="animate-[spin_10s_linear_infinite]" />

                    {/* Neck Assembly */}
                    <path d="M 40,105 L 40,115 M 60,105 L 60,115" stroke="#00eaff" strokeWidth="0.5" />
                    <path d="M 20,115 L 80,115" stroke="#00eaff" strokeWidth="0.5" strokeDasharray="1 2" />

                </svg>
            </div>


            {/* --- LEFT HUD: JARVIS ROTATING CIRCLE --- */}
            <div className="absolute bottom-20 left-10 w-64 h-64 z-20">
                {/* Outer Scale Ring */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/30 border-dashed animate-[spin_60s_linear_infinite]"></div>

                {/* Thick Progress Ring */}
                <div className="absolute inset-4 rounded-full border-[6px] border-cyan-400/20 border-t-cyan-400 border-l-cyan-400 animate-[spin_5s_linear_infinite]"></div>

                {/* Inner Detail Ring */}
                <div className="absolute inset-8 rounded-full border border-orange-500/40 border-b-transparent animate-[spin_10s_linear_infinite_reverse]"></div>

                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <h2 className="text-3xl font-bold text-cyan-100 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,234,255,0.8)]">JARVIS</h2>
                    <span className="text-[10px] text-cyan-600">ONLINE</span>
                </div>
            </div>


            {/* --- RIGHT HUD: SYSTEM STATS --- */}
            <div className="absolute top-1/4 right-10 w-64 flex flex-col gap-6 z-20 text-right">

                {/* Clock Block */}
                <div className="border-r-4 border-orange-500 pr-4">
                    <h1 className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{time.split(':')[0]}:{time.split(':')[1]}</h1>
                    <span className="text-xl text-orange-400">{time.split(':')[2]}</span>
                    <div className="text-[10px] text-cyan-500 mt-1 uppercase tracking-widest">Mark 85 System Time</div>
                </div>

                {/* Stats Panel */}
                <div className="bg-cyan-950/30 border border-cyan-500/30 p-4 clip-corner-right backdrop-blur-sm">
                    <h3 className="text-sm text-cyan-400 border-b border-cyan-500/30 pb-1 mb-2">SYSTEM INTEGRITY</h3>

                    <div className="flex justify-between text-xs text-cyan-200 mb-1">
                        <span>ARMOR</span>
                        <span className="text-cyan-400">100%</span>
                    </div>
                    <div className="h-1 w-full bg-cyan-900/50 mb-3"><div className="h-full w-full bg-cyan-400 shadow-[0_0_5px_#00eaff]"></div></div>

                    <div className="flex justify-between text-xs text-cyan-200 mb-1">
                        <span>POWER</span>
                        <span className="text-orange-400">400%</span>
                    </div>
                    <div className="h-1 w-full bg-cyan-900/50 mb-3"><div className="h-full w-[85%] bg-orange-400 shadow-[0_0_5px_orange]"></div></div>

                    <div className="flex justify-between text-xs text-cyan-200 mb-1">
                        <span>ARC REACTOR</span>
                        <span className="text-green-400">STABLE</span>
                    </div>
                </div>

                {/* Spinning Globe Wireframe (Simulated) */}
                <div className="w-32 h-32 self-end border border-cyan-500/20 rounded-full relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00eaff_3px)] opacity-20 animate-pan-y"></div>
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,#00eaff_11px)] opacity-20 rounded-full"></div>
                </div>
            </div>

            {/* --- DECORATIVE CONNECTORS --- */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                {/* Lines connecting center to sides */}
                <path d="M 500,400 L 300,700" stroke="#00eaff" strokeWidth="1" fill="none" strokeDasharray="5 5" className="hidden lg:block" />
                <path d="M 900,400 L 1200,700" stroke="#00eaff" strokeWidth="1" fill="none" strokeDasharray="5 5" className="hidden lg:block" />
                <circle cx="50%" cy="50%" r="350" stroke="#00eaff" strokeWidth="0.5" fill="none" strokeOpacity="0.1" />
            </svg>

            <style jsx>{`
                .clip-corner-right {
                    clip-path: polygon(100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 0);
                }
                @keyframes pan-y {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 20px; }
                }
            `}</style>
        </div>
    );
}
