# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-07-30 / v6
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務卡：docs/implementation/tasks/T20-GUIDE_ARTICLES_攻略文章功能.md（v3 已核准）
對應修正清單：schema-checklist-2026-07-30.md
前一版：prisma-schema-spec-v5-2026-07-29.md

## 1. 這份文件的用途

本文件只說明 **v6 相對於 v5 的變更**。既有 model（Bank／Card／Category／Offer／OfferCard／RewardTier／Channel／RewardTierChannel／SiteSetting／AdminUser）結構不變，仍以前幾版規格書為準。

## 2. v6 的唯一變更：新增 `Article` model

供 T20 攻略文章功能（`/guides`、`/guides/[slug]`）使用，儲存人工撰寫的情境式攻略文章內容。

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | `Int` | 主鍵，自動遞增 |
| `title` | `String` | 文章標題 |
| `slug` | `String`（唯一） | 網址識別，對應 `/guides/[slug]` |
| `summary` | `String?` | 文章摘要，用於列表頁與 SEO 描述備援 |
| `contentMd` | `String` | Markdown 格式的文章內文，前台以 `react-markdown`＋`remark-gfm` 渲染 |
| `seoTitle` | `String?` | SEO 標題，留空時前台回退用 `title` |
| `seoDescription` | `String?` | SEO 描述，留空時前台回退用 `summary` |
| `faqJson` | `String?` | JSON 字串，前台解析後輸出 FAQ 區塊與 `FAQPage` JSON-LD |
| `lastVerifiedAt` | `DateTime?` | 內容查證日期，前台明顯處顯示 |
| `isPublished` | `Boolean`（預設 `false`） | 是否對前台公開 |
| `publishedAt` | `DateTime?` | 發布時間，輸出 `Article` JSON-LD 的 `datePublished` |
| `createdAt` | `DateTime` | 建立時間 |
| `updatedAt` | `DateTime` | 最後更新時間，輸出 `Article` JSON-LD 的 `dateModified` |

索引：`@@index([isPublished, publishedAt])`，比照 `Offer` 的列表排序需求（僅列已發布、依發布時間排序）。

## 3. 為什麼 `faqJson` 用字串而非獨立資料表

沿用既有 `Category.faqJson`、`Offer.faqJson` 的既有慣例：FAQ 筆數少、結構單純（問題＋答案），存成 JSON 字串即可，不需要為此新增關聯表。後台需提供格式驗證與錯誤提示（見任務卡風險項）。

## 4. 情境標籤設定檔不進資料庫

T20 Scope v2 的 `/scenarios/[slug]` 自動情境頁不新增 model：14 個核心情境標籤與網址 slug、頁面標題、SEO 描述的對照表，以程式碼內固定設定檔維護（非資料庫表），因為這是規格書定義的固定核心標籤，不是後台可自由新增的動態分類。此設計已記錄於任務卡 Non-scope，schema 層完全不受影響。

## 5. 與既有 model 的關聯

`Article` 是獨立 model，**不**與 `Offer`／`Card`／`Bank`／`Category` 建立外鍵關聯。第一版文章與卡片／優惠的關聯以 Markdown 內文的站內連結表達，不做正規化關聯資料表（見任務卡 Non-scope）。

## 6. 影響範圍

- 前台：新增 `/guides`、`/guides/[slug]` 頁面；`src/lib/domain-seo.ts` 補 `dateModified`、新增 Article／FAQPage JSON-LD 產生邏輯。
- 後台：新增 `/admin/articles` 系列頁（列表、新增、編輯、發布／下架）。
- `src/app/sitemap.ts` 加入已發布文章條目。
- 新增相依套件：`react-markdown`、`remark-gfm`（前台 Markdown 渲染，不含 raw HTML）。

## 7. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v6-2026-07-30.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-07-30.md`。
- 資料庫備份：`prisma/backups/dev-before-t20-schema-v6-20260730-093401.db`。
