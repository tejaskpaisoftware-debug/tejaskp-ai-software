"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Gamepad2, Brain, Sparkles } from "lucide-react";
import MemoryGame from "./MemoryGame";
import TicTacToe from "./TicTacToe";
import F1RacingGame from "./F1RacingGame";
import { Flag } from "lucide-react";

export default function GamesPage() {
    const router = useRouter();

    const games = [
        {
            id: 'memory',
            title: 'Memory Matrix',
            description: 'Test your cognitive recall with this advanced pattern matching simulation.',
            icon: <Brain size={48} className="text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-600/20',
            border: 'border-cyan-500/50',
            bgImage: 'https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?q=80&w=2071&auto=format&fit=crop'
        },
        {
            id: 'tictactoe',
            title: 'Neon Tactics',
            description: 'Strategic zero-sum game against an adaptive AI opponent.',
            icon: <Gamepad2 size={48} className="text-purple-400" />,
            color: 'from-purple-500/20 to-pink-600/20',
            border: 'border-purple-500/50',
            bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'
        },
        {
            id: 'f1racing',
            title: 'Velocity F1',
            description: 'Hyper-realistic neural circuit racing simulation. Story mode included.',
            icon: <Flag size={48} className="text-red-500" />,
            color: 'from-red-600/20 to-orange-600/20',
            border: 'border-red-500/50',
            bgImage: 'https://images.unsplash.com/photo-1532906619279-a7e2e7424af9?q=80&w=2072&auto=format&fit=crop'
        },
        {
            id: 'coming-soon',
            title: 'System Locked',
            description: 'Advanced simulation modules currently under development.',
            icon: <Sparkles size={48} className="text-gray-500" />,
            color: 'from-gray-800/50 to-black/50',
            border: 'border-gray-700/50',
            bgImage: ''
        }
    ];

    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans selection:bg-purple-500/30">

            {/* Background "TEJASKP AI SOFTWARE" */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <h1 className="text-[12vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-white/5 to-white/0 tracking-tighter leading-none select-none whitespace-nowrap opacity-50 blur-sm"
                    style={{ WebkitTextStroke: '2px rgba(255,255,255,0.05)' }}>
                    TEJASKP AI
                </h1>
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold group"
                >
                    <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-white/50 text-sm font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full h-screen flex flex-col justify-center pl-[10vw]">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h2 className="text-4xl font-light mb-2 text-white/90">Entertainment Module</h2>
                    <p className="text-white/40 text-lg mb-12 max-w-md">Select a simulation to begin. All progress is saved to your neural profile.</p>
                </motion.div>

                {/* Horizontal Game Scroll */}
                <div className="flex gap-8 overflow-x-auto pb-12 pr-12 no-scrollbar items-center perspective-1000">
                    {games.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{
                                scale: 1.05,
                                y: -10,
                                transition: { duration: 0.3 }
                            }}
                            onClick={() => game.id !== 'coming-soon' && setSelectedGame(game.id)}
                            className={`
                                relative min-w-[300px] h-[400px] rounded-3xl overflow-hidden cursor-pointer group
                                border border-white/10 hover:border-white/50 transition-all duration-300
                                ${game.id === 'coming-soon' ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                            `}
                        >
                            {/* Card Background Image */}
                            {game.bgImage && (
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url(${game.bgImage})` }}
                                />
                            )}

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${game.color} backdrop-blur-[2px] opacity-80 group-hover:opacity-60 transition-opacity`} />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="mb-auto transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">
                                        Active Module
                                    </span>
                                </div>

                                <div className={`mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur-md w-fit border ${game.border}`}>
                                    {game.icon}
                                </div>

                                <h3 className="text-3xl font-bold mb-2 leading-tight">{game.title}</h3>
                                <p className="text-white/60 text-sm leading-relaxed">{game.description}</p>

                                <div className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                    <span>Start Simulation</span>
                                    <ChevronLeft className="rotate-180" size={16} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Game Overlay/Modal Logic (To be implemented) */}
            {selectedGame && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                    <button
                        onClick={() => setSelectedGame(null)}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl font-light">×</div>
                    </button>

                    <div className="w-full max-w-4xl h-[80vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl shadow-purple-500/10">
                        {selectedGame === 'memory' && <MemoryGame />}
                        {selectedGame === 'tictactoe' && <TicTacToe />}
                        {selectedGame === 'f1racing' && <F1RacingGame />}
                    </div>
                </div>
            )}
        </div>
    );
}




