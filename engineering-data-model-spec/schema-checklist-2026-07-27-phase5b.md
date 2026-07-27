# schema 修正清單 2026-07-27（v4，T21 Phase 5b：移除扁平回饋欄位）

依 `schema修改流程.md` 產出。對應任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`（v1 已核准）。前一版：v3（`schema-checklist-2026-07-27.md`）。

## 本次背景

v3 為「先擴張」（新增 RewardTier／Channel、保留扁平欄位當搬運橋樑）。資料已遷移、前台／後台／匯入／seed 全部改讀 RewardTier 後，本版（v4）執行「收縮」：從 `Offer` 移除扁平回饋欄位。使用者 2026-07-27 拍板扁平欄位最終移除。

## `schema.prisma` 要改什麼

1. `Offer` 移除欄位：`rewardType`、`rewardValue`、`rewardCap`、`minSpend`、`conditions`（皆 String?）。
2. 更新檔頭版本註解為 `v4 / 2026-07-27`，記錄本次移除。
3. 其餘 model（RewardTier／Channel／RewardTierChannel／Card／Bank／Category／OfferCard／SiteSetting／AdminUser）不變。

## 一併處理的程式碼（非 schema，但同批不可分割）

- `src/app/offers/[slug]/page.tsx`：移除扁平欄位 fallback 分支（tiers 現保證非空）。
- `src/components/OfferCard.tsx`：`回饋` 只讀 `headlineRate`（移除 `?? rewardValue`）。
- 匯入／seed／驗證／後台表單已於 Phase 4-5a 改用 tiers，本批不再引用扁平欄位。
- `scripts/migrate-offers-to-tiers.mjs`：一次性遷移腳本，讀取的扁平欄位已移除，加註為歷史腳本、不再執行。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v4-2026-07-27.md`：說明扁平欄位移除、回饋一律經 RewardTier，並保留 v3 的 RewardTier／Channel 說明連結。

## 版本備份檔

- `schema-v4-2026-07-27.prisma`（＝本次修改後的 `prisma/schema.prisma`）。

## format / validate / db push

- `npx prisma validate` → 通過。
- `npx prisma db push --accept-data-loss` → 已執行（移除欄位屬 data-loss，但資料已於 v3 遷移進 RewardTier，且移除前已備份 `prisma/dev.db` 至 `prisma/backups/dev-before-t21-phase5b-*.db`）。
- `npx prisma generate` → 已重新生成 Client。
- `npx tsc --noEmit` → 0 錯誤；`npx next build` → 全部路由編譯通過。

## MVP 範圍檢查

- 僅移除欄位，未新增 MVP 外 model／欄位。未觸碰 MVP 明文排除的 model。
