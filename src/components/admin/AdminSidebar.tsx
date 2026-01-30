"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

const menuItems = [
    { name: "Overview", href: "/dashboard/admin", icon: "📊" },
    { name: "Mail Server", href: "/dashboard/admin/mailbox", icon: "📧" },
    {
        name: "Users",
        href: "#", // Parent doesn't navigate, toggles
        icon: "👥",
        subItems: [
            { name: "All Users", href: "/dashboard/admin/users", icon: "👥" },
            { name: "Attendance", href: "/dashboard/admin/attendance", icon: "🕒" },
            { name: "Leaves", href: "/dashboard/admin/leaves", icon: "🌴" },
            { name: "Tasks", href: "/dashboard/admin/tasks", icon: "📋" },
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
            { name: "NOC Submissions", href: "/dashboard/admin/documents/noc", icon: "📄" },
            { name: "Assessment Submissions", href: "/dashboard/admin/documents/assessment", icon: "📝" },
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
    width?: number;
    setWidth?: (w: number) => void;
}

export default function AdminSidebar({ isDesktopOpen = true, toggleDesktop, width = 260, setWidth }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>("Users");
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Sidebar resize handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !setWidth) return;
            const newWidth = Math.max(240, Math.min(e.clientX, 480)); // Min 240px, Max 480px
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setWidth]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

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
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] bg-gradient-to-b from-yellow-400 to-yellow-600 text-black p-2.5 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all border border-yellow-500/50"
            >
                {isMobileOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                )}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[45] md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}


            {/* Desktop Open Button (Visible when sidebar is closed) */}
            {!isDesktopOpen && (
                <button
                    onClick={toggleDesktop}
                    className="hidden md:flex fixed top-4 left-4 z-[40] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/10 p-2.5 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-yellow-500/30 text-yellow-500 items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                    title="Open Sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:text-yellow-400"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            )}

            <div
                style={{ width: isDesktopOpen ? `${width}px` : '0px' }}
                className={`bg-gradient-to-b from-[#1a1a1a] via-[#111111] to-black backdrop-blur-2xl border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col p-6 z-50 transition-all duration-75 shadow-[10px_0_30px_rgba(0,0,0,0.5)]
                ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
                ${isDesktopOpen ? 'md:translate-x-0 md:opacity-100' : 'md:-translate-x-full md:opacity-0 md:overflow-hidden'}
            `}>

                {/* Drag Handle - Desktop Only */}
                <div
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-yellow-500/50 transition-colors z-[60] group hidden md:flex items-center justify-center"
                >
                    <div className="h-8 w-1 rounded-full bg-gray-600/50 group-hover:bg-yellow-400 shadow-[0_1px_2px_rgba(0,0,0,0.8)]"></div>
                </div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative">
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                            <img src="/logo.jpg" alt="Logo" className="relative w-11 h-11 rounded-full border-2 border-yellow-400 shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                        </div>
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] filter contrast-125">TEJASKP</span>
                    </div>

                    {/* Collapse/Close Button */}
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                setIsMobileOpen(false);
                            } else {
                                toggleDesktop?.();
                            }
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#2a2a2a] to-black border border-white/10 shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-yellow-500/50 hover:text-yellow-400 text-gray-400 transition-all active:scale-95 group/btn"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md group-hover/btn:drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                </div>

                <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-900/20 scrollbar-track-transparent">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = openSubmenu === item.name;
                        const isChildActive = hasSubItems && item.subItems?.some(sub => pathname === sub.href);

                        return (
                            <div key={item.name} className="mb-1">
                                {hasSubItems ? (
                                    <motion.div
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border border-transparent
                                            ${isChildActive || isOpen
                                                ? "bg-white/5 border-white/10 text-yellow-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
                                                : "text-gray-400 hover:text-yellow-200 hover:bg-white/5"
                                            }`}
                                        whileHover={{ x: 3 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl filter drop-shadow-md">{item.icon}</span>
                                            <span className="text-sm tracking-wide font-bold">{item.name}</span>
                                        </div>
                                        <span className={`text-xs transition-transform duration-300 ${isOpen ? 'rotate-180 text-yellow-500' : 'text-gray-600'}`}>▼</span>
                                    </motion.div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                                ${item.special
                                                ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 text-purple-200 shadow-[0_4px_15px_rgba(147,51,234,0.2)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                                                : isActive
                                                    ? 'bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 text-black font-extrabold shadow-[0_4px_12px_rgba(234,179,8,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] border border-yellow-400/50 transform translate-y-[-1px]'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5 active:scale-98'
                                            }`}
                                    >
                                        {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none"></div>}
                                        <span className={`text-xl relative z-10 ${item.special ? 'animate-pulse' : ''} ${isActive ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]' : 'drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]'}`}>{item.icon}</span>
                                        <span className={`relative z-10 ${isActive ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]' : ''}`}>{item.name}</span>
                                        {item.name === "Payroll Automation" && isPayDay && (
                                            <span className="ml-auto w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse border border-red-300"></span>
                                        )}
                                    </Link>
                                )}

                                {/* Submenu Items */}
                                {hasSubItems && isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="ml-4 mt-2 mb-2 space-y-1 border-l-2 border-white/5 pl-4 overflow-hidden"
                                    >
                                        {item.subItems?.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link key={sub.name} href={sub.href}>
                                                    <div className={`py-2.5 px-3 rounded-lg text-sm transition-all duration-200 border border-transparent 
                                                        ${isSubActive
                                                            ? "bg-white/10 text-yellow-400 font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border-white/5"
                                                            : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
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

                <div className="pt-6 relative">
                    <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#222] to-black rounded-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] mb-4 group hover:border-yellow-900/30 transition-colors">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-800 flex items-center justify-center text-black font-black border border-yellow-400/30 shadow-inner">
                                AD
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">Admin User</div>
                            <div className="text-xs text-green-400 font-medium">● Online</div>
                        </div>
                    </div>

                    <motion.button
                        onClick={handleLogout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-b from-red-600 to-red-800 text-white border border-red-500/30 shadow-[0_4px_8px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-red-500 hover:to-red-700 transition-all font-bold text-sm"
                    >
                        <span className="drop-shadow-md">🚪 Log Out</span>
                    </motion.button>
                </div>
            </div>
        </>
    );
}
