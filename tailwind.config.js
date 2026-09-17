/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          base: "#07130F",
          panel: "#0E1F18",
          raised: "#122B21",
          sunken: "#030D09",
        },
        gold: {
          DEFAULT: "#D6BB69",
          muted: "rgba(214,187,105,0.28)",
          faint: "rgba(214,187,105,0.10)",
        },
        hairline: "rgba(213,189,114,0.16)",
        "hover-wash": "rgba(255,255,255,0.05)",
        mint: {
          sahih: "#65D59B",
          hasan: "#9AE6BD",
        },
        ochre: "#E5B563",
        crimson: "#ED7D6D",
        parchment: "#F7F2DF",
        stone: {
          mid: "#9DB1A6",
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
    },
  },
  plugins: [],
};
