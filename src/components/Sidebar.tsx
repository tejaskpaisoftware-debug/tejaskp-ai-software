"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentUser");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const menuItems = [
        { name: "Dashboard", href: "/dashboard/" + (user?.role?.toLowerCase() || 'student'), icon: "📊" },
        { name: "Chat", href: "/dashboard/user/chat", icon: "💬" },
    ];

    if (user?.role === 'STUDENT') {
        menuItems.push({ name: "Weekly Submissions", href: "/dashboard/student/submissions", icon: "upload" });
    }

    const handleLogout = async () => {
        try {
            if (user) {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id })
                });
            }
        } catch (e) { console.error(e); }
        sessionStorage.removeItem("currentUser");
        sessionStorage.clear();
        router.push("/login");
    };

    return (
        <div className="w-64 bg-charcoal/50 backdrop-blur-xl border-r border-gold-500/20 h-screen fixed left-0 top-0 flex flex-col p-6 z-50">
            <div className="flex items-center gap-3 mb-10">
                <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-gold-500" />
                <span className="text-xl font-bold text-gold-500 tracking-wider">TEJASKP</span>
            </div>

            <nav className="space-y-2 flex-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive ? "bg-gold-500 text-obsidian font-bold shadow-lg" : "text-gray-400 hover:text-gold-300 hover:bg-white/5"}`}
                                whileHover={{ x: 5 }}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-sm tracking-wide">{item.name}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-gold-500/10">
                <div className="flex items-center gap-3 p-3 bg-obsidian/40 rounded-lg mb-4">
                    <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-obsidian font-bold text-xs">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{user?.name}</div>
                        <div className="text-[10px] text-green-400 uppercase">{user?.role}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all font-medium text-sm"
                >
                    🚪 Log Out
                </button>
            </div>
        </div>
    );
}
