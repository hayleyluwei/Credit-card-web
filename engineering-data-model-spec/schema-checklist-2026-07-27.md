# schema 修正清單 2026-07-27（v3，T21 優惠條件結構化）

依 `schema修改流程.md` 產出。對應任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`（v1 已核准 2026-07-27）。

## 本次背景

T21 採方案 B：重構 `Offer`，改為「一檔優惠拆成多層回饋（RewardTier）」的結構，每層各自管理率／上限／上限週期／通路／條件。使用者 2026-07-27 拍板扁平欄位最終移除；為避免資料遺失，採「先擴張、遷移、再收縮」順序，本次（v3）為擴張階段，扁平欄位暫時保留，於 T21 Phase 5 移除（屆時另出 v4）。

## `schema.prisma` 要改什麼

1. 新增 `model RewardTier`：`id / offerId / label / rewardType / rate / cap / capPeriod / minSpend / conditionsText / conditions(JSON字串) / sortOrder / createdAt / updatedAt`；關聯 `Offer`（onDelete: Cascade）與多對多 `Channel`；`@@index([offerId])`。（`minSpend` 為每層各自的使用門檻，供舊 `Offer.minSpend` 遷移時有結構化去處。）
2. 新增 `model Channel`：`id / name(unique) / slug(unique) / createdAt / updatedAt`；多對多 `RewardTier`。
3. 新增 `model RewardTierChannel`（join table）：`rewardTierId / channelId`，複合主鍵，`@@index([channelId])`，兩端 onDelete: Cascade。
4. `Offer` 新增：關聯 `tiers RewardTier[]`；非正規化 `headlineRate String?`、`headlineSummary String?`。
5. `Offer` 既有扁平欄位 `rewardType / rewardValue / rewardCap / minSpend / conditions`：**本版保留**（過渡搬運橋樑），加註 T21 移除計畫。
6. 更新檔頭版本註解為 `v3 / 2026-07-27`。

## 一併處理的既有漂移（reconciliation）

- `engineering-data-model-spec/schema.prisma`（schema 流程認定的正式檔）先前與實際執行的 `prisma/schema.prisma` 不同步：**少了 T19 新增的 6 個 `Card` 欄位**（`annualFee / annualFeeWaiver / cardLevel / cardNetwork / prosJson / consJson`），因為 T19 當時只改了 `prisma/schema.prisma`。本次以實際執行檔 `prisma/schema.prisma` 為準，將兩者對齊，之後兩份一致。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v3-2026-07-27.md`：說明 RewardTier／Channel／join table 的用途、與 Offer 的關係、扁平欄位過渡策略、T19 漂移的對齊，以及 String（非 enum）與 JSON 字串（非 Prisma Json 型別）的既有慣例延續。

## 是否新增版本備份檔

- 是：`schema-v3-2026-07-27.prisma`（內容＝本次修改後的 `prisma/schema.prisma`）。

## 是否需要 format / validate

- 已執行 `npx prisma validate` → 通過（valid）。
- **尚未執行 `prisma db push`**：db push 會改動本機 SQLite 結構，屬高風險步驟，依 T21 核准條件須在執行前再次向使用者確認（Phase 2）。

## MVP 範圍檢查

- 本次新增的 `RewardTier / Channel / RewardTierChannel` 屬 T21 已核准 Scope，非未經核准的 MVP 外 model。
- 未觸碰 MVP 明文排除的 `AuditLog / FaqItem / Tag / Redirect / CrawlSource / ImportJob`。
