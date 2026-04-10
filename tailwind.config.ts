import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        corporate: {
          950: "#0a0a0c",
          900: "#121214",
          800: "#1a1a1e",
          700: "#252529",
          600: "#3a3a3e",
        },
        "blue-corporate": "#3b82f6",
      },
    },
  },
  plugins: [],
} satisfies Config;
