import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:     "#0a0a0f",
          card:   "#12121e",
          card2:  "#1a1a2e",
          border: "#2a2a4a",
          text:   "#e2e8f0",
          muted:  "#64748b",
        },
        brand: {
          green:  "#00ff88",
          red:    "#ff4466",
          blue:   "#4488ff",
          yellow: "#ffcc44",
          orange: "#ff8844",
          purple: "#aa44ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "fade-in":    "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
