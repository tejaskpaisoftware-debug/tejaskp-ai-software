"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
    Search, Bell, ChevronRight, Menu, 
    User, LogOut, CheckCircle2, Shield, Calendar, Clock,
    HelpCircle, Sparkles, RefreshCw
} from "lucide-react";
import Link from "next/link";

interface AdminTopNavbarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export default function AdminTopNavbar({ toggleSidebar, isSidebarOpen }: AdminTopNavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userName, setUserName] = useState("Admin User");
    const [userRole, setUserRole] = useState("ADMIN");
    const [userEmail, setUserEmail] = useState("admin@tejaskpai.com");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "System Online", desc: "All core services operational", time: "Just now", unread: true },
        { id: 2, title: "Database Synced", desc: "Local PostgreSQL connected", time: "5m ago", unread: false },
        { id: 3, title: "Security Checked", desc: "Biometric and session guard active", time: "1h ago", unread: false },
    ]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u.name) setUserName(u.name);
                if (u.role) setUserRole(u.role);
                if (u.email) setUserEmail(u.email);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Format breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
        // Humanize segment name
        let label = segment.replace(/-/g, ' ');
        if (segment === 'dashboard') label = 'Dashboard';
        else if (segment === 'admin') label = 'Admin';
        else label = label.charAt(0).toUpperCase() + label.slice(1);
        return { label, url, isLast: index === pathSegments.length - 1 };
    });

    const handleLogout = async () => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
            let userId = null;
            if (userStr) {
                try {
                    userId = JSON.parse(userStr).id;
                } catch (e) {}
            }
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login?logout=true";
        }
    };

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 sm:px-6 lg:px-8 py-3 transition-all duration-200">
            <div className="flex items-center justify-between gap-4">
                
                {/* Left: Mobile Toggle + Breadcrumbs */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        aria-label="Toggle navigation"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <Link href="/dashboard/admin" className="hover:text-amber-600 transition-colors font-medium">
                            Portal
                        </Link>
                        {breadcrumbs.map((crumb) => (
                            <div key={crumb.url} className="flex items-center gap-1.5">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                {crumb.isLast ? (
                                    <span className="font-semibold text-slate-800 capitalize truncate">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link href={crumb.url} className="hover:text-amber-600 transition-colors capitalize">
                                        {crumb.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Right: Live Time, Search, Notifications, Admin Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    
                    {/* Live Clock & Date Badge */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-medium text-slate-600">{formattedDate}</span>
                        <span className="text-slate-300">|</span>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-800 font-mono">{formattedTime}</span>
                    </div>

                    {/* Quick Search Shortcut */}
                    <div className="relative hidden md:block">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search portal..."
                            onClick={() => router.push('/dashboard/admin/users')}
                            readOnly
                            className="w-48 xl:w-64 pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200/70 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            ⌘K
                        </span>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            title="Notifications"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-800">Notifications</span>
                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                                        1 unread
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors flex gap-2.5 items-start">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{n.desc}</p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-3 pt-2 border-t border-slate-100 text-center">
                                    <Link href="/dashboard/admin/logs" onClick={() => setShowNotifications(false)} className="text-[11px] font-medium text-amber-600 hover:text-amber-700">
                                        View System Logs
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                    {/* User Profile Pill & Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {userName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                                    {userName}
                                </div>
                                <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wider leading-none mt-0.5">
                                    {userRole.replace('_', ' ')}
                                </div>
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2.5 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                                    <span className="mt-1.5 inline-block text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase">
                                        {userRole.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="py-1 text-xs">
                                    <Link
                                        href="/dashboard/admin/settings"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Account Settings</span>
                                    </Link>
                                    <Link
                                        href="/dashboard/admin/logs"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Activity Logs</span>
                                    </Link>
                                </div>

                                <div className="pt-1 border-t border-slate-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}
