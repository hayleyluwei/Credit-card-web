import type { Config } from "tailwindcss";

/**
 * [T28] 合併「卡片生活誌亮藍風格」契約的 theme.extend
 * （來源：docs/design-system/card-life-pop-style/tailwind.config.js，v1 鎖定契約）。
 *
 * 合併而非覆蓋：
 * - `brand.*` 與 `boxShadow.soft` 為舊 token，**刻意保留**。後台（/admin）是 T28 的
 *   Non-scope、程式碼不得修改，但它大量使用這兩個 token；若在此刪除，後台會在沒有任何
 *   build 錯誤的情況下靜默破版。公開頁面已全面改用新 token，不再新增 brand.* 用法。
 * - `accent.*` 全站 0 處使用，已淘汰。
 *
 * 注意 `ink`／`paper`／`line` 三個 token 名稱沿用但**值已改變**，且 `paper` 語意翻轉
 * （舊＝頁面淺灰底，新＝表面純白；頁面底色改用新增的 `canvas`）。
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // 契約 token（不可變）
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
        mint: "#C9F2DF",
        // 舊 token：僅供後台沿用，公開頁面不得再使用
        brand: {
          50: "#EEF8F6",
          100: "#D6EFEA",
          600: "#147D75",
          700: "#0F665F",
          900: "#0B3F3A"
        }
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
        preview: "0 13px 25px rgba(21, 21, 21, 0.10)",
        // 舊 token：僅供後台沿用
        soft: "0 10px 30px rgba(23, 32, 42, 0.08)"
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

export default config;
