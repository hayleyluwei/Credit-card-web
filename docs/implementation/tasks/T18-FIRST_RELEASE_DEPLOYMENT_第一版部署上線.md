# T18 第一版部署上線

建立日期：2026-07-08（Asia/Taipei）
任務卡版本：v1
核准狀態：待核准
問題類型：架構／驗收部署

## 背景

T17 完成後網站處於「可部署」狀態，但目前資料庫為本機 SQLite，無法部署到無伺服器平台。Roadmap（2026-07-07 討論）傾向方案為：網頁 Vercel Hobby、資料庫 Neon Free（PostgreSQL），該方案尚未正式核准。本任務完成 SQLite → PostgreSQL 遷移、部署與上線後驗證。

上層計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`
依賴：T16、T17 完成；使用者核准部署平台方案。

## 已確認決策

- 部署平台採 **Vercel Hobby + Neon Free**（使用者 2026-07-08 拍板）。
- 正式站後台管理帳號由**使用者本人**持有，密碼由使用者自行設定或上線後立即更改（使用者 2026-07-08 拍板）。
- Prisma schema 修改必須依 `engineering-data-model-spec/schema修正原則.md` 與 `schema修改流程.md` 的專門流程執行。

## 目標

第一版網站以真實資料在正式網址對外提供服務，主要頁面可正常瀏覽，後台可登入管理。

## Scope v1

- PostgreSQL 遷移（依 schema 專門流程）：
  - `prisma/schema.prisma` datasource 調整與必要的型別確認。
  - 建立正式 migration。
  - 本機先以 PostgreSQL 連線完整驗證（T17 的自動驗證重跑一次）。
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
- 待使用者決定：GitHub 遠端 repo 與 push 授權、是否需要自訂網域（部署平台與帳號持有人已於 2026-07-08 拍板）。

## 核准證據

- 核准者：（待填）
- 核准日期與時區：（待填）
- 核准 Scope 版本：（待填）
- 核准原文或可追溯摘要：（待填）
- Git 特別授權：（待填）
- 高風險操作特別授權：（待填）

## Scope 變更紀錄

- v1／2026-07-08：建立草稿，待核准。
