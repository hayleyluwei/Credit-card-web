# 目前專案狀態

最後更新：2026-07-26（Asia/Taipei）  
用途：所有新 AI session 接續本專案時的唯一目前狀態入口

## 專案與工作區

- 正式 Git root：`C:/Users/user/Documents/Credit card web project`
- 工作區 alias：`C:/Users/user/Documents/信用卡查詢網站`
- alias 類型：Windows junction，兩個路徑指向同一份檔案
- branch：`main`
- HEAD：`0429178`（2026-07-26 對話核對時的實際 HEAD；本次 T16/T19 收尾的檔案修改尚未 commit）
- 遠端關係：`main...origin/main [ahead 8]`，尚未 push

新 session 必須以 `git rev-parse --show-toplevel`、`git status` 及 `git rev-parse --short HEAD` 重新核對，不得只相信本文件。

## 目前有三條並行的任務線（2026-07-26 更新）

本專案目前由使用者＋Claude Code＋Codex 三方協作，Codex 負責資料整理人員角色（透過 `.ai-worktree-lock.json` 協調寫入時機），Claude Code 負責工程實作。**新 session 開始時務必先讀 `.ai-worktree-lock.json` 是否存在，若存在且是 Codex 持有，唯讀分析不受影響，但寫入前要跟使用者確認鎖是否仍有效**（不可自行覆蓋或刪除）。

### T16 第一版正式資料匯入 — 已核准 v1，資料已匯入，**已於 2026-07-26 正式標記完成**

- 任務卡：`docs/implementation/tasks/T16-FIRST_RELEASE_DATA_IMPORT_第一版正式資料匯入.md`
- 匯入腳本已建立並 commit：`scripts/import-offer-data.mjs`（用 Python openpyxl 讀 xlsx，不新增 npm 相依）；`package.json` 新增 `data:import`／`data:import:dry`。
- 已完成兩輪真實資料匯入：第一輪 5 家銀行／8 張卡／10 筆優惠；Codex 第二輪（CORE-SCENARIOS-DATA-COLLECTION-BATCH-2，補繳稅／學費／水電瓦斯情境）後累計 **6 家銀行／10 張卡／16 筆優惠／20 筆優惠卡片對應**。每次匯入前都會備份 `prisma/dev.db`（見 `prisma/backups/`），只清除 Bank/Card/Offer/OfferCard，保留 Category/SiteSetting/AdminUser。
- 來源試算表：`docs/data-collection/信用卡優惠資料整理模板-v2-2026-07-18.xlsx`，目前版本已由使用者／Codex commit（`5bcec14 docs(data): 核實繳稅學費與代扣優惠`）。
- **已知資料狀況（尚未解決，非本次收尾範圍）**：16 筆優惠中有 2 筆（永豐指定稅款分期、永豐學費回饋，皆為 2026 上半年活動）以系統目前日期（2026-07-26）來看已過期，前台正確隱藏，不是 bug；等下一輪報稅季可能需要新資料。另有 1 筆（`esun-unicard-wallet-new-card-2026q3`）的「最低消費」欄位疑似填錯內容，dry-run 有警告但不阻擋匯入，尚未人工核對修正。
- **手動內容修正（只存在資料庫，不在 xlsx 原始檔）**：`hsbc-travelone-signature-first-spend-2026q3` 與 `hsbc-travelone-infinite-first-spend-2026q3` 的 `description`／`conditions` 欄位補上了年費金額（NT$2,500／NT$8,000），因為原始文字只寫「正卡全額年費」沒帶數字。**這個修正不在 xlsx 裡，若之後重新執行 `npm run data:import`（資料庫會被清空重建），這兩處會被還原成沒有金額，需要重新補（做法見本次對話紀錄，或直接找對應 offer 的 description/conditions 欄位，把「繳付正卡全額年費、」取代為「繳付正卡全額年費（金額）、」）。**
- **收尾已完成**：Summary 已建立（`docs/implementation/summaries/T16-FIRST_RELEASE_DATA_IMPORT_SUMMARY-v1-2026-07-26.md`）、`01-ACTIVE_TASK_INDEX_目前任務索引.md` 的 T16 狀態列已改為「完成」、本文件同步更新。人工抽點（首頁／分類頁／優惠詳情頁確認無測試資料殘留）已在先前對話中完成，本次僅補齊「正式標記完成」的文件流程。

### T19 卡片結構化欄位與蒐集規格擴充 — 已核准 v1，**已於 2026-07-26 正式標記完成**

- 已 commit：`d6abc55 feat(T19): add card structured fields`
- 功能已用真實資料驗證過（T16 匯入的卡片都正確顯示年費／等級／發卡組織／優缺點），且規格書 v2 與模板 v2 已實際交付整理人員並完成兩輪真實資料匯入，滿足任務卡定義的兩項人工驗收條件。`01-ACTIVE_TASK_INDEX` 與任務卡 Summary 的任務狀態欄位已正式改為「完成」。
- Summary：`docs/implementation/summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md`（2026-07-26 補記驗收結果）

### T21 優惠條件結構化規劃（Promotion／RewardTier／Channel）— 草案，六個分岔路全部拍板，僅剩正式核准 Scope

- 任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`
- 核准狀態：**仍是待核准**——這張卡目前只是規劃文件，不構成任何實作授權，不得修改 Prisma schema、不建立 migration、不修改任何程式碼。
- 已拍板決策（commit `64f7efa`、`4746c10`）：
  - (a) 採方案 B，重構現有 `Offer` model，不新增獨立 `Promotion` model。
  - (b) `capPeriod`／`PaymentMethod` 永遠用 String，不做 Prisma enum。
  - (c) 巢狀邏輯暫不定案，維持限一層，訂觀察門檻（累積 3 張卡以上需要兩層以上巢狀才重新評估）。
  - 規格書 v3（多層回饋寫法慣例）：現在不改，維持 v2。
  - (d) 排在 T18 之前執行。
  - 排序子問題：具體順序是 **T16 → T17 → T21 → T18**（不是排在 T16 之前），因為使用者要先看過真實資料匯入後的狀況再決定結構設計；代價是 T21 的資料遷移腳本屆時要處理 T16 匯入的全部真實資料，範圍比原估的 20+ 筆測試資料大。
- **下一步只剩**：使用者正式核准 T21 整體 Scope v1，才能開始實作。

## AI 引用性（AI search）現況評估（2026-07-26 新增）

用 T16 真實匯入的資料做過一次檢視，結論：

- 優勢：每筆優惠都有來源網址＋查證日期，情境標籤（繳稅／學費／水電瓦斯／保費／加油／外送／超市量販／旅遊訂房）已有真實資料覆蓋全部 8 個標籤。
- 缺口：`faqJson` 目前 0/16 筆優惠有填，優惠詳情頁只輸出基本 `Article` JSON-LD，沒有 `FAQPage`；多層回饋（如幣倍卡、CUBE 卡）條件仍是整段散文，AI 不易抽取結構——這正是 T21 要解決的問題，真實資料已印證缺口存在。
- FAQ 缺口對應 T20（攻略文章功能）方向，尚未有任何動作。

## T15 工作範圍

- 建立 AI 治理入口、協作流程、目前狀態、模板、Roadmap、active index、SOP、驗證政策及治理驗證器。
- 最小幅度更新 `AGENTS.md`、`.gitignore` 與 T01–T14 歷史任務索引的接續入口。
- 建立 T15 文件審閱清單與 Summary 草稿。

## T15 Non-scope

- 不修改產品功能、UI、API、Prisma schema 或資料。
- 不修改既有首頁信用卡入口工作。
- 不執行 `git add`、commit、push 或部署。
- 不替既有測試自行核准安全分類。

## 既有未提交變更（長期存在，非本輪產生，未經處理）

下列項目從 T15／首頁工作階段就存在，多輪 session 都刻意沒有動它們（不在各自任務 Scope 內），**新 session 不得未經使用者同意就 commit 或覆寫**：

- T15 治理文件批次：`.gitignore`、`AGENTS.md`、`docs/implementation/00-master-task-index.md`（修改）；`AI_WORKFLOW_AI協作流程.md`、`HANDOFF_TEMPLATE_新對話交接模板.md`、`ROADMAP_產品路線圖.md`、`TASK_TEMPLATE_任務模板.md`、`docs/sop/`、`docs/superpowers/`、`scripts/verify-ai-governance.mjs`、`docs/implementation/handoffs/`、`outputs/dev-server/`、T15 相關 manual-test-scripts／summaries／tasks（新增，未追蹤）。
- 首頁信用卡入口舊工作：`src/app/page.tsx`（修改）、`scripts/verify-homepage-card-entry.mjs`、`docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`、`docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`（未追蹤）。2026-07-08 使用者已拍板這批要 commit，但截至本次更新**仍未執行**。
- T16 前置的 DAWHO 文字改寫：`prisma/seed.mjs`（修改，2026-07-08 的內容，與本輪 T16 匯入無關）。
- 待核准任務卡草稿：`docs/implementation/tasks/T15-*.md`、`T16-*.md`、`T17-*.md`、`T18-*.md`、`T20-*.md`（未追蹤，各自狀態見 `01-ACTIVE_TASK_INDEX_目前任務索引.md`）。

## 環境狀態

- 本機產品執行狀態：本輪對話多次啟動過本機 dev server（`http://localhost:3000`，用 `.claude/launch.json` 設定 `npm run dev`），對話結束時已停止或閒置；新 session 需要時自行用 preview 工具重開。
- 本機管理員帳號：本輪對話中密碼已被重設過一次（純資料庫層，未動 `.env`），新密碼只告知了使用者本人，未寫入任何檔案；新 session 若要用後台，請使用者提供或再協助重設。
- Preview：未知
- Production：未知
- 正式站是否為最新 commit：未知

未知表示本輪沒有可靠證據，不代表失敗或未部署。

## Worktree 寫入鎖

- lock：`.ai-worktree-lock.json`
- 2026-07-26 對話中，使用者已明確確認 Codex 上一把鎖（`sessionId: codex-core-scenarios-data-collection-2026-07-26`，`status: ready_for_handoff`）可視為交接完成；Claude Code 已接手，目前鎖為 `sessionId: claude-t16-t19-closeout-2026-07-26`，涵蓋範圍僅限 T16 收尾文件與 T19 狀態欄位標記，本輪工作完成後將釋放。
- 新 session 必須以 lock 檔實際是否存在為準，不可只依本段文字；若要自己寫入，先確認這把鎖是否還有效（例如問使用者），不可自行刪除或接管。

## 最近相關文件

- 正式設計：`docs/superpowers/specs/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理架構設計.md`
- 實作計畫：`docs/superpowers/plans/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理實作計畫.md`
- T15 Summary：`docs/implementation/summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md`
- T15 審閱清單：`docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`
- 上一個產品工作摘要：`docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`

## 阻塞與待決問題

- T15 自動驗證與人工審閱都已通過，沒有阻塞。
- 現有 lint、build 與 smoke commands 尚未分類，維持 `unclassified`。
- 首頁信用卡入口是否接受、commit、push 或部署不屬於 T15。
- **T21 僅剩待決問題 (d)** 未拍板：排在 T18 之前還是之後執行（見下方 T21 規劃進度）。

## T21 規劃進度（2026-07-18 更新）

- 使用者取得 `CONDITION_SCHEMA.md` v0.1 草案（Promotion／RewardTier／Channel 結構化條件系統，以永豐幣倍卡為第一個測試案例），經規劃層級檢視後建立 T21 任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`。
- 核准狀態：**待核准**——本卡目前只是規劃文件，不構成任何實作授權；不得修改 Prisma schema、不建立 migration、不修改任何程式碼。
- 已拍板決策：
  - (a) 採方案 B，重構現有 `Offer` model（不新增獨立 `Promotion` model）。
  - (b) `capPeriod`／`PaymentMethod` 永遠用 String，不做 Prisma enum（開發與正式環境策略相同）。
  - (c) 巢狀邏輯暫不永久定案，維持限一層；訂觀察門檻——累積 3 張卡以上需要兩層以上巢狀才重新評估。
  - 規格書 v3（多層回饋寫法慣例）：現在不改，維持 v2 原樣。
- **僅剩待決問題 (d)**：T21 排在 T18（部署上線）之前還是之後執行，尚未拍板。決定後 T21 才能整體核准 Scope 進入實作階段。
- 與 T16–T18 上線主線的關係：T21 目前完全不影響 T16–T18，兩者互不阻塞（T21 Non-scope 明確排除修改 schema／程式碼／既有規格書）。

## 下一步（2026-07-26 更新，取代同日稍早版本）

**T16／T19 收尾已完成**：T16 Summary 已建立、`01-ACTIVE_TASK_INDEX_目前任務索引.md` 的 T16／T19 狀態列已改為「完成」、本文件已同步更新。以下依優先順序：

1. **T21 待使用者正式核准 Scope v1**——六個分岔路都已拍板（見上方 T21 段落），只差一個明確的「核准」動作，之後才能開始寫 schema。核准時機依已拍板的排序是 T17 之後、T18 之前，目前 T17 尚未核准，尚未到核准 T21 的時機點。
2. 接續 T17（上線前完整測試，任務卡已存在但待核准）——需要使用者核准 Scope 才能開始。
3. Codex 那邊如果還有後續資料蒐集批次，記得先確認 `.ai-worktree-lock.json` 狀態再接手匯入，且每次重新執行 `npm run data:import` 前要記得：HSBC 兩筆優惠的年費文字修正只在資料庫裡，會被清空重建覆蓋，需要重新補（見上方 T16 段落）。
4. `esun-unicard-wallet-new-card-2026q3` 的「最低消費」欄位內容疑似有誤，待人工核對修正（回饋給 Codex 或直接改資料庫皆可）。
5. T20（攻略文章功能，AI 可引用性）已起草待核准，仍建議排 T18 上線後；FAQ／比較表格缺口已透過 AI 引用性檢視確認存在。
6. 長期未提交變更（T15 治理文件批次、首頁舊工作、T16 前置 seed.mjs 改寫、多張待核准任務卡草稿）**仍原封不動放著**，需要使用者另外決定要不要一次處理，不屬於任何一條任務線的自然下一步，不要在沒有明確指示時主動去動它們。
7. 本次 T16／T19 收尾新增的 Summary 檔與索引／CURRENT_STATE 修改目前皆為未提交變更（未 git add／commit），是否 commit 需使用者另行授權。

使用者已於 2026-07-08 拍板：清除 seed 測試資料（已完成，真實資料已上）、首頁未提交變更採 commit（**仍未執行**）、部署平台 Vercel Hobby + Neon Free、後台帳號由使用者本人持有。

## 最新資料整理進度（2026-07-08 更新）

- 已將永豐 DAWHO 兩筆優惠資料寫入 `docs/data-collection/信用卡優惠資料整理模板-v1-2026-07-08.xlsx`：
  - `dawho-general-cashback-2026h2` → `cashback`
  - `dawho-easycard-autoload-cashback-2026h2` → `transport`
- 已同步更新 `prisma/seed.mjs` 中既有 DAWHO 兩筆 offer 的正式文字與分類 slug 對應。
- 使用者已核准 T16 v1：「允許備份並寫入本機 SQLite 開發資料庫；不授權 git add、commit、push 或部署」。
- 已備份 `prisma/dev.db` 至 `prisma/backups/dev-before-t16-dawho-20260708-225216.db`。
- 已將兩筆 DAWHO offer 寫入本機 SQLite 開發資料庫，並確認新 slug、分類、卡片對應、官方來源與公開狀態。
- 未執行 `db:seed`，未啟動 dev server，未 git add、commit、push 或部署。
- 接續摘要：`docs/implementation/summaries/T16-DAWHO_DATA_ROWS_PREP_SUMMARY_DAWHO資料列整理-v1-2026-07-08.md`
- 使用者反映 DAWHO 內容出現未解釋術語（大戶Plus／大戶／指定任務），已依官方來源（永豐卡片頁與 dawho.tw 分級制度 FAQ，2026H2 版）改寫兩筆 offer 的詳細說明：等級門檻（大戶＝月平均財富 30 萬、大戶Plus＝100 萬＋任務）、指定任務內容、官方分級連結。三處同步：`prisma/seed.mjs`、資料模板 xlsx、本機 dev.db（更新前另備份於 `prisma/backups/`）。兩個優惠頁面已驗證顯示新內容。
- 規格書新增第 6 節第 8 條「術語白話原則」與 FAQ Q8（以 DAWHO 為實例），防止整理人員再交出未解釋術語。

## 本機瀏覽狀態（2026-07-08 更新）

- 已啟動本機 Next dev server：`http://localhost:3001`
- 已開啟供人工檢視：
  - 前台首頁：`http://localhost:3001/`
  - 現金回饋分類：`http://localhost:3001/categories/cashback`
  - 交通通勤分類：`http://localhost:3001/categories/transport`
  - DAWHO 一般消費優惠：`http://localhost:3001/offers/dawho-general-cashback-2026h2`
  - 後台入口：`http://localhost:3001/admin`
- HTTP 檢查結果：首頁、兩個分類頁、DAWHO 詳情頁皆 200；後台入口 307 轉登入頁，屬預期行為。
- 先前嘗試啟動的 `3000` dev server 已停止，只保留 `3001`。
