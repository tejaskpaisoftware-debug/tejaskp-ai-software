"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader } from "three";
import { useRef } from "react";
import * as THREE from "three";

import RevenueChart3D from "@/components/admin/RevenueChart3D";



export default function AdminDashboard() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({
        revenue: 0,
        users: 0,
        pendingAmount: 0,
        activeSessions: 0,
        revenueGrowth: "---",
        usersGrowth: "---",
        graph: [] as number[] // Monthly revenue array
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format time: 14:39
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Format AM/PM
    const amPm = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).slice(-2);

    // Format date: Dec 25, 2025
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/admin/dashboard/stats?year=${year}`);
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            }
        };
        fetchStats();
    }, [year]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-background text-foreground font-sans transition-colors duration-500 relative z-10 w-full">

            <main className="p-8 space-y-8">
                {/* Header */}
                {/* Header */}
                <header className="flex justify-between items-end border-b border-white/10 pb-6 relative">
                    {/* Glowing line at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>

                    <div>
                        <h1 className="text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 drop-shadow-[0_4px_3px_rgba(0,0,0,0.5)] filter contrast-125 pb-2">
                            DASHBOARD
                        </h1>
                        <p className="text-lg font-medium text-gray-400 tracking-wide mt-1 flex items-center gap-2">
                            Welcome back, <span className="text-yellow-400 font-bold drop-shadow-sm">Administrator</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                            {formattedTime} <span className="text-lg text-yellow-500 align-top mt-1 inline-block">{amPm}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-500 tracking-widest uppercase mt-1">
                            {formattedDate}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatsCard
                        title="Total Users"
                        value={stats.users.toLocaleString()}
                        change={stats.usersGrowth || "+0%"}
                        onClick={() => window.location.href = '/dashboard/admin/users'}
                        isClickable
                    />
                    <StatsCard
                        title="Active Today"
                        value={stats.activeSessions.toLocaleString()}
                        change="Daily"
                        onClick={() => window.location.href = '/dashboard/admin/attendance'}
                        isClickable
                    />
                    <StatsCard
                        title="Total Revenue"
                        value={formatCurrency(stats.revenue)}
                        change={stats.revenueGrowth}
                        isGood
                        onClick={() => window.location.href = '/dashboard/admin/revenue'}
                        isClickable
                        highlight
                    />
                    <StatsCard title="Pending Amount" value={formatCurrency(stats.pendingAmount || 0)} change="Uncollected" />
                    <StatsCard title="System Health" value="99.9%" change="Stable" isGood />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart Area (Real Data) */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[0_8px_16px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-x-12 translate-x-full group-hover:animate-shine"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-wide drop-shadow-sm">REVENUE ANALYTICS ({year})</h3>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-1 text-sm text-yellow-500 font-bold outline-none focus:border-yellow-500/50 shadow-inner"
                                >
                                    {[2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Small total indicator to confirm data load */}
                            <div className="text-xs text-yellow-500/70 font-mono bg-black/40 px-3 py-1 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                Total: {formatCurrency(stats.revenue)}
                            </div>
                        </div>
                        <div className="h-64 mt-4 w-full relative z-10">
                            <RevenueChart3D
                                data={stats.graph && stats.graph.length > 0 ? stats.graph : new Array(12).fill(0)}
                                year={year}
                            />
                        </div>
                    </div>

                    {/* Right Column: Stacked Widgets */}
                    <div className="flex flex-col gap-6">
                        {/* 1. Live Traffic */}
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[0_8px_16px_rgba(0,0,0,0.5)] relative overflow-hidden h-[350px] group">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
                            <div className="absolute top-6 left-6 z-10">
                                <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">LIVE TRAFFIC</h3>
                                <p className="text-xs text-yellow-500/80 font-medium">Real-time Visualization</p>
                            </div>
                            <div className="h-full mt-4 relative z-0">
                                <Canvas>
                                    <ambientLight intensity={0.5} />
                                    <directionalLight position={[10, 10, 5]} />
                                    <Widget3D traffic={stats.activeSessions} />
                                    <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={2} />
                                </Canvas>
                            </div>
                        </div>
                    </div>
                </div >

            </main >
        </div >
    );
}

function StatsCard({ title, value, change, isGood, onClick, isClickable, highlight, className }: any) {
    return (
        <motion.div
            whileHover={isClickable ? { y: -5, scale: 1.02 } : {}}
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-300
                ${isClickable ? 'cursor-pointer' : ''}
                ${highlight
                    ? 'bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                    : 'bg-gradient-to-br from-[#1e1e1e] to-[#0a0a0a] border border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:border-white/20'
                }
                ${className}
            `}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <div className={`w-16 h-16 rounded-full blur-2xl ${highlight ? 'bg-yellow-500' : 'bg-white'}`}></div>
            </div>

            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${highlight ? 'text-yellow-200' : 'text-gray-400'}`}>{title}</h3>

            <div className={`text-3xl font-black mb-3 drop-shadow-md ${highlight ? 'text-yellow-400' : 'text-white'}`}>
                {value}
            </div>

            <div className={`flex items-center text-sm font-bold ${change?.toString().includes('+') || isGood
                ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]'
                : change === 'Uncollected'
                    ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]'
                    : 'text-yellow-500'
                }`}>
                {change}
                <span className={`ml-1 font-normal text-xs ${highlight ? 'text-yellow-200/60' : 'text-gray-500'}`}>
                    {change === 'Daily' || change === 'Stable' || change === 'Uncollected' ? '' : 'from last month'}
                </span>
            </div>
        </motion.div>
    )
}

function Widget3D({ traffic }: { traffic: number }) {
    // Load texture (ensure logo_texture.jpg is in public folder)
    const texture = useLoader(TextureLoader, "/logo.jpg"); // Fixed path to logo.jpg which we know exists
    const meshRef = useRef<THREE.Mesh>(null);

    // Dynamic animation based on traffic
    useFrame((state, delta) => {
        if (meshRef.current) {
            // Base speed + traffic multiplier
            // const speed = 0.5 + (traffic * 0.1); 
            // meshRef.current.rotation.y += delta * speed; // OrbitControls handles rotation now for smoother drag

            // Pulse effect
            const scale = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group>
            {/* Bright Lights for clear visibility */}
            <ambientLight intensity={1.5} />
            <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffd700" />
            <spotLight position={[-5, 5, 5]} intensity={1} color="white" />

            <mesh ref={meshRef} rotation={[0, 0, 0]}>
                {/* Cube Geometry */}
                <boxGeometry args={[1.5, 1.5, 0.2]} />
                <meshStandardMaterial
                    map={texture}
                    metalness={0.6} // More metallic
                    roughness={0.2} // Glossy look
                    emissive="#b8860b" // Dark gold glow
                    emissiveIntensity={0.2}
                />
            </mesh>
        </group>
    )
}
