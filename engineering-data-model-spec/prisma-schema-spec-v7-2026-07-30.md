# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-07-30 / v7
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務：對話中即時核准的 ad-hoc UX 修正（優惠卡片右上角徽章），非既有任務卡
對應修正清單：schema-checklist-2026-07-30-badge.md
前一版：prisma-schema-spec-v6-2026-07-30.md

## 1. 這份文件的用途

本文件只說明 **v7 相對於 v6 的變更**。既有 model 結構不變，仍以前幾版規格書為準。

## 2. v7 的唯一變更：`Offer` 新增 `badgeLabel` 欄位

| 欄位 | 型別 | 用途 |
|---|---|---|
| `badgeLabel` | `String?` | 行銷可自訂的優惠卡片右上角徽章文字，例如「最新優惠」「加碼中」「新戶限定」 |

## 3. 為什麼要改

前台優惠卡片（`OfferCard`）原本右上角固定顯示「進行中／已過期」，由 `isOfferExpired()` 即時計算。但前台各頁面（首頁、分類頁、情境頁、搜尋頁）在組資料時都已經先用 `getPublicOffers()` 過濾掉已過期優惠，所以使用者在正常瀏覽情境下看到的優惠**永遠是「進行中」**，這個徽章等於沒有資訊量。

使用者決定把這個位置改成行銷可自行填寫的自由文字欄位，取代原本恆真的狀態判斷。

## 4. 留空時的行為

`badgeLabel` 為 `String?`，留空時前台**不顯示**徽章（不是回退顯示「進行中」）。既有 16 筆優惠此欄位皆為 NULL，上線當下卡片右上角會直接空白，不影響版面（原本徽章位置的 flex 容器仍在，只是沒有徽章內容）。

## 5. 與既有 `isFeatured`／`recommendScore` 的關係

`badgeLabel` 是純展示用的行銷文字，不影響排序邏輯；卡片排序仍由 `isFeatured`／`recommendScore`／`sortOrder`／`updatedAt` 決定（見 `compareOffers`），彼此獨立。卡片右下角原有的「精選／一般」（`isFeatured`）標示維持不變。

## 6. 影響範圍

- 前台：`src/components/OfferCard.tsx` 右上角徽章改讀 `badgeLabel`。
- 後台：`src/components/AdminOfferForm.tsx` 新增「行銷徽章」文字輸入欄位；`src/lib/admin-actions.ts` 的 `offerData()` 納入此欄位。
- 匯入腳本／資料蒐集規格書：本版未納入，`badgeLabel` 目前僅透過後台個別填寫，不透過 xlsx 批次匯入。

## 7. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v7-2026-07-30.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-07-30-badge.md`。
- 資料庫備份：`prisma/backups/dev-before-t-adhoc-offer-badge-schema-v7-20260730-101314.db`。
