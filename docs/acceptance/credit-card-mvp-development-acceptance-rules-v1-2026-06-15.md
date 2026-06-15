# 信用卡查詢網站 MVP 開發驗收規則

版本：2026-06-15 / v1

對應產品規格：credit-card-mvp-spec-v11-2026-06-08

對應資料模型：prisma-schema-spec-v2-2026-06-08.md / schema.prisma v2

目標：個人實驗作品、免費或低成本、最簡單可執行；同時保留未來商用化時可延伸的路徑。

## 摘要

本文件定義信用卡優惠查詢網站 MVP 的開發驗收規則，用來銜接最新版產品規格書 v11 與 Prisma schema v2。

第一階段以「能在本機完成、能用真實資料驗證、能支撐前後台主要流程」為成功標準。開發時優先使用 Next.js、Prisma、SQLite 與 Tailwind CSS，避免過早導入複雜權限、資料治理、爬蟲、媒體管理或正式商用基礎設施。

本文件同時標明哪些項目是 MVP 必做，哪些項目可延後到第二階段。第二階段可再依商用需求擴充 PostgreSQL、角色權限、稽核紀錄、正式圖片儲存、資料匯入、redirect、canonicalUrl 與正規化 FAQ/tag model。

## 1. 基本原則

- 產品規格以 `credit-card-mvp-spec-v11-2026-06-08` 為準。
- 資料模型以 `schema.prisma` v2 為準。
- 產品規格書中的 snake_case 欄位，實作時對應 Prisma schema 的 camelCase 欄位。
- MVP 以單一管理者、手動維護資料、SQLite 本機資料庫為主。
- 第一階段不做角色權限、AuditLog、爬蟲、匯入任務、Redirect、canonicalUrl 後台維護。
- 所有前台主要頁面需能使用 seed data 顯示真實版型，不只顯示 placeholder 或空狀態。

## 2. 後台登入驗收

MVP 僅支援單一管理員帳密登入，不做角色權限。

驗收規則：

- 系統需能建立至少一筆 `AdminUser`。
- 登入需驗證 `email`、`passwordHash` 與 `isActive`。
- `isActive = false` 的管理員不可登入。
- 登入成功後可進入後台。
- 登出後不可直接存取後台頁面。
- MVP 不驗收多角色、權限分級、多人協作與操作紀錄。

## 3. Seed Data 驗收

開發初期至少需準備以下資料：

- 1 筆 `SiteSetting`
- 1 筆 `AdminUser`
- 3 到 5 家 `Bank`
- 8 到 12 張 `Card`
- 6 個 `Category`
- 20 筆 `Offer`
- 每筆已發布優惠至少關聯 1 張信用卡

驗收規則：

- 首頁可顯示分類入口、精選優惠與最新優惠。
- 分類頁可顯示分類資訊、篩選、排序與優惠列表。
- 搜尋頁可顯示搜尋結果與無結果狀態。
- 銀行頁可顯示銀行資料、該銀行信用卡與相關優惠。
- 信用卡頁可顯示卡片資料、適合族群與關聯優惠。
- 優惠詳情頁可顯示優惠條件、來源、SEO 與 FAQ。
- 後台可新增、編輯、啟用/停用或發布/下架主要資料。

## 4. Slug 與固定 URL 驗收

固定 URL 是 SEO 與未來商用化的基礎，但 MVP 不處理 slug 改名後的 redirect。

驗收規則：

- `Bank.slug`、`Card.slug`、`Category.slug`、`Offer.slug` 必須唯一。
- slug 建議使用小寫英文、數字與 hyphen。
- 建立後避免任意修改。
- 前台需提供以下固定頁面：
  - `/`
  - `/categories/[slug]`
  - `/banks/[slug]`
  - `/cards/[slug]`
  - `/offers/[slug]`
  - `/search`
- canonical URL 由系統依 site base URL 與 slug 自動產生，不存入資料庫。
- slug 改名、redirect 與 canonicalUrl 人工覆寫延後到第二階段。

## 5. 優惠發布驗收

草稿狀態可允許資料不完整；已發布優惠需能支撐前台顯示與使用者判斷。

`Offer.isPublished = true` 時，至少需符合：

- `title` 有值。
- `slug` 有值且唯一。
- `categoryId` 有值。
- 至少有一筆 `OfferCard` 關聯。
- `summaryPreview` 有值，或可由 `manualSummary`、`highlight1`、`highlight2` 產生摘要。
- `sourceUrl` 有值。
- `rewardType` 或 `rewardValue` 至少有一項可顯示內容。
- 若有 `endDate`，前台需能判斷進行中或已過期。

前台驗收規則：

- 前台優惠列表預設只顯示 `isPublished = true` 的資料。
- 過期優惠是否顯示，依 `SiteSetting.showExpiredOffers` 控制。
- 過期優惠若顯示，需清楚標示已過期。

## 6. 搜尋驗收

MVP 搜尋以簡單可用為主，不建立全文搜尋服務。

搜尋至少涵蓋：

- `Offer.title`
- `Offer.summaryPreview`
- `Offer.description`
- `Offer.tags`
- `Card.name`
- `Bank.name`
- `Category.name`

驗收規則：

- 搜尋銀行名稱可找到相關優惠。
- 搜尋信用卡名稱可找到相關優惠。
- 搜尋分類名稱或 tag 可找到相關優惠。
- 無結果時顯示空狀態，並提供清除搜尋或返回分類入口。
- 搜尋結果卡片規則需與分類頁優惠卡片一致，不建立另一套顯示邏輯。

## 7. Tags 驗收

MVP 使用 `Offer.tags String?`，不建立 `Tag` 或 `OfferTag` model。

驗收規則：

- tags 建議使用逗號分隔字串，例如 `現金回饋,網購,新戶`。
- 後台儲存與前台搜尋需使用同一套解析規則。
- 空 tags 不影響優惠發布。
- tags 正規化、tag 頁面與 tag 後台管理延後到第二階段。

## 8. FAQ 驗收

產品規格書中的 `faq`，在 Prisma schema 中對應 `faqJson`。

MVP 僅以下 model 支援 FAQ：

- `Category.faqJson`
- `Offer.faqJson`

驗收規則：

- `faqJson` 若有值，必須是 JSON array。
- 每筆 FAQ 至少包含 `question` 與 `answer`。
- JSON 格式錯誤時，後台不可儲存，或需顯示明確錯誤。
- 有 FAQ 的頁面可輸出 FAQPage JSON-LD。
- FAQ 內容需與頁面可見內容一致。
- 首頁 FAQ 初期由前端靜態內容維護，不進 `SiteSetting`。

建議格式：

```json
[
  {
    "question": "現金回饋信用卡怎麼選？",
    "answer": "先看常用通路、回饋上限與是否需要登錄。"
  }
]
```

## 9. 圖片驗收

圖片不存入資料庫本體，只存 URL 或路徑。

驗收規則：

- `Bank.logoUrl` 用於銀行 Logo。
- `Card.imageUrl` 用於信用卡卡面。
- 開發期可使用專案內靜態路徑或公開測試 URL。
- 上線期可改用託管物件儲存或雲端媒體服務。
- 若圖片欄位為空，前台需顯示 placeholder。
- `logoAlt` 與 `imageAlt` 若為空，前台需使用銀行名稱或卡名作為 fallback。
- MVP 不驗收圖片上傳、裁切、壓縮與媒體庫管理。

## 10. SEO 驗收

每個固定頁面都需有 metadata。若後台 SEO 欄位為空，系統需自動產生 fallback。

頁面對應：

- 首頁：`SiteSetting.defaultSeoTitle`、`SiteSetting.defaultSeoDescription`
- 分類頁：`Category.seoTitle`、`Category.seoDescription`
- 銀行頁：`Bank.seoTitle`、`Bank.seoDescription`
- 信用卡頁：`Card.seoTitle`、`Card.seoDescription`
- 優惠頁：`Offer.seoTitle`、`Offer.seoDescription`

驗收規則：

- 首頁、分類頁、銀行頁、信用卡頁、優惠詳情頁都有 title 與 description。
- SEO 欄位空白時，系統可依名稱、摘要或預設值產生。
- sitemap.xml 需收錄首頁、分類頁、銀行頁、信用卡頁與優惠詳情頁。
- robots.txt 不可阻擋主要前台頁面。
- canonical URL 由系統產生，不作為後台欄位。
- 有 FAQ 的頁面可輸出 FAQPage JSON-LD。

## 11. 排序驗收

前台優惠列表排序需符合產品規格：

```text
isFeatured -> recommendScore -> sortOrder -> updatedAt
```

驗收規則：

- `isFeatured = true` 的優惠優先。
- `recommendScore` 較高者優先。
- 分數相同時依 `sortOrder`。
- 仍相同時依 `updatedAt`。
- 首頁精選數量依 `SiteSetting.homepageFeaturedCount`。
- 分類頁每頁筆數依 `SiteSetting.categoryPageSize`。

## 12. 後台 CRUD 驗收

後台至少需能管理：

- `Bank`
- `Card`
- `Category`
- `Offer`
- `SiteSetting`

每個後台列表至少需支援：

- 檢視列表。
- 新增。
- 編輯。
- 啟用/停用，或發布/下架。
- 基本搜尋或篩選。

MVP 不驗收：

- 批次操作。
- 匯入匯出。
- 稽核紀錄。
- 權限分級。
- 多人協作流程。

## 13. 第二階段延後項目

以下項目不列入 MVP 驗收，但保留未來商用化延伸空間：

- 多角色權限。
- AuditLog。
- FaqItem model。
- Tag / OfferTag model。
- canonicalUrl 後台欄位。
- Redirect model。
- 爬蟲與排程匯入。
- 圖片上傳與媒體管理系統。
- PostgreSQL 正式遷移流程。
- 正式監控、錯誤追蹤與備份策略。

## 14. MVP 完成判定

符合以下條件時，可視為 MVP 開發驗收通過：

- 所有主要前台頁面可用 seed data 正常顯示。
- 後台可完成銀行、信用卡、分類、優惠與設定的基本 CRUD。
- 管理員可登入與登出。
- 已發布優惠可在前台列表、搜尋、詳情頁正確呈現。
- SEO metadata、固定 URL、sitemap、robots 與 FAQ JSON-LD 具備基本輸出。
- schema 不需要新增第二階段 model 也能完成第一版功能。
- 延後項目已有明確紀錄，不阻塞 MVP 上線或本機展示。
