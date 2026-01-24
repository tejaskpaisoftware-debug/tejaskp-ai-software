"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
        <div className="min-h-screen bg-background text-foreground font-sans pl-64 transition-colors duration-500 relative z-10">
            <AdminSidebar />

            <main className="p-8 space-y-8">
                {/* Header */}
                <header className="flex justify-between items-end border-b border-theme pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-widest">DASHBOARD</h1>
                        <p className="text-gold-theme/60 mt-1">Welcome back, Administrator</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gold-theme">14:39 PM</div>
                        <div className="text-sm text-muted-foreground">Dec 25, 2025</div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatsCard
                        title="Total Users"
                        value={stats.users.toLocaleString()}
                        change={stats.usersGrowth}
                        onClick={() => window.location.href = '/dashboard/admin/users'}
                        className="cursor-pointer hover:border-gold-theme"
                    />
                    <StatsCard title="Active Today" value={stats.activeSessions.toLocaleString()} change="Daily" />
                    <StatsCard
                        title="Total Revenue"
                        value={formatCurrency(stats.revenue)}
                        change={stats.revenueGrowth}
                        isGood
                        onClick={() => window.location.href = '/dashboard/admin/revenue'}
                        className="cursor-pointer hover:border-gold-theme"
                    />
                    <StatsCard title="Pending Amount" value={formatCurrency(stats.pendingAmount || 0)} change="Uncollected" />
                    <StatsCard title="System Health" value="99.9%" change="Stable" isGood />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart Area (Real Data) */}
                    <div className="lg:col-span-2 bg-card border border-theme rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-foreground tracking-wide">REVENUE ANALYTICS ({year})</h3>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="bg-card border border-theme rounded px-2 py-1 text-sm text-gold-theme outline-none focus:border-gold-theme"
                                >
                                    {[2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Small total indicator to confirm data load */}
                            <div className="text-xs text-gold-theme/50 font-mono">
                                Total: {formatCurrency(stats.revenue)}
                            </div>
                        </div>
                        <div className="h-64 mt-4 w-full">
                            <RevenueChart3D
                                data={stats.graph && stats.graph.length > 0 ? stats.graph : new Array(12).fill(0)}
                                year={year}
                            />
                        </div>
                    </div>

                    {/* Right Column: Stacked Widgets */}
                    <div className="flex flex-col gap-6">
                        {/* 1. Live Traffic (Restored) */}
                        <div className="bg-card border border-theme rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden h-[350px]">
                            <div className="absolute top-6 left-6 z-10">
                                <h3 className="text-lg font-bold text-foreground tracking-wide">LIVE TRAFFIC</h3>
                                <p className="text-xs text-gold-theme/60">Real-time Visualization</p>
                            </div>
                            <div className="h-full mt-4">
                                <Canvas>
                                    <ambientLight intensity={0.5} />
                                    <directionalLight position={[10, 10, 5]} />
                                    <Widget3D traffic={stats.activeSessions} />
                                    <OrbitControls enableZoom={false} autoRotate={false} />
                                </Canvas>
                            </div>
                        </div>


                    </div>
                </div >

            </main >
        </div >
    );
}

function StatsCard({ title, value, change, isGood, onClick, className }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`bg-card border border-theme rounded-xl p-6 backdrop-blur-sm shadow-lg hover:border-gold-theme/50 transition-colors ${className}`}
        >
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{title}</h3>
            <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
            <div className={`text-sm ${change?.includes('+') || isGood ? 'text-green-400' : 'text-gold-theme'}`}>
                {change} {change === 'Daily' || change === 'Stable' ? '' : 'from last month'}
            </div>
        </motion.div>
    )
}

function Widget3D({ traffic }: { traffic: number }) {
    // Load texture (ensure logo_texture.jpg is in public folder)
    const texture = useLoader(TextureLoader, "/logo_texture.jpg");
    const meshRef = useRef<THREE.Mesh>(null);

    // Dynamic animation based on traffic
    useFrame((state, delta) => {
        if (meshRef.current) {
            // Base speed + traffic multiplier
            const speed = 0.5 + (traffic * 0.1);
            meshRef.current.rotation.y += delta * speed;

            // Pulse effect
            const scale = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1; // Bigger scale: 2.5 base
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group>
            {/* Bright Lights for clear visibility */}
            <ambientLight intensity={2} />
            <pointLight position={[5, 5, 5]} intensity={1} color="white" />

            <mesh ref={meshRef} rotation={[0, 0, 0]}>
                {/* Bigger Geometry */}
                <boxGeometry args={[1.5, 1.5, 0.05]} />
                <meshStandardMaterial
                    map={texture}
                    metalness={0.1} // Less metallic, more photo-realistic
                    roughness={0.2} // Glossy look
                    emissive="white"
                    emissiveIntensity={0.2} // Self-illuminate slightly so colors pop
                    emissiveMap={texture} // Use texture colors for glow, not yellow tint
                />
            </mesh>
        </group>
    )
}
