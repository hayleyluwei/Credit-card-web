# T30 日期時區正確性修正（正式站日期少一天）

建立日期：2026-08-18（Asia/Taipei）
任務卡版本：v1.3
核准狀態：**已核准（2026-08-18）**
任務狀態：**已部署並通過上線後驗證，待使用者本人人工驗收**
部署狀態：**Production 已部署，Production 已驗證**（commit `d41aed9`，2026-08-18）
問題類型：Bug 修正（正在對線上使用者顯示錯誤資訊）

> **2026-08-18 盤點後結論**：既有資料**完全未被破壞**（105 個日期欄位全數符合約定），
> 因此 **Scope E 的資料修復不需要執行**，本任務縮減為純程式修正。詳見「Scope E 盤點結果」。

## 背景

`CURRENT_STATE` 與 2026-08-18 交接摘要記錄了一個已知問題：正式站的優惠日期比實際少一天。本卡在建立前先做了 Discovery，實際查證後確認**問題不只一個，而且有一個尚未被發現的缺陷比顯示錯誤更嚴重**。

### 根因：專案沒有統一的時區約定

資料寫入時使用的是「**台北午夜的那個瞬間**」：

```js
// scripts/import-offer-data.mjs:317-322
startDate: new Date(`${o["開始日期"]}T00:00:00+08:00`)
```

所以資料庫裡的 `2026-06-30T16:00:00Z` 代表的是**台北 2026-07-01**，資料本身正確。

但**讀取與比較的每一處都使用「伺服器本機時區」**——`toLocaleDateString()` 不帶 `timeZone`、`setHours(0,0,0,0)`、`new Date("YYYY-MM-DDT00:00:00")` 全部如此。本機是 `Asia/Taipei`，Vercel 是 `UTC`，同一份資料因此在兩個環境被解讀成不同的日期。

**這代表本機測試永遠看不到這個 bug**——只有上線後才會出現。

### 實測證據（2026-08-18 以 Node 重現，未觸及資料庫）

以資料庫實際存在的值 `2026-06-30T16:00:00Z`（＝台北 2026-07-01）為例：

| 環境 | `toLocaleDateString("zh-TW")` | `toISOString().slice(0,10)` |
|---|---|---|
| 本機（Asia/Taipei） | `2026/7/1` ✅ | `2026-06-30` ❌ |
| Vercel（UTC） | `2026/6/30` ❌ | `2026-06-30` ❌ |
| 修正後（指定 `timeZone: "Asia/Taipei"`） | `2026/7/1` ✅ | — |

### 缺陷一：正式站顯示早一天（使用者已察覺）

| 位置 | 程式 | 受影響欄位 |
|---|---|---|
| `src/app/offers/[slug]/page.tsx:16` | `formatDate` 用 `toLocaleDateString("zh-TW")`，未指定 `timeZone` | `startDate`、`endDate`、`lastVerifiedAt` |
| `src/components/OfferCard.tsx:47` | 同上（「截至 …」） | `endDate` |
| `src/app/guides/page.tsx:46` | `toISOString().slice(0,10)` | `lastVerifiedAt` |
| `src/app/guides/[slug]/page.tsx:88,90` | `toISOString().slice(0,10)` | `updatedAt`、`lastVerifiedAt` |

`OfferCard` 是 **server component**（無 `"use client"`），所以在 Vercel 上以 UTC 算日期——**首頁、分類頁、情境頁、搜尋頁、卡片頁凡是列出優惠的地方全部受影響**，不只詳情頁。

`toISOString()` 那兩處更麻煩：它**永遠**取 UTC 日期，與伺服器時區無關，所以本機也是錯的。但要注意 `updatedAt` 是真實時間戳（不是台北午夜），對它取 UTC 日期只有在台北 00:00–08:00 之間才會早一天——兩類欄位性質不同，修法相同但風險不同。

### 缺陷二：過期判斷提早一天隱藏優惠

`setHours(0, 0, 0, 0)` 同樣使用伺服器本機時區：

| 位置 | 函式 |
|---|---|
| `src/lib/domain-offers.ts:56-68` | `getPublicOffers`（決定優惠是否出現在前台） |
| `src/lib/domain-offers.ts:114-125` | `isOfferExpired`（詳情頁的「已過期」標示） |
| `src/lib/domain-offers.ts:134-145` | `daysUntilExpiry` |
| `src/lib/domain-search.ts:105-115` | 搜尋結果過濾 |
| `src/lib/domain-validation.ts:106-115` | `isOfferExpired`（重複實作，同樣的錯） |
| `src/app/admin/page.tsx:23-28,43,49` | 後台「過期優惠」與「即將到期」統計，直接用 `new Date()` 比對 |

實測：`endDate` ＝ 台北 7/1 的優惠，在 UTC 環境下，當 UTC 進入 7/1（即**台北 7/1 上午 8 點**）就被判定為 `endDate < now` → 過期。

**結果是優惠在它仍然有效的最後一天上午 8 點從網站上消失。**

### 缺陷三（最嚴重，尚未被記錄）：後台編輯會讓日期每存一次就往前跳一天

這是 Discovery 過程中新發現的，**它會實際破壞資料，不只是顯示問題**。

| 位置 | 程式 | 行為 |
|---|---|---|
| `src/components/AdminOfferForm.tsx:66` | `dateInput` ＝ `value.toISOString().slice(0,10)` | 把台北 7/1 的值**顯示成 `2026-06-30`** |
| `src/lib/admin-actions.ts:266-268` | `dateValue` ＝ `new Date(\`${value}T00:00:00\`)`（**無時區後綴**） | 以伺服器本機時區解析 |
| `src/components/AdminArticleForm.tsx:21` | 同樣的 `dateInput` | 文章的 `lastVerifiedAt`、`publishedAt` 同受影響 |

實測往返結果：

| 原始資料 | 表單顯示 | 在何處按儲存 | 存回去變成 | 台北日期 |
|---|---|---|---|---|
| 台北 2026-07-01 | `2026-06-30` | 本機（台北） | `2026-06-29T16:00Z` | **6/30（早一天）** |
| 台北 2026-07-01 | `2026-06-30` | Vercel（UTC） | `2026-06-30T00:00Z` | 6/30 上午 8 點（**日期錯，且破壞「台北午夜」約定**） |

**在台北本機每編輯儲存一次，日期就往前一天，而且會累積。** 在 Vercel 上儲存則會讓該筆資料不再落在午夜，使缺陷二的比較再多一層偏差。

**因此無法假設資料庫現有的值都還是原始值**——凡是使用者曾在後台編輯過日期欄位的優惠，存的可能已經不是當初匯入的日期。修程式之前必須先盤點。

## 已確認決策

- 資料的正確語意是「**台北的某一個日曆日**」，匯入腳本的 `T00:00:00+08:00` 是正確約定，本任務**沿用**這個約定，不改資料語意。
- `endDate` 為**包含當日**（現行 `endDate >= now` 的行為），本任務維持不變。
- 不改 Prisma schema：欄位型別維持 `DateTime`，問題全部出在讀寫層。

## 目標

讓全站以 `Asia/Taipei` 為唯一的日期解讀基準，**顯示、過期判斷、後台編輯往返三者一致，且與部署環境的時區無關**——本機跑出來的結果必須等於 Vercel 跑出來的結果。

## Scope（規劃內容；核准實作前不得執行）

### A. 建立單一時區工具模組

新增 `src/lib/domain-date.ts`，集中管理所有日期解讀：

- `formatTaipeiDate(date)`：以 `Asia/Taipei` 格式化顯示（取代所有 `toLocaleDateString`／`toISOString().slice(0,10)`）。
- `taipeiDateInput(date)`：後台 `<input type="date">` 的值，以台北日期取字串。
- `parseTaipeiDate(value)`：把 `YYYY-MM-DD` 解析成台北午夜的 `Date`（即現行匯入腳本的行為）。
- `taipeiTodayStart()`：今天台北 00:00 對應的瞬間，供過期比較使用。

規則：**其他檔案一律不得自行 `new Date(...)` 做日期比較或格式化**，必須經過本模組。

### B. 顯示端改用 A

`offers/[slug]/page.tsx`、`OfferCard.tsx`、`guides/page.tsx`、`guides/[slug]/page.tsx`，以及後台頁面的日期顯示。

### C. 過期判斷改用 A

`domain-offers.ts`（3 個函式）、`domain-search.ts`、`domain-validation.ts`、`admin/page.tsx` 的 Prisma `where` 條件。

順帶處理：`domain-offers.ts` 與 `domain-validation.ts` 有兩份重複的 `isOfferExpired`，本次應收斂為一份，避免只修好其中一份。

### D. 後台編輯往返改用 A

`AdminOfferForm.tsx` 的 `dateInput`、`AdminArticleForm.tsx` 的 `dateInput`、`admin-actions.ts` 的 `dateValue`。**這一項優先於 B、C**——它每被觸發一次就多壞一筆資料。

### E. 既有資料盤點與修復（**盤點已完成；修復不需要執行**）

1. ~~唯讀盤點~~ **已於 2026-08-18 完成**，見下方「Scope E 盤點結果」。
2. ~~盤點結果先回報~~ 已回報。
3. ~~若需修復~~ **不需要**。資料全數完好，不執行任何資料庫寫入。

#### Scope E 盤點結果（2026-08-18，唯讀執行 `scripts/t30-date-inventory.mjs`）

| 項目 | 結果 |
|---|---|
| 優惠筆數 | 35（文章 0 篇） |
| 有值且已檢查的日期欄位 | 105（`startDate`／`endDate`／`lastVerifiedAt`） |
| 符合「台北午夜」約定 | **105（100%）** |
| 偏離約定（疑似被後台存壞） | **0** |

**結論一：資料完好。** 缺陷三（後台編輯往前跳）雖然存在，但**尚未被觸發過**——
使用者至今沒有在後台編輯過任何日期欄位。這是運氣，不是設計；缺陷仍須修掉。

**結論二：顯示錯誤是全面的。** 35 / 35 筆有 `endDate` 的優惠在正式站都顯示錯誤日期，
無一倖免（例：`2026/12/30` 應為 `2026/12/31`）。

**結論三：過期誤判目前尚未發生，但有明確的引爆日。**
盤點當下（2026-08-18）判定不一致的優惠為 **0 筆**，因為沒有任何優惠的 `endDate` 正好是今天。
但最早到期的三筆——`ctbc-uniopen-core-rewards-2026h2`、`ctbc-uniopen-icashpay-stack-2026q3`、
`ctbc-uniopen-overseas-physical-2026h2`——`endDate` 皆為 **2026/8/31**。
若在此之前未修好，這三筆會在 **2026-08-31 台北時間上午 8 點**從網站上消失，
而它們實際上到當天結束都仍然有效。

### F. 雙時區回歸驗證

新增驗證腳本，**在 `TZ=UTC` 與 `TZ=Asia/Taipei` 兩種環境下跑同一組斷言**，兩者結果必須完全相同。這是本任務唯一能證明修好的方式——只在本機跑等於沒測。

### G. 文件

Summary、人工驗收腳本、`CURRENT_STATE`、任務索引更新。

## Non-scope

- 不修改 Prisma schema 或建立 migration。
- 不修改資料庫既有資料（Scope E 的修復需另外核准）。
- 不改任何視覺、版面或文案。
- 不處理 T25 的過期優惠轉址（兩者相關但各自獨立）。
- 不改匯入腳本的日期寫入邏輯（現行是對的）。
- 不處理 `createdAt`／`updatedAt` 在 JSON-LD 的 ISO 輸出（那裡用完整 ISO 字串是正確的）。

## 安全限制

- Scope A–D、F、G 只動程式與文件，不觸及資料庫。
- Scope E 的盤點為唯讀查詢；**修復屬第三層，未逐筆確認不得執行**。
- 本機 `.env` 的 `DATABASE_URL` 直接指向正式站 Neon，**任何資料庫操作都等於在動正式站**，執行前必須明確區分唯讀與寫入。
- 不在對話或文件輸出連線字串、密碼或 Token。

## 影響範圍

| 類型 | 檔案 |
|---|---|
| 新增 | `src/lib/domain-date.ts`、雙時區驗證腳本 |
| 顯示 | `src/app/offers/[slug]/page.tsx`、`src/components/OfferCard.tsx`、`src/app/guides/page.tsx`、`src/app/guides/[slug]/page.tsx` |
| 判斷 | `src/lib/domain-offers.ts`、`src/lib/domain-search.ts`、`src/lib/domain-validation.ts`、`src/app/admin/page.tsx` |
| 後台 | `src/components/AdminOfferForm.tsx`、`src/components/AdminArticleForm.tsx`、`src/lib/admin-actions.ts` |
| 使用者可見頁面 | 首頁、`/offers/[slug]`、`/categories/[slug]`、`/scenarios/[slug]`、`/cards/[slug]`、`/banks/[slug]`、`/search`、`/guides`、`/guides/[slug]`、後台儀表板與編輯表單 |

**部署注意**：首頁與 `/scenarios/[slug]` 是靜態產生，修好後必須重新部署才會反映（見 2026-08-18 交接摘要「寫入資料庫 ≠ 全站可見」）。

## 驗證方式與完成定義

自動驗證：

1. `tsc` 型別檢查、`eslint` 通過。
2. Scope F 的雙時區腳本在 `TZ=UTC` 與 `TZ=Asia/Taipei` 下輸出一致，且對「台北午夜」樣本資料得到正確日期。
3. 邊界案例斷言：`endDate` ＝今天（台北）→ 仍可見；＝昨天 → 隱藏；**在台北時間 00:00–08:00 與 08:00 之後結果必須相同**（這是原本會出錯的時段）。
4. 後台往返斷言：讀出 → 填入表單 → 儲存 → 再讀出，日期不變（在兩種時區下都要成立）。

人工驗收（使用者可見變更，必須有腳本）：

- 建立 `manual-test-scripts/T30-…` 腳本，於**正式站**逐項核對：詳情頁期間、卡片「截至」、攻略頁查證日期、後台編輯儲存後日期不跳動。
- **未在正式站驗證前不得標示完成**——本機正確不能證明任何事。

## 資料保護與回復方式

- 程式變更以 Git 版控，可 revert。
- Scope E 若執行修復：先用 Prisma 唯讀匯出受影響筆的現值存檔，再逐筆寫入；匯入腳本自動備份的 `prisma/dev.db` 已停用，**對正式站 Postgres 沒有保護作用**，不可依賴。

## Git 授權

- 本卡草稿階段：不執行 `git add`、commit、branch 操作。
- 核准後：授權範圍由使用者於核准時明確指定。
- **push 到正式站一律須先詢問**（2026-08-09 明訂規則，不因本任務為 Bug 修正而例外）。

## 風險與待決問題

| # | 問題 | 現況／建議 |
|---|---|---|
| (a) | 既有資料是否已被後台編輯破壞？要不要修？ | **已解決（2026-08-18）**：盤點 105 個欄位全數完好、0 筆偏離，**不需修復**，未執行任何資料庫寫入 |
| (b) | 是否新增時區套件（如 `date-fns-tz`）？ | **已解決**：不新增。改用 Node 內建 `Intl.DateTimeFormat` 的 `timeZone` 選項，`package.json` 未變動 |
| (c) | 後台顯示與輸入是否一律以台北為準？ | **已解決**：是。後台與前台共用同一個 `domain-date` 基準 |
| (d) | `guides` 的 `updatedAt`（真實時間戳，非台北午夜）是否也改成台北日期顯示？ | **已解決**：一併改為台北日曆日。原本用 `toISOString()` 取 UTC 日期，在台北 00:00–08:00 之間會顯示前一天 |
| (e) | 修好後何時部署？ | **未決，需使用者授權**。⚠️ 有時限：三筆 uniopen 優惠會在 **2026-08-31** 觸發過期誤判，建議在此之前上線 |
| (f) | 是否同時收斂 `domain-offers` 與 `domain-validation` 的重複 `isOfferExpired`？ | **已解決**：`domain-validation.isOfferExpired` 改為委派給 `isPastTaipeiDay`，兩處不會再各自漂移 |
| (g) | Scope 是否切成兩階段（先修 D 止血，再修 B/C）？ | **已解決**：盤點確認資料未被破壞，無立即止血壓力，A–D 一次做完 |

風險：

- 修改過期判斷會**改變前台實際顯示的優惠筆數**（原本被提早隱藏的會回來）。這是預期中的修正，但驗收時要能分辨「多出來的是修好」而非「錯誤顯示過期優惠」。
- Scope C 動到 `getPublicOffers`，是全站優惠列表的共用入口，回歸範圍大。

## 實作結果（2026-08-18）

### 新增檔案

| 檔案 | 用途 |
|---|---|
| `src/lib/domain-date.ts` | **全站唯一的日期時區基準**。`formatTaipeiDate`／`taipeiDayKey`／`taipeiDateInput`／`parseTaipeiDate`／`taipeiDayStart`／`taipeiTodayStart`／`isPastTaipeiDay`／`daysUntilTaipeiDay`／`taipeiDayOffset` |
| `scripts/verify-t30-date-timezone.mjs` | 雙時區驗證（唯讀，不連資料庫） |
| `scripts/t30-date-inventory.mjs` | Scope E 的唯讀資料盤點 |
| `docs/implementation/manual-test-scripts/T30-日期時區修正驗收腳本-v1-2026-08-18.md` | 人工驗收腳本 |

### 修改檔案

| 檔案 | 修改 |
|---|---|
| `src/components/AdminOfferForm.tsx` | `dateInput` 改用 `taipeiDateInput`（缺陷三） |
| `src/components/AdminArticleForm.tsx` | 同上 |
| `src/lib/admin-actions.ts` | `dateValue` 改用 `parseTaipeiDate`（缺陷三） |
| `src/app/offers/[slug]/page.tsx` | `formatDate` 改用 `formatTaipeiDate`（缺陷一） |
| `src/components/OfferCard.tsx` | 「截至」改用 `formatTaipeiDate`（缺陷一，影響全站列表） |
| `src/app/guides/page.tsx` | 查證日期改用 `taipeiDayKey`（缺陷一） |
| `src/app/guides/[slug]/page.tsx` | 最後更新／最後查證改用 `taipeiDayKey`（缺陷一） |
| `src/lib/domain-offers.ts` | `getPublicOffers`／`isOfferExpired`／`daysUntilExpiry` 三處改用台北日曆日（缺陷二） |
| `src/lib/domain-search.ts` | `filterExpiredOffers` 同上（缺陷二） |
| `src/lib/domain-validation.ts` | 重複的 `isOfferExpired` 改為委派（缺陷二＋待決 (f)） |
| `src/app/admin/page.tsx` | 儀表板統計的日期基準改用 `taipeiTodayStart`／`taipeiDayOffset`（缺陷二） |

未新增任何套件；`package.json`、`prisma/schema.prisma` 皆未變動。

### 自動驗證結果

| 指令 | 結果 |
|---|---|
| `node scripts/verify-t30-date-timezone.mjs` | **通過**。19 項斷言在 `TZ=UTC` 與 `TZ=Asia/Taipei` 下輸出完全一致；含「後台往返連做三次不漂移」與「結束日＝今天仍有效」的邊界斷言；靜態掃描確認 `src` 下無殘留舊寫法 |
| `npx tsc --noEmit --incremental false` | **通過**（exit 0，未產生 tsbuildinfo） |
| `npx next lint` | **通過**（No ESLint warnings or errors） |
| `npm run build` | **未執行**。白名單 `AI_VERIFICATION_POLICY` 目前為空，`next build` 分類為 `unclassified`，且會寫入共用 `.next`，依 AI_WORKFLOW §4／§11 不得自行認證執行 |

### 部署與上線後驗證（2026-08-18）

使用者明確授權（「T30 push 上正式站」）後執行：

- commit `d41aed9`，以快轉方式推送 `3dd19a8..d41aed9` 至 `origin/main`（推送前已確認 `origin/main` 為 HEAD 祖先，不覆蓋任何遠端提交）；本地 `main` 同步更新。
- Vercel 自動建置完成後，實測正式站四種頁型：

| 頁型 | 檢查 | 結果 |
|---|---|---|
| 優惠詳情頁（動態） | `/offers/cathay-cube-private-school-tuition-2026` | 起 **2026/7/1**、迄 **2026/12/31**、查證 **2026/8/18**（修正前分別為 6/30、12/30、8/17） |
| 首頁（靜態，需重建） | OfferCard「截至」 | **2026/12/31**（修正前 12/30），確認靜態頁已隨部署重建 |
| 搜尋頁（動態） | `/search?q=學費` | **2026/12/31** |
| 情境頁（靜態 SSG） | `/scenarios/tuition` | **2026/12/31** |
| 8/31 引爆點三筆 | 三筆 uniopen 優惠 | 全部顯示 **2026/8/31**（修正前 8/30） |

**`npm run build` 仍未在本機執行**（白名單為空，且會寫共用 `.next`）。實際把關的是 Vercel 的建置——
若建置失敗，Vercel 不會替換 Production，正式站會停在舊版；本次建置成功且上線後實測通過。

### 未完成／需使用者決定

- **使用者本人的人工驗收未執行**：`manual-test-scripts/T30-日期時區修正驗收腳本-v1-2026-08-18.md`
  現在已可執行（A、B、D、E、F 區塊）。
- **C 區塊（過期判斷）必須等到 2026-08-31 當天**才能驗證。

## 核准證據

- 建立依據：使用者於 2026-08-18 對話中指示「正式站日期少一天…開任務卡」。
- **核准者**：使用者本人（hayleyluwei）
- **核准日期與時區**：2026-08-18（Asia/Taipei）
- **核准 Scope 版本**：v1
- **核准原文**：「T30 核准開工 你盤點」
- **涵蓋範圍**：Scope A–D、F、G 的程式與文件修改，以及 Scope E 第 1 步的**唯讀**盤點。
- **不涵蓋**：Scope E 第 3 步的資料修復寫入（盤點後確認不需要）、push 與部署（依 2026-08-09 規則仍須另外詢問）。
- Git 特別授權：未授權。`git add`、commit、push 皆未執行。

## Scope 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.3 | 2026-08-18 | 使用者授權後推送 `d41aed9` 至 `origin/main`，Vercel 部署完成。正式站四種頁型實測全部顯示正確日期，部署狀態改為「Production 已驗證」 |
| v1.2 | 2026-08-18 | Scope A–D、F、G 實作完成，自動驗證通過。7 個待決問題中 6 個已解決，僅 (e) 部署時機待使用者授權 |
| v1.1 | 2026-08-18 | 使用者核准開工並指示先盤點。Scope E 盤點完成：105 個日期欄位全部完好、0 筆偏離，**資料修復不需要執行**，本任務縮減為純程式修正。同時記錄過期誤判的引爆日為 2026-08-31（三筆 uniopen 優惠） |
| v1 | 2026-08-18 | 建立。Discovery 後確認為三個相關缺陷（顯示早一天、過期提早一天、後台編輯累積往前跳），並記錄實測證據 |
