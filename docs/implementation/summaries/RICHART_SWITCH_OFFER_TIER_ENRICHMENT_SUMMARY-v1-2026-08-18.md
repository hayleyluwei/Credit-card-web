# 台新 Richart 卡「切換刷」優惠資料補齊 Summary

最後更新：2026-08-18（Asia/Taipei）

## 起因

審查中秋聚餐攻略草稿（`mid-autumn-dining-2026`，另一 session 建立）時，發現文章引用的優惠
`taishin-richart-switch-rewards-2026h2` 我方資料庫只記了「指定通路最高 3.8%」一個 tier，
但文章聲稱 Chill 刷最高 10%。逐一以 WebFetch 核對台新官方活動頁
（`https://mkp.taishinbank.com.tw/TsCms/marketing/expose/WM_20251008205057150/index.html`）
與政府 115 年（2026）假期公告 PDF 後，確認：

- 文章數字**全部正確**（Chill 刷 10%、好饗刷 3.3%、中秋連假 9/25–9/28、支付工具與排除清單皆逐字相符）。
- 問題出在**我方資料庫本身漏了大半內容**：官方頁面實際是 LEVEL 1／LEVEL 2 兩層資格
  ×8 個子方案（2%～10%），舊記錄只捕捉了其中「Pay著刷」的 3.8%。

使用者於 2026-08-18 對話中明確授權：「直接授權補這些資料」。

## 執行

1. **寫入前備份**：完整匯出當時的 Offer + RewardTier 記錄，存於 session scratchpad
   （`richart-backup-before-2026-08-18.json`，未納入版控——內容為正式站資料快照，不屬程式碼）。
2. **三次 WebFetch 逐項核對官方頁面**，取得 LEVEL 1／LEVEL 2 資格規則、8 個子方案各自的
   回饋率與適用通路、加碼上限（NT$300,000）、一般消費／保費規則、方案切換規則、活動期間。
3. 以交易（transaction）更新 `Offer` 欄位並重建 `RewardTier`：
   - `title`：「最高 3.8%」→「最高 10%」（比照站內既有多層級優惠的命名慣例，
     即 `ctbc-linepay-rewards-2026h2` 的「最高16%」寫法：標題呈現全部子方案中的最高值）。
   - `headlineRate`／`highlight1`／`highlight2`：改為「一般消費 0.3%（基準）／LEVEL 2 最高 10%（天花板）」的慣例寫法。
   - `summary`／`description`：重寫為涵蓋 LEVEL 1／LEVEL 2 與全部 8 個子方案的完整說明。
   - `tags`：新增「餐飲美食」「海外消費」「網購電商」（對應 Chill刷／好饗刷、玩旅刷、數趣刷新增涵蓋的範圍）；
     確認新增標籤不在 14 個固定情境標籤清單內，不會意外把此優惠帶進任何 `/scenarios/[slug]` 頁。
   - `sourceUrl`：更新為本次查證的官方頁面。
   - `lastVerifiedAt`：更新為 2026-08-18（台北）。
   - `RewardTier`：由 1 筆擴充為 **10 筆**（LEVEL 1 基礎、Chill刷、Pay著刷、天天刷、大筆刷、
     好饗刷、數趣刷、玩旅刷、假日刷、一般消費／保費），每筆皆含 rate／cap／minSpend／conditionsText，
     內容逐項對應官方原文。

## 驗證

| 檢查 | 結果 |
|---|---|
| `/offers/taishin-richart-switch-rewards-2026h2` | 200，標題顯示「最高 10%」，頁面顯示「共 10 個回饋層級」，查證日顯示 2026/8/18 |
| `/search?q=Richart` | 200，搜尋結果標題已更新為「最高 10%」，無舊標題「最高 3.8%」殘留 |
| `/categories/cashback` | 200 |
| `/` 首頁 | 200 |
| `/sitemap.xml` | 200 |
| HTML 是否含渲染錯誤字樣（`undefined`／`[object Object]`／`NaN`） | 檢查到的 `undefined` 皆為 Next.js RSC 內部序列化標記（`"$undefined"`），非畫面缺陷 |

未執行：`npm run build`（本機未跑，不影響本次純資料寫入；此次未改動任何程式碼）。

## 影響範圍

- 純資料變更，未改 schema、未改程式碼。
- 受影響頁面：`/offers/taishin-richart-switch-rewards-2026h2`（動態頁，即時反映）、
  `/search`、`/categories/cashback`（動態頁，即時反映）；首頁若有列出此優惠的區塊為靜態頁，
  需下次部署才會反映最新標題（本次未觸發部署）。
- 中秋聚餐攻略文章的引用內容不需修改，本來就是對的。

## 未執行

- 未修改中秋聚餐文章本身（內容審查結果為不需修改）。
- 未填入該文章的 `lastVerifiedAt`（仍為空，待使用者確認查證日期後填寫）。
- 未 git add／commit／push（純資料庫寫入，不涉及程式碼版控）。
- 未執行 `npm run build`。

## 待使用者處理

1. 中秋聚餐文章的 `lastVerifiedAt` 要不要填、填哪一天。
2. 是否要為 Richart 優惠新增「餐飲美食」情境的後續串接（目前 14 個固定情境標籤沒有「餐飲」這一項，
   如需要屬於 T29／情境擴充的範圍，本次未處理）。
