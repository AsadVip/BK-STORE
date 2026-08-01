/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: "1.5rem",
                sm: "1.5rem",
                lg: "3rem",
                xl: "5rem",
            },
            screens: {
                "2xl": "1440px",
            },
        },
        extend: {
            colors: {
                // BK Store palette tokens — LUXURY PAKISTAN INDEPENDENCE DAY PALETTE
                bg: {
                    primary: "#FFFFFF",
                    secondary: "#F5F5F7",
                    light: "#FAFAFA",
                },
                accent: {
                    brown: "#171717",
                    dark: "#0D0D0D",
                    gold: "#D4AF37",
                },
                pak: {
                    green: "#01411C",
                    emerald: "#064E3B",
                    gold: "#D4AF37",
                    "gold-hover": "#E5C158",
                },
                btn: {
                    primary: "#01411C",
                    "primary-hover": "#D4AF37",
                },
                text: {
                    primary: "#0D0D0D",
                    secondary: "#525252",
                    // Derived for dark surfaces (AA contrast)
                    dark: "#0D0D0D",
                    muted: "#737373",
                    pak: "#01411C",
                },
                state: {
                    success: "#01411C",
                    danger: "#C62828",
                    warning: "#FF9800",
                },
                // shadcn/ui semantic tokens mapped to BK palette
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            fontFamily: {
                serif: ["Plus Jakarta Sans", "Poppins", "system-ui", "sans-serif"],
                sans: ["Plus Jakarta Sans", "Poppins", "system-ui", "sans-serif"],
            },
            fontSize: {
                // Type scale from 02_UI_UX_System.md
                "display-1": ["3rem", { lineHeight: "3.5rem", fontWeight: "600" }],
                "display-2": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "600" }],
                "display-3": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "500" }],
                "display-4": ["1.375rem", { lineHeight: "1.875rem", fontWeight: "500" }],
                "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
                caption: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
            },
            borderRadius: {
                xl: "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
                "soft-lg": "0 12px 40px -4px rgba(0, 0, 0, 0.12)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                shimmer: {
                    "100%": { transform: "translateX(100%)" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    from: { opacity: "0", transform: "translateY(-12px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                marquee: {
                    "0%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(-50%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                shimmer: "shimmer 1.5s infinite",
                "fade-in": "fade-in 0.2s ease-out",
                "slide-up": "slide-up 0.25s ease-out",
                "slide-down": "slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                marquee: "marquee 25s linear infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
