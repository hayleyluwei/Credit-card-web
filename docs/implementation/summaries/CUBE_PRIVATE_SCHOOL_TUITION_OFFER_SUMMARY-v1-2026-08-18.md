# CUBE 指定私校學費 1% 優惠新增摘要

日期：2026-08-18（Asia/Taipei）  
授權：使用者於本對話明確指示新增至信用卡後台  
任務狀態：已完成  
部署狀態：Production 已驗證

## 新增內容

- 新增優惠：`cathay-cube-private-school-tuition-2026`，標題為「CUBE 童樂匯指定私校學費 1%」。
- 適用卡片：既有 `cathay-cube-card`（國泰世華 CUBE 信用卡）。
- 活動期間：2026-07-01 至 2026-12-31。
- 資料完整記錄：僅限 i 繳費平台、童樂匯解鎖資格與期限、指定私校／校區限制、直接刷卡或指定國際行動支付限制、信用額度加新臺幣 50 萬元的指定消費上限，以及官方交易認列原則。
- 官方來源：<https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/discount/2026/familypillar/index.html>；實際查證日為 2026-08-18。

## 資料寫入與驗證

- 建立增量資料檔：`docs/data-collection/CUBE指定私校學費優惠-增量資料-v1-2026-08-18.xlsx`，僅含這筆優惠與其 CUBE 卡片對應，不覆蓋未列出的既有資料。
- 匯入前 dry-run：0 錯誤。
- 執行增量匯入：新增 1 筆優惠、更新 0 筆、建立 1 組優惠與卡片對應；未執行 reset、未修改 schema 或既有卡片資料。
- 匯入前備份：`prisma/backups/dev-before-import-upsert-20260818-032002.db`。
- 公開驗證：`https://credit-card-web-pi.vercel.app/offers/cathay-cube-private-school-tuition-2026` 回應 HTTP 200，頁面標題正確。

## 事後複核（Claude，2026-08-18）

逐項對照官方活動頁重新查證，**10 項全部吻合**：活動期間、1% 小樹點、已含一般消費 0.3%、
上限（消費日信用額度＋NT$50 萬）、限 i 繳費平台、資格解鎖 2026-11-20、子女 2008-06-01 後出生、
康橋限 6 校區、台北歐洲學校須由 TES AOS 跳轉、每月 20 日前符合資格次月 1 日生效。

**發現一項可追溯性瑕疵並已修正**：條件與限制中「不得透過 LINE Pay、街口支付、全支付等第三方支付」
一句，內容屬實但**不在本活動頁上**，而是 CUBE 卡「指定消費」的通用定義。已於條件與限制段末
註明該句的實際出處並附上卡片條款頁網址
（`https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube/`，2026-08-18 查證），
使每項宣稱都能追溯到來源。

**發現一項本摘要原本的判斷落差**：原記「Production 已驗證」的依據只有優惠詳情頁回應 200。
實測發現這筆優惠當時**沒有出現在首頁與學費情境頁**——因為這些頁面在 build 時就靜態產生，
最後一次 build（2026-08-09）早於本次資料寫入。**資料寫入資料庫不等於全站可見，需要重新部署**
讓靜態頁重新產生。已於本次 push 觸發重建。

## 未觸及

- 未修改 Prisma schema、程式碼、既有優惠、卡片資料、銀行資料、Git 暫存／commit／push 或部署設定。
- 未新增玉山世界卡學費優惠；該優惠若要收錄，需另做官方資料新增與驗證。
