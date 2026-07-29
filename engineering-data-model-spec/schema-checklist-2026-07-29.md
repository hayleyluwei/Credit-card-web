# schema 修正清單 2026-07-29（v5，T23：卡面配色欄位）

依 `schema修改流程.md` 產出。對應任務卡：`docs/implementation/tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md`（v1 已核准）。前一版：v4（`schema-checklist-2026-07-27-phase5b.md`）。

## 本次背景

T23 已完成「參數化 SVG 卡面」實作，底色原本一律由卡片 slug 雜湊產生。使用者 2026-07-29 決定改為**抽取各卡官網卡面的真實色彩印象**（只取色彩，不重製 Logo、版型或專屬圖示，如富士山、街口小豬、菱形切面、森林剪影等一律不畫）。

顏色資訊要存哪裡，使用者在兩個方案中選定**存進資料庫**：

- 選項 1（採用）：新增 `Card` 欄位，整理人員可在後台自行填寫，與 `cardNetwork`／`cardLevel` 同一套維護流程。
- 選項 2（未採用）：寫成程式碼內的卡片代號對照表，每加一張新卡都要工程端改程式碼，脫離整理人員工作流程。

選擇選項 1 的關鍵理由：未來若取得銀行授權的真實卡面圖片，會是**零星、分批、長期混雜共存**的狀態（`Card.imageUrl` 有值就顯示真圖，無值才用生成卡面）。把生成配色也放在 `Card`，兩種呈現方式才會落在同一套後台維護流程，不會被拆成「一部分後台填、一部分找工程端」。

## `schema.prisma` 要改什麼

1. `Card` 新增 5 個可選欄位（皆 `String?`），置於 `cardNetwork` 之後、`prosJson` 之前，並加中文註解說明用途與 fallback：
   - `cardBgColorFrom`：卡面底色漸層起始色（hex，例：`#DED5C6`）
   - `cardBgColorTo`：卡面底色漸層結束色
   - `cardTextColor`：卡片名稱文字顏色
   - `cardChipColorFrom`：晶片漸層起始色（同時作為邊框色調依據）
   - `cardChipColorTo`：晶片漸層結束色
2. 更新檔頭版本註解為 `v5 / 2026-07-29`，`Schema Spec` 指向 `prisma-schema-spec-v5-2026-07-29.md`，並補上 v5 變更說明。
3. 其餘 model（Bank／Category／Offer／OfferCard／RewardTier／Channel／RewardTierChannel／SiteSetting／AdminUser）不變。

### 為什麼邊框不另設欄位

邊框顏色跟著晶片色調走（同一組金屬色系），由 `cardChipColorFrom`／`cardChipColorTo` 推導，不另存欄位，避免整理人員要填的欄位過多且容易互相矛盾。

## 一併處理的程式碼（非 schema，但同批不可分割）

- `src/lib/cardVisual.ts`：新增「資料庫顏色優先、留空回退雜湊演算法」的解析邏輯。
- `src/components/CardImage.tsx`：接收並套用 5 個顏色欄位。
- `src/app/page.tsx`、`src/app/cards/page.tsx`、`src/app/offers/[slug]/page.tsx`、`src/app/banks/[slug]/page.tsx`：呼叫端傳入新欄位。
- `src/components/AdminCardForm.tsx`：新增 5 個顏色輸入欄位（後台可自行維護）。
- `src/lib/admin-actions.ts`：`cardData()` 納入 5 個欄位（create／update 共用同一函式，兩條路徑一次覆蓋）。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v5-2026-07-29.md`：說明新增欄位用途、fallback 行為、與 `imageUrl` 的優先順序關係。

## 版本備份檔

- `schema-v5-2026-07-29.prisma`（＝本次修改後的 `prisma/schema.prisma`）。

## format / validate / db push

- 修改前已備份 `prisma/dev.db` → `prisma/backups/dev-before-t23-schema-v5-20260729-100902.db`。
- `npx prisma format` → 已執行。
- `npx prisma validate` → 通過（`The schema at prisma\schema.prisma is valid`）。
- `npx prisma db push` → 已執行，**純新增可選欄位，無 data loss**，未使用 `--accept-data-loss`。
- `npx prisma generate` → 已重新生成 Client（首次因 dev server 佔用 query engine DLL 出現 EPERM，停止 dev server 後重跑成功）。
- `npx tsc --noEmit` → 0 錯誤。
- `npx eslint`（8 個異動檔）→ 0 問題。
- `npx next build` → 全部路由編譯通過。

## 實際驗證結果

- **fallback 驗證**：db push 後、尚未填任何顏色時，前台 11 張卡的 SVG 漸層仍為雜湊色、金色晶片、白色文字，與 v5 前完全相同 → 確認新增欄位不影響既有畫面。
- **資料路徑驗證**：以一次性腳本寫入 11 張卡已確認的官網配色後，前台 SVG 的 `stop-color` 全部改為填入值；邊框亦正確跟隨晶片色（DAWHO 金框、CUBE／Richart／聯邦綠卡銀框、街口白框、中信青銅框）。
- 瀏覽器 console 與 dev server log 皆 0 錯誤。
- 後台表單欄位已加入，但**尚未由使用者登入實測**（AI 無管理員憑證），列為待人工驗收項目。

## MVP 範圍檢查

- 僅在既有 `Card` model 新增可選欄位，未新增 model、index、relation，未觸碰 MVP 明文排除的內容。
- 既有 11 張卡的新欄位皆為 NULL，前台自動走既有雜湊 fallback，不影響現有畫面。
