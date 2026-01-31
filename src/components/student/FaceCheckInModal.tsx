"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, RefreshCw, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FaceCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    mode?: 'check-in' | 'check-out';
}

export default function FaceCheckInModal({ isOpen, onClose, onSuccess, userId, mode = 'check-in' }: FaceCheckInModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFYING' | 'SUCCESS' | 'ERROR' | 'LOCKED'>('IDLE');
    const displayTitle = mode === 'check-out' ? "Face Check-Out" : "Face Check-In";
    const [message, setMessage] = useState(`Initializing ${displayTitle}...`);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadModels();
        }
    }, [isOpen]);

    const loadModels = async () => {
        try {
            setStatus('IDLE');
            setMessage("Loading Face Models...");
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setLoadingModels(false);
            setMessage("Please position your face in the frame.");
            setStatus('SCANNING');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
            setMessage("Failed to load AI models. Please refresh.");
        }
    };

    const captureAndVerify = async () => {
        if (status === 'VERIFYING' || status === 'LOCKED') return;

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setStatus('VERIFYING');
        setMessage("Analyzing Face...");

        try {
            // 1. Detect Face
            const img = await faceapi.fetchImage(imageSrc);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setStatus('ERROR');
                setMessage("No face detected. Please try again.");
                setTimeout(() => setStatus('SCANNING'), 2000);
                return;
            }

            // 2. Send Descriptor to Backend
            const descriptor = Array.from(detection.descriptor);

            const res = await fetch('/api/user/face-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, faceDescriptor: descriptor })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('SUCCESS');
                setMessage(mode === 'check-out' ? "Face Verified! Checking you out..." : "Face Verified! Checking you in...");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                if (res.status === 403 && data.locked) {
                    setStatus('LOCKED');
                    setMessage(data.error);

                    // IMMEDIATE LOGOUT SEQUENCER
                    setTimeout(async () => {
                        console.log("Security Lockout: Logging out...");
                        try {
                            // Fire and forget logout
                            fetch("/api/auth/logout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId })
                            });
                        } catch (e) {
                            console.error("Logout API failed", e);
                        }
                        sessionStorage.removeItem("currentUser");
                        sessionStorage.clear();
                        window.location.replace("/login"); // Force hard redirect
                    }, 1500); // 1.5 seconds - faster response

                } else {
                    setStatus('ERROR');
                    setMessage(data.error || "Verification failed.");
                    if (data.attemptsLeft !== undefined) {
                        setAttemptsLeft(data.attemptsLeft);
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setStatus('ERROR');
            setMessage("System Error. Please try again.");
        }
    };

    // Auto-scan effect: Continuously check for face when in SCANNING mode
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const autoScan = async () => {
            if (status !== 'SCANNING' || loadingModels || !webcamRef.current) return;

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            try {
                // Lightweight detection to check for presence
                const img = await faceapi.fetchImage(imageSrc);
                const detection = await faceapi.detectSingleFace(img);

                if (detection) {
                    console.log("Face detected, auto-verifying...");
                    captureAndVerify();
                }
            } catch (e) {
                // Silent error for auto-scan
            }
        };

        if (isOpen && status === 'SCANNING' && !loadingModels) {
            interval = setInterval(autoScan, 1000); // Check every 1 second
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, loadingModels, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border border-theme w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white bg-black/50 p-2 rounded-full">
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2">{displayTitle}</h2>
                    <p className={`text-sm mb-4 font-medium ${status === 'ERROR' ? 'text-red-500' :
                        status === 'SUCCESS' ? 'text-green-500' :
                            status === 'LOCKED' ? 'text-red-600' : 'text-gold-500'
                        }`}>
                        {message}
                    </p>

                    <div className="relative aspect-square bg-[#111] rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 mx-auto w-full max-w-[300px] mb-6 shadow-inner">
                        {loadingModels ? (
                            <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
                                Loading AI...
                            </div>
                        ) : (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "user" }}
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay Frame */}
                                <div className="absolute inset-0 border-[3px] border-gold-500/30 rounded-full scale-75 m-auto pointer-events-none"></div>
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/40"></div>
                            </>
                        )}

                        {status === 'VERIFYING' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {status === 'LOCKED' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm flex-col text-red-100">
                                <Lock size={40} className="mb-2" />
                                <span className="font-bold">LOCKED</span>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                                <CheckCircle size={60} className="text-green-500 drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    {!loadingModels && status !== 'LOCKED' && status !== 'SUCCESS' && (
                        <div className="space-y-3">
                            <button
                                onClick={captureAndVerify}
                                disabled={status === 'VERIFYING'}
                                className="w-full py-3 px-6 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera size={20} />
                                {status === 'VERIFYING' ? 'Processing...' : 'Scan Face'}
                            </button>
                            {status === 'ERROR' && (
                                <button onClick={() => setStatus('SCANNING')} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 justify-center mx-auto">
                                    <RefreshCw size={14} /> Retry
                                </button>
                            )}
                            {attemptsLeft !== null && (
                                <p className="text-xs text-red-400 mt-2">
                                    Attempts remaining: {attemptsLeft}
                                </p>
                            )}
                        </div>
                    )}

                    {status === 'LOCKED' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <h3 className="text-red-500 font-bold flex items-center justify-center gap-2 mb-1">
                                <AlertTriangle size={16} /> Security Lockout
                            </h3>
                            <p className="text-xs text-red-400">
                                Your account has been temporarily locked due to multiple failed biometric attempts.
                            </p>
                            <div className="mt-2 text-gold-500 text-xs font-mono animate-pulse font-bold">
                                Logging out for security...
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}


