"use client";

import { usePathname } from "next/navigation";

export default function Header({ title }: { title?: string }) {
    const pathname = usePathname();
    // Default title based on path if not provided
    const displayTitle = title || pathname.split('/').pop()?.toUpperCase() || "DASHBOARD";

    return (
        <header className="flex justify-between items-center py-4 pr-8 border-b border-gold-500/10">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-widest uppercase">{displayTitle}</h1>
                <p className="text-gold-500/60 text-sm">Welcome to your secure portal</p>
            </div>
            {/* Optional right side content like notifications or user profile snippet if needed in future */}
        </header>
    );
}
