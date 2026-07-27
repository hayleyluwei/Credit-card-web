# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-07-27 / v4
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務卡：docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md（v1 已核准）
前一版：prisma-schema-spec-v3-2026-07-27.md

## 1. 這份文件的用途

本文件只說明 **v4 相對於 v3 的變更**。RewardTier／Channel／RewardTierChannel 的結構、型別策略（String 不做 enum、JSON 字串不做 Prisma Json）等說明仍以 `prisma-schema-spec-v3-2026-07-27.md` 為準。

## 2. v4 的唯一變更：移除 Offer 扁平回饋欄位

v3 為過渡階段，`Offer` 同時保有舊的扁平回饋欄位（搬運橋樑）與新的 `RewardTier`。v4 完成「收縮」，從 `Offer` 移除下列欄位：

- `rewardType`
- `rewardValue`
- `rewardCap`
- `minSpend`
- `conditions`

移除後，一檔優惠的回饋內容**一律**由 `RewardTier`（一對多）承載：每層有 `rewardType / rate / cap / capPeriod / minSpend / conditionsText / conditions(JSON) / label / sortOrder / channels`。列表頁的重點顯示改用 `Offer.headlineRate`（非正規化，遷移／匯入／seed 時由第一層 tier 的 rate 帶入）。

## 3. 為什麼可以安全移除

- 資料已於 v3（Phase 2）以 `scripts/migrate-offers-to-tiers.mjs` 把每筆 Offer 的扁平欄位遷移成一筆 RewardTier；`import-offer-data.mjs`／`seed.mjs` 也已改為寫入 RewardTier。
- 前台（`offers/[slug]`、`OfferCard`）、後台（`AdminOfferForm`、`admin-actions`）、發布驗證（`domain-validation`）皆已改讀／寫 RewardTier，不再引用扁平欄位。
- 移除前備份 `prisma/dev.db`；`prisma validate`、`tsc --noEmit`、`next build` 均通過。

## 4. 影響的既有腳本

- `scripts/migrate-offers-to-tiers.mjs`：一次性遷移腳本，其讀取的扁平欄位已不存在，成為歷史腳本、不再執行（檔頭已加註）。
- `scripts/verify-t03-seed.mjs`、`verify-real-card-data.mjs`、`verify-ux-followup.mjs`：T17 已標記停用，不受本次影響。

## 5. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v4-2026-07-27.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-07-27-phase5b.md`。
