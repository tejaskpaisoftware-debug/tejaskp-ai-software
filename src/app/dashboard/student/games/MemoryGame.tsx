"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Trophy, RefreshCw } from "lucide-react";

type Card = {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
};

const EMOJIS = ["🔮", "⚡", "🧬", "🪐", "🛸", "💎", "🧩", "🦠"];

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        const duplicatedEmojis = [...EMOJIS, ...EMOJIS];
        const shuffledCards = duplicatedEmojis
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                emoji,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(shuffledCards);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setGameOver(false);
    };

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves((prev) => prev + 1);
            checkForMatch(newFlipped[0], newFlipped[1]);
        }
    };

    const checkForMatch = (firstId: number, secondId: number) => {
        if (cards[firstId].emoji === cards[secondId].emoji) {
            const newCards = [...cards];
            newCards[firstId].isMatched = true;
            newCards[secondId].isMatched = true;
            setCards(newCards);
            setFlippedCards([]);
            setMatches((prev) => {
                const newMatches = prev + 1;
                if (newMatches === EMOJIS.length) {
                    setTimeout(() => setGameOver(true), 500);
                }
                return newMatches;
            });
        } else {
            setTimeout(() => {
                const newCards = [...cards];
                newCards[firstId].isFlipped = false;
                newCards[secondId].isFlipped = false;
                setCards(newCards);
                setFlippedCards([]);
            }, 1000);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header Stats */}
            <div className="flex justify-between items-center w-full max-w-lg mb-8 z-10">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
                    <span className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Moves</span>
                    <span className="text-2xl font-mono text-white">{moves}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Brain className="text-cyan-400 animate-pulse" size={32} />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">MEMORY MATRIX</h2>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
                    <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">Matches</span>
                    <span className="text-2xl font-mono text-white">{matches} / 8</span>
                </div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-4 z-10 perspective-1000">
                {cards.map((card) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: card.id * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCardClick(card.id)}
                        className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl cursor-pointer relative preserve-3d transition-all duration-500 ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
                        style={{ transformStyle: 'preserve-3d', transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                        {/* Card Back (Hidden) */}
                        <div className="absolute inset-0 w-full h-full bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center backface-hidden shadow-lg shadow-black/50 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-50" />
                            <Brain className="text-slate-600 group-hover:text-cyan-500/50 transition-colors" size={32} />
                        </div>

                        {/* Card Front (Visible) */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-900 to-blue-900 rounded-xl border-2 border-cyan-500/50 flex items-center justify-center backface-hidden rotate-y-180 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <span className="text-4xl drop-shadow-md">{card.emoji}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <div className="bg-slate-900 p-8 rounded-3xl border border-cyan-500/50 flex flex-col items-center text-center shadow-[0_0_50px_rgba(6,182,212,0.4)] max-w-sm mx-4">
                            <Trophy className="text-yellow-400 mb-4" size={64} />
                            <h3 className="text-3xl font-bold text-white mb-2">Neural Link Established!</h3>
                            <p className="text-gray-400 mb-6">Simulation complete in <span className="text-cyan-400 font-bold">{moves}</span> moves. Cognitive efficiency nominal.</p>
                            <button
                                onClick={initializeGame}
                                className="flex items-center gap-2 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-cyan-500/30"
                            >
                                <RefreshCw size={20} />
                                Restart Simulation
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
