# schema 修正清單 2026-07-30-badge（v7，Offer 新增 badgeLabel）

依 `schema修改流程.md` 產出。對應：使用者於對話中直接指出「進行中」徽章恆真、無資訊量，決定改為行銷可自訂文字，非既有任務卡範圍內的變更，屬對話中即時核准的小型 UX 修正。前一版：v6（`schema-checklist-2026-07-30.md`）。

## 本次背景

前台優惠卡片右上角固定顯示「進行中／已過期」，但已過期優惠在各前台頁面都已被 `getPublicOffers()` 過濾掉不顯示，導致這個徽章在正常瀏覽情境下永遠是「進行中」，沒有資訊量。使用者決定移除這個計算式徽章，改為行銷可自行填寫的自由文字欄位（例：「最新優惠」）。

## `schema.prisma` 要改什麼

1. `Offer` 新增 1 個可選欄位：`badgeLabel String?`，置於 `isPublished` 之後。
2. 檔頭版本註解升級為 `v7 / 2026-07-30`，`Schema Spec` 指向 `prisma-schema-spec-v7-2026-07-30.md`，補上 v7 變更說明。
3. 其餘 model 不變。

## 一併處理的程式碼（非 schema，同批不可分割）

- `src/components/OfferCard.tsx`：右上角徽章改讀 `badgeLabel`，移除 `isOfferExpired` 判斷式；留空不顯示徽章。
- `src/components/AdminOfferForm.tsx`：新增「行銷徽章」文字輸入欄位。
- `src/lib/admin-actions.ts`：`offerData()` 納入 `badgeLabel`。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v7-2026-07-30.md`：說明欄位用途、為什麼移除舊的計算式徽章、留空時的行為、與既有 `isFeatured` 的關係。

## 版本備份檔

- `schema-v7-2026-07-30.prisma`（＝本次修改後的 `prisma/schema.prisma`）。

## 使用者確認紀錄

- 使用者於 2026-07-30 對話中確認本清單（選擇「自由文字欄位」＋「現在就動」），確認後才開始修改檔案，符合 `schema修改流程.md` 第 7 條。

## format / validate / db push

- 修改前已備份 `prisma/dev.db` → `prisma/backups/dev-before-t-adhoc-offer-badge-schema-v7-20260730-101314.db`。
- `npx prisma format` → 已執行。
- `npx prisma validate` → 通過。
- `npx prisma db push` → 已執行，純新增可選欄位，無 data loss，未使用 `--accept-data-loss`。
- `npx prisma generate` → 首次因本機 dev server 佔用 query engine DLL 出現 EPERM，停止 dev server 後重跑成功（與 T23 記載的已知現象一致）。

## MVP 範圍檢查

- 僅新增 1 個可選欄位，未修改任何既有 model／欄位／relation／index。
- `prisma/schema.prisma` 與 `engineering-data-model-spec/schema.prisma` 已核對一致。
