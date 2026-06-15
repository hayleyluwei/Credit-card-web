# 信用卡優惠查詢網站 MVP v9 展開規格草案

日期：2026-06-07
來源：承接 credit-card-mvp-spec-v8-2026-06-05，新增 RWD layout、前台真實頁面、後台操作畫面與欄位可用性檢查。

## 1. 本次展開目標

v8 已定義產品目標、資料模型、後台模組、排序、SEO 與上線技術方向。v9 應進一步補足「畫面是否真的可做、欄位是否真的可維護、手機與桌機是否都可用」。

本次規格書需新增三個核心成果：

1. 前台每個真實頁面的畫面規格。
2. 後台每個操作畫面的欄位、操作方式、提示文字與前台影響。
3. RWD layout 與欄位可用性驗收清單。

## 2. RWD Layout 規格

### 2.1 Breakpoints

| 裝置 | 建議寬度 | 前台規則 | 後台規則 |
|---|---:|---|---|
| Mobile | 320-767px | 單欄排列，搜尋與篩選優先，卡片摘要固定二行 | 側欄收合，列表改卡片式摘要，主要操作固定可見 |
| Tablet | 768-1023px | 兩欄卡片，篩選可置頂或收合 | 表格可保留主要欄位，次要欄位進入詳情或更多選單 |
| Desktop | 1024px+ | 左側分類/篩選，右側列表或精選區 | 完整側欄、表格、多欄表單與預覽區 |

### 2.2 前台 RWD 原則

- 首頁手機版：搜尋框優先，其次分類入口，再顯示精選優惠與最新優惠。
- 分類頁手機版：篩選條件預設收合；已選條件以 chip 顯示；優惠卡片一欄顯示。
- 詳情頁手機版：卡面與主優惠先出現，條件、注意事項、官方來源依序往下。
- 卡片固定高度：列表頁推薦理由最多二行，超出截斷，完整內容由詳情頁承接。
- 圖片比例：卡面圖需固定容器比例，避免不同圖片尺寸造成版面跳動。
- CTA：官方連結或申辦導流按鈕在手機版需容易點擊，不被長文推到難找的位置。

### 2.3 後台 RWD 原則

- 後台桌機優先，但不可在窄螢幕爆版。
- 手機或窄螢幕時，左側選單改為 drawer 或頂部選單。
- 後台列表在手機版改為卡片式摘要，每張卡顯示主標、狀態、更新時間與主要操作。
- 表單欄位手機版單欄排列，桌機版可分區雙欄。
- 儲存、預覽、上下架等主要操作需固定在表單頂部或底部，避免管理者填完找不到操作。

## 3. 前台真實畫面展開

### 3.1 首頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| Header | Logo、主導覽、搜尋入口 | settings.site_name、categories.name | 手機版導覽需收合 |
| Hero/Search | 搜尋框、熱門分類入口 | categories、offers.tags | 可輸入關鍵字並進入搜尋結果頁 |
| 分類入口 | 現金回饋、網購、旅遊、海外、繳費、新戶 | categories.name、slug、icon_name、sort_order | 只顯示 is_active 分類 |
| 精選優惠 | 精選卡片列表 | offers.is_featured、recommend_score、summary_preview | 依排序規則顯示 |
| 最新優惠 | 最近更新或上架優惠 | offers.updated_at、is_published | 僅顯示已上架資料 |
| SEO/FAQ | 首頁說明與常見問題 | settings.seo、FAQ 設定 | HTML 文字可被搜尋引擎讀取 |

### 3.2 分類列表頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| 分類標題 | 分類名稱、分類說明 | categories.name、description、seo_title | URL 固定，例如 /categories/cashback |
| 篩選區 | 銀行、是否進行中、推薦、關鍵字 | banks、offers.end_date、is_featured | 手機版可收合 |
| 排序 | 本站推薦、分數、人工排序、更新時間 | is_featured、recommend_score、sort_order、updated_at | 與商業規則一致 |
| 優惠卡片 | 卡面、卡名、銀行、主打回饋、期間、二行推薦理由 | cards.image_url、cards.name、banks.name、offers.summary_preview | 卡片高度穩定 |
| 空狀態 | 無符合優惠時提示 | 系統產生 | 提供返回分類或清除篩選 |

### 3.3 搜尋結果頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| 搜尋摘要 | 顯示關鍵字與結果數 | offers、cards、banks | 搜尋結果可重複篩選 |
| 結果列表 | 與分類頁卡片一致 | 同分類頁 | 不產生另一套卡片規則 |
| 無結果 | 建議熱門分類與清除搜尋 | categories.sort_order | 不讓使用者卡死 |

### 3.4 優惠詳情頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| 主資訊 | 優惠標題、卡面、銀行、分類、狀態 | offers.title、cards.image_url、banks.name、categories.name | 資訊需與列表頁一致 |
| 主打回饋 | reward_type、reward_value、reward_cap | offers.reward_type、reward_value、reward_cap | 數字與單位需清楚 |
| 條件與限制 | min_spend、conditions、注意事項 | offers.min_spend、conditions、description | 長文需有清楚段落 |
| 官方來源 | source_url、最後校對時間 | offers.source_url、last_verified_at | 可讓管理者追查來源 |
| SEO | title、description、canonical、JSON-LD | offers.seo_title、seo_description、slug | 頁面需有固定 URL |

### 3.5 銀行頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| 銀行資訊 | 銀行名稱、Logo、官網、介紹 | banks.name、logo_url、website_url、description | Logo 需有 alt text |
| 該銀行卡片 | 信用卡列表 | cards.bank_id、is_active | 點擊可進信用卡頁 |
| 該銀行優惠 | 優惠列表 | offer_cards、offers.is_published | 僅顯示已上架優惠 |

### 3.6 信用卡頁

| 區塊 | 畫面內容 | 後台來源欄位 | 操作/驗收 |
|---|---|---|---|
| 卡片資訊 | 卡名、銀行、卡面、摘要 | cards.name、bank_id、image_url、summary | image_url 為公開 URL |
| 適合族群 | 卡片介紹與適合場景 | cards.target_audience、description | 可支援 SEO 文字 |
| 關聯優惠 | 目前進行中優惠 | offer_cards、offers.end_date | 可區分進行中/已過期 |

## 4. 後台操作畫面展開

### 4.1 儀表板

| 畫面區塊 | 欄位/資料 | 操作方式 | 前台影響 |
|---|---|---|---|
| 統計卡片 | 上架優惠、草稿、過期、卡片數、銀行數 | 點擊進入對應列表 | 無直接影響，用於管理判斷 |
| 待檢查提醒 | 即將到期、來源待校對、缺圖片 | 點擊進入編輯頁 | 提高資料準確度 |
| 快捷操作 | 新增優惠、新增信用卡、查看前台 | 按鈕 | 加速維護流程 |

### 4.2 銀行管理

| 欄位 | 輸入方式 | 必填 | 預設 | 前台用途 | 操作提示 |
|---|---|---|---|---|---|
| name | 文字輸入 | 是 | 無 | 顯示銀行名稱、篩選 | 名稱應與官方一致 |
| slug | 文字輸入/自動產生 | 是 | 依 name 產生 | 銀行頁 URL | 儲存後避免任意修改 |
| logo_url | 圖片 URL/上傳 | 否 | 空 | 銀行 Logo | 正式上線用公開 URL |
| logo_alt | 文字輸入 | 否 | 銀行名稱 + Logo | 圖片 alt text | SEO 與無障礙使用 |
| website_url | URL 輸入 | 否 | 空 | 官方連結 | 需檢查 URL 格式 |
| is_active | 開關 | 是 | true | 是否可被選用 | 停用不刪除既有關聯 |

### 4.3 信用卡管理

| 欄位 | 輸入方式 | 必填 | 預設 | 前台用途 | 操作提示 |
|---|---|---|---|---|---|
| bank_id | 下拉選單 | 是 | 無 | 顯示銀行與篩選 | 只可選啟用銀行 |
| name | 文字輸入 | 是 | 無 | 卡名 | 需能搜尋 |
| slug | 文字輸入/自動產生 | 是 | 依 name 產生 | 信用卡頁 URL | 避免重複 |
| image_url | 圖片 URL/上傳 | 否 | placeholder | 卡面圖 | 儲存公開可讀 URL，不存圖片本體 |
| image_alt | 文字輸入 | 否 | 卡名 + 卡面圖 | 圖片 alt text | 避免重要資訊只在圖片 |
| summary | 文字輸入 | 否 | 空 | 卡片摘要 | 不取代優惠摘要 |
| is_active | 開關 | 是 | true | 是否可關聯優惠 | 停用後前台不推薦新關聯 |

### 4.4 分類管理

| 欄位 | 輸入方式 | 必填 | 預設 | 前台用途 | 操作提示 |
|---|---|---|---|---|---|
| name | 文字輸入 | 是 | 無 | 分類名稱 | 例如現金回饋、網購 |
| slug | 文字輸入/自動產生 | 是 | 依 name 產生 | 分類 URL | 需唯一 |
| icon_name | 下拉/文字 | 否 | 無 | 分類入口 icon | 使用既有 icon set |
| sort_order | 數字輸入 | 是 | 0 | 分類排序 | 數字越小越前 |
| is_active | 開關 | 是 | true | 是否顯示 | 停用後分類入口隱藏 |
| seo_title | 文字輸入 | 否 | 系統產生 | SEO title | 可人工覆寫 |
| seo_description | 文字輸入 | 否 | 系統產生 | SEO description | 建議限制長度 |
| faq | 重複欄位 | 否 | 空 | FAQPage JSON-LD | 需與可見內容一致 |

### 4.5 優惠管理與單筆編輯

| 區塊 | 欄位 | 操作方式 | 前台影響 | 畫面說明需求 |
|---|---|---|---|---|
| 基本資訊 | title、category_id、offer_cards | 文字、下拉、多選 | 標題、分類歸屬、關聯卡片 | 說明一個優惠可關聯多張卡 |
| 摘要設定 | summary_mode、target_audience、highlight_1、highlight_2、manual_summary、summary_preview | 單選、下拉、文字、唯讀預覽 | 列表二行推薦理由 | 說明 manual_summary 有值時優先顯示 |
| 詳情資料 | description、conditions、reward_cap、min_spend、source_url | 長文、數字、URL | 詳情頁完整內容 | 說明 source_url 用於校對 |
| 排序上架 | is_featured、recommend_score、sort_order、is_published、updated_at | 開關、數字、系統欄位 | 是否顯示、排序位置、推薦標記 | 說明排序規則 is_featured > score > sort > updated |
| SEO | seo_title、seo_description、canonical、faq | 文字/重複欄位 | 搜尋可見性 | 說明內容需與頁面可見文字一致 |

### 4.6 設定

| 欄位 | 輸入方式 | 用途 | 驗收 |
|---|---|---|---|
| site_name | 文字輸入 | Header、SEO 預設值 | 前台可看到 |
| default_seo_title | 文字輸入 | 未設定頁面的預設 SEO | metadata 有 fallback |
| default_seo_description | 文字輸入 | 預設 description | 不可空白 |
| homepage_featured_count | 數字輸入 | 首頁精選數量 | 改值後首頁數量改變 |
| category_page_size | 數字輸入 | 分類頁每頁筆數 | 分頁/載入更多一致 |
| show_expired_offers | 開關 | 是否顯示過期優惠 | 前台清楚標示已過期 |

## 5. 前台顯示欄位 vs 後台來源欄位對照

| 前台顯示 | 後台來源 | 資料表 | 驗收方式 |
|---|---|---|---|
| 卡名 | 信用卡管理 name | cards | 修改後列表與詳情同步 |
| 銀行名稱 | 銀行管理 name | banks | 篩選與卡片顯示一致 |
| 卡面圖 | 信用卡管理 image_url | cards | 圖片可載入且比例穩定 |
| 推薦理由 | 優惠管理 summary_preview 或 manual_summary | offers | 列表最多二行 |
| 優惠期間 | 優惠管理 start_date/end_date | offers | 過期狀態正確 |
| 主打回饋 | 優惠管理 reward_type/reward_value | offers | 列表與詳情一致 |
| 官方來源 | 優惠管理 source_url | offers | 詳情頁可點擊 |
| SEO title | 各管理模組 SEO 欄位 | categories/banks/cards/offers/settings | metadata 正確輸出 |

## 6. 欄位可用性驗收清單

每個欄位納入規格前，都需通過以下問題：

1. 這個欄位由哪個角色維護？
2. 這個欄位在哪個後台畫面新增或編輯？
3. 欄位是否必填？若不是，空值時前台怎麼顯示？
4. 欄位有沒有預設值？預設值由系統給還是管理者選？
5. 欄位是否影響前台顯示、排序、篩選、SEO 或資料匯入？
6. 欄位是否需要管理者看得懂的說明文字？
7. 欄位修改後，會影響哪些前台頁面？
8. 欄位是否需要保留修改時間或最後校對時間？
9. 欄位是否可能造成資料不一致？若會，後台如何提示？
10. 手機版或窄螢幕後台是否仍能完成這個欄位的編輯？

## 7. v9 規格書建議新增章節

建議在正式 v9 docx 中調整為以下章節：

1. 產品目標
2. MVP 範圍
3. 前台資訊架構與真實頁面規格
4. 前台 RWD layout 規格
5. 後台資訊架構與操作畫面規格
6. 後台欄位可用性與前台對應
7. 資料結構規劃
8. 商業規則與排序
9. SEO 與 AI 搜尋可見性
10. 技術建議與部署路線
11. 第二階段擴充
12. 本版更新說明
