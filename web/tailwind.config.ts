import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#141414",
        "surface-hover": "#1a1a1a",
        border: "#1e1e1e",
        "border-hover": "#2a2a2a",
        amber: {
          DEFAULT: "#f59e0b",
          dim: "#92600a",
          bright: "#fbbf24",
        },
        text: {
          primary: "#e5e5e5",
          secondary: "#737373",
          muted: "#525252",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
