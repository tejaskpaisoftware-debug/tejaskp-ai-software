import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card-bg)",
        theme: "var(--card-border)",
        "gold-theme": "var(--gold-accent)", // Dynamic accent based on theme
        "muted-foreground": "var(--muted-foreground)", // Semantic muted text
        gold: {
          100: "#FFF9C4",
          200: "#FFF176",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFC107",
          600: "#FFB300",
          700: "#FFA000",
          800: "#FF8F00",
          900: "#FF6F00",
          DEFAULT: "#FFD700",
        },
        obsidian: "#050505",
        charcoal: "#121212",
      },
      fontFamily: {
        heading: ["var(--font-geist-mono)", "monospace"], // Placeholder for now
      },
      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
