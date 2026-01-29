"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TejasKPLogo from "@/components/common/TejasKPLogo";

export default function DraggableAIButton() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const constraintsRef = useRef(null);

    return (
        <>
            {/* Constraints container covering the screen but allowing clicks through */}
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

            <motion.div
                drag
                dragConstraints={constraintsRef}
                whileDrag={{ scale: 1.1 }}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ bottom: 100, right: 20 }}
                className="fixed z-[101] cursor-grab active:cursor-grabbing pointer-events-auto"
            >
                <div className="relative">
                    {/* Main Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-14 h-14 rounded-full bg-gold-500 text-obsidian shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isOpen ? <X size={24} /> : <TejasKPLogo size={24} />}
                    </button>

                    {/* Menu Items */}
                    {isOpen && (
                        <div className="absolute bottom-16 right-0 space-y-3 flex flex-col items-end min-w-[150px]">
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => router.push('/dashboard/student/ai')}
                                className="flex items-center gap-2 bg-obsidian border border-gold-500/50 px-4 py-2 rounded-lg text-gold-400 font-bold shadow-xl whitespace-nowrap"
                            >
                                <span>TejasKP AI</span>
                                <TejasKPLogo size={16} />
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => router.push('/dashboard/user/chat')}
                                className="flex items-center gap-2 bg-white border border-gold-500/50 px-4 py-2 rounded-lg text-obsidian font-bold shadow-xl whitespace-nowrap"
                            >
                                <span>Support Chat</span>
                                <MessageCircle size={16} />
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
