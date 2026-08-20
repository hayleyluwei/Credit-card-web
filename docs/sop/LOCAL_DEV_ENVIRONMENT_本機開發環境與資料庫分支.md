# 本機開發環境與資料庫分支

最後更新：2026-08-20（Asia/Taipei，第 6 節更新：dev 已清除 playing_with_neon，production 待處理）
用途：說明本機開發環境連到哪個資料庫、與正式站的關係，以及切換與驗證方式。
適用對象：所有能讀取本專案的 AI，以及使用者本人。

---

## ⚠️ 最重要的一件事（2026-08-20 起生效）

> **本機開發已經與正式站分離。`npm run dev`、後台操作、AI 執行的任何查詢與寫入，
> 全部打到 Neon 的 `dev` 分支，不會影響正式站。**

這是 2026-08-20 才建立的隔離。**在此之前，本機直接讀寫正式站資料庫**
（`prisma/schema.prisma` 檔頭仍留有 "also used for local dev" 的註解，那句話已經過時）。

### 這件事的直接後果

| 動作 | 影響哪裡 |
|---|---|
| `npm run dev` 起本機站 | **dev 分支** |
| 本機後台 `/admin` 新增或修改資料 | **dev 分支** |
| AI 執行的 Prisma 查詢／寫入 | **dev 分支** |
| 匯入腳本 `npm run data:import` | **dev 分支** |
| Vercel 上的正式站 | **production 分支**（完全不受本機影響） |

### ⚠️ 最容易搞混的地方

**在本機後台改的資料，不會出現在正式站。**

2026-08-20 之前不是這樣——那時本機後台改什麼，正式站立刻就變。現在不會了。

要讓改動真的上線：

| 要上線的東西 | 做法 |
|---|---|
| **程式變更** | `commit` + `push`（跟以前完全一樣，不受本次隔離影響） |
| **資料變更** | 需要另外寫入 `production` 分支——**在正式站後台操作**，或明確把連線指向 production 執行匯入 |

**「我在本機後台改好了」不等於「正式站已經改好了」。** 兩者是不同的資料庫。

---

## 1. 環境對照

| | production 分支 | dev 分支 |
|---|---|---|
| 用途 | 正式站（Vercel）唯一資料來源 | 本機開發與測試 |
| 建立時間 | 2026-08-03（T18） | **2026-08-20** |
| Neon 分支名 | `production`（Default） | `dev` |
| 誰連它 | Vercel 環境變數 | 本機 `.env` |
| Auto-delete | 不適用 | **Never**（不會自動消失） |
| 資料 | 正式資料 | 建立當下的完整複本 |

Neon 專案：`credit-card-web`，AWS Asia Pacific 1（Singapore），**Free plan**。

## 2. Neon Free plan 的重要限制（先前未記錄）

| 項目 | 額度／行為 |
|---|---|
| 分支數 | **10 個**（目前用 2：production、dev） |
| 儲存空間 | 0.5 GB／專案（2026-08-20 實際用量 33 MB，約 6.7%） |
| Compute | 100 CU-hrs／月 |
| 網路傳輸 | 5 GB／月 |
| **History retention** | **6 小時** |
| **自動休眠** | **閒置後 compute 會 scale to zero** |

### 2.1 自動休眠會讓 CLI 工具第一次連線失敗

實測（2026-08-20）：`prisma migrate diff` 第一次執行直接回 `P1001 Can't reach database server`，
但用 Prisma Client 查詢可以喚醒，**冷啟動約 0.7–1.8 秒**。

> **看到 `P1001` 不要以為資料庫壞了。** 先跑一個簡單查詢喚醒，再重試原本的指令。

前台不受影響——Vercel 有流量時 compute 一直是醒著的。

### 2.2 6 小時的時間點還原是唯一的事後補救

Free plan 保留 **6 小時**的 history，可以把分支還原到這段時間內的任一時間點。

| | 6 小時還原 | dev 分支 |
|---|---|---|
| 性質 | **出事後補救** | **事前避免出事** |
| 限制 | 超過 6 小時就沒了；還原是整個分支回滾，期間其他正常變更會一起消失 | 無時間限制，改壞不影響正式站 |

**兩者不能互相取代。** 真的要動 production 資料時，6 小時窗口是最後的安全網，不是第一道防線。

## 3. 怎麼確認現在連到哪

**不要直接印出 `DATABASE_URL`**（含明碼密碼）。用下列方式判斷：

```bash
# 檢查端點是不是 production（production 的端點前綴為 ep-bitter-surf）
grep -q "ep-bitter-surf" .env && echo "連到 production" || echo "連到其他分支（dev）"
```

或用資料筆數交叉比對：兩個分支剛分家時筆數相同，
但 dev 一旦有測試資料就會不同（2026-08-20 分家時：35 優惠／18 卡／9 銀行／2 文章／6 分類）。

## 4. 切換分支

### ⚠️ 切換前先備份目前設定（2026-08-20 新增，這條是踩到才補的）

**`cp` 會直接覆蓋 `.env`，被蓋掉的那組連線字串就從本機消失了。**

2026-08-20 T33 執行時，AI 指示使用者 `cp .env.backup-production .env`，
但當時**只有 production 的備份、沒有 dev 的備份**，dev 連線字串因此被覆蓋，
只能回 Neon 控制台重拿。

**所以每次切換前先確認要切過去的方向有沒有備份**：

```bash
ls -la .env*
```

備份檔應該要有兩個：`.env.backup-production` 與 `.env.backup-dev`。
缺哪一個，就在目前連著那個分支時先補起來：

```bash
# 目前連 dev 時執行
cp .env .env.backup-dev
# 目前連 production 時執行
cp .env .env.backup-production
```

`.gitignore` 的 `.env.*` 已涵蓋所有備份檔，不會進版控。

### 切到 dev（日常開發，預設狀態）

備份齊全時：

```bash
cp .env.backup-dev .env
```

沒有備份時（回 Neon 重拿）：

1. Neon → `credit-card-web` → Branches → `dev` → Connection details → Copy
2. 編輯專案根目錄 `.env`，**只換 `DATABASE_URL=` 等號後面那串**，其餘四個變數不動
3. 存檔
4. **存檔後補一份備份**：`cp .env .env.backup-dev`

### 切回 production（需要動正式資料時）

```bash
cp .env.backup-production .env
```

`.env.backup-production` 是 2026-08-20 建立 dev 分支前的原始備份。
若備份不見了，到 Neon 的 `production` 分支重新複製連線字串即可——**連線字串不是一次性的**。

> **切回 production 之後要記得切回來**，否則後續的本機操作又會直接動正式站。

## 5. ⚠️ 連線字串是機密

格式：`postgresql://使用者:密碼@主機/資料庫?sslmode=require`——**中間是明碼密碼**，
取得者可完整讀寫資料庫，包含後台管理員資料表。

| 可以 | 不可以 |
|---|---|
| 貼進本機 `.env` | ❌ 貼進對話、文件、程式碼、截圖 |
| 貼進 Vercel 環境變數設定 | ❌ commit 進 git |
| — | ❌ 由 AI 代為輸入或轉貼 |

**AI 不需要看到這串字。** 驗證一律用「連得上／連不上」與筆數比對完成。

若不慎外流：到 Neon 重設該分支的密碼（rotate），並更新所有使用該字串的地方。

### `.gitignore` 保護範圍（2026-08-20 修正）

原本只排除 `.env` 與 `.env*.local`，**備份檔如 `.env.backup-production` 不在保護範圍內**。
已改為：

```
.env
.env.*
!.env.example
```

現在所有 `.env` 變體都被排除，只有 `.env.example` 仍在版控。

## 6. `playing_with_neon`：✅ 兩個分支都已清除（2026-08-20 完成）

`playing_with_neon` 是 Neon 建立專案時的範例表（`id`／`name`／`value`，10 筆假資料，
`name` 是數字的 MD5 前 10 碼），**專案程式碼零引用**。

它的風險是：`prisma migrate dev` 會把這張 schema 檔沒有的表判定為 **drift**，
並**提議重置整個資料庫**。

### 處理結果（T33）

| 分支 | 狀態 |
|---|---|
| `dev` | ✅ 2026-08-20 移除 |
| `production` | ✅ 2026-08-20 移除 |

兩個分支皆套用同一個 migration `20260820230418_drop_playing_with_neon`，
現在都是 **2 筆 migration、12 張表、漂移歸零**，資料筆數零變動（35／18／9／2／6）。

處理流程與陷阱見 `DATABASE_MIGRATION_資料庫結構變更流程.md`。

## 7. 與其他 SOP 的分工

| 文件 | 負責 |
|---|---|
| **本文件** | 連到哪個資料庫、分支切換、Neon 限制 |
| `DATABASE_MIGRATION_資料庫結構變更流程.md` | **改資料庫結構怎麼執行**：migration 流程、陷阱、驗證、把關方式 |
| `LOCAL_VERIFICATION_本機驗證與快取排查.md` | dev server、port、`.next`、build、stale chunk |
| `PRODUCTION_DEPLOYMENT_正式環境部署檢查.md` | 部署授權與正式環境操作 |

## 8. 給 AI 的界線

- **預設情況下本機連 dev 分支，寫入 dev 屬一般操作**，不再是第三層。
- **但寫入 production 分支仍然是第三層**，每次都要使用者個別確認。
- 執行任何資料庫寫入前，**先確認目前連到哪個分支**（見第 3 節），不可假設。
- 不得輸出 `DATABASE_URL` 的值，不得代為輸入連線字串。
- 切換分支屬於改 `.env`，由使用者本人操作；AI 可以協助開啟檔案與驗證結果。
