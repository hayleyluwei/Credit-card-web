# 目前專案狀態

最後更新：2026-07-18（Asia/Taipei）  
用途：所有新 AI session 接續本專案時的唯一目前狀態入口

## 專案與工作區

- 正式 Git root：`C:/Users/user/Documents/Credit card web project`
- 工作區 alias：`C:/Users/user/Documents/信用卡查詢網站`
- alias 類型：Windows junction，兩個路徑指向同一份檔案
- branch：`main`
- HEAD：`43b724f`
- 遠端關係：`main...origin/main [ahead 1]`

新 session 必須以 `git rev-parse --show-toplevel`、`git status` 及 `git rev-parse --short HEAD` 重新核對，不得只相信本文件。

## 目前任務

- Task ID：T19
- 名稱：卡片結構化欄位與蒐集規格擴充
- 任務卡：`docs/implementation/tasks/T19-CARD_STRUCTURED_FIELDS_卡片結構化欄位與蒐集規格擴充.md`
- Scope 版本：v1
- 核准狀態：已核准（2026-07-18，使用者原文「核准 T19 v1，排 T16 前，標籤清單照草案」）
- 任務狀態：待驗收（實作與自動驗證完成，等待使用者人工抽點）
- 部署狀態：不適用
- Summary：`docs/implementation/summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md`

T19 重點：`Card` 新增年費／免年費條件／卡片等級／發卡組織／優點／注意事項六欄（`db push` 已同步本機 SQLite，備份 `prisma/backups/dev-before-t19-schema-20260718-160058.db`）；卡片頁與後台表單支援；蒐集規格書與 xlsx 模板升版 v2（新增八個消費情境標籤：繳稅、學費、水電瓦斯、保費、加油、外送、超市量販、旅遊訂房）。T16 匯入腳本改以 v2 模板為準（相依備註已寫入 T16 任務卡）。

（上一個任務 T15 AI 開發治理導入：已完成，見任務索引。）

## T15 工作範圍

- 建立 AI 治理入口、協作流程、目前狀態、模板、Roadmap、active index、SOP、驗證政策及治理驗證器。
- 最小幅度更新 `AGENTS.md`、`.gitignore` 與 T01–T14 歷史任務索引的接續入口。
- 建立 T15 文件審閱清單與 Summary 草稿。

## T15 Non-scope

- 不修改產品功能、UI、API、Prisma schema 或資料。
- 不修改既有首頁信用卡入口工作。
- 不執行 `git add`、commit、push 或部署。
- 不替既有測試自行核准安全分類。

## 既有未提交變更

下列項目在 T15 開始前已存在，屬於首頁信用卡入口工作，T15 不得覆蓋或改寫：

- `package.json`
- `src/app/page.tsx`
- `scripts/verify-homepage-card-entry.mjs`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`
- `docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`

目前 `main` 比 `origin/main` 多一個既有 commit。其推送與部署狀態未在 T15 查證。

## 環境狀態

- 本機產品執行狀態：本任務未啟動 dev server，未知
- Preview：未知
- Production：未知
- 正式站是否為最新 commit：未知

未知表示本輪沒有可靠證據，不代表失敗或未部署。

## Worktree 寫入鎖

- lock：`.ai-worktree-lock.json`
- 本輪持有者：`codex-inline-t15-acceptance-2026-07-05`
- 本輪 Task：T15 / Scope v1
- 狀態：人工驗收狀態更新完成，於本次交接完成後釋放
- 新 session 必須以 lock 檔實際是否存在為準，不可只依本段文字

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

## 下一步（2026-07-18 更新）

1. **T19 人工驗收**：使用者於後台任一張卡填入新欄位並儲存，抽點前台卡片頁顯示；審閱蒐集規格書 v2 與模板 v2。通過後 T19 改「完成」。
2. **把規格書 v2＋模板 v2 交給資料整理人員**（`docs/data-collection/` 內的 v2 檔案；v1 已標示取代）。
3. **T16 前置**：首頁未提交變更 commit（2026-07-08 拍板採 commit，尚未執行，需當下 Git 操作確認）；資料整理人員交付 v2 試算表。之後可開工 T16 匯入腳本（任務卡已核准，相依備註要求以 v2 模板為準）。
4. T17 前需依 SOP 提出驗證指令分類草案（lint／build／smoke 仍為 unclassified）。
5. T20（攻略文章功能，AI 可引用性）已起草待核准，建議排 T18 上線後。
6. **T21 待拍板 (d)**：使用者決定排在 T18 之前或之後執行後，才能核准 T21 整體 Scope 進入實作。

使用者已於 2026-07-08 拍板：清除 seed 測試資料、首頁未提交變更採 commit（尚未執行）、部署平台 Vercel Hobby + Neon Free、後台帳號由使用者本人持有。

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
