"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as random from "maath/random/dist/maath-random.esm";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onComplete, 1000); // Allow exit animation
        }, 4000); // 4 seconds splash
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian text-gold-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1 } }}
                >
                    <div className="absolute inset-0">
                        <Canvas camera={{ position: [0, 0, 1] }}>
                            <Stars />
                        </Canvas>
                    </div>

                    <div className="relative z-10 text-center space-y-4">
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="mb-8"
                        >
                            <img src="/logo.jpg" alt="TEJASKP" className="w-32 h-32 mx-auto rounded-full border-2 border-gold-500 shadow-[0_0_30px_rgba(255,215,0,0.5)] object-cover" />
                        </motion.div>

                        <motion.h1
                            className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                        >
                            WELCOME TO
                            <br />
                            <span className="text-5xl md:text-7xl mt-2 block">TEJASKP AI SOFTWARE</span>
                        </motion.h1>

                        <motion.p
                            className="text-lg md:text-2xl text-gold-200 tracking-[0.5em] font-light"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                        >
                            FEEL THE FUTURE
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Stars(props: any) {
    const ref = useRef<any>(null);
    // Generate random points in a sphere. Must be divisible by 3 (x,y,z)
    const [sphere] = useState(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }));

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#FFD700"
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}
