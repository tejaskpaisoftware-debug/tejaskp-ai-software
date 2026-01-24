"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
    { name: "Overview", href: "/dashboard/admin", icon: "📊" },
    {
        name: "Users",
        href: "#", // Parent doesn't navigate, toggles
        icon: "👥",
        subItems: [
            { name: "All Users", href: "/dashboard/admin/users", icon: "👥" },
            { name: "Attendance", href: "/dashboard/admin/attendance", icon: "🕒" },
            { name: "Leaves", href: "/dashboard/admin/leaves", icon: "🌴" },
        ]
    },
    {
        name: "Documents",
        href: "#",
        icon: "📂",
        subItems: [
            { name: "Joining Letter", href: "/dashboard/admin/documents/joining-letter", icon: "✉️" },
            { name: "Experience Certificate", href: "/dashboard/admin/documents/certificate", icon: "🏅" },
            { name: "Salary Slip", href: "/dashboard/admin/documents/salary-slip", icon: "💳" },
            { name: "Weekly Submissions", href: "/dashboard/admin/submissions", icon: "upload" },
        ]
    },
    { name: "Register New", href: "/dashboard/admin/register", icon: "📝" },
    { name: "Payroll Automation", href: "/dashboard/admin/payroll", icon: "💸" },
    { name: "Billing", href: "/dashboard/admin/billing", icon: "🧾" },
    { name: "Invoices", href: "/dashboard/admin/invoices", icon: "📄" },
    { name: "Daily Updates", href: "/dashboard/admin/updates", icon: "📢" },
    { name: 'Reports', href: '/dashboard/admin/reports', icon: '📊' },
    { name: "Revenue", href: "/dashboard/admin/revenue", icon: "💰" },
    { name: "Chat Server", href: "/dashboard/admin/chat-server", icon: "💬" },
    { name: "Online Meetings", href: "/dashboard/admin/meetings", icon: "📹" },
    { name: "Referrals", href: "/dashboard/admin/referrals", icon: "🎁" },
    { name: 'TEJASKP AI', href: '/dashboard/admin/ai', icon: '🧠', special: true },
    { name: "System Logs", href: "/dashboard/admin/logs", icon: "🛡️" },
    { name: "Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
];

interface AdminSidebarProps {
    isDesktopOpen?: boolean;
    toggleDesktop?: () => void;
}

export default function AdminSidebar({ isDesktopOpen = true, toggleDesktop }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>("Users"); // Default open for visibility

    const toggleSubmenu = (name: string) => {
        setOpenSubmenu(openSubmenu === name ? null : name);
    };

    const handleLogout = async () => {
        try {
            // Attempt to get user ID for attendance logging, but don't block logout if missing
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
            let userId = null;
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    userId = user.id;
                } catch (e) { console.error("Error parsing user for logout", e); }
            }

            // ALWAYS call the logout endpoint to clear cookies
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userId })
            });

        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.removeItem("user");
            localStorage.removeItem("currentUser");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("currentUser");
            sessionStorage.clear();
            // Force hard reload to clear cache with logout flag
            window.location.href = "/login?logout=true";
        }
    };

    // Check for Pay Day (5th of month)
    const isPayDay = new Date().getDate() === 5;

    return (

        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setOpenSubmenu(openSubmenu === 'MOBILE_OPEN' ? null : 'MOBILE_OPEN')}
                className="md:hidden fixed top-4 right-4 z-[60] bg-gold-500 text-black p-2 rounded-lg shadow-lg"
            >
                {openSubmenu === 'MOBILE_OPEN' ? '✕' : '☰'}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {openSubmenu === 'MOBILE_OPEN' && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[45] md:hidden"
                    onClick={() => setOpenSubmenu(null)}
                />
            )}


            {/* Desktop Open Button (Visible when sidebar is closed) */}
            {!isDesktopOpen && (
                <button
                    onClick={toggleDesktop}
                    className="hidden md:flex fixed top-4 left-4 z-[40] bg-background border border-theme p-2 rounded-lg shadow-xl hover:border-gold-theme text-gold-theme items-center justify-center transition-all hover:scale-105"
                    title="Open Sidebar"
                >
                    <span className="text-xl">☰</span>
                </button>
            )}

            <div className={`w-64 bg-background/95 backdrop-blur-xl border-r border-theme h-screen fixed left-0 top-0 flex flex-col p-6 z-50 transition-transform duration-300
                ${openSubmenu === 'MOBILE_OPEN' ? 'translate-x-0' : '-translate-x-full'}
                ${isDesktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
            `}>
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-gold-theme" />
                        <span className="text-xl font-bold text-gold-theme tracking-wider">TEJASKP</span>
                    </div>
                    {/* Desktop Collapse Button (Inside Panel) */}
                    <button onClick={toggleDesktop} className="hidden md:block text-gold-theme hover:bg-white/10 p-2 rounded-lg">
                        ☰
                    </button>
                </div>

                <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = openSubmenu === item.name;

                        // Check if any child is active to highlight parent
                        const isChildActive = hasSubItems && item.subItems?.some(sub => pathname === sub.href);

                        return (
                            <div key={item.name}>
                                {hasSubItems ? (
                                    <motion.div
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${isChildActive || isOpen ? "text-gold-theme bg-foreground/5" : "text-muted-foreground hover:text-gold-theme/80 hover:bg-foreground/5"
                                            }`}
                                        whileHover={{ x: 5 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="text-sm tracking-wide font-bold">{item.name}</span>
                                        </div>
                                        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                                    </motion.div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                                ${item.special
                                                ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                                                : isActive
                                                    ? 'bg-gold-theme text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)]'
                                                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-gold-theme'
                                            }`}
                                    >
                                        <span className={`text-xl ${item.special ? 'animate-pulse' : ''}`}>{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                        {item.name === "Payroll Automation" && isPayDay && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        )}
                                    </Link>
                                )}

                                {/* Submenu Items */}
                                {hasSubItems && isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="ml-8 mt-1 space-y-1 border-l border-theme pl-4"
                                    >
                                        {item.subItems?.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link key={sub.name} href={sub.href}>
                                                    <div className={`py-2 text-sm transition-colors ${isSubActive ? "text-gold-theme font-bold" : "text-muted-foreground hover:text-gold-theme/80"
                                                        }`}>
                                                        {sub.name}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="pt-6 border-t border-theme space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg border border-theme">
                        <div className="w-10 h-10 rounded-full bg-gold-theme flex items-center justify-center text-black font-bold">
                            AD
                        </div>
                        <div>
                            <div className="text-sm font-bold text-foreground">Admin User</div>
                            <div className="text-xs text-green-400">● Online</div>
                        </div>
                    </div>

                    <motion.button
                        onClick={handleLogout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all font-medium text-sm"
                    >
                        🚪 Log Out
                    </motion.button>
                </div>
            </div>
        </>
    );
}
