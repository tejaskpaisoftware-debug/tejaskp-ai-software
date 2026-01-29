"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Check, Cloud, Moon, Sun, Snowflake, CloudRain, Flower2, Umbrella, Shield, Aperture, Bug } from "lucide-react";
import { useState } from "react";

const themes = [
    {
        id: "light",
        name: "Light Mode",
        description: "Clean and bright",
        icon: Sun,
        color: "bg-white",
        textColor: "text-gray-900",
    },
    {
        id: "dark",
        name: "Dark Mode",
        description: "Easy on the eyes",
        icon: Moon,
        color: "bg-neutral-900",
        textColor: "text-white",
    },
    {
        id: "snow",
        name: "Snow Theme",
        description: "Winter wonderland with falling snow",
        icon: Snowflake,
        color: "bg-blue-50",
        textColor: "text-blue-900",
    },
    {
        id: "summer",
        name: "Summer Theme",
        description: "Warm and sunny vibes",
        icon: Sun,
        color: "bg-orange-50",
        textColor: "text-orange-900",
    },
    {
        id: "rain",
        name: "Rain Theme",
        description: "Calm raining ambiance",
        icon: CloudRain,
        color: "bg-slate-200",
        textColor: "text-slate-800",
    },
    {
        id: "cloudy",
        name: "Cloudy Theme",
        description: "Soft and overcast",
        icon: Cloud,
        color: "bg-gray-200",
        textColor: "text-gray-800",
    },
    {
        id: "spring",
        name: "Spring Theme",
        description: "Fresh and blooming",
        icon: Flower2,
        color: "bg-green-50",
        textColor: "text-green-900",
    },
    {
        id: "avengers",
        name: "Avengers Initiative",
        description: "Assemble your favorite hero",
        icon: Shield,
        color: "bg-red-50",
        textColor: "text-red-900",
    },
];

export default function SettingsPage() {
    const { theme, setTheme, setLocalTheme, isLoading, setAvengersCharacter } = useTheme() as any; // Cast to access new props safely
    const [saving, setSaving] = useState(false);
    const [showHeroModal, setShowHeroModal] = useState(false);

    const handleThemeChange = async (newTheme: any) => {
        console.log("🖱️ Theme Config Clicked:", newTheme);

        if (newTheme === "avengers") {
            setShowHeroModal(true);
            return;
        }

        setSaving(true);
        // Clear local override so Admin sees the Global change immediately
        setLocalTheme(null);

        try {
            await setTheme(newTheme);
            console.log("✅ Theme State Updated via Context:", newTheme);
        } catch (e) {
            console.error("❌ Error setting theme:", e);
        } finally {
            setSaving(false);
        }
    };

    const selectHero = async (hero: string) => {
        setAvengersCharacter(hero);
        setShowHeroModal(false);
        setSaving(true);
        try {
            await setTheme("avengers");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-foreground relative z-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage global application settings and themes.
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Global Theme</h2>
                    {isLoading && <span className="text-sm text-yellow-500">Syncing...</span>}
                    {saving && <span className="text-sm text-blue-500">Saving...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;

                        return (
                            <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                className={`
                  relative group flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]
                  ${isActive
                                        ? "border-blue-500 shadow-xl ring-2 ring-blue-500/20"
                                        : "border-transparent hover:border-gray-200 shadow-md"}
                  ${t.color}
                `}
                            >
                                {isActive && (
                                    <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}

                                <div className={`p-4 rounded-full bg-white/50 mb-4 ${t.textColor}`}>
                                    <Icon className="w-8 h-8" />
                                </div>

                                <h3 className={`text-lg font-bold ${t.textColor}`}>{t.name}</h3>
                                <p className={`text-sm opacity-70 mt-1 ${t.textColor}`}>
                                    {t.description}
                                </p>

                                {/* Preview Elements */}
                                <div className="mt-4 w-full h-16 rounded-lg bg-white/30 flex items-center justify-center space-x-2">
                                    <div className="w-8 h-2 rounded bg-current opacity-20"></div>
                                    <div className="w-16 h-2 rounded bg-current opacity-40"></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hero Selection Modal */}
            {showHeroModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/20">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">CHOOSE YOUR HERO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Iron Man */}
                            <button
                                onClick={() => selectHero("iron-man")}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-yellow-500 p-1 hover:scale-105 transition-all"
                            >
                                <div className="bg-black/20 absolute inset-0 group-hover:bg-transparent transition-colors" />
                                <div className="relative bg-slate-900/90 h-full rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                                    <Aperture className="w-12 h-12 text-cyan-400 animate-pulse" />
                                    <span className="text-yellow-500 font-bold tracking-widest">IRON MAN</span>
                                </div>
                            </button>

                            {/* Spider Man */}
                            <button
                                onClick={() => selectHero("spider-man")}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-blue-600 p-1 hover:scale-105 transition-all"
                            >
                                <div className="bg-black/20 absolute inset-0 group-hover:bg-transparent transition-colors" />
                                <div className="relative bg-slate-900/90 h-full rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                                    <Bug className="w-12 h-12 text-red-500" />
                                    <span className="text-red-500 font-bold tracking-widest">SPIDER-MAN</span>
                                </div>
                            </button>

                            {/* Captain America */}
                            <button
                                onClick={() => selectHero("captain-america")}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 to-red-600 p-1 hover:scale-105 transition-all"
                            >
                                <div className="bg-black/20 absolute inset-0 group-hover:bg-transparent transition-colors" />
                                <div className="relative bg-slate-900/90 h-full rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                                    <Shield className="w-12 h-12 text-blue-400" />
                                    <span className="text-blue-400 font-bold tracking-widest">CAPTAIN</span>
                                </div>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowHeroModal(false)}
                            className="mt-8 w-full py-3 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel Mission
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
