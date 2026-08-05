/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        canvas: "#F6F6F7",
        paper: "#FFFFFF",
        line: "#BCC1CA",
        blue: {
          DEFAULT: "#4387FF",
          deep: "#2869DC",
          soft: "#E9F0FF"
        },
        lime: "#DFFF6B",
        rose: "#FFDDE3",
        yellow: "#FFF1A8",
        mint: "#C9F2DF"
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans TC", "Microsoft JhengHei", "Arial", "sans-serif"]
      },
      fontWeight: {
        850: "850"
      },
      borderWidth: {
        DEFAULT: "1.5px"
      },
      borderRadius: {
        control: "9px",
        card: "15px",
        panel: "18px",
        preview: "20px"
      },
      boxShadow: {
        card: "0 10px 18px rgba(67, 135, 255, 0.12)",
        preview: "0 13px 25px rgba(21, 21, 21, 0.10)"
      },
      keyframes: {
        "preview-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        "preview-bob": "preview-bob 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

