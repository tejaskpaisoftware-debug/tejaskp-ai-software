import type { Metadata } from "next";
import { Inter, Outfit, Orbitron, Cinzel } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: '--font-orbitron',
  display: 'swap',
});
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TejasKP AI",
  description: "Advanced dashboard for management",
  manifest: "/manifest.json",
  themeColor: "#FFD700",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TejasKP AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${orbitron.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground transition-colors duration-500`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
