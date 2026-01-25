/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "#050505",
                foreground: "#ededed",
                card: "#121212",
                theme: "#333333",
                "gold-theme": "#FFC107",
                "muted-foreground": "#9ca3af",
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
        },
    },
    plugins: [],
}
