/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          base: "#101210",
          panel: "#161816",
          raised: "#1A1D1A",
          sunken: "#0C0E0C",
        },
        gold: {
          DEFAULT: "#C2A145",
          muted: "rgba(194,161,69,0.28)",
          faint: "rgba(194,161,69,0.10)",
          glow: "rgba(194,161,69,0.25)",
        },
        hairline: "rgba(255,255,255,0.08)",
        "hover-wash": "rgba(255,255,255,0.04)",
        mint: {
          sahih: "#4ADE80",
          hasan: "#86EFAC",
        },
        ochre: "#E0A33E",
        crimson: "#E06C5A",
        parchment: "#F3F2EE",
        stone: {
          mid: "#A8A49A",
        },
      },
      fontFamily: {
        arabic: ["Amiri", "Scheherazade New", "serif"],
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};
