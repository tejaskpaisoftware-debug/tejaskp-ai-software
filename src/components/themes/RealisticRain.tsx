"use client";

import { useEffect, useState, useRef } from "react";

interface Droplet {
    id: number;
    left: number;
    delay: number;
    duration: number;
    opacity: number;
}

export function RealisticRain() {
    const [droplets, setDroplets] = useState<Droplet[]>([]);

    const [isLightning, setIsLightning] = useState(false);

    const [lightningPos, setLightningPos] = useState({ left: 50, scale: 1, rotation: 0 });

    // Audio Refs
    const rainAudioRef = useRef<HTMLAudioElement | null>(null);
    const thunderAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio
        // Switched to a "light rain on leaves/window" sound for distinct droplets
        rainAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3");
        rainAudioRef.current.loop = true;
        rainAudioRef.current.volume = 0.5; // Slightly louder to hear the droplets

        // Switched to a louder, more immediate thunder crack
        thunderAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2034/2034-preview.mp3");
        thunderAudioRef.current.volume = 1.0; // Max volume for thunder

        // Attempt to play rain immediately
        rainAudioRef.current.play().catch(e => console.log("Audio play failed (autoplay policy):", e));

        // Create a fixed number of droplets
        const count = 100;
        const newDroplets = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // Random horizontal position 0-100%
            delay: Math.random() * 2, // Random start delay
            duration: 2.5 + Math.random() * 1.5, // Slower fall duration (2.5s to 4s)
            opacity: 0.1 + Math.random() * 0.2, // Lower opacity for better transparency
        }));
        setDroplets(newDroplets);

        // Thunderstorm logic: Flash every 7 seconds
        const thunderInterval = setInterval(() => {
            triggerLightning();
        }, 7000);

        return () => {
            clearInterval(thunderInterval);
            if (rainAudioRef.current) {
                rainAudioRef.current.pause();
                rainAudioRef.current = null;
            }
            if (thunderAudioRef.current) {
                thunderAudioRef.current.pause();
                thunderAudioRef.current = null;
            }
        };
    }, []);

    const triggerLightning = () => {
        // Randomize position for the bolt
        setLightningPos({
            left: 20 + Math.random() * 60, // Keep more central (20%-80%)
            scale: 0.8 + Math.random() * 0.5,
            rotation: -10 + Math.random() * 20
        });

        // Play Thunder Sound Immediately
        if (thunderAudioRef.current) {
            thunderAudioRef.current.currentTime = 0; // Reset to start
            // Play returns a promise, we handle error
            const playPromise = thunderAudioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log("Thunder play failed:", e));
            }
        }

        setIsLightning(true);

        // Double flash effect
        setTimeout(() => setIsLightning(false), 100);
        setTimeout(() => setIsLightning(true), 150);
        setTimeout(() => setIsLightning(false), 300);
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Dark Moody Background for Rain Theme */}
            <div className={`absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 opacity-90 -z-10 transition-colors duration-100 ${isLightning ? "bg-slate-700 brightness-150" : ""}`} />

            {/* Lightning Flash Overlay */}
            <div className={`fixed inset-0 z-10 bg-white pointer-events-none mix-blend-overlay transition-opacity duration-75 ${isLightning ? "opacity-30" : "opacity-0"}`} />

            {/* Visible Lightning Bolt SVG */}
            {isLightning && (
                <div
                    className="absolute top-0 z-0 pointer-events-none opacity-90"
                    style={{
                        left: `${lightningPos.left}%`,
                        transform: `translateX(-50%) scale(${lightningPos.scale}) rotate(${lightningPos.rotation}deg)`,
                        filter: "drop-shadow(0 0 20px rgba(200, 220, 255, 0.8))"
                    }}
                >
                    <svg width="300" height="500" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M60 0L30 80H50L20 200L80 90H50L90 0H60Z"
                            fill="white"
                            className="lightning-bolt"
                        />
                    </svg>
                </div>
            )}

            {/* Rain Container */}
            <div className="absolute inset-0 w-full h-full">
                {droplets.map((droplet) => (
                    <div
                        key={droplet.id}
                        className="absolute top-[-100px] w-[1px] h-[80px] rounded-full bg-gradient-to-b from-transparent via-blue-50/10 to-blue-100/20"
                        style={{
                            left: `${droplet.left}%`,
                            opacity: droplet.opacity,
                            animation: `rainfall ${droplet.duration}s linear infinite`,
                            animationDelay: `-${droplet.delay}s`,
                            boxShadow: "0 0 2px rgba(255, 255, 255, 0.1)" // Subtle glow only
                        }}
                    >
                        {/* Optional: Small "head" for the droplet to make it look like water */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[4px] bg-white/30 rounded-full blur-[0.5px]" />
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes rainfall {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(120vh);
                    }
                }
            `}</style>
        </div>
    );
}
