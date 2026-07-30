# 目前專案狀態

最後更新：2026-07-30（Asia/Taipei）  
用途：所有新 AI session 接續本專案時的唯一目前狀態入口
交接摘要：`docs/implementation/handoffs/2026-07-30-T20情境頁與訂閱標籤-交接摘要.md`（最新一輪對話的完整導覽，內容橫跨 2026-07-29 晚間至 2026-07-30 上午；2026-07-29 稍早的 T23 定案過程見 `2026-07-29-T23-卡面配色與資料蒐集v4-交接摘要.md`；T18/T21/T22/T24 現況仍見前一篇 `2026-07-27-T16-T24-交接摘要.md`）

## 專案與工作區

- 正式 Git root：`C:/Users/user/Documents/Credit card web project`
- 工作區 alias：`C:/Users/user/Documents/信用卡查詢網站`
- alias 類型：Windows junction，兩個路徑指向同一份檔案
- branch：`main`
- HEAD：`3fd8e4d`（2026-07-30 08:44 更新；`f0f6ecc`／`42c6108` 為 2026-07-29 晚間 commit，`3fd8e4d` 為跨午夜後 2026-07-30 上午 commit，三個皆本輪對話產生，見下方各任務段落與新交接摘要）
- 遠端關係：**已與 `origin/main` 同步，無待 push 的 commit**（每次 commit 後皆已 push，最後核對時間 2026-07-30）

新 session 必須以 `git rev-parse --show-toplevel`、`git status` 及 `git rev-parse --short HEAD` 重新核對，不得只相信本文件。

## 目前有三條並行的任務線（2026-07-26 更新）

本專案目前由使用者＋Claude Code＋Codex 三方協作，Codex 負責資料整理人員角色（透過 `.ai-worktree-lock.json` 協調寫入時機），Claude Code 負責工程實作。**新 session 開始時務必先讀 `.ai-worktree-lock.json` 是否存在，若存在且是 Codex 持有，唯讀分析不受影響，但寫入前要跟使用者確認鎖是否仍有效**（不可自行覆蓋或刪除）。

### T16 第一版正式資料匯入 — 已核准 v1，資料已匯入，**已於 2026-07-26 正式標記完成**

- 任務卡：`docs/implementation/tasks/T16-FIRST_RELEASE_DATA_IMPORT_第一版正式資料匯入.md`
- 匯入腳本已建立並 commit：`scripts/import-offer-data.mjs`（用 Python openpyxl 讀 xlsx，不新增 npm 相依）；`package.json` 新增 `data:import`／`data:import:dry`。
- 已完成兩輪真實資料匯入：第一輪 5 家銀行／8 張卡／10 筆優惠；Codex 第二輪（CORE-SCENARIOS-DATA-COLLECTION-BATCH-2，補繳稅／學費／水電瓦斯情境）後累計 **6 家銀行／10 張卡／16 筆優惠／20 筆優惠卡片對應**。每次匯入前都會備份 `prisma/dev.db`（見 `prisma/backups/`），只清除 Bank/Card/Offer/OfferCard，保留 Category/SiteSetting/AdminUser。
- 來源試算表：`docs/data-collection/信用卡優惠資料整理模板-v2-2026-07-18.xlsx`，目前版本已由使用者／Codex commit（`5bcec14 docs(data): 核實繳稅學費與代扣優惠`）。
- **已知資料狀況**：`esun-unicard-wallet-new-card-2026q3` 的「最低消費」欄位，T17 抽查已核對為欄位歸類問題（填了申辦期限敘述，非事實錯誤），待資料整理或 T21 欄位重構時調整。（原本列在此的兩筆永豐過期優惠已於 2026-07-27 更新解決，見下。）
- **2026-07-27 永豐兩筆優惠期間更新**：T17 抽查發現的 `sinopac-designated-tax-installment-2026h1`、`sinopac-tuition-payment-rebate-2026h1`（原記為 2026 上半年、已過期隱藏），使用者確認官網已延展為下半年（2026/7/1-12/31）且核心條款不變，屬規格書 v3 3.4「情況一」。已更新 **xlsx 原始檔**（開始/結束/查證日期＋摘要說明內文日期）並跑增量匯入同步資料庫，前台已確認兩筆改為「進行中」正常顯示。優惠代號仍保留 `-2026h1`（沿用不改以免破壞 URL），與實際下半年期間為外觀不一致的命名瑕疵，未來可清理。xlsx 異動與 T17 抽查清單更新尚未 commit。
- **2026-07-27 匯入方式升級為增量更新（v2，取代原本整批清空重建）**：使用者提出「往後每半年信用卡權益更新，希望能局部覆蓋、不要整批清空」的需求後，已完成以下工作：
  - `scripts/import-offer-data.mjs` 新增增量 upsert 模式並改為**預設行為**：以 slug（銀行代號／卡片代號／優惠代號）比對，存在就整列覆蓋更新、不存在就新增，**完全不刪除本次表格沒有列出的既有資料**；原本的整批清空重建邏輯保留，改為需要明確加 `--reset` 旗標才會觸發（`npm run data:import:reset`）。
  - 修正了一個實作過程中發現的邏輯缺口：原始 validate() 只檢查「本次表格內」的銀行/卡片代號對應，若使用者依規格書建議只交付「新增或有異動的列」（例如只新增一張卡，不重複列出該卡所屬的既有銀行），會被誤判為「找不到對應」而擋下。已修正為同時查資料庫既有代號，增量情境下可以正常運作。已用真實資料（idempotent 重跑一次，0 新增/全部更新，資料筆數不變）與一個模擬「只新增卡片、不重複列銀行」的最小測試批次（dry-run 與正式寫入都驗證過，寫入後手動清除測試資料）雙重驗證通過。
  - `package.json` 新增 `data:import:reset`（明確整批重建）與 `data:verify-release`（T17 的 `verify-release-data.mjs` 對應 npm script）。
  - 資料蒐集規格書升版至 **v3**（`docs/data-collection/DATA_COLLECTION_SPEC_信用卡優惠資料蒐集與分類規格書-v3-2026-07-27.md`，v2 檔頭已加註取代說明）：新增 2.1 節「增量更新」說明交付規則改變、新增 3.4 節「半年更新週期：延續活動 vs 新活動判斷」規則（同一活動延長期間沿用舊優惠代號、條款有實質變動則換新代號）與對應 FAQ Q10。與 T21 暫緩的「多層回饋寫法慣例」是不同主題，未觸及、仍維持 v2 原樣。
  - **意外發現並已修正的問題**：測試增量模式時，用「無 --reset」模式重跑一次現有 xlsx，證實了先前 CURRENT_STATE 記載的疑慮成真——HSBC 兩筆優惠的年費金額文字（NT$2,500／NT$8,000）因為只存在資料庫、不在 xlsx，被覆蓋成沒有金額的版本。已立即用同樣的字串取代方式修回資料庫，**並且已把這兩個金額直接寫回 xlsx 原始檔**，讓這個修正之後不會再被任何一次匯入（增量或 reset）覆蓋掉，徹底解決這個長期記錄在案的已知風險。
  - 上述程式與規格異動**尚未 commit**，仍在工作區，commit 前待使用者確認。
- **收尾已完成**：Summary 已建立（`docs/implementation/summaries/T16-FIRST_RELEASE_DATA_IMPORT_SUMMARY-v1-2026-07-26.md`）、`01-ACTIVE_TASK_INDEX_目前任務索引.md` 的 T16 狀態列已改為「完成」、本文件同步更新。人工抽點（首頁／分類頁／優惠詳情頁確認無測試資料殘留）已在先前對話中完成，本次僅補齊「正式標記完成」的文件流程。

### T17 上線前完整測試 — 已核准 v1（2026-07-27），**已於 2026-07-27 標記完成**（使用者拍板接受自動驗證＋AI 示範測試＋16 筆抽查；後台登入編輯項由使用者自行補跑）

- 任務卡：`docs/implementation/tasks/T17-PRE_LAUNCH_TESTING_上線前完整測試.md`
- 核准拍板：抽查比例＝全部16筆；人工測試執行方式＝AI先示範跑一輪、使用者最後覆核；Git 授權＝git add + local commit。
- 建立 `scripts/verify-release-data.mjs`（唯讀），執行通過、0 錯誤：6 家銀行／10 張卡／16 筆優惠（皆已發布）／20 筆優惠卡片對應，無舊測試資料殘留。2 個非阻擋警告：2 筆優惠已過期但 isPublished 仍為 true（設計如此，前台已確認正確隱藏）；目前 0 筆優惠為精選（isFeatured=true），首頁「本期精選」區塊目前為空。
- 盤點既有 17 支 smoke 腳本，逐一決定處置（詳見 T17 Summary）：`verify-t03-seed.mjs`、`verify-real-card-data.mjs`、`verify-ux-followup.mjs` 三支因斷言舊 seed／舊一輪真實資料的專屬內容已標記**停用**（加註頭部說明，未刪除）；其餘沿用不變，但多數仍為 `unclassified`（需即時 dev server 與正式管理員密碼，寫入共用資料庫），本次未執行。
- 建立人工測試腳本 `docs/implementation/manual-test-scripts/T17-上線前測試腳本-v1-2026-07-08.md` 與資料抽查清單（全部16筆）`docs/implementation/manual-test-scripts/T17-資料抽查清單-v1-2026-07-27.md`，AI 已用瀏覽器與 WebFetch 示範跑過一輪。
- **重要發現，待使用者裁定**：`sinopac-designated-tax-installment-2026h1`、`sinopac-tuition-payment-rebate-2026h1` 兩筆優惠的官方來源頁目前顯示活動期間為「2026/7/1–12/31」（下半年），但資料庫記錄為已過期的上半年期間（至2026-06-30）。回饋內容本身與官網相符，僅期間可能未同步，可能導致實際仍有效的優惠被前台誤判過期而隱藏。是否回到 T16 資料流程更新期間，待使用者決定；本任務 Non-scope 不允許 AI 直接修改資料。
- **AI 無法示範的項目**：後台登入與編輯流程（AI 無管理員登入憑證）、5 個未逐頁示範的分類頁、分頁功能（目前資料量未觸發）。
- Summary：`docs/implementation/summaries/T17-PRE_LAUNCH_TESTING_SUMMARY-v1-2026-07-27.md`
- **流程備註**：本次 T17 寫入作業因銜接前一輪 T16/T19 收尾直接進行，未在動筆前重新建立 `.ai-worktree-lock.json`（屬流程疏漏）；當下並無其他 session 持有鎖或有重疊寫入跡象，風險判斷為低，但提醒下次寫入前仍應依 `AI_WORKFLOW_AI協作流程.md` 第7節建立鎖。

### T19 卡片結構化欄位與蒐集規格擴充 — 已核准 v1，**已於 2026-07-26 正式標記完成**

- 已 commit：`d6abc55 feat(T19): add card structured fields`
- 功能已用真實資料驗證過（T16 匯入的卡片都正確顯示年費／等級／發卡組織／優缺點），且規格書 v2 與模板 v2 已實際交付整理人員並完成兩輪真實資料匯入，滿足任務卡定義的兩項人工驗收條件。`01-ACTIVE_TASK_INDEX` 與任務卡 Summary 的任務狀態欄位已正式改為「完成」。
- Summary：`docs/implementation/summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md`（2026-07-26 補記驗收結果）

### T21 優惠條件結構化（重構 Offer＋RewardTier／Channel）— 已核准 v1（2026-07-27），**已完成**

- Summary：`docs/implementation/summaries/T21-CONDITION_SCHEMA_SUMMARY-v1-2026-07-27.md`
- 現況：Phases 1-5 全部完成。schema 已升至 **v4**（扁平回饋欄位已從 Offer 移除，回饋一律經 RewardTier）。前台、後台、匯入、seed 全部改用 tiers。
- **驗證證據（三層）**：① 自動驗證：`prisma validate`／`tsc`／`next build` 皆通過。② 資料層測試：`scripts/verify-t21-tier-data-layer.mjs`（直接用 Prisma 模擬 admin-actions.ts 的 tier create/整批替換/刪除邏輯，11 項斷言全過，測試資料建立後已清除，未汙染真實資料）。③ **使用者已於 2026-07-27 親自登入後台實測 tier 動態表單**：在真實優惠（`ctbc-linepay-rewards-2026h2`，Codex 匯入、本身即為 3 層真實資料）新增第 4 層測試層（test0728），前台正確反映為第 4 層獨立顯示，證明表單新增功能正常；測試層已請使用者自行從後台刪除清除（同時驗證刪除功能）。
- 真實多層資料佐證：中國信託 LINE Pay 卡的 `ctbc-linepay-rewards-2026h2` 優惠本身即為 3 層真實資料（一般消費／國外實體／指定商家加碼），前台三層皆正確渲染，是 T21 多層設計在真實情境下的自然驗證。
- 幣倍卡多層 seed 範例：使用者 2026-07-27 決定先跳過（seed 已具多層能力，多層資料改由後台表單建在正式資料上）。
- schema 檔案（歷史留存）：v3＝擴張（加 RewardTier）、v4＝收縮（移除扁平欄位），備份與規格說明見 `engineering-data-model-spec/`。

（以下為 2026-07-27 稍早的分階段細節，保留供追溯）

### T21（分階段細節，2026-07-27 稍早）— 已核准 v1，實作中

- 任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`（核准證據已填）
- 核准狀態：**已核准**（使用者 2026-07-27 回覆「進入 T21」並選「直接動 schema」）。依 schema 專門流程進行，高風險步驟執行前先確認清單。
- 已拍板決策（不變）：(a) 方案 B 重構 Offer；(b) capPeriod／PaymentMethod 用 String；(c) 巢狀限一層＋觀察門檻；規格書維持 v2（資料蒐集規格另已升 v3，指增量匯入/半年更新規則，與此不同）；(d) 排序 T16→T17→T21→T18；扁平欄位最終**移除**（使用者 2026-07-27 拍板）。
- **實作進度（分階段，扁平欄位採「先擴張、遷移、再收縮」避免資料遺失）**：
  - Phase 1 ✅ schema 加 `RewardTier`／`Channel`／`RewardTierChannel`＋Offer 加 `tiers`／`headlineRate`／`headlineSummary`（RewardTier 另含 `minSpend`）；扁平欄位暫留當橋樑；`prisma validate` 通過。對齊了漂移的 `engineering-data-model-spec/schema.prisma`（補回 T19 少的 6 個 Card 欄位）。產出 `schema-v3-2026-07-27.prisma`、`prisma-schema-spec-v3-2026-07-27.md`、`schema-checklist-2026-07-27.md`。
  - Phase 2 ✅ 備份 dev.db → `prisma db push`（純新增）→ `scripts/migrate-offers-to-tiers.mjs` 把 16 筆 offer 各遷出 1 筆 tier（16/16，內容抽查一致）。
  - Phase 3 ✅ 前台詳情頁與 `OfferCard` 改讀 tiers（保留扁平 fallback）；tsc 乾淨、瀏覽器實測正確。
  - Phase 4 ⏳ 後台 `AdminOfferForm` tier 動態表單＋`admin-actions` 寫 tiers＋`domain-validation` 改用 tiers（**後台 UI 需使用者登入測試**）。
  - Phase 5 ⏳ `import-offer-data.mjs`／`seed.mjs` 改寫 tiers；幣倍卡做為第一筆多層結構化案例；**從 schema 移除扁平欄位＝高風險，執行前再確認**；寫 T21 Summary。
- 目前資料庫「新舊並存」：資料已在 RewardTier、前台讀新的，扁平欄位仍在、後台仍寫舊的，網站正常。

### T22 排程輔助資料更新（半自動：抓取＋比對＋人工核准後匯入）— 草案待核准

- 任務卡：`docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md`
- 依賴 T18（資料庫上雲）、T21（已完成，結構化後比對較可靠）。5 個待決問題（排程機制/抓取方式/頻率/與其他任務排序/報告自動化程度）尚未拍板。

### T23 卡面圖像視覺風格規則 — 已核准 v1，**已完整實作並上線於本機環境**

- 任務卡：`docs/implementation/tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md`（已核准，含完整迭代紀錄）
- 完整過程見 `docs/implementation/handoffs/2026-07-29-T23-卡面配色與資料蒐集v4-交接摘要.md`，此處只記現況。
- **現況**：卡片沒有真實 `imageUrl` 時，前台以參數化 SVG 樣板生成卡面示意圖（晶片圖示＋雙色漸層底＋卡片名稱主視覺＋金屬色系細邊框，邊框色調跟著晶片走）。底色／文字／晶片色優先取自 `Card` 的 5 個可選欄位（`cardBgColorFrom`／`cardBgColorTo`／`cardTextColor`／`cardChipColorFrom`／`cardChipColorTo`，schema v5 新增），皆取自各卡官網卡面的真實色彩印象（只抽色彩、不重製 Logo 或專屬圖案）；欄位留空則回退為依卡片代號雜湊（FNV-1a＋12色調色盤）的預設色，不會破版。
- **目前資料**：**14 張卡全數已有官網真實配色**（2026-07-29 稍晚補上最後 3 張：momo卡／滙豐現金回饋御璽卡／星展eco永續卡）。
- **2026-07-29 補色方式**：官網卡面圖片用瀏覽器 canvas 像素取樣（非肉眼截圖猜色），momo卡（`momo2026new.gif`＋新卡上市 banner 兩份素材交叉驗證：白/淺灰卡身＋momo品牌桃紅文字）、滙豐現金回饋御璽卡（`signature.jpg` 取樣：深炭灰卡身，與同系列滙豐旅人御璽卡同屬黑卡系但刻意保留可辨識深淺差異）、星展eco永續卡（`eco_cardface_kv.png` 取樣：森林綠漸層，晶片沿用全站中性銀灰慣例）。直接寫 `dev.db`（backup 於 `prisma/backups/dev-before-t23-3new-cards-colors-20260729-220946.db`），未經後台表單；已用前台頁面讀出實際渲染的 SVG gradient stop 值核對過與寫入值一致。
- **多卡面選型缺口已拍板（2026-07-29）**：不新增欄位記錄「選了哪一款」，改採**「官網頁面讀取到的第一張卡片／色版」為代表色抽取目標**這一原則長期適用。本次星展eco系列（同時有 eco永續卡／eco永續極簡卡／優選／優選PLUS／世界商務／biz 等子卡）即依此原則確認官網列表第一項就是本卡專屬頁面，無選型疑慮。玉山Unicard（白/黃/藍3色）、中信LINE Pay卡（11款角色卡面）現有配色維持不變，往後若要重新核對比照同一原則。
- **相關檔案**：`src/lib/cardVisual.ts`（雜湊＋斷行＋顏色解析邏輯）、`src/components/CardImage.tsx`（SVG 生成）、`src/components/AdminCardForm.tsx`（後台 5 個顏色欄位）、4 個前台呼叫端頁面。
- **待辦**：後台顏色欄位「儲存＋前台反映」完整迴圈待使用者找機會補測（已確認欄位存在，完整存檔測試未完全確認）。測試腳本已建立：`docs/implementation/manual-test-scripts/T23-後台顏色欄位儲存與前台反映測試腳本-v1-2026-07-30.md`（2026-07-30 新增，需使用者本人登入操作，AI 可協助核對前台渲染結果）。
- Commit：`f512fdb`（SVG 實作）、`e6ea3a5`（schema v5）、`322049b`（資料蒐集 v4＋Codex 批次匯入），**已於 2026-07-29 confirm 為已 push**（見上方「專案與工作區」節）；本次 3 張新卡配色為直接資料庫寫入，**尚未 commit**（資料庫變更不受 git 版控，無需 commit，但建議之後補進 xlsx 範本存檔以防重新匯入覆蓋，見下方提醒）。

### T20 攻略文章功能與自動情境頁 — Scope v3 已核准，**自動驗證通過，待人工驗收**（2026-07-30）

- 任務卡：`docs/implementation/tasks/T20-GUIDE_ARTICLES_攻略文章功能.md`（v3，2026-07-30 已核准）
- **背景**：使用者實測發現，搜尋「繳稅/學費/機票 信用卡優惠」這類情境查詢，網站雖然資料都有（站內搜尋能比對 `Offer.tags` 找到），但外部 Google／AI 搜尋幾乎找不到——因為 `/search?q=` 沒有 `generateMetadata`、沒有 JSON-LD，帶參數的搜尋結果頁對 SEO 是隱形的；情境標籤只活在優惠內文裡，沒有自己的網址。
- **2026-07-27 舊決策**：曾明確排除「標籤自動聚合頁」，選擇只做人工攻略文章。
- **2026-07-30 決策反轉**：AI 用 mockup 具體呈現自動情境頁的樣子（單薄清單、但有獨立網址可被索引）供使用者評估後，使用者決定**兩者都做**——自動情境頁（`/scenarios/[slug]`，核心情境標籤各一頁）負責「先有網址、全部標籤一次上線」，人工攻略文章負責「結論、比較表、FAQ」的深度內容，兩者互補、非取代關係。
- **2026-07-30（同日稍晚）核心情境標籤擴充為 14 項**：使用者參考同業網站的情境分類截圖，比對後新增電影／高鐵台鐵／eTag／停車／道路救援 5 項（高鐵與台鐵合併為一個標籤），明確排除「首刷禮行李箱」這類促銷型項目不列入情境標籤；規格書同步升版至 **v6**（v5 已加註取代說明）。T20 任務卡同步更新為 v3。
- **現況（2026-07-30 更新）**：Scope v3 已完整實作。schema 升版至 v6（新增 `Article` model，依 schema 專門流程走完清單確認→migration→spec 同步）；`/scenarios/[slug]` 14 個情境頁、`/guides`＋`/guides/[slug]` 攻略文章前台、`/admin/articles` 後台 CRUD、sitemap／llms.txt／首頁入口／撰寫準則文件皆已完成。自動驗證（`prisma validate`／`tsc`／`eslint`／`next build`／瀏覽器唯讀驗證）全數通過，包含防 XSS 驗證（Markdown 中的 `<script>` 標籤確認未被執行）。**後台文章新增／編輯／發布／下架流程需使用者親自登入驗收**（AI 無管理員憑證，不代為輸入密碼），見人工測試腳本 `docs/implementation/manual-test-scripts/T20-攻略文章與自動情境頁測試腳本-v1-2026-07-30.md`。Summary：`docs/implementation/summaries/T20-GUIDE_ARTICLES_SUMMARY-v1-2026-07-30.md`。已 `git add`＋local commit（`9e75c95`），未 push。
- Non-scope／風險（詳見任務卡）：情境頁與攻略文章若涵蓋同一情境，需注意 Google 關鍵字互搶風險；情境標籤對照表 v1 先寫死在程式碼、不開後台管理；部分情境標籤目前資料量很少（如訂閱服務目前僅 1 筆優惠），頁面內容單薄的問題待實作時定案。
- 相依：建議排在 T18（上線）之後（非強制）；Markdown 渲染套件選型（`react-markdown`＋`remark-gfm`）已確認並安裝。
- **2026-07-30（同輪對話延伸）首頁 ad-hoc UX 修正（非既有任務卡，對話中即時核准）**：
  1. **優惠卡片徽章**：使用者發現右上角「進行中／已過期」徽章恆真（已過期優惠早被 `getPublicOffers()` 過濾，前台看到的永遠是進行中），改為 `Offer.badgeLabel` 自由文字欄位（schema 升版至 **v7**，`schema-checklist-2026-07-30-badge.md`），行銷可自行填「最新優惠」之類文字，留空不顯示徽章；`OfferCard`／`AdminOfferForm`／`admin-actions.ts` 已同步。既有 16 筆優惠此欄位皆為空，前台徽章暫時全部不顯示，待後台個別補填。
  2. **首頁區塊重排＋圖示**：順序改為「熱門情境 → 熱門優惠分類 → 信用卡優惠（原「選你手上的信用卡」已更名）→ 精選優惠 → 最新優惠」；新增 `src/components/EntryIcon.tsx`（手刻 inline SVG，未新增圖示套件相依），情境標籤與分類卡片皆換成風格一致的圖示（本輪僅測試風格一致性，非最終視覺定案）。
  - 自動驗證：`prisma validate`／`tsc --noEmit`／`eslint`／`next build` 全過；瀏覽器實測確認新順序、圖示正確渲染、徽章留空不顯示。

### T24 信用卡申辦導引連結 — 草案待核准，**v1 方向已拍板**

- 任務卡：`docs/implementation/tasks/T24-APPLY_LINKS_信用卡申辦導引連結.md`
- 背景：目前平台無「立即申辦」導引連結。
- **已拍板**：v1 只做「純導引到官網申辦頁」＋UTM 參數（供未來 GA 追蹤點擊成效），不含聯盟行銷／推薦碼。聯盟行銷列為未來獨立決策，屆時會牽動部署平台選擇（Vercel Hobby 禁止商業用途，Railway/Render 無此限制，兩者皆已與使用者討論過）。

### GA 網站流量分析（未建卡）

- 使用者 2026-07-27 決定排在 T18 上線後另開一個小任務處理，不佔用 T18 Scope。

## AI 引用性（AI search）現況評估（2026-07-26 新增）

用 T16 真實匯入的資料做過一次檢視，結論：

- 優勢：每筆優惠都有來源網址＋查證日期，情境標籤（繳稅／學費／水電瓦斯／保費／加油／外送／超市量販／旅遊訂房／訂閱服務，共 9 項）已有真實資料覆蓋。2026-07-30 規格書再新增 5 項（電影／高鐵台鐵／eTag／停車／道路救援，核心情境標籤共 14 項，見規格書 v6），這 5 項目前**尚無實際優惠資料掛標籤**，屬規格先行、資料待補。
- **2026-07-29 新增（本輪對話最早的一項）**：優惠詳情頁原本有一個「優惠摘要」側欄，重複顯示分類與標籤純文字，未接到任何結構化資料、對 SEO／AI 引用零效果，使用者確認後移除；標籤改寫入 `Article` JSON-LD 的 `keywords` 欄位（`src/lib/domain-seo.ts` 的 `generateArticleJsonLd` 新增選填參數），讓標籤真正變成 AI／Google 讀結構化資料時能抓到的內容，而不是只給人看的純文字。已用瀏覽器讀出實際輸出的 JSON-LD 核對過 `keywords` 值正確。Commit `f0f6ecc`，已 push。
- 缺口：`faqJson` 目前 0/16 筆優惠有填，優惠詳情頁只輸出基本 `Article` JSON-LD，沒有 `FAQPage`；多層回饋（如幣倍卡、CUBE 卡）條件仍是整段散文，AI 不易抽取結構——這正是 T21 要解決的問題，真實資料已印證缺口存在。
- FAQ 缺口對應 T20（攻略文章功能）方向，尚未有任何動作。
- **2026-07-30 新增**：使用者提出「數位訂閱優惠」該如何分類的問題時，發現 CUBE 卡「玩數位」方案（3.3% 小樹點回饋）雖已在資料庫裡，但標籤清單漏了對應的情境標籤（只有餐飲／旅遊訂房／外送／超市量販，對應「樂饗購」「趣旅行」方案，沒有「玩數位」）。已拍板將「訂閱服務」升級為第 9 個正式核心情境標籤（與繳稅／學費等 8 個同等地位），並回補 CUBE 卡這筆優惠（`cube-tiered-category-rewards-2026`）的標籤：DB 與來源試算表 `信用卡優惠資料整理模板-v2-2026-07-18.xlsx`（offers 工作表第 4 列）皆已補上「訂閱服務」，兩處改動前皆已備份。規格書已升版 `DATA_COLLECTION_SPEC...v5-2026-07-30.md`（v4 已加註取代說明，後續同日又升到 v6），4.3 節新增第 9 項標籤定義，並新增一條規則：切換方案類優惠（如玩數位／樂饗購／趣旅行）每種方案的情境標籤都要各自標註，不要因主分類只能選一個就漏掉。前台 JSON-LD `keywords` 已驗證正確吐出新標籤。

## T15 工作範圍

- 建立 AI 治理入口、協作流程、目前狀態、模板、Roadmap、active index、SOP、驗證政策及治理驗證器。
- 最小幅度更新 `AGENTS.md`、`.gitignore` 與 T01–T14 歷史任務索引的接續入口。
- 建立 T15 文件審閱清單與 Summary 草稿。

## T15 Non-scope

- 不修改產品功能、UI、API、Prisma schema 或資料。
- 不修改既有首頁信用卡入口工作。
- 不執行 `git add`、commit、push 或部署。
- 不替既有測試自行核准安全分類。

## 既有未提交變更（長期存在，非本輪產生，未經處理）

下列項目從 T15／首頁工作階段就存在，多輪 session 都刻意沒有動它們（不在各自任務 Scope 內），**新 session 不得未經使用者同意就 commit 或覆寫**：

- T15 治理文件批次：`.gitignore`、`AGENTS.md`、`docs/implementation/00-master-task-index.md`（修改）；`AI_WORKFLOW_AI協作流程.md`、`HANDOFF_TEMPLATE_新對話交接模板.md`、`ROADMAP_產品路線圖.md`、`TASK_TEMPLATE_任務模板.md`、`docs/sop/`、`docs/superpowers/`、`scripts/verify-ai-governance.mjs`、`docs/implementation/handoffs/`、`outputs/dev-server/`、T15 相關 manual-test-scripts／summaries／tasks（新增，未追蹤）。
- 首頁信用卡入口舊工作：`src/app/page.tsx`（修改）、`scripts/verify-homepage-card-entry.mjs`、`docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`、`docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`（未追蹤）。2026-07-08 使用者已拍板這批要 commit，但截至本次更新**仍未執行**。
- T16 前置的 DAWHO 文字改寫：`prisma/seed.mjs`（修改，2026-07-08 的內容，與本輪 T16 匯入無關）。
- 待核准任務卡草稿：`docs/implementation/tasks/T15-*.md`、`T16-*.md`、`T17-*.md`、`T18-*.md`（未追蹤，各自狀態見 `01-ACTIVE_TASK_INDEX_目前任務索引.md`）；`T20-GUIDE_ARTICLES_攻略文章功能.md` 已於 2026-07-30 commit `3fd8e4d` 追蹤並 push，不再屬於本段落的未追蹤草稿。

## 環境狀態

- 本機產品執行狀態：本輪對話多次啟動過本機 dev server（`http://localhost:3000`，用 `.claude/launch.json` 設定 `npm run dev`），對話結束時已停止或閒置；新 session 需要時自行用 preview 工具重開。
- 本機管理員帳號：本輪對話中密碼已被重設過一次（純資料庫層，未動 `.env`），新密碼只告知了使用者本人，未寫入任何檔案；新 session 若要用後台，請使用者提供或再協助重設。
- Preview：未知
- Production：未知
- 正式站是否為最新 commit：未知

未知表示本輪沒有可靠證據，不代表失敗或未部署。

## Worktree 寫入鎖

- lock：`.ai-worktree-lock.json`
- 2026-07-26 對話中，使用者已明確確認 Codex 上一把鎖（`sessionId: codex-core-scenarios-data-collection-2026-07-26`，`status: ready_for_handoff`）可視為交接完成；Claude Code 已接手，目前鎖為 `sessionId: claude-t16-t19-closeout-2026-07-26`，涵蓋範圍僅限 T16 收尾文件與 T19 狀態欄位標記，本輪工作完成後將釋放。
- 新 session 必須以 lock 檔實際是否存在為準，不可只依本段文字；若要自己寫入，先確認這把鎖是否還有效（例如問使用者），不可自行刪除或接管。

## 最近相關文件

- 正式設計：`docs/superpowers/specs/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理架構設計.md`
- 實作計畫：`docs/superpowers/plans/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理實作計畫.md`
- T15 Summary：`docs/implementation/summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md`
- T15 審閱清單：`docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`
- 上一個產品工作摘要：`docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`

## 阻塞與待決問題

- T15 自動驗證與人工審閱都已通過，沒有阻塞。
- 現有 lint、build 與 smoke commands 尚未分類，維持 `unclassified`。
- 首頁信用卡入口是否接受、commit、push 或部署不屬於 T15。
- ~~T21 僅剩待決問題 (d) 未拍板：排在 T18 之前還是之後執行~~ **已拍板（2026-07-18）並已依此順序實際執行完成**：T16 → T17 → T21 → T18；T21 已於 2026-07-27 核准並完成，此項不再待決（2026-07-30 使用者確認並補記，此前文件殘留未同步更新）。

## T21 規劃進度（2026-07-18 更新）

- 使用者取得 `CONDITION_SCHEMA.md` v0.1 草案（Promotion／RewardTier／Channel 結構化條件系統，以永豐幣倍卡為第一個測試案例），經規劃層級檢視後建立 T21 任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`。
- 核准狀態：**待核准**——本卡目前只是規劃文件，不構成任何實作授權；不得修改 Prisma schema、不建立 migration、不修改任何程式碼。
- 已拍板決策：
  - (a) 採方案 B，重構現有 `Offer` model（不新增獨立 `Promotion` model）。
  - (b) `capPeriod`／`PaymentMethod` 永遠用 String，不做 Prisma enum（開發與正式環境策略相同）。
  - (c) 巢狀邏輯暫不永久定案，維持限一層；訂觀察門檻——累積 3 張卡以上需要兩層以上巢狀才重新評估。
  - 規格書 v3（多層回饋寫法慣例）：現在不改，維持 v2 原樣。
- **待決問題 (d) 已拍板（2026-07-18）並已生效**：T21 排序為 T16 → T17 → T21 → T18（晚於 T16/T17、早於 T18）；T21 已於 2026-07-27 依此順序核准並完成實作，此問題不再待決（2026-07-30 使用者確認並補記，修正此段此前未同步更新的殘留文字）。
- 與 T16–T18 上線主線的關係：T21 目前完全不影響 T16–T18，兩者互不阻塞（T21 Non-scope 明確排除修改 schema／程式碼／既有規格書）。

## 下一步（2026-07-30 更新，取代前一版本）

**T15/T16/T17/T19/T21/T23 皆已完成。** 以下依優先順序：

1. ~~本地 3 個 commit（`f512fdb`～`322049b`）尚未 push~~ **已確認 push 完成（2026-07-29 新 session 核對），此項不再是待辦。**
2. T18（部署上線）：**Scope v1 已核准（2026-07-30）**，Vercel/Neon 帳號已就緒，排進實作；schema 現為 v6（新增 Article model），PostgreSQL 遷移屆時一併處理；schema 型別調整／migration 執行／Neon 正式資料載入／Production promote 等個別高風險步驟仍逐一於執行前確認。實際建立 Neon 資料庫、Vercel 專案、環境變數需使用者於各自主控台操作，AI 無法代為建立帳號或專案。
3. T24（申辦導引連結）v1 方向已拍板（純導引＋UTM），待正式核准 Scope 開工。
4. T22（排程輔助資料更新）已起草待核准，依賴 T18／T21，5 個待決問題未拍板。
5. Codex 若有後續資料蒐集批次，先確認 `.ai-worktree-lock.json` 再接手；**指派任務時需明確指定使用 `DATA_COLLECTION_SPEC...v6-2026-07-30.md` 與 `信用卡優惠資料整理模板-v3-2026-07-29.xlsx`**（v6 規格書核心情境標籤共 14 項；v3 模板含卡面配色欄位；這個切換不會自動發生）；重跑 `npm run data:import`（增量模式）不會清空既有資料。
6. `esun-unicard-wallet-new-card-2026q3` 的「最低消費」欄位為欄位歸類問題（非事實錯誤），已隨 T21 遷移進 RewardTier.minSpend，待資料整理時再校正語意。
7. **T20（攻略文章功能與自動情境頁）Scope v3 已核准，套件與 Git 授權皆已確認（2026-07-30）**：新增自動情境頁（`/scenarios/[slug]`）與人工攻略文章並行，取代先前排除自動聚合頁的決定，核心情境標籤擴充為 14 項，詳見上方 T20 段落；可開始實作，建議排 T18 上線後（非強制）。
8. GA 網站流量分析：使用者已決定排 T18 上線後另開小任務，不佔用 T18 Scope。
9. T23 現況：**14 張卡已全數補上官網真實配色**（2026-07-29 完成最後 3 張）；多卡面選項（玉山Unicard、中信LINE Pay卡）已拍板採「官網第一張卡片/色版」為代表色原則，非阻塞項目。
10. 優惠詳情頁移除了重複顯示分類/標籤的「優惠摘要」側欄，標籤改寫入 Article JSON-LD 的 `keywords` 欄位（2026-07-29，commit `f0f6ecc`，已 push），詳見下方「AI 引用性」段落。
11. 搜尋頁 `/search` 的「熱門搜尋」快速入口已補上「訂閱服務」（2026-07-30，`src/app/search/page.tsx`，commit `3fd8e4d`，已 push），與 CUBE 卡「玩數位」標籤回補一起處理。

使用者已於 2026-07-08 拍板：清除 seed 測試資料（已完成）、部署平台 Vercel Hobby + Neon Free、後台帳號由使用者本人持有。首頁未提交變更與 T15 治理文件批次已於 2026-07-27 全部 commit 並 push（不再是待處理項）。

## 最新資料整理進度（2026-07-08 更新）

- 已將永豐 DAWHO 兩筆優惠資料寫入 `docs/data-collection/信用卡優惠資料整理模板-v1-2026-07-08.xlsx`：
  - `dawho-general-cashback-2026h2` → `cashback`
  - `dawho-easycard-autoload-cashback-2026h2` → `transport`
- 已同步更新 `prisma/seed.mjs` 中既有 DAWHO 兩筆 offer 的正式文字與分類 slug 對應。
- 使用者已核准 T16 v1：「允許備份並寫入本機 SQLite 開發資料庫；不授權 git add、commit、push 或部署」。
- 已備份 `prisma/dev.db` 至 `prisma/backups/dev-before-t16-dawho-20260708-225216.db`。
- 已將兩筆 DAWHO offer 寫入本機 SQLite 開發資料庫，並確認新 slug、分類、卡片對應、官方來源與公開狀態。
- 未執行 `db:seed`，未啟動 dev server，未 git add、commit、push 或部署。
- 接續摘要：`docs/implementation/summaries/T16-DAWHO_DATA_ROWS_PREP_SUMMARY_DAWHO資料列整理-v1-2026-07-08.md`
- 使用者反映 DAWHO 內容出現未解釋術語（大戶Plus／大戶／指定任務），已依官方來源（永豐卡片頁與 dawho.tw 分級制度 FAQ，2026H2 版）改寫兩筆 offer 的詳細說明：等級門檻（大戶＝月平均財富 30 萬、大戶Plus＝100 萬＋任務）、指定任務內容、官方分級連結。三處同步：`prisma/seed.mjs`、資料模板 xlsx、本機 dev.db（更新前另備份於 `prisma/backups/`）。兩個優惠頁面已驗證顯示新內容。
- 規格書新增第 6 節第 8 條「術語白話原則」與 FAQ Q8（以 DAWHO 為實例），防止整理人員再交出未解釋術語。

## 本機瀏覽狀態（2026-07-08 更新）

- 已啟動本機 Next dev server：`http://localhost:3001`
- 已開啟供人工檢視：
  - 前台首頁：`http://localhost:3001/`
  - 現金回饋分類：`http://localhost:3001/categories/cashback`
  - 交通通勤分類：`http://localhost:3001/categories/transport`
  - DAWHO 一般消費優惠：`http://localhost:3001/offers/dawho-general-cashback-2026h2`
  - 後台入口：`http://localhost:3001/admin`
- HTTP 檢查結果：首頁、兩個分類頁、DAWHO 詳情頁皆 200；後台入口 307 轉登入頁，屬預期行為。
- 先前嘗試啟動的 `3000` dev server 已停止，只保留 `3001`。
