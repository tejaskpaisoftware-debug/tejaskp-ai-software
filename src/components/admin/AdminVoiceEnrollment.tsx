"use client";

import { useState } from "react";
import { X, Mic, CheckCircle, AlertTriangle } from "lucide-react";
import VoiceRecorder from "@/components/auth/VoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";

interface AdminVoiceEnrollmentProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    userName: string;
}

export default function AdminVoiceEnrollment({ isOpen, onClose, onSuccess, userId, userName }: AdminVoiceEnrollmentProps) {
    const [step, setStep] = useState<"PHRASE" | "RECORD" | "CONFIRM">("PHRASE");
    const [passphrase, setPassphrase] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleEnroll = async () => {
        if (!audioBlob || !passphrase) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append("file", audioBlob, "enrollment.wav");
        formData.append("passphrase", passphrase);
        formData.append("userId", userId);

        try {
            const res = await fetch("/api/admin/voice-enrollment", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert("Voice Enrolled Successfully!");
                onSuccess();
                onClose();
            } else {
                alert(`Failed: ${data.message}\n${data.error || ""}`);
            }
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#121212] border border-blue-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mic className="text-blue-400" /> Voice Biometrics
                            </h2>
                            <p className="text-blue-200 text-xs mt-1">Enrollment for {userName}</p>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="p-8">
                        {step === "PHRASE" && (
                            <div className="space-y-6">
                                <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-200 text-sm">
                                    <AlertTriangle className="shrink-0" />
                                    <p>Security Note: Choose a unique phrase. You must speak this exact phrase to login. Your unique voice print will be verified against this recording.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Set Access Phrase</label>
                                    <input
                                        value={passphrase}
                                        onChange={(e) => setPassphrase(e.target.value)}
                                        placeholder="e.g. 'Project Alpha Secure Access'"
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white mt-1 focus:border-blue-500 focus:outline-none placeholder-gray-600"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Make it memorable but complex.</p>
                                </div>

                                <button
                                    onClick={() => {
                                        if (passphrase.length < 5) return alert("Phrase too short");
                                        setStep("RECORD");
                                    }}
                                    disabled={!passphrase}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                                >
                                    Next: Record Voice
                                </button>
                            </div>
                        )}

                        {step === "RECORD" && (
                            <div className="space-y-6 text-center">
                                <p className="text-white text-lg font-medium">Please verify your phrase:</p>
                                <div className="bg-black/50 p-4 rounded-xl border border-dashed border-gray-600">
                                    <p className="text-2xl font-serif text-blue-400 italic">"{passphrase}"</p>
                                </div>

                                <VoiceRecorder
                                    onRecordingComplete={(blob) => {
                                        setAudioBlob(blob);
                                    }}
                                />

                                {audioBlob && (
                                    <div className="pt-4">
                                        <button
                                            onClick={handleEnroll}
                                            disabled={isLoading}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? "Analyzing..." : <><CheckCircle size={20} /> CONFIRM & ENROLL</>}
                                        </button>
                                        <button
                                            onClick={() => setAudioBlob(null)}
                                            className="text-gray-500 text-xs mt-3 underline"
                                        >
                                            Re-record
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
