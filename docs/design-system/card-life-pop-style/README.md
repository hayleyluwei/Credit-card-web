# 卡片生活誌亮藍風格移交包

- 版本：v1（2026-08-05，Asia/Taipei）
- 用途：交由 Claude 或其他實作者套用至既有公開頁面。
- 狀態：**實作時視為鎖定的視覺契約**；任何色彩、比例、元件型態或資訊層級變更，必須先由使用者明確核准。

## 這個資料夾的內容

| 檔案 | 用途 |
| --- | --- |
| `STYLE_CONTRACT.md` | 唯一的視覺與 UX 規格來源。 |
| `tailwind.config.js` | Tailwind 3 參考 token 設定。 |
| `globals.css` | 基底與可重用的元件 class。 |
| `reference-components.tsx` | 可移植的 React/Next.js 元件範例。 |
| `CLAUDE_STYLE_LOCK_PROMPT.md` | 交給 Claude 的鎖定提示詞。 |
| `visual-reference.html` | 可離線開啟的全站公開頁面互動示意。 |

## 套用順序

1. 先閱讀 `STYLE_CONTRACT.md`，再閱讀 `CLAUDE_STYLE_LOCK_PROMPT.md`。
2. 將 `tailwind.config.js` 的 `theme.extend` **合併**至目前專案的 `tailwind.config.ts`，保留既有 `content` glob、plugins 與其他未衝突設定。不要直接覆蓋正式設定檔。
3. 將 `globals.css` 的 base 與 component layer 合併至現有 `src/app/globals.css`。全站背景不得保留舊的綠色漸層。
4. 以 `reference-components.tsx` 的語意元件取代重複的樣式字串，再逐頁套用。
5. 以 `visual-reference.html` 對照桌機與手機畫面，完成每個公開路由後再進行下一頁。

## 範圍

- 套用對象：首頁、搜尋、分類與分類詳情、優惠詳情、信用卡與卡片詳情、銀行頁、情境頁、攻略列表與文章頁。
- 不套用對象：登入、後台、資料庫 schema、資料內容、SEO 文案、路由結構與部署設定。
- 「本月情境選讀」屬 T27 草案中的未來資料功能。視覺可預留位置，但不得在尚未核准 T27 前硬編碼成正式產品功能。

## 視覺驗收入口

開啟 `visual-reference.html` 後，從首頁依序點入搜尋、分類、優惠、信用卡、銀行、情境與攻略。麵包屑只能連到真實存在的上層頁面；例如卡片詳情使用「首頁 / 信用卡 / 卡片名稱」，發卡銀行應以頁面中的關聯連結呈現，而不是放進不存在的主層級。
