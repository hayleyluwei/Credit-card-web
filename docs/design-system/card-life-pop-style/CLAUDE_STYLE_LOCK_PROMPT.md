# 給 Claude 的風格鎖定提示詞

```text
你正在為「卡片生活誌」實作公開網站的視覺更新。先閱讀以下檔案，並把它們當成不可自行變更的設計契約：

1. docs/design-system/card-life-pop-style/STYLE_CONTRACT.md
2. docs/design-system/card-life-pop-style/tailwind.config.js
3. docs/design-system/card-life-pop-style/globals.css
4. docs/design-system/card-life-pop-style/reference-components.tsx
5. docs/design-system/card-life-pop-style/visual-reference.html

任務目標：只將既有公開頁面套用此設計系統。維持所有既有資料模型、資料查詢、商業規則、SEO、路由、權限與公開內容不變。

絕對規則：
- 先讀 STYLE_CONTRACT.md，再開始改動。
- 不得自行換色、加入漸層、紫色主題、米色/咖啡色主題、裝飾光球、Hero SVG、過度圓角或卡片巢狀。
- 不得用任意 hex 色碼、任意圓角或任意陰影取代既有 token；新增元件一律使用 Tailwind token 或共用 class。
- 主要表面框線固定為 1.5px 的 line token (#BCC1CA)。不得為了「柔和」把框線改淡。
- 首頁固定保留：生活任務搜尋、五張快速入口預覽、本月情境選讀視覺預留、熱門情境、熱門優惠分類、正在發生的回饋、從手上的卡開始、攻略文章。不得刪除或任意重排。
- 五張預覽卡只在首頁允許 preview-bob 微浮動動畫；其他頁面不使用持續動畫，且必須支援 prefers-reduced-motion。
- 麵包屑只能連向真實存在的上層 route。卡片詳情使用「首頁 / 信用卡 / 卡片名稱」；發卡銀行以可點選的內容關聯呈現，不能放成不存在的主層級。
- T27 本月情境選讀尚未獲實作核准。只能預留元件位置與視覺，不得自行新增 schema、資料庫欄位、後台 CRUD、硬編碼真實內容或部署。
- 不修改登入、後台、schema、migration、seed、環境變數或部署設定，除非使用者另行明確授權。

實作方式：
1. 將參考 tailwind.config.js 的 theme.extend 合併到既有 tailwind.config.ts，不能整份覆蓋。
2. 將 globals.css 的 base/component layer 合併至既有 src/app/globals.css，移除與本契約衝突的全站漸層背景。
3. 優先建立並重用 SurfaceCard、PrimaryAction、Breadcrumb、IssuerLink、PreviewCard 等語意元件，避免每個頁面各自發明樣式。
4. 依序處理首頁、搜尋、分類、分類詳情、優惠詳情、信用卡列表、卡片詳情、銀行、情境、攻略列表與文章頁。每完成一頁，與 visual-reference.html 對照。
5. 任何必須改變風格契約的需求，先停止並向使用者提出「風格契約變更」選項與影響範圍，不要自行決定。

驗收：
- 檢查 1440px、768px、390px，確保文字、框線、卡片和按鈕均不溢出。
- 檢查高亮度螢幕下，主要卡片框線仍清楚可見。
- 檢查所有按鈕、麵包屑與發卡銀行關聯連結都有有效目標。
- 以現有專案允許的 lint/typecheck/build 流程驗證；不要執行未分類、會寫入 Production 或會影響資料庫的命令。

交付時請逐頁列出：修改檔案、沿用的 token/元件、桌機/手機驗證結果，以及任何仍需使用者決定的事項。
```

