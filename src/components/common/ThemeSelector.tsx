"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import { Check, Palette, Cloud, Sun, CloudRain, CloudSnow, Moon, Zap, Flower2 } from "lucide-react";

export default function ThemeSelector() {
    const { theme, setLocalTheme, avengersCharacter, setAvengersCharacter } = useTheme();

    const themes = [
        { id: "light", name: "Classic Light", icon: <Sun />, color: "bg-white text-black" },
        { id: "dark", name: "Midnight Dark", icon: <Moon />, color: "bg-black text-white" },
        { id: "summer", name: "Golden Summer", icon: <Sun className="text-yellow-500" />, color: "bg-orange-50 text-orange-900 border-orange-200" },
        { id: "snow", name: "Winter Snow", icon: <CloudSnow className="text-blue-400" />, color: "bg-slate-50 text-slate-800" },
        { id: "rain", name: "Monsoon Rain", icon: <CloudRain className="text-blue-600" />, color: "bg-slate-900 text-blue-100" },
        { id: "cloudy", name: "Overcast", icon: <Cloud className="text-gray-500" />, color: "bg-gray-200 text-gray-800" },
        { id: "spring", name: "Floral Spring", icon: <Flower2 className="text-pink-500" />, color: "bg-pink-50 text-pink-900" },
        { id: "avengers", name: "Jarvis Interface", icon: <Zap className="text-cyan-400" />, color: "bg-black text-cyan-400 border-cyan-500" },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <div className="flex items-center gap-3">
                <span className="p-3 bg-purple-500/10 rounded-full text-purple-500 text-2xl">🎨</span>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Personalize Your Dashboard</h2>
                    <p className="text-muted-foreground text-sm">Select a theme to customize your experience. This only affects your view.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((t) => (
                    <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLocalTheme(t.id as any)}
                        className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 shadow-sm h-32 justify-center overflow-hidden group ${theme === t.id
                                ? 'border-purple-500 ring-4 ring-purple-500/20'
                                : 'border-transparent hover:border-gray-500/30'
                            } ${t.color}`}
                    >
                        {/* Background pattern/overlay could go here */}
                        <div className="z-10 flex flex-col items-center gap-2">
                            {t.icon}
                            <span className="font-bold text-sm">{t.name}</span>
                        </div>

                        {theme === t.id && (
                            <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1">
                                <Check size={12} />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Avengers Character Selector (Only if Avengers theme is active) */}
            {theme === 'avengers' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-black/40 border border-cyan-500/30 rounded-xl"
                >
                    <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                        <Zap size={16} /> Select AI Interface
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {['iron-man', 'cap', 'thor', 'hulk'].map((char) => (
                            <button
                                key={char}
                                onClick={() => setAvengersCharacter(char)}
                                className={`px-4 py-2 rounded-lg border text-sm font-mono uppercase transition-all ${avengersCharacter === char
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                        : 'bg-black/20 border-gray-700 text-gray-500 hover:border-cyan-500/50 hover:text-cyan-400'
                                    }`}
                            >
                                {char.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
