# T33 資料庫遷移基準與範例表清理

建立日期：2026-08-20（Asia/Taipei）
任務卡版本：v1
核准狀態：**已核准（2026-08-20，使用者）**
問題類型：架構設計／技術債清理

> **狀態說明**：Scope A–F 已於 2026-08-20 由使用者核准。
> Scope B 寫入 Neon `dev` 分支；**Scope E 寫入 `production` 分支屬第三層，
> 本次核准不含 E3 的執行授權，仍須在當下單獨徵求同意**。

## 背景

### 起因

2026-08-20 全專案一致性盤點發現 Neon 資料庫裡有一張 `playing_with_neon`——
Neon 建立專案時附贈的範例表。同日建立 `dev` 分支後，這張表也一併複製過去。

它本身無害（假資料、零引用），真正的問題是**它擋在 migration 流程的入口**：
`prisma migrate dev` 會把「資料庫裡有、schema 裡沒有」的表判定為 drift，
並**提議重置整個資料庫**。而 T24／T25／T27／T29 四張待核准的卡全都要改 schema，
全都得走 migration 流程。

### 唯讀查證結果（2026-08-20，未執行任何寫入）

**一、`playing_with_neon` 確認可安全移除**

| 查證項目 | 結果 |
|---|---|
| 結構 | `id`(serial PK)／`name`(text NOT NULL)／`value`(real)，附 `playing_with_neon_id_seq` |
| 筆數 | 10 筆（`name` 為數字 1–10 的 MD5 前 10 碼，`value` 為隨機小數） |
| 外鍵關聯 | **0 筆**（進出都沒有） |
| 程式碼引用 | **0 處**（`.ts` `.tsx` `.mjs` `.js` `.prisma` `.sql` 全掃） |
| 文件提及 | 僅 3 份治理文件，皆為「待處理」記錄 |

**二、漂移範圍只有這一張表**

```
npx prisma migrate diff --from-schema-datasource --to-schema-datamodel --script
→ -- DropTable
   DROP TABLE "playing_with_neon";
```

整份 diff 就這兩行，證明 11 張專案表與 `schema.prisma` 零漂移。

**三、⚠️ 修正既有記載：沒有履歷斷層**

`CURRENT_STATE` 與 2026-08-20 交接摘要都寫「**之後都用 `db push` 沒留履歷**」。
實際查證後這句話不精確：

- `prisma/schema.prisma` 最後一次變更是 `bd6e7c7`（2026-08-03，T18 轉 PostgreSQL），**之後至今零變更**
- init migration 由**同一筆 commit** 產生
- init migration 的 `CREATE TABLE` 共 **11 張** ＝ `schema.prisma` 的 **11 個 model**，baseline 完整
- `prisma migrate status` → `Database schema is up to date!`（checksum 相符）

**PostgreSQL 時代根本沒有發生過 schema 變更**，所以沒有遺失的履歷。
`db push` 的無履歷期是 **SQLite 時代（T18 之前）**，而 init migration 已經是壓縮後的 baseline。

→ **本卡的性質因此確定**：不是「補回遺失的履歷」，而是
**「在第一次真正需要改 schema 之前，把往後的變更流程建立起來並演練一次」**。

**四、一項潛在阻塞已排除**

角色 `neondb_owner` 的 `rolcreatedb = true`，
表示 `prisma migrate dev` **可以自動建立 shadow database**，
不需另外佔用 Neon 分支額度（目前用 2/10）。

**五、環境事實**

- PostgreSQL 18.6，資料庫 `neondb`，角色 `neondb_owner`
- dev 分支冷啟動實測 1,696 ms（LOCAL_DEV SOP 記載 0.7–1.8 秒，相符）
- dev 分支筆數 35 優惠／18 卡／9 銀行／2 文章／6 分類，與 8/20 分家時一致

## 已確認決策

| # | 決策 | 拍板者／時間 |
|---|---|---|
| 1 | **走 migration 履歷**，不直接下 SQL 刪表 | 使用者，2026-08-20 |
| 2 | migration 內容用 `DROP TABLE IF EXISTS`，確保在從未有該表的新資料庫上也不會失敗 | 同上 |
| 3 | 套用指令用 `migrate deploy`（不做漂移偵測），**不可用 `migrate dev`**（會提議 reset） | 同上 |
| 4 | **production 排在 dev 驗證通過後、同一輪對話內處理**，作為獨立階段（Scope E），執行前單獨徵求授權 | AI 建議，使用者授權由 AI 決定，2026-08-20 |
| 5 | **刪表前不匯出那 10 筆假資料** | 使用者，2026-08-20 |
| 6 | **不改 `db:push` script**（不改名、不加警告），只在 SOP 規範用法 | 使用者，2026-08-20 |
| 7 | **不得把 SQL 語法當成使用者的把關點**；AI 改用執行前後的數字自證 | 使用者，2026-08-20（「看不懂的東西當關卡，等於沒有關卡」） |

### 決策 4 的理由（使用者交由 AI 判斷）

1. **兩個分支不一致本身就是風險**：dev 翻到第 2 頁、production 停在第 1 頁。
   若將來從 production 再開任何分支，那張表會跟著回來，migration 狀態也會與 dev 不一致。
2. **功能風險為零**：零引用的假資料表，網站不讀它，刪掉不影響任何頁面，
   也不需要重新部署。拖延不會降低風險，只會增加遺忘成本。
3. **Neon Free 的 history retention 只有 6 小時**。趁同一輪做完，安全網才在有效期內；
   隔幾天再做等於放棄這個窗口。
4. **但仍是第三層操作**，且切換 `.env` 必須由使用者本人執行，
   所以授權不自動延伸——Scope E 執行前仍要單獨問。

## 目標

1. 移除 `playing_with_neon`，讓 dev 與 production 兩個分支的實際結構與 `schema.prisma` 零漂移。
2. 建立並實際演練一次完整的 migration 流程，作為 T24／T25／T27／T29 的前置基礎。
3. 把流程與已知陷阱寫成 SOP，讓下一次改 schema 不必重新摸索。

## Scope（規劃內容；核准實作前不得執行）

### A. 建立 migration 檔（不執行套用）

建立目錄與檔案：

```
prisma/migrations/20260820HHMMSS_drop_playing_with_neon/migration.sql
```

內容：

```sql
-- 移除 Neon 建立專案時附贈的範例表。
-- 專案程式碼零引用、無外鍵關聯；保留會讓 prisma migrate 判定 drift 並提議重置資料庫。
-- 使用 IF EXISTS 以確保在從未建立過此表的新資料庫上也能安全套用。
DROP TABLE IF EXISTS "playing_with_neon";
```

- 目錄時間戳採 Prisma 慣例 `YYYYMMDDHHMMSS`，必須排序在 `20260803033914_init_postgresql` 之後。
- ~~SQL 內容先給使用者過目，確認後才進入 Scope B。~~
  **⚠️ 此把關點已於 2026-08-20 作廢並改寫（見下方）。**
- 本項只建立檔案，不碰資料庫。

#### ⚠️ 把關點改寫（2026-08-20，使用者指出）

原設計是「AI 把 SQL 貼出來請使用者確認」。使用者當場指出
**「看不懂的東西當關卡，等於沒有關卡」**——這個把關點是無效的，
使用者不具備審查 SQL 的背景，也沒有義務具備。

改為：

| 角色 | 負責 |
|---|---|
| **AI** | 用**執行前後可比對的數字**自證：表數、各表資料筆數、`migrate status`、`migrate diff` |
| **使用者** | 判斷**結果對不對**：資料有沒有少、網站有沒有壞、要不要套到正式站 |

AI 仍須說明「這次做什麼、影響哪些東西」，但**說明的單位是影響範圍，不是語法**。
SQL 的正確去處是 SOP 與 migration 檔的註解，給 AI 與未來接手者看。

已寫入 `docs/sop/DATABASE_MIGRATION_資料庫結構變更流程.md` 第 1 節，成為往後的通則。

### B. 在 `dev` 分支套用

執行前置：

1. **先確認目前連的是 dev**（LOCAL_DEV SOP 第 3 節端點比對，不輸出連線字串）。
2. ~~唯讀匯出 `playing_with_neon` 全部 10 筆存檔~~
   **依使用者 2026-08-20 決定：不匯出。** 該表為 Neon 附贈的隨機假資料，
   與本專案任何資料無關，備份沒有實際用途。回復手段改為只依賴 Neon 的 6 小時時間點還原。

執行：

```
npx prisma migrate deploy
```

預期：套用 1 筆待處理 migration，並在 `_prisma_migrations` 新增一列。

### C. dev 驗證

| # | 檢查項 | 預期結果 |
|---|---|---|
| C1 | `npx prisma migrate status` | 2 筆 migration，皆已套用 |
| C2 | `migrate diff --from-schema-datasource --to-schema-datamodel --script` | **輸出為空**（零漂移） |
| C3 | `public` schema 表數 | 13 → **12**（11 張專案表 ＋ `_prisma_migrations`） |
| C4 | 資料筆數 | 35／18／9／2／6 **完全不變** |
| C5 | `playing_with_neon_id_seq` | 一併消失（`DROP TABLE` 會連帶刪除該欄位持有的 sequence） |
| C6 | `npm run dev` 起站 | 首頁與任一優惠詳情頁正常（確認無非預期影響） |

C6 需依 `LOCAL_VERIFICATION_本機驗證與快取排查.md` 先確認無共用 dev server。

### D. 文件與 SOP

**D1. 新增 `docs/sop/DATABASE_MIGRATION_資料庫結構變更流程.md`**，至少涵蓋：

- 往後改 schema 的標準路徑：改 `schema.prisma` → 在 dev 分支 `migrate dev` →
  檢視產生的 SQL → 驗證 → 套 production 用 `migrate deploy`
- `db:push` 的定位：**僅限拋棄式實驗，正式流程禁用**（不移除 script，只規範用法）
- ⚠️ **陷阱一**：`migrate dev` 遇到「資料庫有、schema 沒有」的物件會判定 drift 並**提議重置資料庫（資料全毀）**
- ⚠️ **陷阱二**：**Vercel 的 build 指令是純 `next build`，不會自動跑 migration**，
  production 的每一次結構變更都必須手動套用
- ⚠️ **陷阱三**：Neon 休眠會讓 CLI 首次連線回 `P1001`，先跑查詢喚醒再重試
- shadow database：`rolcreatedb = true`，`migrate dev` 可自動建立，不佔用分支額度

**D2. 修正 `prisma/schema.prisma` 第 6 行的過時註解**

目前寫著 `Database: PostgreSQL (Neon) for production; also used for local dev`，
自 2026-08-20 起已不成立（本機連 dev 分支）。LOCAL_DEV SOP 已標記這句過時，此處一併修正。

**D3. 更新 `LOCAL_DEV_ENVIRONMENT_本機開發環境與資料庫分支.md` 第 6 節**

該節寫著「處理方式與時機見 T33（待建立）」，改為指向本卡與實際結果。

**D4. 更新 SOP 索引** `docs/sop/README_SOP索引.md`，登錄 D1 新增的文件。

### E. `production` 分支套用（獨立階段，**執行前需單獨授權**）

| 步驟 | 內容 | 誰執行 |
|---|---|---|
| E1 | 使用者切 `.env` 至 production（`cp .env.backup-production .env`） | **使用者本人** |
| E2 | **唯讀**確認 production 現況：端點含 `ep-bitter-surf`、`_prisma_migrations` 為 1 筆 init、`playing_with_neon` 存在、筆數 35／18／9／2／6 | AI |
| E3 | `npx prisma migrate deploy`（與 Scope B **完全相同的指令與檔案**） | AI，需當下授權 |
| E4 | 驗證同 C1–C5 | AI |
| E5 | **切回 dev 並以端點比對確認已切回** | 使用者切、AI 驗證 |

> **E2 是必要的**：production 的 migration 狀態至今未經查證，
> 不得假設它與 dev 相同。若 E2 結果與預期不符，**停止並回報，不執行 E3**。

> **E5 不可省略**：LOCAL_DEV SOP 明文警告「切回 production 之後要記得切回來」。
> 忘記切回會讓後續所有本機操作直接動正式站。

### F. 治理文件同步

- `docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md` 新增 T33 列
- `CURRENT_STATE_目前專案狀態.md`：更新「下一步」，並**修正「之後都用 `db push` 沒留履歷」
  這句不精確的描述**（見背景第三點）
- 完成後撰寫 Summary
- 釋放 `.ai-worktree-lock.json`

## Non-scope

- ❌ 不改 11 張專案表的任何結構（那是 T24／T25／T27／T29）
- ❌ 不升級 Prisma 5.22 → 7.9.1（CLI 有提示，屬獨立風險，另案）
- ❌ 不移除 `package.json` 的 `db:push` script（只在 SOP 規範用法）
- ❌ 不處理 `prisma/dev.db` 與 `prisma/backups/` 的 SQLite 時代遺留（另議）
- ❌ 不觸發部署（網站不讀這張表，刪除後外觀與行為零變化）
- ❌ 不建立新的 Neon 分支

## 安全限制

- **Scope B 寫入 dev 分支**：依 LOCAL_DEV SOP 第 8 節屬一般操作，但因為是 `DROP TABLE`，
  仍逐步執行、逐步回報，不與其他步驟合併。
- **Scope E 寫入 production 分支：第三層，每次都要使用者個別確認。**
- 每次資料庫操作前**必須先確認目前連到哪個分支**（端點比對），不得假設。
- 刪表前先唯讀匯出該表全部內容存檔。
- **AI 不得代為切換 `.env`、不得代為輸入或轉貼連線字串、不得輸出 `DATABASE_URL` 的值。**
- CLI 輸出若含主機名稱，回報時遮蔽。
- 不使用 `migrate dev`（會判定 drift 並提議重置資料庫）。
- 不使用 `-Force` 覆蓋 lock。

## 影響範圍

| 類型 | 對象 |
|---|---|
| 資料庫結構 | 移除 `playing_with_neon` 與其 sequence（dev 先、production 後） |
| 資料庫資料 | 該表 10 筆假資料。**11 張專案表的資料完全不動** |
| 版控檔案 | 新增 1 個 migration 目錄與 1 個 `.sql`；新增 1 份 SOP；修改 `schema.prisma` 註解、LOCAL_DEV SOP、SOP 索引、任務索引、CURRENT_STATE |
| 使用者可見 | **無**。網站零引用該表，前後台外觀與行為不變 |
| 部署 | **不需要**。但 migration 檔應在適當時機 commit（push 需單獨詢問） |

## 驗證方式與完成定義

1. Scope C 的 C1–C6 全數通過（dev）。
2. Scope E 的 E4 全數通過（production）。
3. 兩個分支的 `migrate diff` 皆為**空輸出**，`migrate status` 皆為 **2 筆已套用**。
4. 兩個分支的專案資料筆數與執行前**逐項相同**。
5. `.env` 已確認切回 dev（端點比對）。
6. 屬治理／技術債任務，依 `AI_WORKFLOW` 第 12 節採**文件審閱清單**，
   不需人工測試腳本——但因為 Scope E 動到正式資料庫，
   仍須由使用者確認正式站前台可正常瀏覽。
7. **未完成第 5 項不得標示完成。**

## 資料保護與回復方式

| 層級 | 手段 |
|---|---|
| 事前 | ~~匯出 10 筆存檔~~ **依使用者決定不做**（Neon 附贈的隨機假資料，與專案資料無關） |
| 事中 | migration 使用 `IF EXISTS`，重複套用不會失敗 |
| 事後（6 小時內） | Neon history retention 時間點還原，**這是本卡唯一的回復手段**。注意：還原是整個分支回滾，期間其他變更會一起消失 |

> **本卡的真正保護不在備份，而在影響範圍**：`DROP TABLE` 的對象只有一張零引用、
> 無外鍵關聯的表，11 張專案表與其資料完全不在指令的作用範圍內。

## Git 授權

未授權。核准時由使用者明確指定是否允許 `git add` 與 local commit。
**push 到正式站一律須先詢問**（2026-08-09 規則，授權不延伸）。

本卡的變更**不需要部署即可生效**（網站不讀該表），因此 commit 與 push 可與執行脫鉤處理。

## 風險與待決問題

| # | 問題 | 建議 |
|---|---|---|
| (a) | production 的 migration 狀態至今未經查證，可能與 dev 不同 | Scope E2 先做唯讀確認；不符預期就停止，不執行 E3 |
| (b) | ~~那 10 筆假資料要不要保存？~~ | **已拍板（使用者，2026-08-20）：不匯出、不存檔。** 與專案資料無關的隨機假資料 |
| (c) | migration 目錄時間戳用哪個時間？ | 用建立當下時間，格式 `YYYYMMDDHHMMSS`，須排在 init 之後 |
| (d) | 切 `.env` 到 production 後忘記切回 | Scope E5 列為強制收尾步驟，並寫進 D1 的 SOP |
| (e) | ~~是否順便把 `db:push` script 改名或加警告？~~ | **已拍板（使用者，2026-08-20）：不改，只在 SOP 規範用法** |
| (f) | Prisma 5.22 已落後兩個大版本（7.9.1） | 本卡 Non-scope。但升版會影響 migration 行為，建議在 T24 開工前另開一卡評估 |

## 實作結果（2026-08-20）

### Scope A ✅ 完成

建立 `prisma/migrations/20260820230418_drop_playing_with_neon/migration.sql`。
實際執行的指令一句：`DROP TABLE IF EXISTS "playing_with_neon";`（分號計數＝1，確認無夾帶）。
檔內另有註解說明刪除原因、`IF EXISTS` 用途與影響範圍。

### Scope B ✅ 完成（dev 分支）

執行前以端點比對確認連線為 dev（非 production）。

```
npx prisma migrate deploy
→ Applying migration `20260820230418_drop_playing_with_neon`
→ All migrations have been successfully applied.
```

### Scope C ✅ 全數通過

| # | 檢查 | 執行前 | 執行後 | 結果 |
|---|---|---|---|---|
| C1 | `migrate status` | 1 筆已套用、1 筆 pending | **2 筆，Database schema is up to date** | ✅ |
| C2 | `migrate diff` 漂移 | `DROP TABLE "playing_with_neon";` | **`-- This is an empty migration.`（空）** | ✅ |
| C3 | public schema 表數 | 13 | **12** | ✅ |
| C4 | 資料筆數 | 35／18／9／2／6 | **35／18／9／2／6**（另 RewardTier 46、AdminUser 1） | ✅ 零變動 |
| C5 | sequences | 10（含 `playing_with_neon_id_seq`） | **9**，該 sequence 連帶移除 | ✅ |
| C6 | 網站 | — | 首頁與 `/offers/taishin-richart-switch-rewards-2026h2` 皆正常，**console 與 server log 零錯誤**，10 個 tier 完整渲染 | ✅ |

C6 執行前已用 `Get-NetTCPConnection` 確認 port 3000／3001／3002 皆未被佔用，**無共用 dev server**；驗證後已停止該 server。

`_prisma_migrations` 現為 2 筆，皆 `finished`、無 `rolled_back`。

### Scope D 部分完成

| 項 | 狀態 |
|---|---|
| D1 新增 `docs/sop/DATABASE_MIGRATION_資料庫結構變更流程.md` | ✅ 完成 |
| D2 修正 `prisma/schema.prisma` 第 6 行過時註解 | ✅ **完成**。依 `schema修改流程.md` 先列清單、經使用者 2026-08-20 確認後才動手（見下方「D2 執行紀錄」） |
| D3 更新 `LOCAL_DEV_ENVIRONMENT` 第 6 節 | ✅ 完成（改為 dev 已清除／production 仍在的對照，並補上分支不一致的提醒） |
| D4 更新 SOP 索引 | ✅ 完成 |

#### D2 執行紀錄（依 `engineering-data-model-spec/schema修改流程.md`）

**已確認清單**（使用者 2026-08-20 回覆「要改」）：

| 項目 | 內容 |
|---|---|
| `schema.prisma` 要改什麼 | **僅第 6 行註解**。原：`// Database: PostgreSQL (Neon) for production; also used for local dev`；新：改為說明 production 用 `production` 分支、本機用 `dev` 分支（2026-08-20 分離），並指向 LOCAL_DEV SOP |
| 影響檔案 | 2 份現行副本：`prisma/schema.prisma`、`engineering-data-model-spec/schema.prisma` |
| schema 規格說明書 | **不需改**——已查證 `prisma-schema-spec-v8-2026-08-03.md` 無此句 |
| 版本備份檔 | **不新增**。資料模型零變動；且 `schema-v8-2026-08-03.prisma` 是 2026-08-03 的歷史快照，修改它等於竄改紀錄，**刻意保持原狀** |
| format／validate | 執行 `prisma validate` |

**執行後檢查**：

| 檢查 | 結果 |
|---|---|
| 兩份現行副本是否一致 | ✅ 完全相同 |
| 與 v8 歷史備份的差異 | ✅ **僅該 1 處註解**，無其他變動 |
| `npx prisma validate` | ✅ `The schema at prisma\schema.prisma is valid 🚀` |
| model 數量 | ✅ 維持 **11**，順序未動 |
| 欄位／relation／index／default | ✅ 未觸及（diff 證明只有註解一行） |
| 中文亂碼 | ✅ 無 |

> **刻意記錄的例外**：本次未新增版本備份檔與規格說明書，偏離 `schema修正原則.md` 第 8、10 條。
> 理由是本次為純註解修正、資料模型零變動，另存 v9 會產生一個與 v8 內容實質相同的版本。
> 此例外已取得使用者確認，後續若有真正的模型變更仍須完整走版本流程。

### Scope E ✅ 完成（production）

使用者於 2026-08-20 明確授權「正式站要不要一起做，要做」。

| 步驟 | 執行者 | 結果 |
|---|---|---|
| E1 切 `.env` 至 production | **使用者本人** | ✅ 完成 |
| E2 唯讀確認現況 | AI | ✅ 13 表（含 `playing_with_neon`）、1 筆 migration、35／18／9／2／6，**與預期完全相符** |
| E3 `npx prisma migrate deploy` | **使用者本人執行** | ✅ 完成（見下方「執行方式的例外」） |
| E4 驗證 | AI | ✅ 全數通過 |
| E5 切回 dev | 使用者 | ⏸️ **待執行**（見下方「dev 連線字串遺失」） |

#### E4 驗證結果（正式站）

| 檢查 | 執行前 | 執行後 | |
|---|---|---|---|
| `migrate status` | 1 筆 | **2 筆，Database schema is up to date** | ✅ |
| `migrate diff` 漂移 | 有 `DROP TABLE` | **`-- This is an empty migration.`（空）** | ✅ |
| public schema 表數 | 13 | **12** | ✅ |
| `playing_with_neon` | 存在 | **已移除** | ✅ |
| `playing_with_neon_id_seq` | 存在 | **已連帶移除** | ✅ |
| 優惠／卡片／銀行／文章／分類 | 35／18／9／2／6 | **35／18／9／2／6** | ✅ 零變動 |
| RewardTier／AdminUser | 46／1 | **46／1** | ✅ 零變動 |
| 正式站前台 | — | `https://credit-card-web-pi.vercel.app` 正常，**console 零錯誤** | ✅ |

`_prisma_migrations` 兩筆皆 `finished`、無 `rolled_back`。**dev 與 production 結構自此一致。**

#### ⚠️ 執行方式的例外：E3 由使用者本人執行

AI 嘗試執行 `npx prisma migrate deploy` 時**被 Claude Code auto mode 的安全分類器擋下**
（偵測到對正式資料庫的寫入）。AI **未嘗試繞過**，改為說明狀況並請使用者本人執行。

**這個結果其實比原設計更好**：正式資料庫的寫入由人親手執行，AI 只負責前後驗證，
與本卡決策 7（AI 用數字自證、使用者判斷結果）方向一致。
往後 T24／T25／T27／T29 套用 production migration 時，**預期會遇到同樣的攔截，
應直接規劃為「使用者本人執行 ＋ AI 驗證」，不要浪費一輪嘗試。**

#### ⚠️ 過程中的疏失：dev 連線字串遺失

AI 指示使用者執行 `cp .env.backup-production .env` 時，**未事先提醒備份當時的 dev 連線字串**。
專案只有 `.env.backup-production`，沒有 `.env.backup-dev`，該指令直接覆蓋，
**dev 的連線字串因此從本機檔案中消失**。

- **影響**：非永久性。連線字串可從 Neon 控制台重新複製（LOCAL_DEV SOP 第 4 節）。
- **補救**：切回 dev 後執行 `cp .env .env.backup-dev` 建立備份；
  `.gitignore` 的 `.env.*` 已涵蓋此檔。
- **已修正流程**：LOCAL_DEV SOP 第 4 節新增「切換前先備份目前設定」步驟。

### Scope F 進行中

任務索引與 `CURRENT_STATE` 已更新至 dev 完成的狀態；Summary 待 Scope E 結束後補。

### 未執行／不適用

- `npm run build`：白名單為空且會寫共用 `.next`，未執行（與 T30 同樣處理）。
- `git add`／commit／push：**未授權，未執行**。
- 假資料備份：依使用者決定不做。

### 過程中發現的範圍外問題

`/offers/taishin-richart-switch-rewards-2026h2` 的**頁面標題（`metaTitle`）仍寫 3.8%**，
但標題與內文已是 **10%**。應是 2026-08-18 Richart 資料補齊時漏更新 `metaTitle`。

**使用者 2026-08-20 決定：不處理。** 不併入 T32，本卡亦不處理。
僅記錄於此供日後參考，未列為待辦。

## 核准證據

- 建立依據：使用者於 2026-08-20 指示「接下來要做的是處理 `playing_with_neon` 與 migration 對齊（暫編 T33）」，
  並於同日明確選定「建議走 migration 履歷（手動建 migration 目錄放 `DROP TABLE IF EXISTS`，再 `migrate deploy`）」
  與「建 T33 任務卡」；production 處理時機由使用者授權 AI 決定。
### ✅ 核准紀錄

| 項目 | 內容 |
|---|---|
| 核准者 | 使用者本人 |
| 核准日期 | 2026-08-20（Asia/Taipei） |
| 核准 Scope 版本 | **v1（A–F）** |
| 核准原文 | 「核准 T33 Scope v1（A–F）」／「那 10 筆假資料刪掉前要不要匯出存檔，不要」／「要不要順便把 db:push 加警告或改名？不改，只在 SOP 規範用法」 |
| **不含** | **Scope E3（寫入 production）的執行授權**——依卡片設計仍須在執行當下單獨徵求同意 |
| Git 授權 | **未授權**。使用者未回覆 `git add`／local commit 的授權，故本卡執行期間不執行任何 Git 寫入操作 |

## Scope 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1 | 2026-08-20 | 建立草案。依唯讀 Discovery 結果確立任務性質為「建立往後的變更流程」而非「補回遺失履歷」 |
| v1 | 2026-08-20 | **使用者核准 Scope A–F**。同時拍板 (b) 不匯出假資料、(e) 不改 `db:push`。Scope B 前置步驟 2 依此取消 |
