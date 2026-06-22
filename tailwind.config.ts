import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        paper: "#F7F8FA",
        line: "#D8DEE8",
        brand: {
          50: "#EEF8F6",
          100: "#D6EFEA",
          600: "#147D75",
          700: "#0F665F",
          900: "#0B3F3A"
        },
        accent: {
          500: "#D97706",
          600: "#B45309"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
