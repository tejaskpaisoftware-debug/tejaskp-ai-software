"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FaceLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (userData: any) => void;
}

export default function FaceLoginModal({ isOpen, onClose, onSuccess }: FaceLoginModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState("Initializing Smart Login...");

    useEffect(() => {
        if (isOpen) {
            loadModels();
        }
    }, [isOpen]);

    const loadModels = async () => {
        try {
            setStatus('IDLE');
            setMessage("Loading AI Models...");
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setLoadingModels(false);
            setMessage("Position your face for Smart Login");
            setStatus('SCANNING');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
            setMessage("Failed to load AI models.");
        }
    };

    const captureAndLogin = async () => {
        if (status === 'VERIFYING') return;

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setStatus('VERIFYING');
        setMessage("Identifying User...");

        try {
            const img = await faceapi.fetchImage(imageSrc);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setStatus('ERROR');
                setMessage("No face detected. Try again.");
                setTimeout(() => setStatus('SCANNING'), 2000);
                return;
            }

            const descriptor = Array.from(detection.descriptor);

            const res = await fetch('/api/auth/face-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ faceDescriptor: descriptor })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('SUCCESS');
                setMessage(`Welcome back, ${data.user.name}!`);
                setTimeout(() => {
                    onSuccess(data.user);
                    onClose();
                }, 1500);
            } else {
                setStatus('ERROR');
                setMessage(data.error || "Login failed.");
                setTimeout(() => setStatus('SCANNING'), 3000);
            }

        } catch (error) {
            console.error(error);
            setStatus('ERROR');
            setMessage("System Error.");
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const autoScan = async () => {
            if (status !== 'SCANNING' || loadingModels || !webcamRef.current) return;
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;
            try {
                const img = await faceapi.fetchImage(imageSrc);
                const detection = await faceapi.detectSingleFace(img);
                if (detection) {
                    captureAndLogin();
                }
            } catch (e) { }
        };
        if (isOpen && status === 'SCANNING' && !loadingModels) {
            interval = setInterval(autoScan, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [status, loadingModels, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#121212] border border-yellow-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white bg-black/50 p-2 rounded-full">
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-[#FFD700] mb-2 font-mono tracking-widest">SMART FACE LOGIN</h2>
                    <p className={`text-sm mb-4 font-medium ${status === 'ERROR' ? 'text-red-500' :
                        status === 'SUCCESS' ? 'text-green-500' : 'text-gray-400'
                        }`}>
                        {message}
                    </p>

                    <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-yellow-500/20 mx-auto w-full max-w-[280px] mb-6 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                        {loadingModels ? (
                            <div className="flex items-center justify-center h-full text-yellow-500/50 animate-pulse font-mono text-xs uppercase">
                                Calibrating AI...
                            </div>
                        ) : (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "user" }}
                                    className="w-full h-full object-cover grayscale"
                                />
                                <div className="absolute inset-0 border-[2px] border-yellow-500/20 rounded-full scale-90 m-auto pointer-events-none animate-pulse"></div>
                                <div className="absolute inset-x-0 top-0 h-px bg-yellow-500/50 shadow-[0_0_10px_#EAB308] animate-scan pointer-events-none"></div>
                            </>
                        )}

                        {status === 'VERIFYING' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                <RefreshCw size={40} className="text-yellow-500 animate-spin" />
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm">
                                <CheckCircle size={60} className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            </div>
                        )}
                    </div>

                    {!loadingModels && status !== 'SUCCESS' && (
                        <div className="space-y-3">
                            <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-2 italic">Scanning active...</div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
