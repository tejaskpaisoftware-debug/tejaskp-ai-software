"use client";

import { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, extend, ReactThreeFiber } from "@react-three/fiber";
import { PerspectiveCamera, Stars, Trail, shaderMaterial, Html } from "@react-three/drei";
import * as THREE from "three";
import { Trophy, Users, Crown, Play } from "lucide-react";

// --- Types ---
type GameState = 'menu' | 'lobby' | 'car_select' | 'intro' | 'playing' | 'crashed' | 'finished';
type Player = {
    id: string;
    name: string;
    carColor: string;
    score: number;
    speed: number;
    positionX: number; // -5 to 5
    status: 'READY' | 'RACING' | 'CRASHED' | 'FINISHED';
};

// --- Game Constants ---
const TRACK_WIDTH = 10;
const OBSTACLE_SPAWN_RATE = 0.05;

// --- Custom Shaders (Reused) ---
const GridShaderMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color(1, 0, 1), uSpeed: 0 },
    `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `uniform float uTime; uniform vec3 uColor; varying vec2 vUv; 
    void main() { 
      float gridY = step(0.98, fract(vUv.y * 20.0 + uTime * 5.0));
      float gridX = step(0.98, fract(vUv.x * 10.0));
      float strength = max(gridX, gridY);
      float fade = 1.0 - vUv.y; 
      vec3 finalColor = uColor * strength * fade;
      gl_FragColor = vec4(finalColor, strength * fade);
    }`
);
extend({ GridShaderMaterial });

declare global {
    namespace JSX {
        interface IntrinsicElements {
            gridShaderMaterial: any; // ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof GridShaderMaterial>;
        }
    }
}

// --- Audio Engine ---
const useAudioEngine = (active: boolean, speed: number) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        if (active && !audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            const osc = audioContextRef.current.createOscillator();
            const gain = audioContextRef.current.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 100;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(audioContextRef.current.destination);
            osc.start();
            oscillatorRef.current = osc;
            gainNodeRef.current = gain;
        } else if (!active && audioContextRef.current) {
            oscillatorRef.current?.stop();
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        return () => { audioContextRef.current?.close(); };
    }, [active]);

    useEffect(() => {
        if (oscillatorRef.current && audioContextRef.current) {
            const targetFreq = 80 + (speed * 1000);
            oscillatorRef.current.frequency.setTargetAtTime(targetFreq, audioContextRef.current.currentTime, 0.1);
        }
    }, [speed]);
};

// --- 3D Components ---

function AnimatedTrack({ speed }: { speed: number }) {
    const materialRef = useRef<any>(null);
    useFrame((state, delta) => {
        if (materialRef.current) materialRef.current.uTime += delta * speed * 2.0;
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -50]}>
                <planeGeometry args={[100, 200]} />
                <meshStandardMaterial color="#050510" roughness={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -25]}>
                <planeGeometry args={[50, 100]} />
                {/* @ts-ignore */}
                <gridShaderMaterial ref={materialRef} transparent uColor={new THREE.Color("cyan")} />
            </mesh>
        </group>
    );
}

function Car({ position, steering, speed, color = "#ef4444", isGhost = false }: { position: number, steering: number, speed: number, color?: string, isGhost?: boolean }) {
    const groupRef = useRef<THREE.Group>(null);
    const wheelRefs = useRef<(THREE.Mesh | null)[]>([]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position, isGhost ? 0.1 : 0.2);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -steering * 0.5, 0.1);
            if (!isGhost) groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.02 * (speed > 0 ? 1 : 0);
        }
        wheelRefs.current.forEach(wheel => { if (wheel) wheel.rotation.x += speed * 0.5; });
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Name Tag for Ghost */}
            {isGhost && (
                <Html position={[0, 1.5, 0]} center>
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20 backdrop-blur whitespace-nowrap">
                        OPPONENT
                    </div>
                </Html>
            )}

            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.8, 0.3, 2]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={isGhost ? 0.5 : 1} />
            </mesh>
            <mesh position={[0, 0.6, -0.2]}>
                <boxGeometry args={[0.5, 0.25, 0.8]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
            <group position={[0, 0.8, -1]}>
                <mesh rotation={[0.1, 0, 0]}><boxGeometry args={[1.6, 0.1, 0.4]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
            </group>
            <mesh position={[0, 0.2, 1.2]}><boxGeometry args={[1.5, 0.1, 0.4]} /><meshStandardMaterial color="#1a1a1a" /></mesh>

            {[[0.7, 0.35, 0.8], [-0.7, 0.35, 0.8], [0.7, 0.35, -0.8], [-0.7, 0.35, -0.8]].map((pos, i) => (
                <mesh key={i} position={pos as any} rotation={[0, 0, Math.PI / 2]} ref={el => { wheelRefs.current[i] = el }}>
                    <cylinderGeometry args={[0.35, 0.35, 0.25, 24]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            ))}

            {!isGhost && (
                <Trail width={1.5} length={6} color={new THREE.Color(color).offsetHSL(0, 0, 0.2)} attenuation={(width) => width}>
                    <mesh position={[0.4, 0.4, -1]} visible={false}><boxGeometry args={[0.1, 0.1, 0.1]} /></mesh>
                    <mesh position={[-0.4, 0.4, -1]} visible={false}><boxGeometry args={[0.1, 0.1, 0.1]} /></mesh>
                </Trail>
            )}
        </group>
    );
}

function Obstacles({ obstacles }: { obstacles: any[] }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.children.forEach((mesh) => { mesh.rotation.x += 0.02; mesh.rotation.y += 0.02; });
        }
    });
    return (
        <group ref={groupRef}>
            {obstacles.map(obs => (
                <mesh key={obs.id} position={[obs.x, 0.8, obs.z]}>
                    <octahedronGeometry args={[0.8]} />
                    <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                </mesh>
            ))}
        </group>
    );
}

// --- Main Component ---

export default function F1RacingGame() {
    const [gameState, setGameState] = useState<GameState>('menu');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [sessionCode, setSessionCode] = useState('');
    const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([]);

    const [carColor, setCarColor] = useState('#ef4444');
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Physics
    const carPositionRef = useRef(0);
    const steeringRef = useRef(0);
    const obstaclesRef = useRef<{ id: number, x: number, z: number }[]>([]);

    const [renderTrigger, setRenderTrigger] = useState(0);

    useAudioEngine(gameState === 'playing' && audioEnabled, speed);

    // --- Multiplayer Logic ---

    const startSinglePlayer = () => {
        setPlayerName("Player 1");
        setSessionId(null);
        setPlayerId('single-player');
        setGameState('intro');
    };

    const createSession = async () => {
        if (!playerName) return alert("Enter name first");
        const res = await fetch('/api/games/f1/session', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            setSessionId(data.session.id);
            setSessionCode(data.session.code);
            // Join as host
            joinSession(data.session.id, true);
        } else {
            alert("Failed to create session: " + data.error + "\n\nTRY RESTARTING 'npm run dev' IF THIS PERSISTS.");
        }
    };

    const joinSession = async (id: string, isHost = false) => {
        if (!playerName) return alert("Enter name first");
        const res = await fetch(`/api/games/f1/session/${id}/join`, {
            method: 'POST',
            body: JSON.stringify({ name: playerName, carColor })
        });
        const data = await res.json();
        if (data.success) {
            setPlayerId(data.player.id);
            setSessionId(id);
            setGameState('lobby');
        } else {
            alert(data.error);
        }
    };

    const joinByCode = async () => {
        if (sessionCode) joinSession(sessionCode);
    };

    const startGameAsHost = async () => {
        if (sessionId) {
            // Unblock all players
            await fetch(`/api/games/f1/session/${sessionId}`, {
                method: 'PUT',
                body: JSON.stringify({ sessionStatus: 'RACING' })
            });
        }
        setGameState('intro');
    };

    // Polling State (Lobby & Game)
    useEffect(() => {
        if (!sessionId || (gameState !== 'lobby' && gameState !== 'playing')) return;

        const interval = setInterval(async () => {
            const res = await fetch(`/api/games/f1/session/${sessionId}`);
            const data = await res.json();
            if (data.success) {
                const session = data.session;
                // Update opponents
                const opponents = session.players.filter((p: any) => p.id !== playerId);
                setOpponentPlayers(opponents);

                // Auto-start if host started (checks remote status)
                if (gameState === 'lobby' && session.status === 'RACING') {
                    setGameState('intro');
                }
            }
        }, 1000); // 1s polling
        return () => clearInterval(interval);
    }, [sessionId, gameState, playerId]);

    // Send Updates (Heartbeat)
    useEffect(() => {
        if (gameState !== 'playing' || !playerId || !sessionId) return;

        const interval = setInterval(async () => {
            await fetch(`/api/games/f1/session/${sessionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    playerId,
                    score,
                    speed,
                    status: 'RACING'
                })
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, playerId, sessionId, score, speed]);


    // --- Game Physics Loop ---
    useEffect(() => {
        if (gameState !== 'playing') {
            if (gameState === 'crashed') setSpeed(0);
            return;
        }

        let lastTime = performance.now();
        let animationFrameId: number;

        const loop = (time: number) => {
            const delta = (time - lastTime) / 1000;
            lastTime = time;

            setSpeed(prev => Math.min(prev + 0.0002, 1.5));
            setScore(prev => prev + 1);

            const moveSpeed = 10 * delta;
            carPositionRef.current += steeringRef.current * moveSpeed;
            carPositionRef.current = Math.max(Math.min(carPositionRef.current, TRACK_WIDTH / 2), -TRACK_WIDTH / 2);

            if (Math.random() < OBSTACLE_SPAWN_RATE * (1 + speed)) {
                obstaclesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: (Math.random() * TRACK_WIDTH) - (TRACK_WIDTH / 2),
                    z: -100
                });
            }

            const obstacleSpeed = 30 * (0.5 + speed) * delta;
            obstaclesRef.current.forEach(obs => { obs.z += obstacleSpeed; });
            obstaclesRef.current = obstaclesRef.current.filter(obs => obs.z < 10);

            const carRadius = 0.6;
            const obstacleRadius = 0.6;
            for (const obs of obstaclesRef.current) {
                if (Math.abs(obs.z) < 1) {
                    if (Math.abs(obs.x - carPositionRef.current) < (carRadius + obstacleRadius)) {
                        setGameState('crashed');
                        return;
                    }
                }
            }
            setRenderTrigger(prev => prev + 1);
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState, speed]);

    // Input Handling
    useEffect(() => {
        const keys = { ArrowLeft: false, ArrowRight: false };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
            if (e.key === 'ArrowRight') keys.ArrowRight = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
            if (e.key === 'ArrowRight') keys.ArrowRight = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const interval = setInterval(() => {
            if (gameState === 'playing') {
                if (keys.ArrowLeft) steeringRef.current = Math.max(steeringRef.current - 0.1, -1);
                else if (keys.ArrowRight) steeringRef.current = Math.min(steeringRef.current + 0.1, 1);
                else steeringRef.current *= 0.8;
            }
        }, 16);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            clearInterval(interval);
        };
    }, [gameState]);

    // Intro Sequence
    useEffect(() => {
        if (gameState === 'intro') {
            setTimeout(() => {
                setGameState('playing');
                setSpeed(0.1);
            }, 3000);
        }
    }, [gameState]);

    return (
        <div className="w-full h-full relative bg-gray-900 overflow-hidden select-none font-mono text-white">

            {/* 3D Scene Background */}
            <div className="absolute inset-0 z-0">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 4, 6]} fov={60} rotation={[-0.2, 0, 0]} />
                    <color attach="background" args={['#050510']} />
                    <fog attach="fog" args={['#050510', 10, 60]} />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={2} />
                    <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1 + speed * 5} />

                    <AnimatedTrack speed={gameState === 'playing' ? speed : 0.2} />

                    {/* Render Player Car */}
                    {(gameState === 'playing' || gameState === 'crashed' || gameState === 'intro') && (
                        <Car position={carPositionRef.current} steering={steeringRef.current} speed={speed} color={carColor} />
                    )}

                    {/* Render Opponent Ghosts (Simulated positions for now) -- In real implementation we'd Lerp these */}
                    {gameState === 'playing' && opponentPlayers.map((p, i) => (
                        <Car key={p.id} position={(i + 1) * 2} steering={0} speed={speed * 0.9} color={p.carColor} isGhost />
                    ))}

                    <Obstacles obstacles={obstaclesRef.current} />
                </Canvas>
            </div>

            {/* UI Layer */}
            <div className="absolute inset-0 z-10 p-8 flex flex-col pointer-events-none">

                {/* MENU STATE */}
                {gameState === 'menu' && (
                    <div className="m-auto bg-black/80 backdrop-blur border border-white/10 p-8 rounded-2xl text-center pointer-events-auto max-w-md w-full">
                        <h1 className="text-4xl font-black italic mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            VELOCITY F1
                        </h1>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="ENTER DRIVER NAME"
                                className="w-full bg-white/10 border border-white/20 p-3 rounded text-center text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={createSession}
                                    className="bg-cyan-600 hover:bg-cyan-500 p-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all"
                                >
                                    <Crown size={24} />
                                    HOST RACE
                                </button>
                                <button
                                    onClick={() => setGameState('car_select')}
                                    className="bg-purple-600 hover:bg-purple-500 p-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all"
                                >
                                    <Users size={24} />
                                    JOIN RACE
                                </button>
                            </div>

                            <button
                                onClick={startSinglePlayer}
                                className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg border border-white/10 text-sm font-bold tracking-widest transition-all"
                            >
                                <Play size={16} className="inline mr-2" />
                                SINGLE PLAYER PRACTICE
                            </button>

                            <div className="pt-4 border-t border-white/10">
                                <input
                                    type="text"
                                    placeholder="SESSION ID (FOR JOINING)"
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-xs text-center mb-2"
                                    value={sessionCode}
                                    onChange={e => setSessionCode(e.target.value)}
                                />
                                <button onClick={joinByCode} className="text-xs text-gray-400 hover:text-white underline">
                                    JOIN VIA ID
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CAR SELECT & JOIN STATE */}
                {gameState === 'car_select' && (
                    <div className="m-auto bg-black/80 backdrop-blur border border-white/10 p-8 rounded-2xl text-center pointer-events-auto max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">SETUP RACER</h2>

                        <div className="mb-4 text-left">
                            <label className="text-xs text-gray-400 mb-1 block ml-1">PAINT COLOR</label>
                            <div className="flex justify-center gap-4 mb-8">
                                {['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#eab308'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCarColor(color)}
                                        className={`w-12 h-12 rounded-full border-4 transition-all ${carColor === color ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 text-left">
                            <label className="text-xs text-gray-400 mb-1 block ml-1">SESSION ID (FROM HOST)</label>
                            <input
                                type="text"
                                placeholder="PASTE ID HERE..."
                                className="w-full bg-white/10 border border-white/20 p-3 rounded text-center text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 font-mono"
                                value={sessionCode}
                                onChange={e => setSessionCode(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setGameState('menu')}
                                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl flex-1 font-bold"
                            >
                                BACK
                            </button>
                            <button
                                onClick={() => {
                                    if (!sessionCode) return alert("Please enter Session ID");
                                    joinSession(sessionCode);
                                }}
                                className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl flex-1 font-bold shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                            >
                                JOIN LOBBY
                            </button>
                        </div>
                    </div>
                )}

                {/* LOBBY STATE */}
                {gameState === 'lobby' && (
                    <div className="m-auto bg-black/80 backdrop-blur border border-cyan-500/30 p-8 rounded-2xl text-center pointer-events-auto max-w-lg w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-cyan-400">LOBBY</h2>
                            <div className="flex items-center gap-2">
                                <div className="text-xs bg-cyan-900/50 px-3 py-1 rounded border border-cyan-500/30 font-mono">
                                    ID: {sessionId}
                                </div>
                                <button
                                    onClick={() => {
                                        if (sessionId) navigator.clipboard.writeText(sessionId);
                                        alert("ID reset to clipboard!");
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded text-xs font-bold"
                                >
                                    COPY
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center">
                                <span>{playerName} (YOU)</span>
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_lime]" />
                            </div>
                            {opponentPlayers.map(p => (
                                <div key={p.id} className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center opacity-70">
                                    <span>{p.name}</span>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                </div>
                            ))}
                            {opponentPlayers.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4">Waiting for players to join with ID...</div>
                            )}
                        </div>

                        <button
                            onClick={startGameAsHost}
                            className="w-full bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl font-bold tracking-widest transition-all animate-pulse"
                        >
                            START ENGINE
                        </button>
                    </div>
                )}

                {/* PLAYING HUD */}
                {(gameState === 'playing' || gameState === 'crashed') && (
                    <div className="flex justify-between items-start w-full">
                        <div className="bg-black/50 backdrop-blur border border-red-500/30 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-red-400 mb-1">
                                <Trophy size={18} />
                                <span className="font-bold tracking-widest text-xs">SCORE</span>
                            </div>
                            <div className="text-3xl font-mono text-white tracking-tighter">{score.toLocaleString()}</div>
                        </div>

                        {/* Leaderboard Mini */}
                        <div className="bg-black/50 backdrop-blur border border-white/10 p-4 rounded-xl text-right">
                            <div className="text-xs text-gray-400 mb-2 font-bold tracking-widest">LEADERBOARD</div>
                            <div className="text-sm text-yellow-500 font-bold">1. {playerName} {score}</div>
                            {opponentPlayers.map((p, i) => (
                                <div key={p.id} className="text-sm text-gray-400">{i + 2}. {p.name} {p.score}</div>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'crashed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm pointer-events-auto">
                        <div className="bg-black border border-red-500 p-8 rounded-2xl text-center">
                            <h2 className="text-4xl font-black text-red-500 mb-4">CRASHED</h2>
                            <button onClick={() => setGameState('menu')} className="bg-white text-black px-6 py-2 rounded font-bold">
                                RETURN TO MENU
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
