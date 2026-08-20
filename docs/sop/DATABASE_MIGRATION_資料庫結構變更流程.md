# 資料庫結構變更流程（migration）

最後更新：2026-08-20（Asia/Taipei）
用途：改動資料庫**結構**（新增／修改／刪除表或欄位）的標準流程、已知陷阱與把關方式
適用對象：所有能讀取本專案的 AI，以及使用者本人
建立依據：T33（`docs/implementation/tasks/T33-DB_MIGRATION_BASELINE_資料庫遷移基準與範例表清理.md`）

> **先讀**：`LOCAL_DEV_ENVIRONMENT_本機開發環境與資料庫分支.md`（本機連哪個資料庫）
> 以及 `../../engineering-data-model-spec/schema修改流程.md`（schema 檔本身的修改流程）。

---

## 0. 這份文件在講什麼（給使用者的白話版）

### migration 是「資料庫的改動紀錄本」

每次要改資料庫結構（加一個欄位、刪一張表…），就在紀錄本上**新增一頁**，
那一頁裡面寫著「這次要執行的指令」。紀錄本就是專案裡這個資料夾，**它會進 git**：

```
prisma/migrations/
  ├── 20260803033914_init_postgresql/     ← 第 1 頁：建立 11 張表（2026-08-03）
  │     └── migration.sql
  └── 20260820230418_drop_playing_with_neon/   ← 第 2 頁：刪掉 Neon 範例表（2026-08-20）
        └── migration.sql
```

資料庫裡有一張隱形的表 `_prisma_migrations`，記著「這個資料庫已經翻到第幾頁」。

**關鍵在於：同一本紀錄本，可以拿去對任何一個資料庫翻頁。**
所以 dev 分支驗證過的那一頁，套到 production 時是**同一個檔案、同一句指令**，
不需要重想、不需要重寫、不會兩邊做出不一樣的結果。

### 為什麼不直接下指令改就好

直接改：紀錄本沒有新增任何一頁，git 裡看不出這件事發生過，
另一個資料庫還是舊的，將來得有人記得「當初是怎麼做的」再手動做一次。
**兩邊各做一次、各自靠記憶**——這正是本專案已經吃過虧的模式。

---

## 1. ⚠️ 把關方式：不要拿 SQL 給使用者過目

**2026-08-20 使用者明確指出：看不懂的東西當關卡，等於沒有關卡。**

過去的做法是「AI 把 SQL 貼出來請使用者確認」。這個把關點是無效的——
使用者不具備審查 SQL 的背景，也沒有義務具備。

### 有效的把關方式

| 角色 | 負責 |
|---|---|
| **AI** | 用**執行前後可比對的數字**自證：表數、每張表的資料筆數、`migrate status`、`migrate diff` |
| **使用者** | 判斷**結果對不對**：資料有沒有少、網站有沒有壞、要不要套到正式站 |

AI 仍然要說明「這次要做什麼、影響哪些東西」，但說明的**單位是影響範圍，不是語法**。

### 對照

| ❌ 不要這樣問 | ✅ 改成這樣問 |
|---|---|
| 「這句 `DROP TABLE IF EXISTS "x";` 沒問題吧？」 | 「這次會刪掉 1 張沒人用的表；11 張專案表與 35 筆優惠資料完全不動。執行後我會把前後數字逐項對給你看。要開始嗎？」 |
| 「你看一下 SQL 對不對」 | 「執行完了，表數 13→12，優惠／卡片／銀行／文章／分類五個數字一個都沒變，網站正常。」 |

**SQL 的正確去處是這份文件與 migration 檔的註解，給 AI 與未來的接手者看，不是給使用者當關卡。**

---

## 2. 標準流程

### 2.1 改結構（在 dev 分支做）

1. 確認目前連 **dev 分支**（`LOCAL_DEV_ENVIRONMENT` 第 3 節端點比對，**不輸出連線字串**）
2. 依 `schema修改流程.md` 修改 `prisma/schema.prisma`（含三份副本同步與版本備份）
3. 執行 `npx prisma migrate dev --name <描述性名稱>`
   - Prisma 會產生 migration 檔、套用到 dev、並更新 Prisma Client
   - ⚠️ **先確認資料庫沒有 drift**，否則見第 3 節陷阱一
4. **檢視產生的 `migration.sql`**，確認它只做預期的事
   - 特別注意有沒有非預期的 `DROP`（Prisma 有時會用「刪掉重建」來達成看似單純的修改）
5. 驗證（見第 4 節）

### 2.2 套用到 production

**第三層操作，每次都要使用者個別確認。**

0. **切換前先確認兩個方向的 `.env` 備份都在**（`ls -la .env*`）。
   `cp` 會覆蓋，被蓋掉的連線字串就從本機消失了——2026-08-20 已經踩過一次。
   詳見 `LOCAL_DEV_ENVIRONMENT` 第 4 節。
1. 使用者本人切 `.env` 到 production（`cp .env.backup-production .env`）——**AI 不得代為操作**
2. AI **唯讀**確認 production 現況（端點、`migrate status`、資料筆數），不符預期就停止
3. 取得使用者當下授權後執行：

   ```
   npx prisma migrate deploy
   ```

   ⚠️ **預期由使用者本人執行，不是 AI**——見下方 2.4。
4. 驗證（見第 4 節）
5. **使用者切回 dev，AI 以端點比對確認已切回**，並補上 `cp .env .env.backup-dev`——這一步不可省略

### 2.4 ⚠️ AI 執行 `migrate deploy` 會被 auto mode 擋下

2026-08-20 實測：AI 執行 `npx prisma migrate deploy`（目標為 production）時，
**被 Claude Code auto mode 的安全分類器直接擋下**，理由是對正式資料庫的寫入。

**這不是故障，是保護，不要繞過。** 正確做法是把這一步規劃成：

| 誰 | 做什麼 |
|---|---|
| **使用者本人** | 在終端機執行 `npx prisma migrate deploy` |
| **AI** | 執行前唯讀確認現況、執行後用數字驗證結果 |

**規劃 production migration 時直接照這個分工寫，不要浪費一輪去嘗試。**
這個分工也與第 1 節的把關原則一致：**寫入由人親手做，驗證由 AI 用數字做。**

終端機畫面常常只顯示前幾行、看不到結果。**不要靠畫面判斷成功與否**，
直接用第 4 節的唯讀查詢確認 `_prisma_migrations` 筆數與漂移狀態。

### 2.3 `migrate dev` 與 `migrate deploy` 的差別

| | `migrate dev` | `migrate deploy` |
|---|---|---|
| 用在哪 | **只用於 dev 分支** | **production**，或手動建立 migration 檔後的套用 |
| 會不會產生新檔案 | 會（比對 schema 後自動產生） | 不會（只套用既有檔案） |
| 會不會做漂移偵測 | **會，而且可能提議重置整個資料庫** | 不會 |
| 需不需要 shadow database | 需要 | 不需要 |

---

## 3. ⚠️ 三個陷阱（都是本專案實際踩過或查證過的）

### 陷阱一：`migrate dev` 遇到 drift 會提議重置整個資料庫（資料全毀）

只要資料庫裡有「schema 檔沒有」的表或欄位，`migrate dev` 就判定為 drift，
並提議 `reset`——那會**清空整個資料庫**。

本專案 2026-08-20 之前就處於這個狀態（Neon 附贈的 `playing_with_neon`），T33 已清除。

**規則**：`migrate dev` 之前先跑漂移檢查（第 4 節 V2）。有 drift 先處理 drift，
**任何情況下都不要按下 reset**。

### 陷阱二：Vercel 不會自動套用 migration

`package.json` 的 build 指令是**純 `next build`**，沒有 `prisma migrate deploy`。

意思是：**push 程式碼上去不會讓正式資料庫的結構跟著改。**
production 的每一次結構變更都必須由人手動套用（第 2.2 節）。

推論出來的部署順序：**先套 production 的 migration，再 push 依賴新結構的程式碼。**
反過來會讓正式站在兩者之間的空窗期出錯。

### 陷阱三：Neon 休眠會讓 CLI 第一次連線直接失敗

Neon Free plan 閒置後 compute 會 scale to zero。
實測 `prisma migrate diff` 第一次執行直接回 `P1001 Can't reach database server`。

**看到 `P1001` 不要以為資料庫壞了。** 先用 Prisma Client 跑一個簡單查詢喚醒
（冷啟動實測 0.7–1.8 秒），再重試原本的指令。

### 補充：shadow database 不佔用分支額度

`migrate dev` 需要一個 shadow database 來重放 migration。
本專案的 Neon 角色 `neondb_owner` 具備 `rolcreatedb = true`，
**Prisma 會自動建立與清理**，不需要手動設定 `shadowDatabaseUrl`，
也不會佔用 Neon 的 10 個分支額度。

---

## 4. 驗證清單（每次結構變更都要跑）

| # | 檢查 | 指令／方式 | 預期 |
|---|---|---|---|
| V1 | migration 是否全部套用 | `npx prisma migrate status` | 顯示的筆數與 `prisma/migrations/` 目錄數相同，且無 pending |
| V2 | 資料庫與 schema 是否零漂移 | `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` | **輸出為空** |
| V3 | 表數 | 查 `information_schema.tables` | 與預期相符 |
| V4 | 資料筆數 | 逐表 `count(*)` | **與執行前逐項比對，不該變的一個都不能變** |
| V5 | 網站 | `npm run dev` 起站看首頁與詳情頁 | 正常 |
| V6 | 連線分支 | 端點比對 | 收尾時確認已切回 dev |

V2 的輸出為空是最關鍵的一項——**它代表「資料庫實際長相」與「schema 檔」完全一致**。

CLI 輸出若含主機名稱，回報時遮蔽：

```bash
npx prisma migrate status 2>&1 | sed -E 's#(postgres|postgresql)://[^"[:space:]]*#<REDACTED>#g; s#ep-[a-z0-9-]+\.[a-z0-9.-]*#<HOST-REDACTED>#g'
```

---

## 5. `db:push` 的定位

`package.json` 有 `db:push`（＝`prisma db push`）。它會**直接把 schema 推到資料庫，不留任何紀錄**。

| | |
|---|---|
| ✅ 可以用 | 拋棄式實驗、臨時起的測試資料庫 |
| ❌ 不可以用 | **dev 分支與 production 的任何正式結構變更** |

**2026-08-20 使用者決定：不移除也不改名這個 script**，僅在本文件規範用法。
所以看到它存在**不代表可以用**——正式流程一律走 migration。

歷史背景：T18（2026-08-03）之前的 SQLite 時代都用 `db push`，那段期間沒有履歷。
轉 PostgreSQL 時已用一筆 init migration 作為壓縮後的 baseline，
`prisma/schema.prisma` 自 `bd6e7c7`（2026-08-03）起到 T33 為止**零變更**，
所以 **PostgreSQL 時代沒有履歷斷層**。

---

## 6. 實例：T33 移除 `playing_with_neon`（2026-08-20）

這是本專案第一次走完整 migration 流程，留作範本。

### 背景

Neon 建立專案時附贈一張範例表 `playing_with_neon`（`id`／`name`／`value`，10 筆隨機假資料）。
專案程式碼零引用、無外鍵關聯，但它會觸發陷阱一。

### 手動建立 migration 檔（本次的特殊做法）

一般情況由 `migrate dev` 自動產生。但本次的目的**就是要清除 drift**，
而 `migrate dev` 遇到 drift 會提議重置資料庫——**先有雞還是先有蛋**。
所以本次改為手動建立 migration 檔，再用 `migrate deploy` 套用（`deploy` 不做漂移偵測）。

```
prisma/migrations/20260820230418_drop_playing_with_neon/migration.sql
```

檔案實際執行的指令**只有一句**：

```sql
DROP TABLE IF EXISTS "playing_with_neon";
```

逐字說明：

| 片段 | 意思 |
|---|---|
| `DROP TABLE` | 刪除一張表 |
| `IF EXISTS` | 「如果它存在的話」——不存在也不會報錯。**沒有這段的話，套用到從未有這張表的新資料庫會失敗** |
| `"playing_with_neon"` | 要刪的表名。**雙引號是 PostgreSQL 的識別字引號**，不是字串 |
| `;` | 一句指令結束。**分號數量 = 指令數量**，可用來確認沒有夾帶其他指令 |

`DROP TABLE` 會**連帶刪除該表欄位持有的 sequence**（`playing_with_neon_id_seq`），
不需要另外寫一句。

### 目錄命名規則

`YYYYMMDDHHMMSS_描述性名稱`。Prisma **依字典順序**決定套用順序，
所以時間戳必須排在既有的最後一筆之後。

### 本次未做的事（使用者決定）

- **未匯出那 10 筆假資料備份**——與專案資料無關的隨機數字，備份沒有實際用途
- 回復手段只依賴 Neon 的 **6 小時時間點還原**

### 實際結果（兩個分支）

| | dev | production |
|---|---|---|
| 執行者 | AI | **使用者本人**（AI 被 auto mode 擋下，見 2.4） |
| migration 筆數 | 1 → **2** | 1 → **2** |
| 表數 | 13 → **12** | 13 → **12** |
| 漂移 | 有 → **空** | 有 → **空** |
| 資料筆數 35／18／9／2／6 | **零變動** | **零變動** |
| 網站 | 本機首頁與詳情頁正常 | 正式站首頁正常，console 零錯誤 |

### 本次學到的三件事

1. **AI 對 production 的寫入會被 auto mode 擋下** → 直接規劃成使用者執行（2.4）
2. **切 `.env` 前要先備份要被覆蓋的那一組** → 已補進 `LOCAL_DEV_ENVIRONMENT` 第 4 節
3. **終端機畫面看不到完整輸出時，用唯讀查詢確認，不要用畫面判斷**

---

## 7. 給 AI 的界線

- 資料庫操作前**必須先確認目前連到哪個分支**，不得假設。
- **寫入 production 是第三層，每次都要使用者個別確認**；一次授權不延伸到下一次。
- **不得代為切換 `.env`、不得代為輸入或轉貼連線字串、不得輸出 `DATABASE_URL` 的值。**
- **不得把 SQL 語法當成使用者的把關點**（第 1 節）。要說明的是影響範圍，要提出的是可比對的數字。
- 遇到 drift 時**不得執行 reset**，停下來回報。
- `migrate dev`／`migrate deploy`／`db push` 永遠不屬於自動驗證白名單
  （`AI_WORKFLOW_AI協作流程.md` 第 11 節）。

## 8. 與其他 SOP 的分工

| 文件 | 負責 |
|---|---|
| **本文件** | 結構變更**怎麼執行**：migration 流程、陷阱、驗證、把關方式 |
| `../../engineering-data-model-spec/schema修改流程.md` | `schema.prisma` **本身怎麼改**：三份副本同步、版本備份、核准 |
| `LOCAL_DEV_ENVIRONMENT_本機開發環境與資料庫分支.md` | **連到哪個資料庫**：dev／production 分工、切換、Neon 限制 |
| `PRODUCTION_DEPLOYMENT_正式環境部署檢查.md` | 部署授權與正式環境操作 |
| `LOCAL_VERIFICATION_本機驗證與快取排查.md` | dev server、port、`.next`、build |
