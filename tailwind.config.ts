import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
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
      maxWidth: {
        prose: "68ch"
      }
    }
  },
  plugins: []
};

export default config;
