# T26 GA 網站流量分析

建立日期：2026-08-05（Asia/Taipei）
任務卡版本：v1（已核准）
核准狀態：已核准（2026-08-06，Asia/Taipei）
問題類型：功能需求／驗收部署

> **狀態說明**：使用者已於 2026-08-06 核准 T26 Scope。核准範圍為 Production only、使用 `next/script` 手動載入 GA4 `gtag.js`、不新增套件、暫不做 cookie banner。AI 仍不得建立或登入任何 Google 帳號／服務。

## 背景

使用者 2026-07-27（T18 部署上線討論期間）決定：網站需要 Google Analytics（GA）流量分析，但排在 T18 上線後另開一個小任務處理，不佔用 T18 Scope。當時只記錄為「其他待辦（尚未建卡）」，未展開規劃。T18 已於 2026-08-04 完成並驗證上線（`https://credit-card-web-pi.vercel.app`），具備串接 GA 的前提。

目前網站沒有任何流量分析或使用者行為追蹤機制，使用者無法得知訪客來源、瀏覽路徑、熱門頁面等資訊。

相關任務：
- T18：部署上線（已完成，前提依賴）。
- T24：信用卡申辦導引連結（草案，v1 方向已拍板為「純導引＋UTM 參數，供未來 GA 追蹤點擊成效」）——T24 的 UTM 參數設計預期會與本任務的 GA 事件／流量來源分析搭配使用，兩者有介面銜接，但各自獨立核准。

## 已確認決策

- 使用 Google Analytics（GA4，目前 Google 官方唯一現行版本）做網站流量分析。
- 排在 T18（部署上線）之後執行，不佔用 T18 Scope（2026-07-27 拍板）。
- 使用者需自行建立 GA4 資源並取得 Measurement ID；AI 不代為建立或登入 Google 帳號。
- GA 只在 Production 環境且有 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 時載入，本機開發不追蹤。
- 技術實作採 `next/script` 手動載入 `gtag.js`，不新增 npm 套件。
- 暫不做 cookie banner；隱私權政策或追蹤揭露可另案處理。

## 目標

網站上線後的訪客流量（頁面瀏覽、流量來源、熱門頁面等）能被記錄到使用者自己的 GA4 帳號，讓使用者可以在 GA 後台查看網站實際使用狀況。

## Scope（v1 已核准）

- 在 `src/app/layout.tsx`（或等效的全站共用佈局）加入 GA4 追蹤程式碼，使用 `next/script` 載入官方 `gtag.js` 片段，不新增套件。
- 新增環境變數（例如 `NEXT_PUBLIC_GA_MEASUREMENT_ID`）存放 GA4 Measurement ID，於 Vercel 專案設定與本機 `.env` 分別設定；Measurement ID 本身不是機密資訊（GA4 設計上會出現在前端原始碼），但仍集中管理、不寫死在程式碼中。
- 只在正式站（Vercel Production / `NODE_ENV=production`）且存在 Measurement ID 時載入 GA；本機開發環境不載入，避免測試流量進入正式 GA 資料。
- 暫不新增 cookie banner；隱私權政策或追蹤揭露若需要，另開或另核准文件／頁面任務處理。
- 建立 T26 Summary、更新任務索引與 CURRENT_STATE。

## Non-scope

- **不由 AI 建立或登入使用者的 Google／GA4 帳號**：GA4 資源（帳號、資源、資料串流）需要使用者自己用 Google 帳號在 [analytics.google.com](https://analytics.google.com) 建立，AI 只能在使用者提供 Measurement ID 後協助接線，不代為註冊或登入任何 Google 服務。
- 不做進階事件追蹤（如自訂轉換事件、電子商務追蹤）——目前網站無交易行為，v1 只做基本頁面瀏覽與流量來源分析。
- 不做 Cookie 同意管理平台（Consent Management Platform）或 cookie banner；如後續需要隱私權政策頁或退出追蹤機制，另案處理。
- 不涉及 T24（申辦導引連結）UTM 參數本身的設計與實作，只確保串接後 GA 能正確接收帶 UTM 的流量來源。
- 不修改 T18 已完成的部署設定以外的其他任務範圍。

## 安全限制

- 本任務卡的建立與修改屬「治理紀錄／任務卡草稿」，可在唯讀分析後直接寫入文件；正式開始改程式碼或環境變數前需依 `AI_WORKFLOW_AI協作流程.md` 取得 `.ai-worktree-lock.json`（本次草稿撰寫已依規建立）。
- **不得由 AI 建立 Google 帳號或登入使用者既有帳號**——建立 GA4 資源、取得 Measurement ID 是使用者本人操作的範圍（屬於「Explicit permission required」等級以上的帳號操作，AI 不代為執行）。
- 環境變數（`NEXT_PUBLIC_GA_MEASUREMENT_ID` 或等效名稱）由使用者提供後，AI 依專案慣例寫入 `.env.example`（不含實際值）與提醒使用者自行填入 `.env` 及 Vercel 環境變數設定，不在對話中要求使用者貼出任何機密字串（Measurement ID 本身雖非機密，但若涉及 GA4 API Secret 等更高權限憑證則需比照機密處理）。
- 目前本機 `.env` 的 `DATABASE_URL` 直接接正式站 Neon PostgreSQL 的已知風險與本任務無直接關聯（GA 追蹤不涉及資料庫），但仍提醒新 session 注意此既有風險。

## 影響範圍

- 頁面與 route：全站共用佈局（`src/app/layout.tsx`），追蹤程式碼會影響所有頁面。
- API：不涉及。
- 資料模型與資料流：不涉及，GA 資料存於 Google 端，不寫入本專案資料庫。
- 共用元件：不新增共用元件，直接在全站 layout 以 `next/script` 載入 GA。
- 文件與測試：`.env.example` 新增欄位說明；新增 T26 專用檢查腳本；T26 Summary。
- 外部服務：新增 Google Analytics（GA4）——需使用者自行建立帳號與資源；本任務不新增 npm 相依。

## 驗證方式與完成定義

- 本卡（規劃文件）完成定義：使用者審閱本卡內容，對「風險與待決問題」逐項給出決定，並明確核准 Scope 版本。
- 實作階段的驗證方式待 Scope 正式核准後於 Scope 修訂版中訂定（預期包含）：
  - 自動驗證：`tsc --noEmit`、`next build` 確認追蹤程式碼不破壞既有頁面。
  - 人工驗收：正式站部署後，使用者本人登入自己的 GA4 帳號，於「即時」報表確認能看到自己瀏覽正式站產生的流量事件；確認本機開發環境的測試流量是否如預期被排除或標記（依待決問題 (b) 結果）。
  - 部署驗證：需在 Vercel Production 環境設定對應環境變數後才算完整生效，不適用本機驗證取代。

## 資料保護與回復方式

- 本任務不讀寫本專案資料庫（Neon PostgreSQL），GA 追蹤資料完全存放於 Google 端，與本專案資料庫無關。
- 唯一新增的專案內狀態是環境變數設定，若設定錯誤只需移除或修正對應變數，無資料遺失風險。

## Git 授權

- 允許：status、diff、log 唯讀操作；在 `codex/t26-ga-analytics` 隔離 worktree 中進行 T26 實作與文件更新。
- 不允許：`git add`、local commit、push、破壞性或重寫歷史操作，除非使用者另行明確授權。

## 風險與待決問題

以下分岔路已於 2026-08-06 由使用者拍板：

1. **(a) GA4 資源由誰建立、用哪個 Google 帳號？** 使用者需自行在 [analytics.google.com](https://analytics.google.com) 建立 GA4 帳號與資源（AI 不代為註冊或登入），並提供或自行設定 Measurement ID（格式如 `G-XXXXXXXXXX`）。
2. **(b) 本機開發環境的追蹤要不要排除？** 選項：
   - 只在 Production 環境（`NODE_ENV=production` 或 Vercel 環境變數區分）載入 GA 追蹤程式碼，本機 `npm run dev` 完全不載入。
   - 本機也載入但用不同的 GA 資源（開發用資源，資料分開看）。
   - 都用同一個資源，不特別區分（會讓開發測試流量混進正式流量資料，較不建議）。
   **拍板：採第一種，僅 Production 載入。**
3. **(c) 是否需要 Cookie／隱私權同意機制？** GA4 預設會在使用者裝置寫入 cookie／識別碼。台灣個資法對此沒有強制要求歐盟 GDPR 式的 cookie 同意彈窗，但：
   - 是否至少需要新增或更新一個隱私權政策頁面，說明網站有使用 Google Analytics？
   - 是否需要加入同意橫幅（consent banner），讓使用者可選擇退出追蹤？
   **拍板：暫不做 cookie banner；隱私權政策或追蹤揭露另案處理。**
4. **(d) 技術實作方式：`@next/third-parties` 套件 vs 手動 `gtag.js` 片段？** 前者是 Next.js 官方套件，寫法簡潔但屬新增 npm 相依（依流程第三層需先確認）；後者不新增套件，手動維護追蹤程式碼片段，彈性較低但無新相依。**拍板：使用 `next/script` 手動載入 `gtag.js`，不新增套件。**
5. **(e) 是否要與 T24（申辦導引連結）的 UTM 參數設計同時規劃？** T24 目前仍是草案待核准，若兩者的 GA 事件／流量來源命名規則能一併設計，可以避免之後 T24 核准實作時要回頭配合本任務調整；但若優先順序上想讓 GA 基本追蹤先單獨上線，也可以本任務先獨立完成，T24 之後再對接。

## 核准證據

- 核准者：使用者
- 核准日期與時區：2026-08-06（Asia/Taipei）
- 核准 Scope 版本：v1
- 核准原文或可追溯摘要：「核准 T26 Scope。採 Production only。使用 next/script，不新增套件。暫不做 cookie banner。」
- Git 特別授權：允許在 `codex/t26-ga-analytics` 隔離 worktree / branch 實作；未授權 `git add`、local commit、push、合併。
- 高風險操作特別授權：無；不得建立或登入 Google 帳號，不得修改正式環境變數，Vercel Production Measurement ID 由使用者自行設定或另行授權。

## Scope 變更紀錄

- v1／2026-08-05：建立草稿，記錄 2026-07-27 已拍板的「GA 網站流量分析，排 T18 之後另開任務」方向，展開待決問題，待核准。
- v1 核准／2026-08-06：使用者核准 T26 Scope；拍板 Production only、使用 `next/script`、不新增套件、暫不做 cookie banner。
