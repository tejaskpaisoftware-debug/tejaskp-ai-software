"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500 relative z-10 flex">
            {/* Sidebar with props */}
            <AdminSidebar
                isDesktopOpen={isSidebarOpen}
                toggleDesktop={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content Area */}
            {/* Logic: if sidebar is open, padding left is 64 (16rem/256px), else 0 or small icon width */}
            {/* Actually AdminSidebar expands to 64. If collapsed, maybe 0. */}
            <main className={`flex-1 p-8 space-y-8 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}>
                {/* Desktop Toggle Button (External to Sidebar, optional) */}
                {/* Or we put the toggle INSIDE the sidebar header */}

                {children}
            </main>
        </div>
    );
}
