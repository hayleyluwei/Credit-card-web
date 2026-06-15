# schema 修正清單

日期：2026-06-08

用途：記錄今天已確認、但尚未執行的 schema 修正項目。

## 已確認待修正項目

1. `Bank` 補上 SEO 欄位。
   - 新增 `seoTitle String?`
   - 新增 `seoDescription String?`
   - 用途：讓銀行頁可人工設定 SEO title 與 SEO description，對齊 `credit-card-mvp-spec-v11-2026-06-08` 中銀行頁 SEO metadata 需求。

2. `Card` 補上 SEO 欄位。
   - 新增 `seoTitle String?`
   - 新增 `seoDescription String?`
   - 用途：讓信用卡頁可人工設定 SEO title 與 SEO description，對齊 `credit-card-mvp-spec-v11-2026-06-08` 中信用卡頁 SEO metadata 需求。

3. MVP 先不新增 `canonicalUrl` 欄位。
   - 不在 `Offer`、`Category`、`Bank`、`Card` 或 `SiteSetting` 新增 `canonicalUrl`。
   - 初期 canonical URL 由系統依 site base URL 與各頁 `slug` 自動產生。
   - 用途：避免後台多一個容易填錯的 SEO 欄位，並降低 MVP 資料治理成本。
   - 未來若出現多 URL、slug 改名、重複內容或 SEO 精修需求，再評估新增 `canonicalUrl` 或 `Redirect` model。

4. schema 規格說明書需補充 FAQ 命名對應。
   - `credit-card-mvp-spec-v11-2026-06-08` 中的 `faq`，在 Prisma schema 中對應 `faqJson`。
   - 用途：說明 MVP 階段 FAQ 先用 JSON 字串儲存，避免讀者誤以為漏掉 `faq` 欄位。

5. schema 規格說明書需補充欄位命名規則。
   - 產品規格書使用 snake_case 表達資料概念，例如 `seo_title`、`image_url`、`is_featured`。
   - Prisma schema 使用 camelCase 欄位命名，例如 `seoTitle`、`imageUrl`、`isFeatured`。
   - 用途：避免產品規格與 Prisma schema 欄位命名看起來不一致。

6. MVP 先不新增 `SiteSetting.homepageFaqJson`。
   - 首頁 FAQ 初期由前端靜態內容維護，不進資料庫。
   - 用途：避免設定頁過早增加 FAQ 編輯區與 JSON 維護成本。
   - 未來若需要後台維護首頁 FAQ，再於 `SiteSetting` 新增 `homepageFaqJson String?`。
   - 此欄位未來擴充容易，因為它是 nullable 欄位，不影響既有 relation。

## 執行狀態

- 已修改 `schema.prisma`。
- 已產出新版 schema 備份檔 `schema-v2-2026-06-08.prisma`。
- 已同步更新 schema 規格說明書 `prisma-schema-spec-v2-2026-06-08.md`。
