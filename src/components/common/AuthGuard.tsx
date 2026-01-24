"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SingleTabEnforcer from "./SingleTabEnforcer";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);
    const [statusText, setStatusText] = useState("Initializing...");

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Fast Client Check (Non-blocking)
            setStatusText("Verifying Session...");
            const user = sessionStorage.getItem("user") || sessionStorage.getItem("currentUser") || localStorage.getItem("user");
            // Fallback to localStorage for backward compatibility/migration during dev, but prefer session
            if (!user) {
                console.warn("No user in localStorage, checking server...");
                // Don't redirect yet, let server confirm. 
                // This avoids infinite loops if Middleware thinks we have a cookie.
            }

            // 2. Robust Server Check
            try {
                const userJSON = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("user");
                let token = null;
                if (userJSON) {
                    try {
                        const parsedUser = JSON.parse(userJSON);
                        token = parsedUser.token;
                    } catch (e) {
                        console.error("Failed to parse user JSON from storage:", e);
                    }
                }

                const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Add timestamp to prevent any caching
                const res = await fetch(`/api/auth/session-check?t=${Date.now()}`, {
                    method: "GET",
                    headers: headers,
                    signal: AbortSignal.timeout(5000) // 5s timeout
                });

                if (res.status === 401) {
                    setStatusText("Session Invalid. Redirecting...");
                    console.warn("Session invalid, redirecting to login...");
                    sessionStorage.removeItem("user");
                    sessionStorage.removeItem("currentUser");
                    localStorage.removeItem("user");
                    localStorage.removeItem("currentUser");

                    // Force hard navigation to clear state
                    window.location.href = "/login";
                } else if (res.ok) {
                    setStatusText("Verified.");
                    setIsVerified(true);
                } else {
                    console.warn("Unexpected status:", res.status);
                    setStatusText(`Error ${res.status}. Redirecting...`);
                    // Force hard navigation
                    setTimeout(() => window.location.href = "/login", 1000);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setStatusText("Connection Failed. Redirecting...");
                window.location.href = "/login";
            }
        };

        checkAuth();

        // Run on pageshow (BFcache restore)
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                console.log("Restored from bfcache, re-checking auth...");
                setIsVerified(false); // Hide content immediately
                checkAuth();
            }
        };

        window.addEventListener("pageshow", handlePageShow);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, [router]);

    // BLOCK RENDERING until verified
    if (!isVerified) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold tracking-widest animate-pulse">{statusText.toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500">Please wait while we verify your session...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <SingleTabEnforcer />
            {children}
        </>
    );
}
