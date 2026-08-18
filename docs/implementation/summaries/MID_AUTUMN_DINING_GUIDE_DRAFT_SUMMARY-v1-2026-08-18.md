# 2026 中秋聚餐攻略草稿上稿 Summary

最後更新：2026-08-18（Asia/Taipei）

## 結果

- 使用者明確授權 AI 透過正式站後台建立攻略文章草稿。
- 已建立 Article：`id=2`、`slug=mid-autumn-dining-2026`。
- 標題：`2026中秋聚餐刷哪張？火鍋、燒肉信用卡優惠整理`。
- 狀態：草稿（未發布），前台 `/guides` 與 `/guides/mid-autumn-dining-2026` 不會顯示。
- 內容納入台新 Richart 卡 Chill刷／好饗刷、永豐 DAWHO 現金回饋信用卡、國泰世華 CUBE 樂饗購，以及玉山用戶餐廳優惠券。

## 上稿與驗證

- 透過 `/admin/articles` 建立，未使用匯入腳本或直接操作資料庫。
- 後台文章列表確認顯示 `/guides/mid-autumn-dining-2026 · 草稿`。
- 重新開啟 `/admin/articles/2`，確認 title、slug、summary、contentMd、seoTitle、seoDescription 與 faqJson 均已保存。
- `lastVerifiedAt` 依 `GUIDE_ARTICLE_PUBLISHING_攻略文章上稿流程.md` 保留空白，待使用者人工核對官方來源後填寫。
- 三個站內優惠連結已於上稿前確認 HTTP 200：Richart、DAWHO、CUBE。

## 未執行

- 未發布文章。
- 未觸發部署。
- 未修改其他文章、優惠、卡片或 schema。
- 未執行 git add、commit、push。

## 待使用者處理

1. 在後台檢視並校對草稿。
2. 人工核對官方來源後填入 `lastVerifiedAt`。
3. 若決定發布，須另行明確授權；發布後依 SOP 立即驗證前台排版與全部連結。

## 2026-08-18 銀行名稱文案修正

- 再次進入後台時，Article `id=2` 已顯示為「已發布」；本次保留既有發布狀態。
- 依使用者指示，摘要、比較表、正文、SEO 與 FAQ 的信用卡名稱均補上簡稱銀行名：`台新Richart卡`、`永豐DAWHO現金回饋信用卡／永豐DAWHO卡`、`國泰CUBE卡`。
- 優惠數字、活動條件、slug 與站內連結皆未更動；`lastVerifiedAt` 仍保留空白。
- 後台顯示「已儲存文章」，並已於前台 `/guides/mid-autumn-dining-2026` 確認新文案即時顯示。
- 未執行 git add、commit、push 或部署。
