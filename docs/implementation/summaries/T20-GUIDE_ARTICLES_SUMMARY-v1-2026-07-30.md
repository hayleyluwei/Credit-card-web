# T20 攻略文章功能與自動情境頁 Summary

日期：2026-07-30（Asia/Taipei）
任務卡：`docs/implementation/tasks/T20-GUIDE_ARTICLES_攻略文章功能.md`（v3 已核准 2026-07-30）
任務狀態：**自動驗證通過，待人工驗收**（後台文章 CRUD 需使用者親自登入操作，見人工測試腳本）

## 核准與方針

- 使用者 2026-07-30 核准 Scope v3（攻略文章功能＋自動情境頁＋14 個核心情境標籤），並確認 Markdown 套件選 `react-markdown`＋`remark-gfm`、Git 授權為 `git add`＋local commit（不含 push）。
- 依 `schema修改流程.md` 先提出 `Article` model 修正清單，使用者確認後才動 `schema.prisma`（`schema-checklist-2026-07-30.md`）。

## 完成內容

### Schema（v6）
- `prisma/schema.prisma` 新增 `Article` model：`title`／`slug`（唯一）／`summary?`／`contentMd`／`seoTitle?`／`seoDescription?`／`faqJson?`／`lastVerifiedAt?`／`isPublished`／`publishedAt?`／`createdAt`／`updatedAt`，索引 `@@index([isPublished, publishedAt])`。
- 情境標籤對照表**不**進資料庫，維持程式碼設定檔（`src/lib/domain-scenarios.ts`），符合 Non-scope。
- 備份 `prisma/dev.db` → `prisma-before-t20-schema-v6-20260730-093401.db`，`db push` 純新增、無 data loss；`prisma validate`／`tsc --noEmit` 皆通過。
- 產出 `prisma-schema-spec-v6-2026-07-30.md`、`schema-v6-2026-07-30.prisma`、`schema-checklist-2026-07-30.md`；`prisma/schema.prisma` 與 `engineering-data-model-spec/schema.prisma` 已核對一致。

### 自動情境頁 `/scenarios/[slug]`
- 新增 `src/lib/domain-scenarios.ts`：14 個核心情境標籤的 slug／中文標籤／頁面標題／SEO 描述固定設定檔，與 `offerHasTag` 比對函式（`Offer.tags` 逗號分隔字串比對）。
- 新增 `src/app/scenarios/[slug]/page.tsx`：比照 `/categories/[slug]` 版型，`generateStaticParams` 產生全部 14 個靜態頁；找到對應已發布攻略文章（slug 相同視為對應，第一版關聯方式，見任務卡風險項）時顯示「找不到更深入的整理？」交叉連結；無資料情境顯示合理空狀態。
- `generateMetadata` 與 `WebPage` JSON-LD 皆已輸出。

### 攻略文章 `/guides`、`/guides/[slug]` ＋後台
- 新增 `src/app/guides/page.tsx`（已發布列表）、`src/app/guides/[slug]/page.tsx`（Markdown 渲染、FAQ、`Article`／`BreadcrumbList`／`FAQPage` JSON-LD）。
- Markdown 渲染用 `react-markdown`＋`remark-gfm`，自訂 `components` 覆寫樣式（未安裝額外的 typography 套件，維持只新增已核准的 2 個相依套件）；預設不解析 raw HTML，防儲存型 XSS。
- 新增 `src/app/admin/articles/page.tsx`（列表＋新增表單）、`src/app/admin/articles/[id]/page.tsx`（編輯）；`src/lib/admin-actions.ts` 新增 `createArticle`／`updateArticle`／`toggleArticlePublish`，沿用既有 `ensureUniqueSlug`／`validateFaqJson` helper。
- `src/app/admin/page.tsx` 左側選單新增「攻略文章管理」。

### Sitemap／llms.txt／首頁
- `src/lib/domain-seo.ts` 的 `generateSitemapEntries` 新增 `scenarioSlugs`／`articles` 參數，輸出 14 個情境頁與已發布文章條目。
- 新增 `public/llms.txt`，列出主要內容路徑與資料原則。
- 首頁新增「攻略文章」導覽連結與「熱門情境」14 個標籤入口區塊（最小幅度）。

### 撰寫準則
- 新增 `docs/sop/GUIDE_ARTICLE_WRITING_攻略文章撰寫準則.md`：結論先行、數字附來源與查證日期、術語白話、比較表格式、FAQ 寫法、內文格式限制、與情境頁的分工原則、著作權原則。

## 自動驗證結果

- `npx prisma validate` 通過、`npx prisma db push` 成功、`npx tsc --noEmit` 0 錯誤、`npx eslint`（異動檔案）0 問題、`npx next build` 全部 34 個路由編譯通過（14 個情境頁為 SSG 靜態頁）。
- 瀏覽器唯讀＋一次性測試資料驗證（建立後已刪除）：
  - 首頁 14 個情境標籤正確顯示；`/scenarios/subscription` 正確篩出 CUBE 卡優惠；`/scenarios/movies`（無資料情境）顯示合理空狀態。
  - `/guides/[slug]` 測試文章 Markdown（標題、粗體、清單、表格）正確渲染；內文中的 `<script>alert('xss')</script>` 未被執行，`document.querySelectorAll('article script').length === 0`，確認防 XSS 有效。
  - `Article`／`BreadcrumbList`／`FAQPage`／情境頁 `WebPage` JSON-LD 欄位皆正確。
  - `/sitemap.xml` 含 14 個 `/scenarios/*` 與已發布 `/guides/*` 條目。
  - `/admin/articles` 未登入時正確導向 `/admin/login`（沿用既有 middleware 保護，未額外開洞）。

## 待人工驗收（AI 無管理員憑證，不代為輸入密碼）

見 `docs/implementation/manual-test-scripts/T20-攻略文章與自動情境頁測試腳本-v1-2026-07-30.md`：後台文章新增／編輯／發布／下架、Slug 修改提醒、前台發布後可見與下架後 404，共 8 項待使用者操作確認。

## Non-scope 確認未觸及

- 未新增文章與卡片／優惠的關聯資料表。
- 未做留言、作者系統、多管理者權限、瀏覽統計、自動化 AI 內容生成或爬蟲。
- 未修改既有 `Offer`／`Card`／`Bank`／`Category` model。
- 情境頁未開放後台管理介面。
- 未執行 `git push`；未涉及正式環境部署。

## 待決／後續事項（沿用任務卡風險項，未在本輪解決）

- 情境頁與攻略文章的關鍵字互搶風險緩解方式（分工說法 vs canonical）：本輪先採「slug 相同即視為對應」的交叉連結分工，實際上線後成效待觀察。
- `faqJson` 手寫 JSON 易錯，後台目前僅有基本格式驗證（沿用 `validateFaqJson`），未做更友善的錯誤提示 UI。
- 內容產製本身不在本任務 Scope，功能完成後仍需持續撰寫與查證內容。
