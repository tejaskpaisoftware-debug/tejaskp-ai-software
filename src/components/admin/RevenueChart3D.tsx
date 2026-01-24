"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";

function Bar({ value, max, index, year }: { value: number, max: number, index: number, year: number }) {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // Animate height
    const targetHeight = (value / max) * 5; // Scale to decent 3D height
    const height = Math.max(0.1, targetHeight); // Ensure at least distinct flat bar if 0

    useFrame((state, delta) => {
        if (mesh.current) {
            // Smooth lerp for height animation
            mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, height, delta * 3);
            // Position y needs to be half of height to sit on 'floor'
            mesh.current.position.y = (mesh.current.scale.y) / 2;
        }
    });

    const monthName = new Date(0, index).toLocaleString('default', { month: 'short' });

    return (
        <group position={[index * 0.8 - 4.5, 0, 0]}> {/* Spacing bars apart */}
            <mesh
                ref={mesh}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[0.5, 1, 0.5]} /> {/* Base size, scaled by Y */}
                <meshStandardMaterial
                    color={hovered ? "#fbbf24" : "#eab308"} // Gold/Yellow theme
                    metalness={0.6}
                    roughness={0.2}
                    emissive={hovered ? "#fbbf24" : "#000000"}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Label */}
            <Text
                position={[0, -0.5, 0.5]}
                fontSize={0.25}
                color="#808080"
                anchorX="center"
                anchorY="middle"
            >
                {monthName}
            </Text>

            {/* Tooltip */}
            {hovered && (
                <Html position={[0, height + 0.5, 0]} center>
                    <div className="px-2 py-1 bg-black/80 text-yellow-400 text-xs rounded border border-yellow-500/50 whitespace-nowrap backdrop-blur-md">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function RevenueChart3D({ data, year }: { data: number[], year: number }) {
    const max = useMemo(() => Math.max(...(data.length ? data : [100000])) || 100000, [data]);

    return (
        <Canvas camera={{ position: [0, 4, 8], fov: 45 }} shadows dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            <group position={[0, -1.5, 0]}>
                {data.map((val, i) => (
                    <Bar key={`bar-${i}-${year}`} value={val} max={max} index={i} year={year} />
                ))}
            </group>

            <OrbitControls
                enableZoom={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
                maxAzimuthAngle={Math.PI / 6}
                minAzimuthAngle={-Math.PI / 6}
            />
        </Canvas>
    );
}
