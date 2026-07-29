# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-07-29 / v5
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務卡：docs/implementation/tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md（v1 已核准）
對應修正清單：schema-checklist-2026-07-29.md
前一版：prisma-schema-spec-v4-2026-07-27.md

## 1. 這份文件的用途

本文件只說明 **v5 相對於 v4 的變更**。Offer／RewardTier／Channel 等結構與型別策略（String 不做 enum、JSON 以字串存放）仍以 `prisma-schema-spec-v3-2026-07-27.md`、`prisma-schema-spec-v4-2026-07-27.md` 為準。

## 2. v5 的唯一變更：`Card` 新增 5 個卡面配色欄位

| 欄位 | 型別 | 用途 |
|---|---|---|
| `cardBgColorFrom` | `String?` | 卡面底色漸層的起始色，填 hex 色碼，例如 `#DED5C6` |
| `cardBgColorTo` | `String?` | 卡面底色漸層的結束色 |
| `cardTextColor` | `String?` | 卡片名稱在卡面上的文字顏色 |
| `cardChipColorFrom` | `String?` | 晶片圖示漸層的起始色 |
| `cardChipColorTo` | `String?` | 晶片圖示漸層的結束色 |

五個欄位**全部可選**，位置在 `cardNetwork` 之後、`prosJson` 之前。

### 為什麼邊框沒有獨立欄位

卡面外緣的細邊框顏色由晶片色（`cardChipColorFrom`／`cardChipColorTo`）推導，屬同一組金屬色系。這樣設計是為了讓整理人員少填兩個欄位，也避免出現「金色晶片配銀色邊框」這種互相打架的組合。

## 3. 這些欄位怎麼填

顏色取自各卡**官網卡面的整體色彩印象**，例如「黑底燙金字」「白卡銀灰字」「米卡其底銀色字」。

**只取色彩，不重製構圖**：銀行 Logo、卡片專屬的圖示與插畫（永豐幣倍卡的富士山、台新街口聯名卡的小豬吉祥物、滙豐旅人無限卡的菱形切面、聯邦綠卡的森林剪影等）一律不繪製。晶片、光澤、圓角、細邊框屬於所有信用卡通用的視覺語言，不是特定銀行的識別特徵，因此可以使用。

這個原則與資料蒐集規格書既有的內容政策一致：參考資訊架構、不抄錄原作。

## 4. 留空時的行為（fallback）

三層優先順序，由高到低：

1. **`Card.imageUrl` 有值** → 前台直接顯示該圖片，完全不使用生成卡面，本次新增的 5 個顏色欄位不生效。（未來若取得銀行授權的真實卡面圖片走這條路。）
2. **`imageUrl` 為空、顏色欄位有值** → 用填入的顏色生成卡面。
3. **`imageUrl` 為空、顏色欄位也為空** → 回退為既有規則：依卡片 slug 以 FNV-1a 雜湊，從 12 色深色盤取一色，同一張卡永遠同一色。

因此新增欄位**不會破壞任何既有資料**：v5 上線時 11 張卡的新欄位皆為 NULL，畫面與 v4 完全相同。

顏色欄位可以只填一部分（例如只填底色、不填文字色），未填的個別項目各自回退到預設值，不需要五個一起填。

## 5. 為什麼放資料庫而不是程式碼

使用者 2026-07-29 在兩個方案中選定資料庫：

- 放資料庫：整理人員在後台像填「發卡組織」一樣自己填顏色，不必找工程端。
- 放程式碼對照表：不用改 schema，但每新增一張卡都要工程端改程式碼並重新部署。

關鍵考量是未來取得銀行授權圖片會是**零星、分批、長期混雜**的狀態（部分卡有真圖、部分卡用生成卡面）。把兩種呈現方式的資料都放在 `Card`，才能維持單一維護流程，不會被拆成兩個管道。

## 6. 影響範圍

- 前台：`src/lib/cardVisual.ts`、`src/components/CardImage.tsx` 及四個呼叫端頁面（首頁、`/cards`、優惠詳情頁、`/banks/[slug]`）。
- 後台：`src/components/AdminCardForm.tsx` 新增 5 個輸入欄位；`src/lib/admin-actions.ts` 的 `cardData()` 納入新欄位（新增與編輯共用同一函式）。
- 匯入腳本／資料蒐集規格書：本版尚未納入，若之後要讓整理人員在 xlsx 直接交付顏色，需另行更新規格書與 `import-offer-data.mjs`。

## 7. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v5-2026-07-29.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-07-29.md`。
- 資料庫備份：`prisma/backups/dev-before-t23-schema-v5-20260729-100902.db`。
