# MVP Acceptance Report

版本：v1  
日期：2026-06-15  
更新：2026-06-16 UX follow-up  
範圍：T01-T14 信用卡優惠查詢網站 MVP

## 結論

MVP acceptance pass 已完成。T01-T14 的公開頁、搜尋、SEO、後台登入、後台 CRUD、優惠編輯、發布/取消發布、RWD 基礎與文件要求都已通過自動驗證。

2026-06-16 已追加前後台可理解性修正，讓後台設定欄位在前台更容易對應，也讓 T14 手動測試腳本包含最新檢查項目。

## 已驗證項目

- App 可在本機以 Next.js 啟動，並可開啟 `/`、`/search`、`/admin/login`、`/admin`
- Prisma/SQLite schema 可用，seed data 覆蓋站台設定、管理員、銀行、卡片、分類、優惠與關聯資料
- 公開頁包含首頁、分類頁、銀行頁、卡片頁、優惠詳情頁與搜尋頁
- 公開頁預設只顯示 `isPublished = true` 優惠，過期優惠由 `SiteSetting.showExpiredOffers` 控制
- 搜尋涵蓋優惠、標籤、卡片、銀行與分類相關資料
- SEO metadata、canonical、sitemap、robots、JSON-LD 與 FAQ JSON-LD 已驗證
- 後台登入、登出與 `/admin` 保護已驗證
- 後台 dashboard、settings、bank/card/category CRUD、offer editor、publish/unpublish 已驗證
- RWD polish 已完成，bank/card detail 圖片已改用 `next/image`
- Lint 與 production build 通過，無 ESLint warnings/errors

## UX Follow-up Fixes

2026-06-16 已補完前後台可理解性修正：

- 後台非首頁新增「回後台首頁」入口
- 信用卡管理的「卡面圖片 URL」補上前台用途說明
- 銀行詳情頁信用卡列表顯示卡面圖片或 placeholder
- 優惠詳情頁適用信用卡顯示銀行名稱、信用卡名稱與卡面圖片
- 搜尋頁移除多餘搜尋說明，改為 server-rendered 搜尋結果
- 搜尋可用銀行名稱命中優惠，例如 `/search?q=永豐`
- 搜尋結果卡片顯示銀行與信用卡來源摘要

## 自動驗證結果

已通過：

```powershell
npm run smoke:t08
npm run smoke:t11
npm run smoke:t12
npm run smoke:t13
npm run smoke:ux-followup
npm run lint
npm run build
```

UX follow-up 結果：

```text
UX follow-up smoke test passed.
```

Lint 結果：

```text
No ESLint warnings or errors
```

Build 結果：`next build` passed。

## Schema 與 MVP 邊界

這次 UX follow-up 沒有修改 product SPEC，也沒有修改 Prisma SCHEMA。

維持不加入以下 second-stage 項目：

- `AuditLog`
- `FaqItem`
- `Tag`
- `OfferTag`
- `Redirect`
- `CrawlSource`
- `ImportJob`
- Prisma `canonicalUrl` 欄位
- `SiteSetting.homepageFaqJson`

## Deferred Second-Stage Items

以下仍明確屬於第二階段，不列入 MVP 缺口：

- 多管理員角色與權限
- Audit log
- Structured FAQ model
- Tag / OfferTag model
- Redirect management
- Crawl/import jobs
- 圖片上傳與轉檔管線
- PostgreSQL production migration
- Rich text editor
- Content versioning or approval workflow

## 注意事項

- 單獨跑 dev server 後又執行 production build 時，Next.js dev cache 偶爾會出現 stale chunk 500；清理 `.next` 並重啟 `npm run dev` 可解決。
- T14 手動測試請以 `docs/implementation/manual-test-scripts/T14-測試腳本-v1-2026-06-15.md` 的最新版為準。
