"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(260); // Default width

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500 relative z-10 flex">
            {/* Sidebar with props */}
            <AdminSidebar
                isDesktopOpen={isSidebarOpen}
                toggleDesktop={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
            />

            {/* Main Content Area */}
            <main
                className="flex-1 p-8 space-y-8 transition-all duration-75 ease-out"
                style={{
                    paddingLeft: isSidebarOpen ? `${sidebarWidth}px` : '0px'
                }}
            >
                {children}
            </main>
        </div>
    );
}
