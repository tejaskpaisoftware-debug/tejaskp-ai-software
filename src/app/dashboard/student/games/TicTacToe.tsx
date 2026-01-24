"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, User, Cpu, RotateCcw } from "lucide-react";

type Player = 'X' | 'O';
type Winner = Player | 'Draw' | null;

export default function TicTacToe() {
    const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true); // User is always X
    const [winner, setWinner] = useState<Winner>(null);
    const [aiProcessing, setAiProcessing] = useState(false);

    // AI Logic
    useEffect(() => {
        if (!isXNext && !winner) {
            setAiProcessing(true);
            const timer = setTimeout(() => {
                makeAiMove();
                setAiProcessing(false);
            }, 800); // Artificial delay for realism
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner]);

    const checkWinner = (squares: (Player | null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return squares.every(square => square !== null) ? 'Draw' : null;
    };

    const handleClick = (index: number) => {
        if (board[index] || winner || !isXNext || aiProcessing) return;

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);
        setIsXNext(false);
        setWinner(checkWinner(newBoard));
    };

    const makeAiMove = () => {
        if (winner) return;

        // Simple AI: 1. Win, 2. Block, 3. Center, 4. Random Corner, 5. Random
        const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];

        if (availableMoves.length === 0) return;

        let moveIndex = -1;

        // Helper to check for winning move for a player
        const getWinningMove = (player: Player) => {
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (let line of lines) {
                const [a, b, c] = line;
                const vals = [board[a], board[b], board[c]];
                if (vals.filter(v => v === player).length === 2 && vals.includes(null)) {
                    return line[vals.indexOf(null)];
                }
            }
            return -1;
        };

        // 1. Try to win
        moveIndex = getWinningMove('O');

        // 2. Block user
        if (moveIndex === -1) moveIndex = getWinningMove('X');

        // 3. Take center
        if (moveIndex === -1 && board[4] === null) moveIndex = 4;

        // 4. Random available
        if (moveIndex === -1) {
            moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        const newBoard = [...board];
        newBoard[moveIndex] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        setWinner(checkWinner(newBoard));
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
        setAiProcessing(false);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950 p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="flex flex-col items-center gap-2 mb-8 z-10">
                <div className="flex items-center gap-3">
                    <Gamepad2 className="text-purple-400" size={40} />
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">NEON TACTICS</h2>
                </div>
                <div className="text-purple-200/50 text-sm font-mono tracking-widest">TACTICAL SIMULATION//V.0.1</div>
            </div>

            {/* Turn Indicator */}
            <div className="flex gap-8 mb-8 z-10">
                <div className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${isXNext ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-white/10 text-white/30'}`}>
                    <User size={18} />
                    <span className="font-bold">YOU (X)</span>
                </div>
                <div className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${!isXNext ? 'bg-pink-500/20 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-white/10 text-white/30'}`}>
                    <Cpu size={18} />
                    <span className="font-bold">AI (O)</span>
                    {aiProcessing && <span className="animate-pulse ml-1">...</span>}
                </div>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5 z-10">
                {board.map((square, index) => (
                    <motion.button
                        key={index}
                        whileHover={!square && !winner ? { scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                        whileTap={!square && !winner ? { scale: 0.95 } : {}}
                        onClick={() => handleClick(index)}
                        className={`
                            w-24 h-24 sm:w-28 sm:h-28 rounded-xl text-6xl font-black flex items-center justify-center
                            shadow-inner border border-white/5 bg-white/[0.02]
                            ${square === 'X' ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : ''}
                            ${square === 'O' ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]' : ''}
                        `}
                    >
                        {square && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                {square}
                            </motion.span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Winner Overlay */}
            <AnimatePresence>
                {winner && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute bottom-10 z-20 flex flex-col items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl"
                    >
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                            {winner === 'Draw' ? 'SYSTEM DEADLOCK' : winner === 'X' ? 'VICTORY ACHIEVED' : 'DEFEAT IMMINENT'}
                        </h3>
                        {winner !== 'Draw' && <p className="text-white/60">{winner === 'X' ? 'Tactical superiority checked.' : 'AI adaptation successful.'}</p>}

                        <button
                            onClick={resetGame}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-white/90 rounded-full font-bold transition-all"
                        >
                            <RotateCcw size={20} />
                            RESET SYSTEM
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
