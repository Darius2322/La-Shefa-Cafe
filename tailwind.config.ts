import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      colors: {
        teal: {
          DEFAULT: "#194850",
          dark: "#0F2F35"
        },
        brown: {
          DEFAULT: "#411D0D",
          dark: "#2C1409"
        },
        caramel: {
          DEFAULT: "#CB9D6C",
          light: "#E3C39C"
        },
        cream: "#F8F4EE"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      fontSize: {
        // Controlled, mobile-first display scale — kept deliberately smaller
        // than framework defaults so headings read as elegant, not oversized.
        "display-sm": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "display-md": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-lg": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "display-xl": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }]
      },
      maxWidth: {
        prose: "68ch"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(44, 20, 9, 0.04), 0 6px 20px -8px rgba(44, 20, 9, 0.12)",
        "soft-lg": "0 4px 8px rgba(44, 20, 9, 0.04), 0 16px 32px -12px rgba(44, 20, 9, 0.16)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.4s ease forwards"
      }
    }
  },
  plugins: []
};

export default config;
