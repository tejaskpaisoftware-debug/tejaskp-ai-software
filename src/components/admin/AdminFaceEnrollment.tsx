"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, RefreshCw, CheckCircle, Shield } from 'lucide-react';

interface AdminFaceEnrollmentProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    userName: string;
}

export default function AdminFaceEnrollment({ isOpen, onClose, onSuccess, userId, userName }: AdminFaceEnrollmentProps) {
    const webcamRef = useRef<Webcam>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState("Initializing Security Protocol...");

    const [isCameraSupported, setIsCameraSupported] = useState<boolean>(true);
    const [isSecureContext, setIsSecureContext] = useState<boolean>(true);

    useEffect(() => {
        setIsCameraSupported(typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
        setIsSecureContext(typeof window !== 'undefined' && !!window.isSecureContext);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadSecureModels();
        }
    }, [isOpen]);

    const loadSecureModels = async () => {
        try {
            setStatus('IDLE');
            setMessage("Loading Biometric Models...");
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setLoadingModels(false);
            setMessage(`Secure Enrollment for: ${userName}`);
            setStatus('SCANNING');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
            setMessage("Security System Error: Models Failed");
        }
    };

    const captureAndEnroll = async () => {
        if (status === 'PROCESSING') return;

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setStatus('PROCESSING');
        setMessage("Analyzing Biometric Data...");

        try {
            const img = await faceapi.fetchImage(imageSrc);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setStatus('ERROR');
                setMessage("No face detected. Ensure proper lighting.");
                setTimeout(() => setStatus('SCANNING'), 2000);
                return;
            }

            // Encode Descriptor
            const descriptor = Array.from(detection.descriptor);

            // Send to Admin Secure API
            const res = await fetch('/api/admin/admins/face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, faceDescriptor: descriptor })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('SUCCESS');
                setMessage("Biometric Identity Confirmed & Saved.");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                throw new Error(data.message || "Enrollment Failed");
            }

        } catch (error: any) {
            console.error(error);
            setStatus('ERROR');
            setMessage(error.message || "Enrollment Error");
            setTimeout(() => setStatus('SCANNING'), 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="bg-[#1a1a1a] border border-blue-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)] relative">

                {/* Header */}
                <div className="bg-[#111] p-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Shield size={20} />
                        <span className="font-mono font-bold tracking-widest text-sm">SECURE ENROLLMENT</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">{userName}</h2>
                    <p className={`text-sm mb-6 font-mono ${status === 'ERROR' ? 'text-red-400' :
                        status === 'SUCCESS' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                        {message}
                    </p>

                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-blue-500/20 mx-auto w-full mb-6 relative group">
                        {loadingModels ? (
                            <div className="flex items-center justify-center h-full text-blue-500/50 animate-pulse font-mono text-xs uppercase">
                                System Initializing...
                            </div>
                        ) : !isCameraSupported ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-500/10">
                                <Shield size={32} className="text-red-500 mb-3" />
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
                                    <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-500 uppercase font-bold animate-pulse">
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
                                        width: 1280,
                                        height: 720
                                    }}
                                    mirrored={true}
                                    onUserMedia={() => console.log("Webcam (Admin): User media stream active")}
                                    onUserMediaError={(err) => {
                                        console.error("Webcam (Admin): User media error", err);
                                        setStatus('ERROR');
                                        setMessage("Camera access blocked or not found.");
                                    }}
                                    className="w-full h-full object-cover grayscale"
                                />
                                {/* Face Frame Overlay */}
                                <div className="absolute inset-x-[25%] inset-y-[10%] border-2 border-blue-500/30 rounded-full pointer-events-none"></div>
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(59,130,246,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
                                <div className="absolute inset-x-0 top-0 h-px bg-blue-500/50 shadow-[0_0_10px_#3B82F6] animate-scan pointer-events-none"></div>
                            </>
                        )}

                        {status === 'PROCESSING' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                                <CheckCircle size={64} className="text-green-500 drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    {!loadingModels && status !== 'SUCCESS' && (
                        <div className="flex justify-center">
                            <button
                                onClick={captureAndEnroll}
                                disabled={status === 'PROCESSING'}
                                className="flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            >
                                <Camera size={20} />
                                {status === 'PROCESSING' ? 'PROCESSING...' : 'CAPTURE FACE'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Security Badge */}
                <div className="p-3 bg-blue-500/5 border-t border-blue-500/10 text-center">
                    <p className="text-[10px] text-blue-400/50 uppercase tracking-[0.2em]">
                        Biometric Data is Encrypted & Secure
                    </p>
                </div>
            </div>
        </div>
    );
}
