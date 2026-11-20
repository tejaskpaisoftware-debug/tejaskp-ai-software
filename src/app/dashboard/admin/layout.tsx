"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopNavbar from "@/components/admin/AdminTopNavbar";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(260);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
            {/* Sidebar */}
            <AdminSidebar
                isDesktopOpen={isSidebarOpen}
                toggleDesktop={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
            />

            {/* Content Wrapper */}
            <div
                className="flex-1 flex flex-col transition-all duration-150 ease-out min-h-screen"
                style={{
                    paddingLeft: isSidebarOpen ? `${sidebarWidth}px` : '0px'
                }}
            >
                {/* Global Admin Top Header */}
                <AdminTopNavbar
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Page Content Viewport */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>

                {/* Subtle Global Admin Footer */}
                <footer className="py-4 px-6 border-t border-slate-200/80 bg-white/50 text-center text-xs text-slate-500 flex items-center justify-between">
                    <span>TEJASKP Management Portal &bull; Enterprise Edition</span>
                    <span className="text-[11px] text-slate-400">Version 2.4 &bull; All systems secure</span>
                </footer>
            </div>
        </div>
    );
}
