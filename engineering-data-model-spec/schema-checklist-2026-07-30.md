# schema 修正清單 2026-07-30（v6，T20：新增 Article model）

依 `schema修改流程.md` 產出。對應任務卡：`docs/implementation/tasks/T20-GUIDE_ARTICLES_攻略文章功能.md`（v3 已核准，2026-07-30）。前一版：v5（`schema-checklist-2026-07-29.md`）。

## 本次背景

T20 攻略文章功能需要儲存人工撰寫的情境式文章內容，供 `/guides`、`/guides/[slug]` 頁面使用。

## `schema.prisma` 要改什麼

1. 新增 `Article` model（置於檔案最後）：
   - `id`／`title`／`slug`（唯一）／`summary?`／`contentMd`／`seoTitle?`／`seoDescription?`／`faqJson?`／`lastVerifiedAt?`／`isPublished`（預設 `false`）／`publishedAt?`／`createdAt`／`updatedAt`
   - `@@index([isPublished, publishedAt])`
2. 檔頭版本註解升級為 `v6 / 2026-07-30`，`Schema Spec` 指向 `prisma-schema-spec-v6-2026-07-30.md`，補上 v6 變更說明。
3. 其餘 model（Bank／Card／Category／Offer／OfferCard／RewardTier／Channel／RewardTierChannel／SiteSetting／AdminUser）不變。
4. `/scenarios/[slug]` 情境標籤對照表**不**進 schema，維持程式碼設定檔（見任務卡 Non-scope）。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v6-2026-07-30.md`：說明 `Article` model 用途、`faqJson` 沿用既有慣例的理由、與既有 model 無外鍵關聯、情境標籤設定檔不進資料庫。

## 版本備份檔

- `schema-v6-2026-07-30.prisma`（＝本次修改後的 `prisma/schema.prisma`）。

## 使用者確認紀錄

- 使用者於 2026-07-30 對話中確認本清單（「確認／開始動 schema」），確認後才開始修改檔案，符合 `schema修改流程.md` 第 7 條。

## format / validate / db push

- 修改前已備份 `prisma/dev.db` → `prisma/backups/dev-before-t20-schema-v6-20260730-093401.db`。
- `npx prisma format` → 已執行。
- `npx prisma validate` → 通過（`The schema at prisma\schema.prisma is valid`）。
- `npx prisma db push` → 已執行，**純新增 model，無 data loss**，未使用 `--accept-data-loss`；同時自動重新生成 Prisma Client，未遇到既有紀錄中出現過的 EPERM 鎖定問題（port 5555 有一個殘留 node process，經確認未阻擋本次操作）。
- `npx tsc --noEmit` → 0 錯誤。

## MVP 範圍檢查

- 僅新增 `Article` model，未修改任何既有 model／欄位／relation／index，未觸碰 MVP 明文排除的內容。
- `prisma/schema.prisma` 與 `engineering-data-model-spec/schema.prisma` 已核對一致。
