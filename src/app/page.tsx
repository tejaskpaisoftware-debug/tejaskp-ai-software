"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import { motion } from "framer-motion";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleSplashComplete = () => {
    setLoading(false);
    // Smart Redirect: If user is logged in client-side, trying to go to login will just redirect them back.
    // We can hint the router, but ultimately Middleware rules. 
    // Sending to /login is standard, but let's check if we can skip a hop.
    const user = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'ADMIN') router.push("/dashboard/admin");
        else if (userData.role === 'STUDENT') router.push("/dashboard/student");
        else if (userData.role === 'EMPLOYEE') router.push("/dashboard/employee");
        else if (userData.role === 'CLIENT') router.push("/dashboard/client");
        else router.push("/dashboard");
        return;
      } catch (e) { }
    }
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-obsidian text-gold-100 font-sans selection:bg-gold-500 selection:text-obsidian">
      {/* Splash Screen - Redirects on complete */}
      {loading && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Placeholder content while redirecting */}
      {!loading && (
        <div className="flex flex-col items-center justify-center h-screen bg-obsidian space-y-4">
          <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gold-500 animate-pulse tracking-widest text-sm">ENTERING SECURE PORTAL...</p>
        </div>
      )}
    </main>
  );
}
