# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-07-27 / v3
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務卡：docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md（v1 已核准 2026-07-27）
前一版：prisma-schema-spec-v2-2026-06-08.md

## 1. 這份文件的用途

本文件只說明 **v3 相對於 v2 的變更**。v2 的整體資料模型、命名規則、SEO 欄位等說明仍以 `prisma-schema-spec-v2-2026-06-08.md` 為準，未變動的部分不在此重述。

v3 的核心變更是 **T21 優惠條件結構化**：把「一檔優惠只有一組扁平回饋欄位」改為「一檔優惠可以有多層回饋（RewardTier），每層各自管理回饋率、上限、上限週期、適用通路與條件」。這是為了正確表達像永豐幣倍卡那種「基本回饋＋精選通路加碼＋新卡友加碼＋新戶禮」多層、各有獨立上限的真實優惠。

## 2. 新增的三個 model

### 2.1 RewardTier（回饋層）

一檔 `Offer` 底下可有一到多筆 `RewardTier`。每筆代表一層回饋。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | Int | 主鍵 |
| `offerId` | Int | 所屬優惠 |
| `label` | String? | 這層的名稱，例：「基本回饋」「精選通路加碼」「新卡友加碼」 |
| `rewardType` | String? | 這層的回饋類型（cashback／points…），每層可不同 |
| `rate` | String? | 回饋率或算式文字，例：「4%」「每滿NT$50,000回饋NT$50」 |
| `cap` | String? | 回饋金額上限文字，例：「NT$800」 |
| `capPeriod` | String? | 上限週期，**String 不做 enum**（延續既有慣例），例：「月帳單週期」「日曆月」「一次性」 |
| `minSpend` | String? | 這層的使用門檻／最低消費文字，例：「單筆滿 NT$3,000」。舊 `Offer.minSpend` 遷移時的結構化去處 |
| `conditionsText` | String? | 人話條件文字，前台顯示用 |
| `conditions` | String? | JSON 字串（TierConditions）；前期只建不用，比照 `faqJson`／`prosJson`／`consJson` 慣例，用共用函式手動解析，不用 Prisma `Json` 型別 |
| `sortOrder` | Int | 同一優惠內多層的顯示順序 |

關聯：`offer`（多對一，onDelete: Cascade）、`channels`（多對多，經 `RewardTierChannel`）。索引 `@@index([offerId])`。

### 2.2 Channel（通路）

獨立成表的消費通路（如指定商店類別、行動支付平台）。與 `RewardTier` 多對多，讓同一通路可被多層/多檔優惠引用。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | Int | 主鍵 |
| `name` | String @unique | 通路顯示名稱 |
| `slug` | String @unique | 通路代號 |

### 2.3 RewardTierChannel（join table）

`RewardTier` ↔ `Channel` 多對多的中介表：`rewardTierId` + `channelId` 複合主鍵，兩端 onDelete: Cascade，`@@index([channelId])`。

## 3. Offer 的變更

- 新增關聯 `tiers RewardTier[]`。
- 新增非正規化欄位 `headlineRate String?`、`headlineSummary String?`：供列表頁（首頁、分類頁、OfferCard）快速顯示「最高幾%」之類的重點，不必展開全部 tier 計算。
- **既有扁平欄位 `rewardType / rewardValue / rewardCap / minSpend / conditions` 於 v3 暫時保留**，作為資料遷移期間的搬運橋樑。使用者已拍板最終移除；待前台、後台、驗證、匯入全部改讀 `RewardTier` 後，於 T21 Phase 5（另出 v4）從 schema 移除。

## 4. 型別策略（延續 v2 既有慣例）

- `capPeriod`、`PaymentMethod` 等一律 String＋程式層（`domain-validation.ts`）驗證，**不使用 Prisma enum**（SQLite 與正式 PostgreSQL 策略相同）。
- `conditions`（TierConditions）以 JSON 字串存放，透過共用函式手動解析／驗證，**不使用 Prisma `Json` 型別**，與 `faqJson`／`prosJson`／`consJson` 一致。

## 5. 與 v2 spec 檔漂移的對齊（reconciliation）

v2 之後，T19 於 2026-07-18 為 `Card` 新增了六個欄位（`annualFee / annualFeeWaiver / cardLevel / cardNetwork / prosJson / consJson`），但**當時只改了實際執行的 `prisma/schema.prisma`，未同步 `engineering-data-model-spec/schema.prisma`**，導致兩份 schema 檔漂移。v3 以實際執行檔為準把兩者對齊，之後 `prisma/schema.prisma` 與 `engineering-data-model-spec/schema.prisma` 內容一致。

## 6. 尚未執行的高風險步驟

本版僅完成 schema 檔修改與 `prisma validate`（已通過）。**尚未執行 `prisma db push`**——db push 會改動本機 SQLite 結構，屬高風險，依 T21 核准條件須在執行前再次向使用者確認（T21 Phase 2）。資料遷移（把每筆 Offer 的扁平欄位轉為至少一筆 RewardTier）亦於 Phase 2 進行。

## 7. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v3-2026-07-27.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-07-27.md`。
