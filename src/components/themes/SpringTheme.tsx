"use client";

import { useEffect, useState } from "react";
import { Flower2 } from "lucide-react";

interface Particle {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    rotationDuration: number;
}

export function SpringTheme() {
    const [flowers, setFlowers] = useState<Particle[]>([]);

    useEffect(() => {
        // Create falling flowers
        const count = 30;
        const newFlowers = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 20, // Spread out more
            duration: 15 + Math.random() * 15, // Slower for flow
            size: 16 + Math.random() * 24, // Size 16px - 40px
            rotationDuration: 5 + Math.random() * 10,
        }));
        setFlowers(newFlowers);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Spring Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 -z-20 opacity-80" />

            {/* Trees Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full h-auto flex items-end justify-between px-4 -z-10 opacity-90 pointer-events-none">
                {/* Tree 1 (Left - Large Sakura) */}
                <div className="w-[30vw] min-w-[300px] h-auto transform -translate-x-10 translate-y-10">
                    <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-lg">
                        {/* Trunk */}
                        <path d="M100,300 Q110,250 105,200 Q90,150 100,100" stroke="#5d4037" strokeWidth="15" fill="none" />
                        <path d="M100,200 Q130,170 140,140" stroke="#5d4037" strokeWidth="10" fill="none" />
                        <path d="M100,150 Q70,120 60,100" stroke="#5d4037" strokeWidth="8" fill="none" />

                        {/* Foliage (Pink Clouds) */}
                        <path d="M50,120 Q30,100 50,80 Q70,60 90,80 Q110,60 130,80 Q150,100 130,120 Q150,140 130,160 Q110,180 90,160 Q70,180 50,160 Q30,140 50,120 Z" fill="#fbcfe8" opacity="0.9" />
                        <path d="M80,90 Q70,70 90,60 Q110,50 120,70 Q140,50 150,70 Q160,90 140,110 Z" fill="#f9a8d4" opacity="0.8" />
                        <path d="M60,140 Q40,120 60,100 Q80,120 100,110 Q120,130 100,150 Z" fill="#fce7f3" opacity="0.8" />
                    </svg>
                </div>

                {/* Tree 2 (Right - Medium Sakura) */}
                <div className="w-[25vw] min-w-[250px] h-auto transform translate-x-10 translate-y-5 scale-x-[-1]">
                    <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-md">
                        {/* Trunk */}
                        <path d="M100,300 C120,250 90,150 100,100" stroke="#4e342e" strokeWidth="12" fill="none" />
                        <path d="M100,180 Q130,140 140,120" stroke="#4e342e" strokeWidth="8" fill="none" />

                        {/* Foliage */}
                        <ellipse cx="100" cy="100" rx="60" ry="50" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="70" cy="80" r="30" fill="#f9a8d4" opacity="0.8" />
                        <circle cx="130" cy="80" r="35" fill="#fce7f3" opacity="0.8" />
                        <circle cx="100" cy="60" r="40" fill="#f472b6" opacity="0.6" />
                    </svg>
                </div>
            </div>

            {/* Falling Flowers */}
            <div className="absolute inset-0 w-full h-full">
                {flowers.map((fl, i) => (
                    <div
                        key={fl.id}
                        className="absolute -top-10 text-pink-400/60"
                        style={{
                            left: `${fl.left}%`,
                            width: fl.size,
                            height: fl.size,
                            animation: `${i % 2 === 0 ? "flowerFlow" : "flowerFall"} ${fl.duration}s linear infinite, flowerSway 4s ease-in-out infinite alternate`,
                            animationDelay: `-${fl.delay}s`,
                        }}
                    >
                        <Flower2
                            size={fl.size}
                            className={`${i % 2 === 0 ? "text-pink-500/60" : "text-rose-400/60"} fill-pink-200/40`}
                            style={{
                                animation: `spin ${fl.rotationDuration}s linear infinite`
                            }}
                        />
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes flowerFall {
                    0% {
                        transform: translate(0, -10vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                         opacity: 1;
                    }
                    90% {
                         opacity: 0.8;
                    }
                    100% {
                        transform: translate(20vw, 110vh) rotate(180deg); /* Drift right + down */
                        opacity: 0;
                    }
                }
                @keyframes flowerFlow {
                    0% {
                        transform: translate(-10vw, -10vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(110vw, 40vh) rotate(360deg); /* Strong wind flow across screen */
                        opacity: 0;
                    }
                }
                @keyframes flowerSway {
                    0% {
                        margin-left: -20px;
                    }
                    100% {
                         margin-left: 20px;
                    }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
