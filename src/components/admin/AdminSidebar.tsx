"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Mail,
    Users,
    Clock,
    CalendarOff,
    CheckSquare,
    ShieldCheck,
    FolderArchive,
    FileText,
    Award,
    Briefcase,
    CreditCard,
    UploadCloud,
    FileCheck,
    FileCode,
    UserPlus,
    DollarSign,
    Receipt,
    FileSpreadsheet,
    Megaphone,
    BarChart3,
    TrendingUp,
    MessageSquare,
    Video,
    Gift,
    Bot,
    ShieldAlert,
    Settings,
    ChevronDown,
    LogOut,
    Sparkles,
    X
} from "lucide-react";

interface MenuItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    special?: boolean;
    subItems?: {
        name: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
    }[];
}

const menuItems: MenuItem[] = [
    { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Mail Server", href: "/dashboard/admin/mailbox", icon: Mail },
    {
        name: "Users",
        href: "#",
        icon: Users,
        subItems: [
            { name: "All Users", href: "/dashboard/admin/users", icon: Users },
            { name: "Register New User", href: "/dashboard/admin/register", icon: UserPlus },
            { name: "Attendance", href: "/dashboard/admin/attendance", icon: Clock },
            { name: "Leaves", href: "/dashboard/admin/leaves", icon: CalendarOff },
            { name: "Tasks", href: "/dashboard/admin/tasks", icon: CheckSquare },
            { name: "Admin Validation", href: "/dashboard/admin/validation", icon: ShieldCheck },
        ]
    },
    {
        name: "Documents",
        href: "#",
        icon: FolderArchive,
        subItems: [
            { name: "Joining Letter", href: "/dashboard/admin/documents/joining-letter", icon: FileText },
            { name: "Completion Certificate", href: "/dashboard/admin/documents/certificate", icon: Award },
            { name: "Experience Certificate", href: "/dashboard/admin/documents/experience-certificate", icon: Briefcase },
            { name: "Salary Slip", href: "/dashboard/admin/documents/salary-slip", icon: CreditCard },
            { name: "Weekly Submissions", href: "/dashboard/admin/submissions", icon: UploadCloud },
            { name: "NOC Submissions", href: "/dashboard/admin/documents/noc", icon: FileCheck },
            { name: "Assessment Submissions", href: "/dashboard/admin/documents/assessment", icon: FileCode },
        ]
    },
    { name: "Payroll Automation", href: "/dashboard/admin/payroll", icon: DollarSign },
    { name: "Billing", href: "/dashboard/admin/billing", icon: Receipt },
    { name: "Invoices", href: "/dashboard/admin/invoices", icon: FileSpreadsheet },
    { name: "Daily Updates", href: "/dashboard/admin/updates", icon: Megaphone },
    { name: "Reports", href: "/dashboard/admin/reports/attendance", icon: BarChart3 },
    { name: "Revenue", href: "/dashboard/admin/revenue", icon: TrendingUp },
    { name: "Chat Server", href: "/dashboard/admin/chat-server", icon: MessageSquare },
    { name: "Online Meetings", href: "/dashboard/admin/meetings", icon: Video },
    { name: "Referrals", href: "/dashboard/admin/referrals", icon: Gift },
    { name: "TEJASKP AI", href: "/dashboard/admin/ai", icon: Bot, special: true },
    { name: "System Logs", href: "/dashboard/admin/logs", icon: ShieldAlert },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    isDesktopOpen?: boolean;
    toggleDesktop?: () => void;
    width?: number;
    setWidth?: (w: number) => void;
}

export default function AdminSidebar({
    isDesktopOpen = true,
    toggleDesktop,
    width = 260,
    setWidth
}: AdminSidebarProps) {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
        if (pathname.includes("/users") || pathname.includes("/attendance") || pathname.includes("/leaves") || pathname.includes("/tasks") || pathname.includes("/validation")) {
            return "Users";
        }
        if (pathname.includes("/documents") || pathname.includes("/submissions")) {
            return "Documents";
        }
        return "Users";
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [userRole, setUserRole] = useState<string>("ADMIN");
    const [userName, setUserName] = useState<string>("Admin User");

    useEffect(() => {
        try {
            const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "ADMIN");
                setUserName(user.name || "Admin User");
            }
        } catch (e) {
            console.error("Error reading role", e);
        }
    }, []);

    // Filter menu items based on ROLE
    const filteredMenuItems = menuItems.map(item => {
        if (userRole === "TEAM_LEAD") {
            const forbiddenTopLevel = ["Payroll Automation", "Billing", "Invoices", "Revenue", "System Logs", "Settings"];
            if (forbiddenTopLevel.includes(item.name)) return null;

            if (item.subItems) {
                const filteredSubs = item.subItems.filter(sub => sub.name !== "Admin Validation");
                return { ...item, subItems: filteredSubs };
            }
        }
        return item;
    }).filter(Boolean) as MenuItem[];

    // Sidebar resize handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !setWidth) return;
            const newWidth = Math.max(240, Math.min(e.clientX, 400));
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
        setOpenSubmenu(prev => prev === name ? null : name);
    };

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
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login?logout=true";
        }
    };

    const isPayDay = new Date().getDate() === 5;

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                style={{ width: isDesktopOpen ? `${width}px` : '0px' }}
                className={`fixed left-0 top-0 h-screen z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-150 ease-out select-none
                    ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full'}
                    ${isDesktopOpen ? 'md:translate-x-0 md:opacity-100' : 'md:-translate-x-full md:opacity-0 md:overflow-hidden'}
                `}
            >
                {/* Drag Handle - Desktop Only */}
                <div
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-500/40 transition-colors z-50 hidden md:flex items-center justify-center group"
                >
                    <div className="h-8 w-1 rounded-full bg-slate-700 group-hover:bg-amber-400"></div>
                </div>

                {/* Header Branding */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                    <Link href="/dashboard/admin" className="flex items-center gap-3 group">
                        <div className="relative">
                            <img
                                src="/logo.jpg"
                                alt="TEJASKP"
                                className="w-9 h-9 rounded-lg object-cover ring-2 ring-amber-500/50 group-hover:ring-amber-400 transition-all shadow-sm"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                        </div>
                        <div>
                            <span className="text-base font-black tracking-wider text-white flex items-center gap-1">
                                TEJASKP <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">AI</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block tracking-tight">Admin Portal</span>
                        </div>
                    </Link>

                    {/* Close Button on Mobile / Desktop Collapse */}
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                setIsMobileOpen(false);
                            } else {
                                toggleDesktop?.();
                            }
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Collapse sidebar"
                    >
                        <X className="w-4 h-4 md:hidden" />
                        <span className="hidden md:inline text-xs text-slate-400 hover:text-white">◀</span>
                    </button>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isDirectActive = pathname === item.href;
                        const isChildActive = hasSubItems && item.subItems?.some(sub => pathname === sub.href);
                        const isOpen = openSubmenu === item.name;

                        if (hasSubItems) {
                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group
                                            ${isChildActive || isOpen
                                                ? "bg-slate-800/80 text-white"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-4 h-4 ${isChildActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                            <span className="font-semibold">{item.name}</span>
                                        </div>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-400" : ""}`}
                                        />
                                    </button>

                                    {/* Submenu List */}
                                    {isOpen && (
                                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-slate-800 ml-5">
                                            {item.subItems?.map((sub) => {
                                                const SubIcon = sub.icon;
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                                                            ${isSubActive
                                                                ? "bg-amber-500/10 text-amber-400 font-semibold border-l-2 border-amber-500 pl-2"
                                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                            }`}
                                                    >
                                                        <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-amber-400' : 'text-slate-500'}`} />
                                                        <span>{sub.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Top level link
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group
                                    ${item.special
                                        ? "bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/50"
                                        : isDirectActive
                                            ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 ${isDirectActive ? 'text-slate-950 font-bold' : item.special ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                    <span>{item.name}</span>
                                </div>

                                {item.name === "Payroll Automation" && isPayDay && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Payday active" />
                                )}
                                {item.special && (
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Profile and Logout Section */}
                <div className="p-3 border-t border-slate-800 shrink-0 space-y-2">
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-amber-400 font-medium tracking-tight uppercase truncate">
                                {userRole.replace('_', ' ')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
