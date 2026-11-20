"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Check, Cloud, Moon, Sun, Snowflake, CloudRain, Flower2, Umbrella, Shield, Aperture, Bug, Settings, Sliders, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const themes = [
    {
        id: "light",
        name: "Light Mode",
        description: "Clean, crisp, and bright default theme",
        icon: Sun,
        color: "bg-white",
        textColor: "text-slate-900",
    },
    {
        id: "dark",
        name: "Dark Mode",
        description: "Deep charcoal palette for low light",
        icon: Moon,
        color: "bg-slate-900",
        textColor: "text-white",
    },
    {
        id: "snow",
        name: "Snow Theme",
        description: "Winter wonderland ambiance with snow effects",
        icon: Snowflake,
        color: "bg-sky-50",
        textColor: "text-sky-900",
    },
    {
        id: "summer",
        name: "Summer Theme",
        description: "Warm golden sunlight and vibrant energy",
        icon: Sun,
        color: "bg-amber-50",
        textColor: "text-amber-900",
    },
    {
        id: "rain",
        name: "Rain Theme",
        description: "Calm rainy drizzle and slate tones",
        icon: CloudRain,
        color: "bg-slate-100",
        textColor: "text-slate-800",
    },
    {
        id: "cloudy",
        name: "Cloudy Theme",
        description: "Soft overcast gray and minimal contrast",
        icon: Cloud,
        color: "bg-slate-200",
        textColor: "text-slate-800",
    },
    {
        id: "spring",
        name: "Spring Theme",
        description: "Fresh blooming green botanicals",
        icon: Flower2,
        color: "bg-emerald-50",
        textColor: "text-emerald-900",
    },
    {
        id: "avengers",
        name: "Avengers Initiative",
        description: "Assemble superhero cinematic styling",
        icon: Shield,
        color: "bg-rose-50",
        textColor: "text-rose-900",
    },
];

export default function SettingsPage() {
    const { theme, setTheme, setLocalTheme, isLoading, setAvengersCharacter } = useTheme() as any;
    const [saving, setSaving] = useState(false);
    const [showHeroModal, setShowHeroModal] = useState(false);
    const router = useRouter();

    // Role Protection
    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === "TEAM_LEAD") {
                    router.replace('/dashboard/admin');
                }
            }
        } catch (e) {
            console.error("Role Check Error", e);
        }
    }, [router]);

    const handleThemeChange = async (newTheme: any) => {
        if (newTheme === "avengers") {
            setShowHeroModal(true);
            return;
        }

        setSaving(true);
        setLocalTheme(null);

        try {
            await setTheme(newTheme);
        } catch (e) {
            console.error("Error setting theme:", e);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Palette className="w-3.5 h-3.5" /> Appearance & Preferences
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage global platform theme, seasonal color accents, and administrative visual modes.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isLoading && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Syncing...</span>}
                    {saving && <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">Applying Theme...</span>}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Global Design Themes</h2>
                    <span className="text-xs text-slate-500">Current Theme: <strong className="text-slate-900 uppercase font-mono">{theme}</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;

                        return (
                            <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                className={`
                                    relative group flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 shadow-sm text-left
                                    ${isActive
                                        ? "border-amber-500 bg-white ring-4 ring-amber-400/15"
                                        : "border-slate-200 hover:border-slate-300 bg-white"}
                                `}
                            >
                                {isActive && (
                                    <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 p-1 rounded-full shadow-2xs">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                )}

                                <div className={`p-3.5 rounded-2xl mb-4 ${isActive ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <Icon className="w-7 h-7" />
                                </div>

                                <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 text-center leading-relaxed">
                                    {t.description}
                                </p>

                                <div className="mt-4 w-full h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2">
                                    <div className={`w-6 h-2 rounded-full ${isActive ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                    <div className={`w-12 h-2 rounded-full ${isActive ? 'bg-amber-300' : 'bg-slate-200'}`}></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hero Selection Modal */}
            {showHeroModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200">
                        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">Select Avengers Hero Identity</h2>
                        <p className="text-xs text-slate-500 text-center mb-6">Choose a character to activate hero branding across your portal.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Iron Man */}
                            <button
                                onClick={() => selectHero("iron-man")}
                                className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 transition-all flex flex-col items-center justify-center gap-3 text-center"
                            >
                                <Aperture className="w-10 h-10 text-amber-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Iron Man</span>
                            </button>

                            {/* Spider Man */}
                            <button
                                onClick={() => selectHero("spider-man")}
                                className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/40 transition-all flex flex-col items-center justify-center gap-3 text-center"
                            >
                                <Bug className="w-10 h-10 text-rose-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Spider-Man</span>
                            </button>

                            {/* Captain America */}
                            <button
                                onClick={() => selectHero("captain-america")}
                                className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col items-center justify-center gap-3 text-center"
                            >
                                <Shield className="w-10 h-10 text-sky-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Captain America</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowHeroModal(false)}
                            className="mt-6 w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
