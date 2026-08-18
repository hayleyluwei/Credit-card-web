# 官方來源與輔助網址參考

最後更新：2026-07-27（Asia/Taipei）
用途：每張卡的官方活動頁、輔助官方頁面（FAQ／條款細節）、發現線索（部落格／媒體），集中一處供之後更新資料時快速查閱，減少每次重新搜尋。

## 使用方式

- **這份文件是「查詢起點」，不是最終真相**。實際更新資料時，仍要親自打開下方網址確認目前內容，不能只憑這份文件的舊記錄判斷。
- **這份文件只收錄「已知的」網址，不代表「全部」**。銀行官網會改版、加新頁面、換活動網址；每次更新資料時，除了核對清單上已記錄的網址，**也要主動到銀行官網（卡片介紹頁、活動總覽、優惠專區等）搜尋一輪，確認有沒有清單沒收錄到的新頁面、新活動，或既有頁面已經失效換了新網址**。不能只反覆讀同一份清單就當作查證完成。
- **已知風險**：官網頁面可能是 JavaScript 動態載入內容（例如國泰世華 CUBE 活動頁曾發生：自動抓取工具讀到的是寫死在原始碼裡的舊版文字，實際頁面用 JS 載入了新版內容）。用自動化工具（WebFetch 等）核對前，若結果可疑，要換用真人瀏覽器再次確認。
- **官方來源 vs 輔助線索是兩回事**：
  - 「官方主要來源」「官方輔助頁」可以且應該被填進 `Offer.sourceUrl`（資料庫既有欄位，前台「來源連結」直接讀這裡）。
  - 「發現線索」（部落格、媒體、心得文）**不可**當作 `sourceUrl`，依規格書鐵律，資料的來源網址一律要回官方頁面查證；部落格只用來輔助發現「這張卡/這個活動存在」，不能當作內容依據。
- 新增或更新某張卡時，順手更新這份文件對應的段落（尤其是新發現的輔助頁面、或觀察到的更新規律）。

## 已觀察到的銀行更新規律

- **永豐銀行**：稅款分期／學費回饋／公用事業費類活動常見上下半年各一輪（1/1、7/1 生效切換）。2026-07-27 觀察案例：`sinopac-designated-tax-installment-2026h1`、`sinopac-tuition-payment-rebate-2026h1` 官網延展至下半年時，**沿用同一官方網址、條款內容不變，只延長日期**（對應規格書 v3 3.4「情況一」）。下次遇到類似情況，可先假設是同一活動延展，用同一 `sourceUrl` 核對即可，不必急著找新網址。

## 各銀行／卡片參考

### 中國信託銀行（ctbc）— https://www.ctbcbank.com/

**中國信託LINE Pay卡**（`ctbc-line-pay-card`）
- 官方主要活動頁：`https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/index.html`（已用於多筆優惠的 sourceUrl：一般回饋、海外實體週期回饋、一卡通交通）
- 官方新戶好禮頁：`https://www.ctbcbank.com/content/dam/minisite/long/creditcard/LINEPay/gifts.html`（已用於新戶好禮優惠）
- 官方 FAQ（條款細節，尚未採用為任何優惠的 sourceUrl，供之後核對除外項目／條款細節用）：`https://service.ctbcbank.com/FAQ/Page01?kmid=15719@km`
- 發現線索（部落格，僅供參考，不可當來源）：`https://rich01.com/ctbcbank-line-pay-card/`

### 台新銀行（taishin）— https://www.taishinbank.com.tw/

**台新Richart卡**（`taishin-richart-card`）
- `https://web.taishinbank.com.tw/TSB/personal/credit/intro/overview/cg047/card001/`（切換方案回饋活動）
- `https://mkpcard.taishinbank.com.tw/tscccms/promotion/detail/WM_20260617134739441`（學雜費分期，與街口聯名卡共用）

**台新街口聯名卡**（`taishin-jkopay-card`）
- `https://mkpcard.taishinbank.com.tw/tscccms/promotion/detail/WM_20260617134739441`（學雜費分期）
- `https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/future/24e1ad87-2cad-11f1-b50f-0050568c09e3`（繳稅費活動）

### 國泰世華銀行（cathay）— https://www.cathaybk.com.tw/cathaybk/

**國泰世華CUBE信用卡**（`cathay-cube-card`）
- `https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/product/CUBE_rights/index.html`（權益分級指定消費回饋）
- `https://www.cathaybk.com.tw/cathaybk/promo/event/credit-card/discount/2026/familypillar/index.html`（童樂匯指定私校學費 1%；限 i 繳費平台、須先解鎖童樂匯資格，2026-07-01 至 2026-12-31）
- `https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube/`（CUBE 卡條款頁：「指定消費」的通用定義與排除條款，含不得透過 LINE Pay／街口支付／全支付等第三方支付。活動頁本身不載此條，引用該限制時須改引此頁）
- ⚠️ 此頁為 JS 動態載入內容，自動抓取工具可能讀到舊版文字，務必用真人瀏覽器核對（見上方「使用方式」）。

### 永豐銀行（sinopac）— https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/list.html

**DAWHO現金回饋信用卡**（`dawho-cashback-card`）
- `https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html`（一般消費／悠遊卡自動加值回饋）
- `https://bank.sinopac.com/sinopacbt/personal/credit-card/discount/650410355.html`（稅款分期／學費回饋／公用事業費代扣繳，與幣倍卡共用；見上方「已觀察到的銀行更新規律」）

**永豐幣倍卡**（`sinopac-dual-currency-card`）
- `https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/dual-currency-card.html`（海外指定通路加碼）
- `https://bank.sinopac.com/sinopacbt/personal/credit-card/discount/650410355.html`（稅款分期／學費回饋／公用事業費代扣繳）

### 滙豐銀行（hsbc）— https://www.hsbc.com.tw/credit-cards/

**滙豐旅人御璽卡**（`hsbc-travelone-signature`）— `https://www.hsbc.com.tw/credit-cards/products/travelone-signature/`

**滙豐旅人無限卡**（`hsbc-travelone-infinite`）— `https://www.hsbc.com.tw/credit-cards/products/travel/visa-infinite/`

**滙豐旅人輕旅卡**（`hsbc-travelone-light`）— `https://www.hsbc.com.tw/credit-cards/products/travelone/`

- 註：三張卡官網皆另提及「同時申辦帳戶＋信用卡」加碼最高 NT$1,000 刷卡金，目前資料庫未收錄此追加優惠（覆蓋率缺口，見 T17 資料抽查清單）。

### 玉山銀行（esun）— https://www.esunbank.com/zh-tw/personal

**玉山Unicard**（`esun-unicard`）
- `https://www.esunbank.com/zh-tw/personal/credit-card/intro/bank-card/unicard-b`（百大指定消費／新戶綁玉山Wallet回饋）

### 聯邦銀行（ubot）— https://www.ubot.com.tw/

**聯邦綠卡**（`ubot-green-card`）
- `https://activity.ubot.com.tw/aws_act/2026/202607autopay/index.htm`（指定生活代扣繳回饋）
- 註：官網同頁另有「首扣優惠」子活動（首次代扣送 NT$50，月上限 NT$250，限量 4 萬名）未被收錄，屬覆蓋率缺口。

## 待補齊

- 除中國信託 LINE Pay 卡外，其餘卡片目前尚未系統性記錄「官方輔助頁（FAQ／條款）」與「發現線索（部落格）」，之後每次查證新卡或既有卡片時，順手補進對應段落即可。
