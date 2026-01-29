import React from "react";

interface TejasKPLogoProps {
    size?: number;
    className?: string;
}

export default function TejasKPLogo({
    size = 48,
    className = "",
}: TejasKPLogoProps) {
    return (
        <svg
            width={size}
            height={size} // Square icon
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                {/* Realistic Metallic Gradient */}
                <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FAFAFA" />
                    <stop offset="40%" stopColor="#D4D4D4" />
                    <stop offset="100%" stopColor="#909090" />
                </linearGradient>

                {/* Depth Shadow Gradient for rays */}
                <linearGradient id="rayGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#E0E0E0" />
                    <stop offset="100%" stopColor="#757575" />
                </linearGradient>
            </defs>

            <g
                fill={className.includes("text-") ? "currentColor" : "url(#metalGrad)"}
                stroke={className.includes("text-") ? "currentColor" : "none"}
            >
                {/* --- Rays --- 
            Designed to look like sharp, realistic light cutouts. 
            Symmetrical arrangement.
        */}

                {/* Top Center Ray */}
                <path d="M50 10 L54 35 L46 35 Z" fill="url(#rayGrad)" />

                {/* Side Rays (Left) */}
                <path d="M38 12 L44 38 L36 40 Z" fill="url(#rayGrad)" />
                <path d="M25 18 L35 44 L28 48 Z" fill="url(#rayGrad)" />
                <path d="M14 28 L28 50 L20 54 Z" fill="url(#rayGrad)" />
                <path d="M6 42 L22 58 L14 62 Z" fill="url(#rayGrad)" />

                {/* Side Rays (Right) - Mirrored */}
                <path d="M62 12 L56 38 L64 40 Z" fill="url(#rayGrad)" />
                <path d="M75 18 L65 44 L72 48 Z" fill="url(#rayGrad)" />
                <path d="M86 28 L72 50 L80 54 Z" fill="url(#rayGrad)" />
                <path d="M94 42 L78 58 L86 62 Z" fill="url(#rayGrad)" />

                {/* --- Half Sun Body --- */}
                <path
                    d="M20 70 
               A 30 30 0 1 1 80 70 
               Z"
                    fill="url(#metalGrad)"
                    stroke="url(#rayGrad)"
                    strokeWidth="1"
                />

                {/* --- Base/Horizon --- */}
                <ellipse cx="50" cy="72" rx="35" ry="3" fill="#616161" opacity="0.5" />
            </g>

            {/* Text - Clean and integrated */}
            <text
                x="50"
                y="66"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                fontSize="7"
                fill="#424242"
                style={{ letterSpacing: "0.5px" }}
            >
                TEJASKP AI
            </text>
        </svg>
    );
}
