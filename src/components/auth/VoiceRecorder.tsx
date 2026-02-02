"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    isProcessing?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const isRecordingRef = useRef(false); // Ref for synchronous access in event handlers
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Visualizer refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            await startWavRecording(stream);
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access required");
        }
    };

    // --- RAW WAV RECORDING LOGIC ---
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioDataRef = useRef<Float32Array[]>([]);

    const startWavRecording = async (stream: MediaStream) => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;

        sourceRef.current = ctx.createMediaStreamSource(stream);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current.connect(analyserRef.current);

        // Create ScriptProcessor for raw data access (Deprecated but reliable for raw PCM)
        processorRef.current = ctx.createScriptProcessor(4096, 1, 1);

        audioDataRef.current = []; // Clear buffer

        processorRef.current.onaudioprocess = (e) => {
            if (!isRecordingRef.current) return; // Use Ref to avoid closure staleness
            const inputData = e.inputBuffer.getChannelData(0);
            // Clone data because input buffer is reused
            audioDataRef.current.push(new Float32Array(inputData));
        };

        sourceRef.current.connect(processorRef.current);
        processorRef.current.connect(ctx.destination); // Needed for chrome to fire events

        isRecordingRef.current = true;
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime((t) => t + 1);
        }, 1000);

        visualize();
    };

    const stopRecording = () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;
        setIsRecording(false);

        if (timerRef.current) clearInterval(timerRef.current);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        // Teardown Web Audio
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Compile WAV
        const blob = exportWAV(audioDataRef.current, audioContextRef.current?.sampleRate || 44100);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Close Context (to release mic)
        audioContextRef.current?.close();

        onRecordingComplete(blob);
    };

    const visualize = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording) return;
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    // --- WAV ENCODER UTILS ---
    const exportWAV = (buffers: Float32Array[], sampleRate: number) => {
        // Flatten
        const bufferLength = buffers.reduce((acc, b) => acc + b.length, 0);
        const result = new Float32Array(bufferLength);
        let offset = 0;
        for (const b of buffers) {
            result.set(b, offset);
            offset += b.length;
        }

        // Encode
        const wavBuffer = encodeWAV(result, sampleRate);
        return new Blob([wavBuffer], { type: "audio/wav" });
    };

    const encodeWAV = (samples: Float32Array, sampleRate: number) => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        /* RIFF identifier */
        writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * 2, true);
        /* RIFF type */
        writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, 1, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * 2, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, 2, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, samples.length * 2, true);

        const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
            for (let i = 0; i < input.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, input[i]));
                // Convert to 16-bit
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        };

        floatTo16BitPCM(view, 44, samples);
        return view;
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full h-32 bg-black/50 rounded-xl overflow-hidden border border-gray-700">
                <canvas ref={canvasRef} width={300} height={128} className="w-full h-full" />
                {!isRecording && !audioUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        Ready to Record
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={isProcessing}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-4 border-gray-800 shadow-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale"
                    >
                        <div className="w-6 h-6 bg-white rounded-full" />
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 border-4 border-red-500/50 shadow-xl flex items-center justify-center animate-pulse transition-all"
                    >
                        <div className="w-6 h-6 bg-red-500 rounded-sm" />
                    </button>
                )}
            </div>

            <div className="text-sm font-mono text-gray-400">
                {isRecording ? `Recording: ${recordingTime}s` : (audioUrl ? "Recording Saved" : "Tap to Record")}
            </div>

            {audioUrl && (
                <audio src={audioUrl} controls className="w-full h-10 mt-2" />
            )}
        </div>
    );
}
