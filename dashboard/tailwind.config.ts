import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0b0c0e",
        surface: { DEFAULT: "#16181c", raised: "#1d2025", hover: "#23262c" },
        line: { DEFAULT: "rgba(255,255,255,0.08)", strong: "rgba(255,255,255,0.14)" },
        ink: { DEFAULT: "#efefef", muted: "#9c9c9c", faint: "#6b6e74" },
        accent: "#338ced",
        good: "#53c556",
        bad: "#eb6263",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
