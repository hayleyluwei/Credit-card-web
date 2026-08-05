# T28 卡片生活誌設計系統套用（公開頁面視覺改版）

建立日期：2026-08-05（Asia/Taipei）
任務卡版本：v1（草案）
核准狀態：待核准
問題類型：UX 改善／前端實作

> **狀態說明**：本任務卡只記錄規劃內容，**不構成任何實作授權**。在使用者正式核准 Scope 之前，不得修改 `tailwind.config.ts`、`globals.css`、任何前台頁面或元件。本卡唯一交付物即這份 Markdown。

## 背景

使用者於 2026-08-05 自行完成一份公開網站的視覺風格規劃，並交付為完整移交包：`docs/design-system/card-life-pop-style/`（v1，2026-08-05）。此資料夾在本任務卡建立前為**未追蹤檔案**，內容如下：

| 檔案 | 用途 |
| --- | --- |
| `STYLE_CONTRACT.md` | 唯一的視覺與 UX 規格來源（設計 token、版面骨架、元件規則、動態規則、禁止事項、交付前檢查） |
| `README.md` | 移交說明、套用順序、範圍、視覺驗收入口 |
| `CLAUDE_STYLE_LOCK_PROMPT.md` | 交給實作者（Claude）的風格鎖定提示詞 |
| `tailwind.config.js` | Tailwind 參考 token 設定（供合併，非覆蓋） |
| `globals.css` | 基底與可重用元件 class（供合併） |
| `reference-components.tsx` | 語意元件範例（`PageContainer`／`PrimaryAction`／`Breadcrumb`／`SurfaceCard`／`PreviewCard`／`IssuerLink`） |
| `visual-reference.html` | 可離線開啟的全站公開頁面互動示意（約 36KB，含 home／search／categories／category／offer／cards／card 等 view） |

**風格定位**（摘自 `STYLE_CONTRACT.md` 第 1 節）：不是傳統金融比較站，也不是復古雜誌，而是「將複雜優惠轉成生活任務入口的明亮數位工具」——清楚、活潑、可靠、有一點可愛但不幼稚；大片白底與充足留白，搭配少量亮藍、萊姆綠、粉紅與黃色區塊。

**本契約在移交包中即被宣告為鎖定狀態**：`STYLE_CONTRACT.md` 明訂「除非使用者明確提出『修改風格契約』，否則實作者只能在此契約內新增內容，不能自行改造風格」。本任務卡**不重新討論風格內容本身**，只規劃如何安全套用。

### 為什麼需要獨立任務卡

T27（首頁本月情境選讀模組）的 Non-scope 已明文寫「不進行整站『卡片生活誌』視覺重構；首頁與各詳情頁的共用設計系統屬相鄰但獨立的工作」。本次移交包涵蓋 11 個公開 route 的整站視覺改版，範圍遠大於 T27，因此獨立建卡。兩者關係見下方「與 T27 的關係」。

## 已確認決策

以下為移交包內已由使用者定案、本任務不重新討論的內容：

- **設計 token 為不可變**：`ink #151515`／`canvas #F6F6F7`／`paper #FFFFFF`／`line #BCC1CA`／`blue #4387FF`／`blue-deep #2869DC`／`blue-soft #E9F0FF`／`lime #DFFF6B`／`rose #FFDDE3`／`yellow #FFF1A8`／`mint #C9F2DF`。禁止以相近色替代，禁止把 hex 散落在 TSX/JSX。
- **主要表面框線固定 `1.5px solid #BCC1CA`**，不得為了「柔和」改淡。
- **首頁區塊順序不可任意置換**：① 生活任務主張＋搜尋入口 → ② 五張快速入口預覽卡 → ③ **本月情境選讀視覺預留（T27）** → ④ 熱門情境 → ⑤ 熱門優惠分類 → ⑥ 正在發生的回饋 → ⑦ 從手上的卡開始 → ⑧ 攻略文章。
- **三種入口不可刪除任一**：搜尋、生活情境、手上的卡片為平行入口。
- **動態規則**：只有首頁五張預覽卡可用 `preview-bob`（4 秒、上下最多 6px、錯開延遲）；其他頁面不使用持續動畫；必須支援 `prefers-reduced-motion: reduce`。
- **麵包屑只能連向真實存在的上層 route**；卡片詳情用「首頁 / 信用卡 / 卡片名稱」，發卡銀行以可點選的內容關聯（`IssuerLink`）呈現，不得偽造成不存在的主層級。
- **明確禁止**：漸層、發光球、模糊光斑、擬 3D 裝飾、Hero SVG 插畫、大面積紫／深藍灰／米／咖啡色系、區塊全包成浮動卡、巢狀卡片、`rounded-full` 當一般按鈕或卡片。
- **套用方式為「合併」而非「覆蓋」**：`tailwind.config.js` 的 `theme.extend` 合併進既有 `tailwind.config.ts`（保留既有 `content` glob 與 plugins）；`globals.css` 的 base／component layer 合併進既有 `src/app/globals.css`，並**移除舊的綠色漸層全站背景**。

## 目標

將 `docs/design-system/card-life-pop-style/` 的視覺契約完整套用至全部公開頁面，使正式站外觀與 `visual-reference.html` 一致，且在套用過程中不改變任何資料模型、資料內容、路由結構、SEO 輸出與權限行為。

## 實作前必須先解決：token 遷移落差（2026-08-05 量測，本卡最重要的技術發現）

移交包的 README 說「合併、不要直接覆蓋」——這對**設定檔本身**成立，但對**既有程式碼**不成立。實際量測目前 `src/` 的使用情形：

| 項目 | 數量 |
|---|---|
| `brand-*` 使用次數 | **126** |
| `accent-*` 使用次數 | **0**（既有設定有定義但完全沒用到，可直接淘汰） |
| `ink`／`paper`／`line` 使用次數（`bg-`／`text-`／`border-`） | **229** |
| 受影響檔案數 | **37** |
| 公開 route（`src/app` 內非 admin 的 `page.tsx`） | **11** |

三個具體落差，未處理會造成「build 過了但畫面錯了」的靜默問題：

1. **`brand-*` 在新契約中沒有對應 token**。新調色盤只有 `blue`／`blue-deep`／`blue-soft`，沒有 `brand`。若採純合併，`brand-600`（舊的品牌綠 `#147D75`）仍然解析得到，**不會 build 失敗，但那 126 處會維持綠色**——契約被違反卻沒有任何錯誤提示。這 126 處需逐一改寫為對應的藍色 token，屬本任務的主要工作量。
2. **`ink`／`paper`／`line` 三個 token 名稱相同但值不同**，合併時會被新值覆蓋，229 處使用點的外觀會一次改變。其中最危險的是——
3. **`paper` 的語意被翻轉**：舊設定 `paper: #F7F8FA`（頁面底色，淺灰），新契約 `paper: #FFFFFF`（表面，純白），頁面底色改用新增的 `canvas: #F6F6F7`。任何原本寫 `bg-paper` 是想要「頁面淺灰底」的地方，套用後會變成純白，**需要逐處判斷改為 `bg-canvas` 或維持 `bg-paper`**，不能整批取代。

因此本任務不是「改設定檔就完成」，而是一次涵蓋 37 個檔案的 token 遷移。實作時應先建立新舊 token 對照表並取得確認，再逐頁套用。

## Scope（規劃內容；核准實作前不得執行）

若核准通過，預期實作範圍包含：

- **設定層**：`tailwind.config.ts` 合併移交包的 `theme.extend`（colors／fontFamily／fontWeight 850／borderWidth 1.5px／borderRadius control-card-panel-preview／boxShadow card-preview／keyframes 與 animation `preview-bob`）；保留既有 `content` glob 與 plugins。
- **樣式層**：`src/app/globals.css` 合併移交包的 base 與 component layer（`cl-container`／`cl-eyebrow`／`cl-page-title`／`cl-section-title`／`cl-panel`／`cl-card`／`cl-action`／`cl-filter`／`cl-breadcrumb`／`cl-preview-card` 系列），**移除既有的綠色漸層 body 背景**，字體改為 `Inter, "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif`。
- **token 遷移**：依上節對照表，處理 126 處 `brand-*` 與 229 處 `ink`／`paper`／`line`；淘汰未使用的 `accent-*`。
- **語意元件**：建立 `reference-components.tsx` 對應的共用元件（`PageContainer`／`PrimaryAction`／`Breadcrumb`／`SurfaceCard`／`PreviewCard`／`IssuerLink`），取代各頁重複的樣式字串。
- **逐頁套用**：依移交包建議順序處理首頁 → 搜尋 → 分類 → 分類詳情 → 優惠詳情 → 信用卡列表 → 卡片詳情 → 銀行 → 情境 → 攻略列表 → 文章頁；每完成一頁與 `visual-reference.html` 對照後再進下一頁。
- **麵包屑修正**：確認所有麵包屑只連向真實存在的 route；卡片詳情改為「首頁 / 信用卡 / 卡片名稱」＋`IssuerLink`。
- **T27 視覺預留**：在首頁第 ③ 順位保留「本月情境選讀」的版位與視覺，**但不得硬編碼成正式資料功能**（見「與 T27 的關係」）。
- **文件**：`docs/design-system/card-life-pop-style/` 納入版控；建立 T28 Summary 與人工測試腳本；更新任務索引與 CURRENT_STATE。

## Non-scope

依移交包 `README.md` 的「不套用對象」，加上本專案治理要求：

- **不修改登入與後台**（`/admin` 全部路由與元件）。
- **不修改 Prisma schema、不建立 migration、不執行 seed、不寫入任何資料庫。**
- **不修改資料內容**（銀行／卡片／優惠／文章的實際文字與數值）。
- **不修改 SEO 文案、JSON-LD 結構、sitemap 或 llms.txt 的輸出內容**（純視覺變更不應改變結構化資料）。
- **不修改路由結構**，不新增或移除任何 route。
- **不修改環境變數或部署設定。**
- **不實作 T27 的資料功能**：只做視覺預留，不新增 schema、不建後台 CRUD、不硬編碼真實的每月選讀內容。
- **不修改風格契約本身**：任何需要變更契約的情況，必須停止並向使用者提出「風格契約變更」選項與影響範圍，不得自行決定。
- **不新增動畫或圖示套件**（`preview-bob` 以 Tailwind keyframes 實作；既有 `EntryIcon.tsx` 為手刻 inline SVG，沿用）。
- **本任務卡本身只是規劃文件**，唯一交付物為這份 Markdown。

## 安全限制

- 本任務卡的建立與修改屬「治理紀錄／任務卡草稿」，可在唯讀分析後直接寫入文件；正式改動程式碼前需依 `AI_WORKFLOW_AI協作流程.md` 取得 `.ai-worktree-lock.json`（本次撰寫已依規建立）。
- **本任務全程不讀寫資料庫**。但需注意既有環境風險：本機 `.env` 的 `DATABASE_URL` 直接指向正式站 Neon PostgreSQL，因此**啟動 dev server 進行視覺驗證時，讀到的是正式站真實資料**；只要不執行任何寫入操作即無風險，但不得順手執行匯入或 seed。
- 若驗證需要 `next build`，須先依 `AI_WORKFLOW_AI協作流程.md` 第 11 節確認是否有共用 dev server 在跑（2026-08-03 曾因 dev server 執行中又跑 build 導致 `.next` 快取損毀）。
- 不得為了視覺效果而修改資料查詢或新增欄位；發現資料層限制時停止並回報。

## 影響範圍

- 頁面與 route：**11 個公開 route 全部**（首頁／搜尋／分類／分類詳情／優惠詳情／信用卡列表／卡片詳情／銀行／情境／攻略列表／文章頁）；`/admin` 不受影響。
- API：不涉及。
- 資料模型與資料流：**不涉及**（純呈現層變更，不動查詢與 schema）。
- 共用元件：新增語意元件；既有 `CardImage.tsx`／`OfferCard.tsx`／`EntryIcon.tsx` 等預期需配合調整樣式（**`CardImage.tsx` 的 SVG 卡面配色屬 T23 既有設計，不在本次改版範圍內**，見下方待決問題）。
- 文件與測試：`docs/design-system/`（納管）、T28 Summary、人工測試腳本、任務索引、CURRENT_STATE。
- 外部服務：不涉及。

## 與 T27（首頁本月情境選讀模組）的關係

兩者相鄰但獨立，分工如下：

| | T28（本卡） | T27 |
|---|---|---|
| 負責 | 首頁第 ③ 順位的**版位與視覺**預留 | 該版位背後的**資料模型、後台 CRUD、排程生效邏輯** |
| 現在能做 | 視覺預留（核准後） | 尚未核准，不得動 schema／資料庫 |

**移交包已為 T27 定下視覺規格**（`STYLE_CONTRACT.md` 第 5 節元件規則）：「本月選讀」＝**黑底文字區 ＋ 亮藍圖像區 ＋ 萊姆行動按鈕**；明確禁止漸層英雄區與無連結目標的宣傳卡。T27 實作時應直接沿用此規格，不再另行設計。

**本移交包的出現，等於解決了 T27 待決問題 (e)**（「是否先完成並確認正式的『卡片生活誌』風格契約，再實作 T27 前台元件？」）——契約現已存在且為 v1 定稿，T27 不再需要等待，也不應自行另立一套視覺。已同步註記於 T27 任務卡。

## 驗證方式與完成定義

- 本卡（規劃文件）完成定義：使用者審閱本卡並明確核准或退回 Scope。
- 實作階段的驗證方式待 Scope 核准後於修訂版訂定，預期包含：
  - **自動驗證**：`tsc --noEmit`、`eslint`、`next build`（build 前須先確認無共用 dev server）。
  - **視覺對照**：每完成一頁，以瀏覽器對照 `visual-reference.html` 的對應 view。
  - **響應式檢查**：桌機 `1440px`、平板 `768px`、手機 `390px` 三個斷點皆無溢出、文字遮擋或卡片變形。
  - **契約合規檢查**：全域搜尋確認無殘留 `brand-*`、無散落 hex 色碼、無 `rounded-full` 誤用於一般按鈕或卡片、無漸層背景殘留。
  - **連結有效性**：每個按鈕與麵包屑都有真實可抵達的目標，無中間頁不存在的情況。
  - **降低動態偏好**：開啟 `prefers-reduced-motion: reduce` 後確認持續動畫停用。
  - **人工驗收**：使用者本人於正式站或本機逐頁確認外觀符合預期（視覺類任務最終需人眼判定，AI 自動驗證不能取代）。

## 資料保護與回復方式

- **本任務不讀寫資料庫**，無資料回復需求。
- 程式碼變更以 Git 版控保護；建議依頁面分批 commit，任一頁出問題可單獨回退，不影響其他頁面。

## Git 授權

- 允許：status、diff、log 唯讀操作；本任務卡與相關治理文件的更新。
- 不允許（核准時可另行授權）：建立或切換 branch、`git add`、local commit、push、破壞性或重寫歷史操作。

## 風險與待決問題

1. **(a) `brand-*` 的 126 處對應規則如何訂？** 需先產出「舊 token → 新 token」對照表並取得確認（例如 `brand-600` → `blue`、`brand-700` → `blue-deep`、`brand-50/100` → `blue-soft`），再批次遷移。錯誤對應會造成大量視覺偏差且不易察覺。
2. **(b) `paper` 語意翻轉的 229 處要如何逐處判斷？** 需決定處理策略：全部人工逐處判斷（慢但準）、或先整批改為 `canvas` 再依 visual-reference 逐頁修正（快但需要完整視覺對照）。
3. **(c) T23 卡面 SVG 配色是否納入本次改版？** `CardImage.tsx` 生成的卡面色彩取自各卡官網真實配色（14 張卡已全數設定，屬 T23 已完成的設計決策），與本契約的調色盤是**刻意不同的兩套系統**。建議明確排除、維持現狀，但需使用者確認。
4. **(d) 分批 commit 與部署節奏？** 11 個 route 一次全部改完再 push，或逐頁 push（Vercel 會自動部署，代表改版過程中正式站會呈現新舊混雜的樣子）。建議在單一 branch 上完成全部頁面、確認後再合併，但這需要 branch 授權。
5. **(e) 與 T27 的實作順序？** 若 T27 先核准，可一次做完視覺＋資料功能；若 T28 先做，首頁需保留一個明確的視覺預留版位。目前 T27 仍為草案待核准，預設為 T28 先做、只留版位。
6. **(f) 既有 UX 決策是否與新契約衝突？** 2026-07-30 曾做過一批首頁 ad-hoc UX 修正（區塊重排、`EntryIcon` 圖示、導覽按鈕移出表頭、分類頁移除側欄、優惠卡移除「一般」字樣）。新契約的首頁順序與當時的排序**不完全相同**，需逐項比對確認以新契約為準，並確認不會把當時刻意移除的東西加回來。

## 核准證據

- 核准者：（待核准）
- 核准日期與時區：（待核准）
- 核准 Scope 版本：（待核准）
- 核准原文或可追溯摘要：（待核准）
- Git 特別授權：（待核准）
- 高風險操作特別授權：（待核准）

## Scope 變更紀錄

- v1／2026-08-05：建立草案。收錄使用者自行完成的「卡片生活誌亮藍風格」移交包（`docs/design-system/card-life-pop-style/`，7 個檔案，原為未追蹤），將其定位為鎖定的視覺契約；量測既有程式碼的 token 使用落差（`brand-*` 126 處無對應 token、`ink`／`paper`／`line` 229 處值改變、`paper` 語意翻轉、共 37 個檔案 11 個公開 route）並列為實作前必須先解決的項目；釐清與 T27 的分工，並記錄本移交包已使 T27 待決問題 (e) 因事實而解決。6 個待決問題未拍板，待核准。
