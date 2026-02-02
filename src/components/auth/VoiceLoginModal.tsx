"use client";

import { useState } from "react";
import { Mic, X, Lock, Fingerprint, Waves } from "lucide-react";
import VoiceRecorder from "@/components/auth/VoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

export default function VoiceLoginModal({ isOpen, onClose, onSuccess }: VoiceLoginModalProps) {
    // const [mobile, setMobile] = useState(""); // Removed
    const [status, setStatus] = useState<"IDLE" | "RECORDING" | "VERIFYING" | "SUCCESS" | "FAILED">("IDLE");
    const [errorMessage, setErrorMessage] = useState("");
    const [similarityScore, setSimilarityScore] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleVerification = async (blob: Blob) => {
        // if (!mobile) return alert("Please enter mobile number first"); // Removed

        setStatus("VERIFYING");
        setErrorMessage("");

        const formData = new FormData();
        formData.append("file", blob, "login.wav");
        // formData.append("mobile", mobile); // Removed

        try {
            const res = await fetch("/api/auth/voice-login", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSimilarityScore(data.score);
                setStatus("SUCCESS");
                setTimeout(() => {
                    onSuccess({ ...data.user, token: data.token });
                }, 1500);
            } else {
                setSimilarityScore(data.score || 0);
                setStatus("FAILED");
                // Check if 'details' exists (from Distance/Threshold info)
                const errorText = data.message + (data.details ? ` (${data.details})` : "");
                setErrorMessage(errorText || "Voice mismatch");
            }
        } catch (error) {
            console.error(error);
            setStatus("FAILED");
            setErrorMessage("Connection failed");
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#0a0a0a] border border-blue-500/50 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>

                    <div className="p-8 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-6 animate-pulse border border-blue-500/50">
                            <Waves className="w-8 h-8 text-blue-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Voice Security</h2>
                        <p className="text-gray-400 text-sm text-center mb-8">Please say: <span className="text-blue-400 font-bold">"Login to my desk"</span></p>

// Mobile input removed for identifier-less login

                        {/* Recorder */}
                        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 w-full">
                            <VoiceRecorder
                                onRecordingComplete={handleVerification}
                                isProcessing={status === "VERIFYING"}
                            />
                        </div>

                        {/* Status Messages */}
                        <div className="mt-6 text-center h-12">
                            {status === "VERIFYING" && (
                                <span className="text-blue-400 text-sm font-mono animate-pulse">Analyzing Spectrogram...</span>
                            )}
                            {status === "SUCCESS" && (
                                <div className="text-green-500 text-sm font-bold flex flex-col items-center">
                                    <span>ACCESS GRANTED</span>
                                    <span className="text-[10px] opacity-70">Match Score: {((similarityScore || 0) * 100).toFixed(1)}%</span>
                                </div>
                            )}
                            {status === "FAILED" && (
                                <div className="text-red-500 text-sm font-bold flex flex-col items-center">
                                    <span>ACCESS DENIED</span>
                                    <span className="text-[10px] opacity-70 mb-1">Match Score: {((similarityScore || 0) * 100).toFixed(1)}%</span>
                                    <span className="text-xs font-normal text-red-400/80">
                                        {errorMessage}
                                        {similarityScore !== null && similarityScore < 0.6 && (
                                            <span className="block text-[9px] text-gray-500 mt-1">Try to speak clearer</span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
