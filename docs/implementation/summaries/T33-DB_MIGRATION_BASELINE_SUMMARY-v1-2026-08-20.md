# T33 資料庫遷移基準與範例表清理 — 摘要

版本：v1
日期：2026-08-20（Asia/Taipei）
任務卡：`docs/implementation/tasks/T33-DB_MIGRATION_BASELINE_資料庫遷移基準與範例表清理.md`
任務狀態：**自動驗證通過**（dev 與 production 皆完成並驗證）
部署狀態：**不適用**——網站零引用該表，不需重新部署

---

## 一句話

移除 Neon 附贈的範例表 `playing_with_neon`，讓 dev 與 production 兩個資料庫與 `schema.prisma`
完全一致，並在過程中建立往後改 schema 的正式流程與 SOP。

## 為什麼要做

那張表不在 `schema.prisma` 裡，會讓 `prisma migrate dev` 判定為 drift 並**提議重置整個資料庫**。
T24／T25／T27／T29 四張待核准的卡全都要改 schema，全都得走 migration 流程——
**這張表擋在入口。**

## 做了什麼

| Scope | 內容 | 結果 |
|---|---|---|
| A | 建立 migration `20260820230418_drop_playing_with_neon` | ✅ |
| B | dev 分支套用 | ✅ |
| C | dev 六項驗證 | ✅ 全數通過 |
| D1 | 新增 `docs/sop/DATABASE_MIGRATION_資料庫結構變更流程.md` | ✅ |
| D2 | 修正 `schema.prisma` 過時註解（走 schema 專門流程） | ✅ |
| D3 | 更新 `LOCAL_DEV_ENVIRONMENT` 第 4、6 節 | ✅ |
| D4 | 更新 SOP 索引 | ✅ |
| E | production 套用同一個 migration | ✅ |
| F | 治理文件同步 | ✅ |

## 驗證數字（兩個分支一致）

| 檢查 | 執行前 | 執行後 |
|---|---|---|
| public schema 表數 | 13 | **12** |
| `_prisma_migrations` | 1 筆 | **2 筆**，皆完成、無回滾 |
| `migrate diff` 漂移 | `DROP TABLE "playing_with_neon";` | **空（零漂移）** |
| 優惠／卡片／銀行／文章／分類 | 35／18／9／2／6 | **35／18／9／2／6** |
| RewardTier／AdminUser | 46／1 | **46／1** |
| 網站 | — | 本機與正式站首頁皆正常，console 零錯誤 |

**該少的只少了那一張表，不該動的一筆都沒動。**

## 三個發現（會影響後續所有 schema 變更）

### 一、既有記載有誤：沒有履歷斷層

`CURRENT_STATE` 與交接摘要都寫「之後都用 `db push` 沒留履歷」。查證後不成立：
`schema.prisma` 自 `bd6e7c7`（2026-08-03）起**零變更**，init migration 的 11 張表
＝ schema 的 11 個 model，baseline 完整。無履歷期是 **SQLite 時代（T18 之前）**。

→ 本卡的性質是「**建立往後的流程**」，不是「補回遺失的履歷」。

### 二、AI 對 production 的寫入會被 auto mode 擋下

AI 執行 `npx prisma migrate deploy`（目標 production）時被安全分類器直接攔截。
**AI 未繞過**，改由使用者本人執行、AI 負責前後驗證。

**這個分工比原設計更好，已寫成 SOP 常規**（`DATABASE_MIGRATION` 2.4）：
往後 T24／T25／T27／T29 套用 production migration 時直接照此規劃，不要浪費一輪嘗試。

### 三、Vercel 不會自動套用 migration

`package.json` 的 build 是純 `next build`。**push 程式碼不會讓正式資料庫結構跟著改。**
推論出的部署順序：**先套 production 的 migration，再 push 依賴新結構的程式碼。**
這件事先前沒有任何文件記錄。

## 一項治理規則的改變

使用者於本輪指出：**「看不懂的東西當關卡，等於沒有關卡。」**

原本的把關設計是「AI 把 SQL 貼出來請使用者確認」——這是無效的把關。改為：

| 角色 | 負責 |
|---|---|
| **AI** | 用執行前後可比對的**數字**自證 |
| **使用者** | 判斷**結果對不對** |

說明的單位是**影響範圍**，不是語法。SQL 的正確去處是 SOP 與檔案註解。
已寫入 `DATABASE_MIGRATION_資料庫結構變更流程.md` 第 1 節，成為往後通則。

## 一項疏失（已補流程）

AI 指示 `cp .env.backup-production .env` 時未提醒先備份 dev 連線字串，
專案又只有 production 的備份，導致 **dev 連線字串被覆蓋、需回 Neon 重拿**。

非永久性損失，但流程有缺口。已在 `LOCAL_DEV_ENVIRONMENT` 第 4 節新增
「切換前先確認兩個方向的備份都在」的步驟與指令。

## 解鎖了什麼

**T24／T25／T27／T29 四張卡的 schema 變更路徑現在是通的**：

- 兩個資料庫零漂移，`migrate dev` 不會再誤判 drift
- 流程、陷阱與分工都寫進 SOP
- shadow database 可自動建立（`rolcreatedb = true`），不佔用 Neon 分支額度

## 未做／不適用

- `npm run build`：白名單為空且會寫共用 `.next`，未執行（同 T30 處理）
- 假資料備份：使用者決定不做
- Richart `metaTitle` 仍寫 3.8%（內文已是 10%）：**使用者決定不處理**，未列待辦
- 人工驗收腳本：本卡屬治理／技術債，依 `AI_WORKFLOW` 第 12 節採文件審閱清單

## 收尾狀態

- `.env`：**執行後仍指向 production，須切回 dev**（步驟見 `LOCAL_DEV_ENVIRONMENT` 第 4 節）
- Git：本輪變更已 commit（未 push；push 依 2026-08-09 規則須另外詢問）
