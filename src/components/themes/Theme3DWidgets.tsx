"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Float, Environment } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

function SunMesh({ isAngry }: { isAngry: boolean }) {
    const meshRef = useRef<THREE.Group>(null);
    const texture = useTexture("/assets/images/theme-sun.png");
    texture.center.set(0.5, 0.5);

    useFrame((state, delta) => {
        if (meshRef.current) {
            const speed = isAngry ? 5 : 0.5;
            meshRef.current.rotation.y += delta * speed;

            if (isAngry) {
                meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.2;
                meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.1;
            } else {
                meshRef.current.rotation.z = 0;
                meshRef.current.rotation.x = Math.PI / 2;
            }
        }
    });

    return (
        <group ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
                <cylinderGeometry args={[1.8, 1.8, 0.15, 64]} />
                <meshStandardMaterial
                    attach="material-0"
                    color={isAngry ? "#ff0000" : "#FFD700"}
                    metalness={1}
                    roughness={0.1}
                />
                <meshStandardMaterial
                    attach="material-1"
                    map={texture}
                    transparent
                    opacity={1}
                    emissive={isAngry ? "#ff0000" : "#ffffff"}
                    emissiveMap={texture}
                    emissiveIntensity={isAngry ? 2 : 0.5}
                />
                <meshStandardMaterial
                    attach="material-2"
                    map={texture}
                    transparent
                    opacity={1}
                    emissive={isAngry ? "#ff0000" : "#ffffff"}
                    emissiveMap={texture}
                    emissiveIntensity={isAngry ? 2 : 0.5}
                />
            </mesh>
        </group>
    );
}

function MoonMesh({ isAngry }: { isAngry: boolean }) {
    const meshRef = useRef<THREE.Group>(null);
    const texture = useTexture("/assets/images/theme-moon.png");
    texture.center.set(0.5, 0.5);

    useFrame((state, delta) => {
        if (meshRef.current) {
            const speed = isAngry ? 5 : 0.2;
            meshRef.current.rotation.y -= delta * speed;

            if (isAngry) {
                meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.1;
            } else {
                meshRef.current.rotation.z = 0;
                meshRef.current.rotation.x = Math.PI / 2;
            }
        }
    });

    return (
        <group ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
                <cylinderGeometry args={[1.8, 1.8, 0.15, 64]} />
                <meshStandardMaterial
                    attach="material-0"
                    color={isAngry ? "#8B0000" : "#C0C0C0"}
                    metalness={0.9}
                    roughness={0.2}
                />
                <meshStandardMaterial
                    attach="material-1"
                    map={texture}
                    transparent
                    opacity={1}
                    emissive={isAngry ? "#ff0000" : "#ffffff"}
                    emissiveMap={texture}
                    emissiveIntensity={isAngry ? 2 : 0.2}
                />
                <meshStandardMaterial
                    attach="material-2"
                    map={texture}
                    transparent
                    opacity={1}
                    emissive={isAngry ? "#ff0000" : "#ffffff"}
                    emissiveMap={texture}
                    emissiveIntensity={isAngry ? 2 : 0.2}
                />
            </mesh>
        </group>
    );
}

export function MoonWidget() {
    const [clicks, setClicks] = useState(0);
    const isActive = clicks >= 3;

    return (
        <>
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ x: 0, y: 0 }}
                onClick={() => setClicks(c => c >= 3 ? 0 : c + 1)}
                className={`fixed top-10 right-10 z-50 cursor-grab active:cursor-grabbing pointer-events-auto transition-all duration-500 w-28 h-28
                    ${isActive ? "drop-shadow-[0_0_80px_rgba(255,0,0,0.8)]" : "drop-shadow-[0_0_30px_rgba(200,200,255,0.3)]"}
                `}
                style={{ pointerEvents: "auto", touchAction: "none" }}
            >
                <Canvas
                    camera={{ position: [0, 0, 6], fov: 45 }}
                    gl={{ alpha: true }}
                    style={{ pointerEvents: "none" }}
                >
                    <ambientLight intensity={0.2} />
                    <pointLight position={[-10, 10, 10]} intensity={1.5} color="#aaccff" />
                    <Environment preset="night" />
                    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                        <MoonMesh isAngry={isActive} />
                    </Float>
                </Canvas>
            </motion.div>

            {isActive && (
                <div className="fixed inset-0 z-40 bg-red-900/10 pointer-events-none mix-blend-overlay animate-pulse" />
            )}
        </>
    );
}

export function AngrySun() {
    const [clicks, setClicks] = useState(0);
    const isAngry = clicks >= 3;

    return (
        <>
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ x: 0, y: 0 }}
                onClick={() => setClicks(c => c >= 3 ? 0 : c + 1)}
                className={`fixed top-10 right-10 z-50 cursor-grab active:cursor-grabbing pointer-events-auto transition-all duration-500 w-28 h-28
                    ${isAngry ? "drop-shadow-[0_0_80px_rgba(255,0,0,1)]" : "drop-shadow-[0_0_50px_rgba(255,215,0,0.8)]"}
                `}
                style={{ pointerEvents: "auto", touchAction: "none" }}
            >
                <Canvas
                    camera={{ position: [0, 0, 6], fov: 45 }}
                    gl={{ alpha: true }}
                    style={{ pointerEvents: "none" }}
                >
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 10, 10]} intensity={2} />
                    <Environment preset="city" />
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <SunMesh isAngry={isAngry} />
                    </Float>
                </Canvas>
            </motion.div>

            {isAngry && (
                <div className="fixed inset-0 z-40 heat-overlay pointer-events-none mix-blend-overlay" />
            )}
        </>
    );
}
