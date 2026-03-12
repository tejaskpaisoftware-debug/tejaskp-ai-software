"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, RefreshCw, CheckCircle, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

// Singleton to track model loading state globally
let modelsLoaded = false;
let isModelLoading = false;

export const preloadFaceModels = async () => {
    if (modelsLoaded || isModelLoading) return;
    isModelLoading = true;
    try {
        const MODEL_URL = '/models';
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        console.log("FaceLoginModal: AI Models Preloaded Successfully");
    } catch (err) {
        console.error("FaceLoginModal: Preload Failed", err);
    } finally {
        isModelLoading = false;
    }
};

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

    const [isCameraSupported, setIsCameraSupported] = useState<boolean>(true);
    const [isSecureContext, setIsSecureContext] = useState<boolean>(true);

    useEffect(() => {
        setIsCameraSupported(typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
        setIsSecureContext(typeof window !== 'undefined' && !!window.isSecureContext);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadModels();
            requestCamera();
        }
    }, [isOpen]);

    const requestCamera = async () => {
        if (!isCameraSupported) {
            console.warn("FaceLoginModal: Camera API not supported in this environment.");
            setStatus('ERROR');
            setMessage(isSecureContext ? "Camera API not found." : "Camera requires a SECURE connection (HTTPS).");
            return false;
        }

        try {
            console.log("FaceLoginModal: Requesting camera access...");
            if (!navigator?.mediaDevices?.getUserMedia) {
                throw new Error("getUserMedia is not supported on this browser/context.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log("FaceLoginModal: Camera access granted");
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error("FaceLoginModal: Camera access error:", err);
            setStatus('ERROR');
            setMessage(isSecureContext ? "Camera access denied or failed." : "Camera requires a SECURE connection (HTTPS).");
            return false;
        }
    };

    const loadModels = async () => {
        if (modelsLoaded) {
            setLoadingModels(false);
            setMessage("Position your face for Smart Login");
            setStatus('SCANNING');
            return;
        }

        try {
            setStatus('IDLE');
            setMessage("Loading AI Models...");
            
            // Helpful tip for tunnel users
            const tunnelTimeout = setTimeout(() => {
                setMessage("Tunnel connection is slow. Still loading AI...");
            }, 3000);

            await preloadFaceModels();
            
            clearTimeout(tunnelTimeout);
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
                const debugStr = data.debugDistance ? ` (Dist: ${data.debugDistance})` : "";
                setMessage((data.error || "Login failed.") + debugStr);
                setTimeout(() => setStatus('SCANNING'), 2000);
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
                        ) : !isCameraSupported ? (
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-500/10">
                                    <X size={28} className="text-red-500 mb-3" />
                                    <p className="text-red-500 font-bold text-sm mb-1">
                                        {isSecureContext ? "Camera Not Detected" : "Security Block (Insecure Connection)"}
                                    </p>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        {isSecureContext 
                                            ? "Your browser cannot find or access the camera. Please check your system settings."
                                            : "Camera access is restricted to HTTPS for your safety. Please use a secure URL or localhost."
                                        }
                                    </p>
                                    {!isSecureContext && (
                                        <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 uppercase font-bold animate-pulse">
                                            Run "npm run tunnel" for HTTPS
                                        </div>
                                    )}
                                </div>
                        ) : (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode: "user",
                                        width: { ideal: 1280 },
                                        height: { ideal: 720 },
                                        aspectRatio: 1
                                    }}
                                    mirrored={true}
                                    onUserMedia={() => console.log("Webcam: User media stream active")}
                                    onUserMediaError={(err) => {
                                        console.error("Webcam: User media error", err);
                                        setStatus('ERROR');
                                        setMessage("Camera access blocked or not found.");
                                    }}
                                    className="w-full h-full object-cover grayscale"
                                />
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
                        <div className="space-y-4">
                            {status === 'ERROR' ? (
                                <button
                                    onClick={() => {
                                        setStatus('SCANNING');
                                        setMessage("Retrying camera access...");
                                        requestCamera();
                                    }}
                                    className="flex items-center gap-2 mx-auto px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                >
                                    <Camera size={18} />
                                    TRY AGAIN
                                </button>
                            ) : (
                                <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-2 italic">Scanning active...</div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
