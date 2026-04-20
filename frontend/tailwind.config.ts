import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        "signal": "0 0 36px rgba(255, 43, 43, 0.18)",
        "danger": "0 0 46px rgba(255, 0, 46, 0.3)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "Avenir Next", "sans-serif"],
      },
      keyframes: {
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-line": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "scan": "scan 5s linear infinite",
        "pulse-line": "pulse-line 2.8s ease-in-out infinite",
        "rise": "rise 560ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
