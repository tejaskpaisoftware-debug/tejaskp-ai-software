"use client";

import { createContext, useContext, useEffect, useState } from "react";
import JarvisOverlay from "@/components/themes/JarvisOverlay";

// ... existing code ...
import { motion } from "framer-motion";

type Theme = "light" | "dark" | "snow" | "summer" | "rain" | "cloudy" | "spring" | "avengers";

import { RealisticRain } from "@/components/themes/RealisticRain";
import { SpringTheme } from "@/components/themes/SpringTheme";
import { AvengersTheme } from "@/components/themes/AvengersTheme";

// --- Cloud Component ---
function DraggableCloud({ initialX, initialY, scale = 1, delay = 0 }: any) {
    return (
        <motion.div
            drag
            dragMomentum={true}
            initial={{ x: initialX, y: initialY, opacity: 0 }}
            animate={{
                x: [initialX, typeof initialX === 'number' ? initialX + 50 : initialX, initialX],
                opacity: 0.9
            }}
            transition={{
                x: { repeat: Infinity, duration: 20, ease: "easeInOut", repeatType: "reverse", delay },
                opacity: { duration: 2 }
            }}
            className="absolute z-50 cursor-grab active:cursor-grabbing pointer-events-auto"
            style={{ scale }}
        >
            {/* Cloud Parts */}
            <div className="relative w-32 h-12">
                <div className="cloud-shape w-20 h-20 absolute -top-10 left-4" />
                <div className="cloud-shape w-24 h-24 absolute -top-12 left-10" />
                <div className="cloud-shape w-20 h-20 absolute -top-8 left-20" />
                <div className="cloud-shape w-full h-16 absolute top-0 left-0 rounded-full" />
            </div>
        </motion.div>
    )
}

import dynamic from "next/dynamic";

const MoonWidget = dynamic(
    () => import("@/components/themes/Theme3DWidgets").then(mod => mod.MoonWidget),
    { ssr: false }
);

const AngrySun = dynamic(
    () => import("@/components/themes/Theme3DWidgets").then(mod => mod.AngrySun),
    { ssr: false }
);

// --- Night Wind Component ---
function NightWind() {
    // Generate static random values for wind lines
    const windLines = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4, // 3-7s duration
        opacity: 0.2 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5
    }));

    return (
        <div className="weather-container">
            {/* Gradient Overlay for atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a1a] to-[#050505] -z-20 opacity-80" />

            {windLines.map((line) => (
                <div
                    key={line.id}
                    className="wind-line"
                    style={{
                        top: line.top,
                        animationDelay: `${line.delay}s`,
                        animationDuration: `${line.duration}s`,
                        opacity: line.opacity,
                        transform: `scale(${line.scale})`
                    }}
                />
            ))}
        </div>
    );
}

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    setLocalTheme: (theme: Theme | null) => void; // New: Local override
    isLoading: boolean;
    avengersCharacter: string;
    setAvengersCharacter: (char: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [globalTheme, setGlobalTheme] = useState<Theme>("light");
    const [localTheme, setLocalThemeState] = useState<Theme | null>(null); // Local override
    const [isLoading, setIsLoading] = useState(true);
    const [avengersCharacter, setAvengersCharacter] = useState("iron-man");

    // Effective theme is local if set, otherwise global
    const theme = localTheme || globalTheme;

    // Load Local Preference on Mount
    useEffect(() => {
        const stored = localStorage.getItem("user_theme_preference");
        if (stored) {
            setLocalThemeState(stored as Theme);
        }
    }, []);

    // Sync with Server Settings on Mount
    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.appTheme) {
                        console.log("🌍 [ThemeProvider] Loaded Global Theme:", data.appTheme);
                        setGlobalTheme(data.appTheme);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch global theme:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlobalSettings();
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        root.setAttribute("data-theme", theme);

        // Also add class for easier Tailwind styling if needed
        root.classList.remove("theme-light", "theme-dark", "theme-snow", "theme-summer", "theme-rain", "theme-cloudy", "theme-spring", "theme-avengers");
        root.classList.add(`theme-${theme}`);
        if (theme === 'avengers') {
            root.setAttribute("data-avenger", avengersCharacter);
        } else {
            root.removeAttribute("data-avenger");
        }

        // Standard Tailwind Dark Mode support
        if (theme === 'dark') {
            root.classList.add('dark');
            // HARD ENFORCEMENT: Bypass CSS variables temporarily to prove state
            root.style.backgroundColor = "#050505";
            root.style.color = "#ededed";
        } else {
            root.classList.remove('dark');
            // Reset to CSS variable control for other themes
            root.style.backgroundColor = "";
            root.style.color = "";
        }

    }, [theme, avengersCharacter]);

    const updateGlobalTheme = async (newTheme: Theme) => {
        console.log("🔄 [ThemeProvider] updateGlobalTheme called with:", newTheme);
        // Optimistic update
        setGlobalTheme(newTheme);

        try {
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appTheme: newTheme }),
            });
        } catch (error) {
            console.error("Failed to save theme:", error);
        }
    };

    const updateLocalTheme = (newTheme: Theme | null) => {
        console.log("🎨 [ThemeProvider] Setting Local Theme:", newTheme);
        setLocalThemeState(newTheme);
        if (newTheme) {
            localStorage.setItem("user_theme_preference", newTheme);
        } else {
            localStorage.removeItem("user_theme_preference");
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateGlobalTheme, setLocalTheme: updateLocalTheme, isLoading, avengersCharacter, setAvengersCharacter }}>
            {/* MAIN CONTENT LAYER - Hoisted above background weather */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Standard Tailwind Dark Mode support */}
            {theme === 'dark' && (
                <>
                    <MoonWidget />
                    <NightWind />
                </>
            )}

            {/* Jarvis Hologram Effects */}
            {theme === 'avengers' && avengersCharacter === 'iron-man' && (
                <JarvisOverlay />
            )}

            {/* Global Theme Effects - SPLIT LAYERS */}

            {/* 1. SNOW THEME */}
            {theme === "snow" && (
                <>
                    {/* BACK LAYER: Background Gradient & Falling Snow (Behinds Content) */}
                    <div className="weather-container">
                        {/* Semi-dark night sky gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 opacity-90 -z-10" />

                        <div className="weather-effect snow-bg z-0" />
                        <div className="weather-effect snow-mid z-0" />
                        <div className="weather-effect snow-fg z-0" />
                    </div>

                    {/* FRONT LAYER: Interactive Clouds (In Front of Content) */}
                    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                        <DraggableCloud initialX={100} initialY={50} scale={1.2} />
                        <DraggableCloud initialX={500} initialY={-20} scale={1.5} delay={2} />
                        <DraggableCloud initialX={900} initialY={80} scale={1} delay={4} />
                        <DraggableCloud initialX="80%" initialY={40} scale={1.3} delay={1} />
                    </div>
                </>
            )}

            {/* 2. RAIN THEME */}
            {theme === "rain" && (
                <RealisticRain />
            )}

            {/* 3. SUMMER THEME */}
            {theme === "summer" && (
                <>
                    <div className="weather-container">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#fff7e6] to-[#fffbf0] -z-10" />
                        {/* Static flare background */}
                        <div className="weather-effect sun-flare opacity-50" />
                    </div>

                    {/* Interactive Sun Widget (Foreground) */}
                    <AngrySun />
                </>
            )}

            {/* 4. CLOUDY THEME */}
            {theme === "cloudy" && (
                <div className="weather-container">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#bdc3c7] to-[#2c3e50] -z-10" />
                    <div className="weather-effect fog-layer" />
                </div>
            )}

            {/* 5. SPRING THEME */}
            {theme === "spring" && (
                <SpringTheme />
            )}

            {/* 6. AVENGERS THEME */}
            {theme === "avengers" && (
                <AvengersTheme character={avengersCharacter as any} />
            )}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
