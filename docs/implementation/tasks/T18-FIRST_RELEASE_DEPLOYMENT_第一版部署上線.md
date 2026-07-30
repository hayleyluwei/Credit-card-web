# T18 第一版部署上線

建立日期：2026-07-08（Asia/Taipei）
任務卡版本：v1
核准狀態：**Scope v1 已核准（2026-07-30）**，排進實作；schema migration／Neon 正式資料載入／Production promote 等個別高風險步驟仍依「安全限制」逐一於執行前確認，不因 Scope 核准而略過
問題類型：架構／驗收部署

## 背景

T17 完成後網站處於「可部署」狀態，但目前資料庫為本機 SQLite，無法部署到無伺服器平台。Roadmap（2026-07-07 討論）傾向方案為：網頁 Vercel Hobby、資料庫 Neon Free（PostgreSQL），該方案尚未正式核准。本任務完成 SQLite → PostgreSQL 遷移、部署與上線後驗證。

**2026-07-27 更新**：本卡建立時 T21 尚未存在，當時設想遷移的是 T16 匯入後的扁平 `Offer` 結構。T21（優惠條件結構化）已於 2026-07-27 核准並完成，schema 已由 v2 依序演進至 **v4**：新增 `RewardTier`／`Channel`／`RewardTierChannel` 三個 model，`Offer` 的扁平回饋欄位（`rewardType`／`rewardValue`／`rewardCap`／`minSpend`／`conditions`）已移除，回饋內容一律經 `RewardTier` 承載。本任務執行 PostgreSQL 遷移時，遷移的對象是**現行 v4 schema**（見 `engineering-data-model-spec/prisma-schema-spec-v4-2026-07-27.md`），非原始設想的舊版扁平結構；遷移邏輯不變（型別對照、SQLite→PostgreSQL 轉換），只是多了三張表要一併轉換。

上層計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`
依賴：T16、T17、**T21（2026-07-27 已完成）**；使用者核准部署平台方案。

## 已確認決策

- 部署平台採 **Vercel Hobby + Neon Free**（使用者 2026-07-08 拍板）。
- 正式站後台管理帳號由**使用者本人**持有，密碼由使用者自行設定或上線後立即更改（使用者 2026-07-08 拍板）。
- Prisma schema 修改必須依 `engineering-data-model-spec/schema修正原則.md` 與 `schema修改流程.md` 的專門流程執行。
- **2026-07-30 確認**：Vercel、Neon 帳號使用者已自行申請完成，本卡原本「待使用者申請帳號」的外部阻塞已解除；任務卡 Scope v1 本身仍待正式核准才能開工。
- **2026-07-30（同日稍晚）補充**：schema 因 T20（新增 `Article` model）再升版至 v6，PostgreSQL 遷移時對象為現行 v6 schema（見 `engineering-data-model-spec/prisma-schema-spec-v6-2026-07-30.md`），遷移邏輯不變，僅多一張表要一併轉換。

## 目標

第一版網站以真實資料在正式網址對外提供服務，主要頁面可正常瀏覽，後台可登入管理。

## Scope v1

- PostgreSQL 遷移（依 schema 專門流程）：
  - `prisma/schema.prisma` datasource 調整與必要的型別確認（現行 schema 為 T21 完成後的 v4，含 `RewardTier`／`Channel`／`RewardTierChannel`；`capPeriod` 等已拍板維持 String，不因遷移到 PostgreSQL 改用 enum）。
  - 建立正式 migration。
  - 本機先以 PostgreSQL 連線完整驗證（T17 的自動驗證重跑一次，含 `scripts/verify-release-data.mjs`）。
- 建立 Neon 專案與資料庫，把 T16 驗證過的正式資料載入 Neon。
- Vercel 專案建立與部署：
  - 環境變數設定（資料庫連線、管理帳號相關設定），值不得出現在文件、Summary 或 log。
  - Preview 部署驗證通過後才 promote 到 Production。
- 正式環境後台管理帳號建立（密碼由使用者自行設定或立即更改）。
- 上線後驗證：正式網址的首頁、六個分類頁、搜尋、至少三個優惠詳情頁、銀行頁、卡片頁、後台登入，逐項記錄結果。
- 建立部署 SOP 補充或更新 `docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md`。
- 建立 T18 Summary，更新 CURRENT_STATE 的部署狀態。

## Non-scope

- 不購買自訂網域（第一版使用 Vercel 預設網址；若要自訂網域需使用者另行核准）。
- 不設定廣告、分潤或任何商業化功能（Vercel Hobby 禁止商業用途）。
- 不建立自動爬蟲、排程匯入。
- 不做監控與錯誤追蹤平台導入（Roadmap 另列）。
- 不修改產品功能與 UI。

## 安全限制

- 本任務涉及正式環境與 schema 修改，屬高風險：每個高風險步驟（schema 變更、migration 執行、正式資料載入、Production promote）執行前需使用者確認。
- 資料庫連線字串、密碼、Token 一律不得輸出。
- Neon 正式資料載入前確認本機留有完整資料備份。
- push 與部署操作需本卡核准證據中明確授權。

## 影響範圍

- 頁面與 route：程式碼不變，執行環境改變。
- API：程式碼不變，資料庫連線來源改變。
- 資料模型與資料流：datasource provider 改為 PostgreSQL、新增 migration、資料轉移至 Neon。
- 共用元件：不涉及。
- 文件與測試：部署 SOP、Summary、CURRENT_STATE。
- 外部服務：Vercel、Neon、（推送用）GitHub 遠端。

## 驗證方式與完成定義

- 自動驗證：PostgreSQL 連線下 lint、build、`verify-release-data` 通過；Preview 部署主要頁面回應 200。
- 人工驗收：使用者在正式網址走一遍 T17 人工測試腳本的前台部分，並確認後台可登入。
- 完成定義：Production 部署完成、上線後驗證全數通過、Summary 與 CURRENT_STATE 更新（任務狀態與部署狀態分開記錄）。
- 部署驗證：本任務核心，如上。

## 資料保護與回復方式

- 本機 SQLite 檔案與匯入試算表為資料源頭，Neon 載入失敗可重建，不存在單點資料。
- migration 執行前備份本機資料庫；Neon 端第一次建立無既有資料需保護。
- 部署失敗回復方式：Vercel 保留前次部署可即時 rollback；資料庫問題以重新載入方式回復。

## Git 授權

- 允許：status、diff、log 唯讀操作。
- 待使用者核准時確認：`git add`、local commit、push 至 GitHub 遠端（Vercel 部署需要）。
- 不允許：force push、重寫歷史。

## 風險與待決問題

- SQLite 與 PostgreSQL 型別差異可能需要 schema 微調，任何調整都走 schema 專門流程。
- Vercel Hobby 商業用途限制：未來收益模式出現前必須升級或遷移（Roadmap 已記錄）。
- Neon Free 0.5GB 與休眠限制：資料量小應足夠，冷啟動延遲需在上線後驗證觀察。
- ~~待使用者決定：GitHub 遠端 repo 與 push 授權~~——**已於 2026-07-27 起實際發生**：本機 repo 已設定遠端 `hayleyluwei/Credit-card-web`，多輪工作皆已 push 上去且使用者知情同意，此項視為已事實授權（非本卡 Scope 核准時另立的高風險授權，而是使用者在對話中逐次同意的既成事實）。
- 待使用者決定：是否需要自訂網域（部署平台與帳號持有人已於 2026-07-08 拍板）。

## 核准證據

- 核准者：使用者（hayleyluwei）
- 核准日期與時區：2026-07-30（Asia/Taipei）
- 核准 Scope 版本：v1
- 核准原文或可追溯摘要：「核准 T18 v1，排進實作」（2026-07-30 對話原文）；Vercel/Neon 帳號已申請完成為本次核准前提
- Git 特別授權：**待實作到 push 步驟時另行確認**（本次核准未明確涵蓋 push；push 至 GitHub 遠端屬第三層，執行前需再次確認）
- 高風險操作特別授權：**Scope 已核准，但每個高風險步驟（schema 型別調整、migration 執行、Neon 正式資料載入、Production promote）仍依「安全限制」個別於執行前確認**，不因本次 Scope 核准而略過

## Scope 變更紀錄

- v1／2026-07-08：建立草稿，待核准。
- v1／2026-07-27：內容更新（非 Scope 變更，仍待核准）——補充 T21（優惠條件結構化）已完成、schema 現為 v4（含 RewardTier/Channel）的事實；記錄 GitHub push 授權已於本輪對話中事實發生。
- v1／2026-07-30：內容更新——記錄 Vercel/Neon 帳號已由使用者申請完成，解除原本的外部阻塞。
- v1／2026-07-30（同日）：**Scope v1 正式核准**，排進實作；個別高風險步驟仍逐一確認。
