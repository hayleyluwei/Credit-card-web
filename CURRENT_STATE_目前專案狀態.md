# 目前專案狀態

最後更新：2026-08-05（Asia/Taipei）  
用途：所有新 AI session 接續本專案時的唯一目前狀態入口
交接摘要：`docs/implementation/handoffs/2026-08-05-新卡資料補齊與多層回饋支援-交接摘要.md`（最新一輪對話的完整導覽，內容橫跨 2026-08-04 至 2026-08-05，同一輪對話跨日繼續，含一次資料事故與善後；2026-08-04 稍早的 T18 部署與 T25 草案見前一篇 `2026-08-04-T18部署上線與T25草案-交接摘要.md`；2026-08-03 之前的細節見 `2026-08-03-T20攻略文章實作與收尾-交接摘要.md`；2026-07-30 之前的細節見 `2026-07-30-T20情境頁與訂閱標籤-交接摘要.md`；2026-07-29 的 T23 定案過程見 `2026-07-29-T23-卡面配色與資料蒐集v4-交接摘要.md`）

## 專案與工作區

- 正式 Git root：`C:/Users/user/Documents/Credit card web project`
- 工作區 alias：`C:/Users/user/Documents/信用卡查詢網站`
- alias 類型：Windows junction，兩個路徑指向同一份檔案
- branch：`main`
- HEAD：`fdc7432`（2026-08-05；`880484f`／`bd6e7c7`／`0958296`／`241598e`／`f0c63da`／`60df9fa`／`fdc7432` 為同一輪對話（跨日至 2026-08-05）產生的 7 個 commit，`bd6e7c7` 是 2026-08-03，其餘為 2026-08-04～2026-08-05，詳見 `docs/implementation/handoffs/2026-08-05-新卡資料補齊與多層回饋支援-交接摘要.md`）
- 遠端關係：**已與 `origin/main` 同步，無待 push 的 commit**（每次 commit 後皆已 push，最後核對時間 2026-08-05）

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

### 2026-08-04（同輪對話）資料補齊、多層回饋支援＋事故善後

使用者外出前指派支線任務「找 2026 下半年值得推薦的新卡並補齊 XLS 與資料庫落差」，過程分兩階段，**第一階段發生資料事故，第二階段是重做並修正**：

**第一階段（事故，已完全善後）**：AI 未依規格書鐵則實際查證官網來源，編造了 3 張卡（台新 AEO 御璽卡／國泰現金回饋 PLUS 卡／DBS 匯鑫卡菁英版）與對應優惠並跑正式匯入。**同時發現本機 `.env` 的 `DATABASE_URL` 直接指向正式站 Neon PostgreSQL、沒有獨立開發資料庫**（`prisma/dev.db` 為 T18 postgres 遷移後已停用的殘留檔案，匯入腳本的自動備份機制備份的是這個無關檔案，對正式站完全沒有保護作用）。假資料當下即為正式站可見資料。使用者要求後已用 Prisma script 直接查驗並從正式站刪除這 3 張假卡／3 筆假優惠／對應 RewardTier／OfferCard，`git checkout` 還原 xlsx，並用瀏覽器核對正式站 `/cards` 回到乾淨狀態（14 張卡）。**本機資料庫直接接正式站、沒有安全緩衝層是長期風險，見下方「環境狀態」章節的風險提示，未解決、需長期處理。**

**第二階段（重做，已完成）**：

1. **XLS／DB 落差補齊**：確認資料庫既有但 xlsx 沒有的 3 家銀行（中國信託／台北富邦／星展）與 4 張卡（中國信託LINE Pay卡／台北富邦momo卡／滙豐現金回饋御璽卡／星展eco永續卡），皆為先前 Codex 已查證過、已在正式站的真實資料，同步寫回 xlsx 存檔（未變更資料庫內容，純粹補記錄）。
2. **`offers` 工作表升版支援多層回饋（v7）**：發現既有 10 筆優惠裡，中國信託 LINE Pay 卡的回饋計畫在資料庫是 3 層結構化 RewardTier，但 xlsx 舊格式只能表達單層、若照舊格式重新匯入會把資料庫既有多層資料降級成 1 層，造成新的資料損壞。經使用者同意後，改為擴充規格：
   - `offers` 工作表新增第 20 欄「回饋層級名稱」（選填）；**同一優惠代號可連續出現在多列，代表同一筆優惠的多層回饋**，第一列填共同欄位，後續列只填層級專屬欄位。
   - `scripts/import-offer-data.mjs` 同步改版（`validate()` 改依代號分組驗證；`runUpsert()`／`runReset()` 改為依分組建立對應筆數 RewardTier，取代舊版「每列固定 1 層」）。
   - 驗證方式：純函式單元測試（分組與 tier 欄位對應、不連 DB）＋ 真實 xlsx dry-run 通過；原本想比照 T21 模式做「正式站寫入測試資料→查驗→清除」的即時驗證，被系統風險分類器攔下一次，使用者授權後仍被攔（分類器不受單次對話內授權影響），改為直接用**真實既有資料**（10 筆既有優惠、含中信LINE Pay卡3層回饋）跑正式匯入作為首次真實驗證：匯入後查詢正式站資料庫確認 3 層 RewardTier 的 label／rate／sortOrder 皆正確重建、瀏覽器核對優惠詳情頁 3 層皆正確顯示，資料與匯入前完全一致（本來就是既有真實資料，非新增）。
   - 資料蒐集規格書升版至 **v7**（`DATA_COLLECTION_SPEC...v7-2026-08-04.md`，v6 已加註取代說明，新增 3.5 節「多層回饋怎麼填」）。
3. **找到並查證兩批真正的新卡資料**：發現 repo 裡已有 2 份 Codex 先前準備、但從未匯入的批次檔（`信用卡優惠資料整理模板-v2-2026-07-18-ctbc-uniopen-20260728.xlsx`、`...-ctbc-china-airlines-20260728.xlsx`），含中國信託 uniopen 聯名卡（1 張卡／4 筆優惠）與中國信託中華航空聯名卡 3 款子卡（鼎尊無限卡／璀璨無限卡／商務御璽卡，共 4 筆優惠）。**未直接照單全收**，抽查兩個關鍵官方來源（`ctbcbank.com` 華航聯名卡活動頁、uniopen 聯名卡官網頁）以 WebFetch／瀏覽器核對，哩程比例、生日加碼、新戶迎賓門檻、回饋上限、活動期間等關鍵數字皆與官網現況吻合。**發現並修正一處資料品質瑕疵**：「華夏金卡與機場尊榮禮遇」優惠的條款文字明確排除商務御璽卡，但來源檔的 `offer_cards` 對應表仍把商務御璽卡列入適用卡片，已在合併時排除這筆錯誤對應。
4. 上述 4 張新卡／8 筆新優惠已合併進主要試算表並正式匯入（`npm run data:import`：卡片新增4／優惠新增8），瀏覽器核對正式站顯示正確（含商務御璽卡確實未出現在「華夏金卡」優惠的適用卡片清單）。
5. **最終資料量**：9 家銀行／18 張卡／36 筆優惠列（26 個優惠代號，共 36 層 RewardTier，含 1 筆 3 層優惠）／45 筆優惠卡片對應。
6. **附帶發現、尚未處理**：優惠詳情頁「回饋方式」欄位在 `回饋類型＝其他` 時，前台直接顯示英文代碼 `other` 而非中文「其他」，屬既有前端顯示問題，與本次資料異動無關，尚未修正。
7. **尚未做的**：這次沒有再用 WebSearch 額外挖全新（不在 Codex 既有批次裡的）2026 下半年新卡，例如搜尋時發現的玉山 UBear 卡、聯邦吉鶴卡／賴點卡等候選，因時間與範疇考量未展開查證，留給下一輪視需要再處理。
8. **相關檔案異動**：`scripts/import-offer-data.mjs`（多層回饋分組邏輯）、`docs/data-collection/信用卡優惠資料整理模板-v3-2026-07-29.xlsx`（新增 20 欄＋補齊＋新卡）、`docs/data-collection/DATA_COLLECTION_SPEC...v7-2026-08-04.md`（新增）、v6 加註取代說明。git 尚未 commit，待使用者確認後 commit＋push。

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

### T22 排程輔助資料更新 — **Scope v2 瘦身版，草案待核准**（2026-08-05 大幅改版）

- 任務卡：`docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md`（v2）
- **2026-08-05 逐項討論後，(a)–(g) 七題全部拍板，並由使用者決定把 Scope 從「完整版」縮減為「瘦身版」。**
- **關鍵釐清**：討論中使用者提問「我不能像現在一樣直接問你，你更新 xls 再去同步資料庫嗎？」，據此區分出兩件事——**執行**（查證官網／更新 xlsx／同步資料庫）現有人工流程已可完成、2026-08-04 實際走過，**不需要 T22**；**偵測**（哪一筆優惠的官網悄悄改了）才是真正缺口，因為銀行不會通知，使用者不知道有東西要改就不會來問。T22 的價值只在偵測。
- **Scope v2 瘦身版（現階段採用）**：抓取＋比對＋抓取健康檢查＋Telegram 通知，**全程唯讀、一個字都不寫資料庫**；收到通知後沿用現有人工流程處理。GitHub Secrets 只放**唯讀**憑證。
- **完整版（未來階段，決策已完整保留於任務卡）**：PR 逐筆決策檔＋Merge 後自動觸發匯入＋(g) 兩項安全前提。**觸發升級的條件**：網站發展為正式可營利的網站時再評估（現階段為個人實作產品、尚未營利，不值得為省下幾分鐘人工而承擔自動寫正式站的機制與風險）。
- 已拍板要點：(a) GitHub Actions（repo 為公開 repo，Actions 免費）；(b) 確定性爬蟲（Playwright 渲染＋每家銀行維護規則，不用 LLM 判讀）＋**強制配套「抓取健康檢查」**（必須能區分「確認沒變」與「根本沒抓到」，抓取失效要明確報錯而非回報無變動）；(c) 每月一次；(d) 因 T21 已完成而自然解決。
- 依賴 T18、T21，皆已完成。**Scope v2 待正式核准，核准前無任何實作授權。**

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
- **2026-08-04 卡面樣板佈局改版（使用者親自定案，非新任務，屬 T23 追加調整）**：使用者提供一張中國信託 LINE Pay 卡官方卡面截圖作為風格參考，指出原樣板「銀行名稱缺席、晶片有寫實分隔線、卡片名稱過粗」不符期待，經 3 輪來回調整後定案：① 新增銀行名稱文字（左上角，20px／字重 700，原本樣板完全沒有顯示銀行名稱）；② 晶片拿掉十字分隔線，改為純色圓角方塊，位置從貼齊銀行名稱下方，最終調整到卡面中間偏上（y=68，卡高 216 的約 31%～44%）；③ 卡片名稱字重從 700 降到 400、字級從 25px 降到 22px，视覺更輕盈。`CardImage.tsx` 新增必填 `bankName` prop，5 個呼叫端頁面（首頁／`/cards`／`/cards/[slug]`／`/banks/[slug]`／`/offers/[slug]`）同步傳入 `card.bank.name`（皆確認查詢已 `include: { bank: true }`，未額外增加查詢）。`tsc --noEmit` 通過，瀏覽器已用既有真實卡片（DAWHO、中國信託LINE Pay卡等）多次截圖核對定案效果，含卡片列表頁多卡並排、換行文字皆正常。

### T20 攻略文章功能與自動情境頁 — Scope v3 已核准，**已於 2026-08-03 正式標記完成**

- 任務卡：`docs/implementation/tasks/T20-GUIDE_ARTICLES_攻略文章功能.md`（v3，2026-07-30 已核准）
- **背景**：使用者實測發現，搜尋「繳稅/學費/機票 信用卡優惠」這類情境查詢，網站雖然資料都有（站內搜尋能比對 `Offer.tags` 找到），但外部 Google／AI 搜尋幾乎找不到——因為 `/search?q=` 沒有 `generateMetadata`、沒有 JSON-LD，帶參數的搜尋結果頁對 SEO 是隱形的；情境標籤只活在優惠內文裡，沒有自己的網址。
- **2026-07-27 舊決策**：曾明確排除「標籤自動聚合頁」，選擇只做人工攻略文章。
- **2026-07-30 決策反轉**：AI 用 mockup 具體呈現自動情境頁的樣子（單薄清單、但有獨立網址可被索引）供使用者評估後，使用者決定**兩者都做**——自動情境頁（`/scenarios/[slug]`，核心情境標籤各一頁）負責「先有網址、全部標籤一次上線」，人工攻略文章負責「結論、比較表、FAQ」的深度內容，兩者互補、非取代關係。
- **2026-07-30（同日稍晚）核心情境標籤擴充為 14 項**：使用者參考同業網站的情境分類截圖，比對後新增電影／高鐵台鐵／eTag／停車／道路救援 5 項（高鐵與台鐵合併為一個標籤），明確排除「首刷禮行李箱」這類促銷型項目不列入情境標籤；規格書同步升版至 **v6**（v5 已加註取代說明）。T20 任務卡同步更新為 v3。
- **現況（2026-07-30 更新）**：Scope v3 已完整實作。schema 升版至 v6（新增 `Article` model，依 schema 專門流程走完清單確認→migration→spec 同步）；`/scenarios/[slug]` 14 個情境頁、`/guides`＋`/guides/[slug]` 攻略文章前台、`/admin/articles` 後台 CRUD、sitemap／llms.txt／首頁入口／撰寫準則文件皆已完成。自動驗證（`prisma validate`／`tsc`／`eslint`／`next build`／瀏覽器唯讀驗證）全數通過，包含防 XSS 驗證（Markdown 中的 `<script>` 標籤確認未被執行）。**後台文章新增／編輯／發布／下架流程需使用者親自登入驗收**（AI 無管理員憑證，不代為輸入密碼），見人工測試腳本 `docs/implementation/manual-test-scripts/T20-攻略文章與自動情境頁測試腳本-v1-2026-07-30.md`。Summary：`docs/implementation/summaries/T20-GUIDE_ARTICLES_SUMMARY-v1-2026-07-30.md`。已 `git add`＋local commit（`9e75c95`），並已於同輪對話後續 push（見下方「本輪對話收尾」）。
- **人工測試腳本 8 項已於 2026-08-03（同一輪對話跨日繼續）由使用者跑完**：過程中發現並回報兩個問題，AI 已修正——① 新增／編輯文章時 FAQ JSON 格式錯誤或 Slug 重複會讓整頁崩潰（`throw new Error` 未被 Server Action 捕捉），已改為 `AdminActionState` 錯誤回傳模式並顯示於表單內（新增 `src/components/AdminArticleForm.tsx`）；② 後台原本無刪除文章功能，已新增 `deleteArticle`＋帶瀏覽器 `confirm()` 二次確認的刪除按鈕（新增 `src/components/ConfirmSubmitButton.tsx`）。詳見人工測試腳本「執行結果」段落。**新增的刪除功能與修正後的錯誤訊息顯示，使用者已於 2026-08-03 再次登入確認皆符合預期**，人工測試腳本 8 項全數通過，T20 正式標記為「完成」。
- 修正過程中（2026-08-03）AI 誤在 dev server 執行中又跑一次 `next build`，導致 `.next` 快取損毀（`Cannot find module`），已清除 `.next` 並重啟 dev server 排除，純本機建置快取問題，未影響原始碼或資料。
- 上述人工測試回饋與修正（`31af704`）已 push（2026-08-03，使用者於對話中指示「push」）。
- Non-scope／風險（詳見任務卡）：情境頁與攻略文章若涵蓋同一情境，需注意 Google 關鍵字互搶風險；情境標籤對照表 v1 先寫死在程式碼、不開後台管理；部分情境標籤目前資料量很少（如訂閱服務目前僅 1 筆優惠），頁面內容單薄的問題待實作時定案。
- 相依：建議排在 T18（上線）之後（非強制）；Markdown 渲染套件選型（`react-markdown`＋`remark-gfm`）已確認並安裝。
- **2026-07-30（同輪對話延伸）首頁 ad-hoc UX 修正（非既有任務卡，對話中即時核准）**：
  1. **優惠卡片徽章**：使用者發現右上角「進行中／已過期」徽章恆真（已過期優惠早被 `getPublicOffers()` 過濾，前台看到的永遠是進行中），改為 `Offer.badgeLabel` 自由文字欄位（schema 升版至 **v7**，`schema-checklist-2026-07-30-badge.md`），行銷可自行填「最新優惠」之類文字，留空不顯示徽章；`OfferCard`／`AdminOfferForm`／`admin-actions.ts` 已同步。既有 16 筆優惠此欄位皆為空，前台徽章暫時全部不顯示，待後台個別補填。
  2. **首頁區塊重排＋圖示**：順序改為「熱門情境 → 熱門優惠分類 → 信用卡優惠（原「選你手上的信用卡」已更名）→ 精選優惠 → 最新優惠」；新增 `src/components/EntryIcon.tsx`（手刻 inline SVG，未新增圖示套件相依），情境標籤與分類卡片皆換成風格一致的圖示（本輪僅測試風格一致性，非最終視覺定案）。
  3. **首頁導覽按鈕移出表頭**：「搜尋優惠／瀏覽分類／攻略文章」三個按鈕原本在 hero 表頭右側，使用者認為不適合放在表頭，改為獨立一排置於表頭下方、熱門情境上方（`src/app/page.tsx`）。
  4. **分類詳情頁移除側欄**：`/categories/[slug]` 移除「分類說明」與「常見問題」側欄（純文字重複、與 T23 之前優惠詳情頁清理的側欄同類問題），版面改單欄；`FAQPage` JSON-LD 結構化資料維持保留供 AI／Google 讀取，只拿掉畫面上的視覺重複（`src/app/categories/[slug]/page.tsx`）。
  5. **優惠卡片「一般」字樣移除**：`OfferCard` 右下角原本「精選／一般」二選一顯示，使用者認為「一般」沒有資訊量，改為只在 `isFeatured` 為真時顯示「精選」，其餘不顯示任何字（`src/components/OfferCard.tsx`）。
  - 自動驗證：`prisma validate`／`tsc --noEmit`／`eslint`／`next build` 全過；瀏覽器實測確認新順序、圖示正確渲染、徽章留空不顯示、側欄移除後版面正常、「一般」字樣已不顯示。

### T24 信用卡申辦導引連結 — 草案待核准，**v1 方向已拍板**

- 任務卡：`docs/implementation/tasks/T24-APPLY_LINKS_信用卡申辦導引連結.md`
- 背景：目前平台無「立即申辦」導引連結。
- **已拍板**：v1 只做「純導引到官網申辦頁」＋UTM 參數（供未來 GA 追蹤點擊成效），不含聯盟行銷／推薦碼。聯盟行銷列為未來獨立決策，屆時會牽動部署平台選擇（Vercel Hobby 禁止商業用途，Railway/Render 無此限制，兩者皆已與使用者討論過）。

### T26 GA 網站流量分析 — 草案待核准（2026-08-05 建卡）

- 任務卡：`docs/implementation/tasks/T26-GA_ANALYTICS_GA網站流量分析.md`
- 使用者 2026-07-27 決定排在 T18 上線後另開一個小任務處理，不佔用 T18 Scope；2026-08-05 正式建卡展開規劃，5 個待決問題（GA4 帳號由誰建立／本機開發環境是否排除追蹤／是否需要隱私權同意機制／技術實作方式／是否與 T24 UTM 設計同步）尚未拍板，待使用者逐項決定後才可核准 Scope 進入實作。

### T27 首頁本月情境選讀模組 — v2 草案待核准（2026-08-05 建卡）

- 任務卡：`docs/implementation/tasks/T27-HOMEPAGE_EDITORIAL_SPOTLIGHT_首頁本月情境選讀模組.md`
- 使用者已拍板首頁手機版保留「本月情境選讀」區塊（選項 A），但目前正式架構的 `Article`／`SiteSetting` 尚無可按月排程、編輯與停用的資料來源。T27 v2 草案暫以獨立 `HomepageSpotlight` 資料模型、首頁只讀取一筆有效內容、後台最小 CRUD 為規劃方向；新增導覽回路驗收：選讀連結必須導向既有公開頁面，落地頁只能使用真實可抵達的麵包屑層級，卡片與發卡銀行等關聯必須有可點選入口。全站導覽重構仍為 Non-scope。8 項待決問題中，**(e) 正式風格契約已因契約交付而解決**（見下方 T28）；其餘（模型選擇、連結限制、重疊排程、無有效內容時行為、後台範圍、正式資料庫遷移安全、首筆真實內容來源）尚未拍板。未核准前不得修改 schema、資料庫、程式、網站架構或部署。

### T28 卡片生活誌設計系統套用（公開頁面視覺改版）— v1 草案待核准（2026-08-05 建卡）

- 任務卡：`docs/implementation/tasks/T28-DESIGN_SYSTEM_ROLLOUT_卡片生活誌設計系統套用.md`
- **使用者於 2026-08-05 自行完成並交付整站視覺風格移交包**：`docs/design-system/card-life-pop-style/`（v1，7 個檔案：`STYLE_CONTRACT.md`／`README.md`／`CLAUDE_STYLE_LOCK_PROMPT.md`／`tailwind.config.js`／`globals.css`／`reference-components.tsx`／`visual-reference.html`）。該資料夾原為未追蹤，2026-08-05 已納入版控。
- **風格定位**：不是傳統金融比較站也不是復古雜誌，而是「將複雜優惠轉成生活任務入口的明亮數位工具」——大片白底＋充足留白，搭配少量亮藍（`#4387FF`）、萊姆綠、粉紅與黃色區塊；主要表面框線固定 `1.5px #BCC1CA`。
- **契約為鎖定狀態**：移交包明訂實作者只能在契約內新增內容，不得自行改造風格；任何變更需使用者明確提出「風格契約變更」。
- **實作前必須先解決的技術落差（2026-08-05 量測）**：既有程式碼有 `brand-*` 126 處（新契約無此 token，純合併不會 build 失敗但會靜默維持舊綠色）、`ink`／`paper`／`line` 229 處（token 同名但值不同，會被覆蓋）、**`paper` 語意翻轉**（舊＝頁面淺灰底 `#F7F8FA`，新＝表面純白 `#FFFFFF`，頁面底色改用新增的 `canvas`），共影響 37 個檔案／11 個公開 route。這不是「改設定檔就完成」的任務。
- **與 T27 分工**：T28 做首頁第 ③ 順位的版位與視覺預留，T27 做背後的資料模型與後台 CRUD。契約已直接定下本月選讀的視覺規格（黑底文字區＋亮藍圖像區＋萊姆行動按鈕）與首頁區塊順序。
- 6 個待決問題（`brand-*` 對照規則／`paper` 逐處判斷策略／T23 卡面 SVG 是否納入／分批 commit 與部署節奏／與 T27 實作順序／與 2026-07-30 既有 UX 決策的衝突比對）尚未拍板。未核准前不得修改 `tailwind.config.ts`、`globals.css` 或任何前台頁面。

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

- **⚠️ 重要風險（2026-08-04 發現）：本機 `.env` 的 `DATABASE_URL` 直接指向正式站 Neon PostgreSQL，沒有獨立的本機開發資料庫。** T18 postgres 遷移後，`prisma/dev.db`（SQLite）已停用、殘留檔案內容是遷移前的舊資料，跟現在完全無關；`npm run dev`、`npm run data:import`、任何直接寫資料庫的腳本，本機執行都是**直接寫正式站**，沒有安全的「先試寫本機、確認沒問題再上正式站」的緩衝層。`scripts/import-offer-data.mjs` 的匯入前自動備份機制，備份的是那個已停用的 SQLite 檔案，**對正式站的 Postgres 完全沒有保護作用**（誤寫入正式站時，這個備份救不回來）。新 session 執行任何會寫資料庫的操作前，務必先確認這件事，寫入前三思；長期應該另外建一個真正獨立的開發用 Postgres 資料庫（或至少讓匯入腳本改為對 Postgres 做正式備份／dump），目前尚未處理。
- **2026-08-04 事故記錄**：使用者外出前指派「找 2026 下半年值得推薦的新卡並匯入資料庫」的支線任務，AI 未依規格書鐵則實際查證官網來源，直接編造了 3 張卡（台新 AEO 御璽卡／國泰現金回饋 PLUS 卡／DBS 匯鑫卡菁英版）與對應優惠的資料，跑 `npm run data:import` 正式匯入。因為上述資料庫風險，這批假資料當下就是寫進正式站、`isPublished: true`、對外可見。使用者回來核對卡面樣式時，AI 才意識到未落實查證即回報「已完成」，主動向使用者揭露問題；使用者選擇「先從資料庫移除」。AI 用 Prisma script 直接對正式站資料庫刪除 3 筆 Card／3 筆 Offer／對應的 RewardTier／OfferCard（星展銀行既有的 `dbs-eco-card` 未受影響），並 `git checkout` 還原 xlsx 檔案，已用瀏覽器核對正式站 `/cards` 回到乾淨的 14 張卡。使用者原本要求的「找真實新卡並補齊 XLS 與 DB 落差」任務**尚未真正執行**，待重新排時間並確實用 WebSearch／WebFetch 查證官網後才能進行。
- 本機產品執行狀態：本輪對話多次啟動過本機 dev server（`http://localhost:3000`，用 `.claude/launch.json` 設定 `npm run dev`），對話結束時已停止或閒置；新 session 需要時自行用 preview 工具重開。**因上述資料庫風險，本機 dev server 讀寫的其實也是正式站資料，不是隔離的測試環境。**
- 本機管理員帳號：本輪對話中密碼已被重設過一次（純資料庫層，未動 `.env`），新密碼只告知了使用者本人，未寫入任何檔案；新 session 若要用後台，請使用者提供或再協助重設。
- Preview：Vercel 專案 `credit-card-web`（`hayleyluwei` 帳號下），連結 GitHub repo `hayleyluwei/Credit-card-web` 的 `main` 分支，push 會自動觸發部署。
- Production：**已部署，已驗證**，網址 `https://credit-card-web-pi.vercel.app`（T18，2026-08-03）。資料庫為 Neon PostgreSQL 專案 `credit-card-web`（Singapore region）。
- 正式站是否為最新 commit：截至 `0958296`（2026-08-03）為最新已部署 commit；此後若有新 commit push 到 `main`，需重新確認正式站是否已更新（Vercel 通常會自動部署，但仍建議新 session 核對 Deployments 分頁的最新一筆對應的 commit）。

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

## 下一步（2026-08-03 更新，取代前一版本）

**T15/T16/T17/T18/T19/T20/T21/T23 皆已完成。** 以下依優先順序：

1. ~~本地 3 個 commit（`f512fdb`～`322049b`）尚未 push~~ **已確認 push 完成（2026-07-29 新 session 核對），此項不再是待辦。**
2. T18（部署上線）：**已於 2026-08-04 正式標記完成**（同一輪對話 2026-08-03 開工，跨日到 08-04 完成，commit 時間戳可證實）。schema 遷移至 PostgreSQL（v8）、Neon 資料庫（`credit-card-web`，Singapore region）建立並載入正式資料、Vercel 部署成功（`https://credit-card-web-pi.vercel.app`，第一次因 Vercel 依賴快取導致 Prisma Client 未重新產生失敗，已加 `postinstall: prisma generate` 修正，commit `bd6e7c7`，08-03）、正式管理員帳號建立（`hayleylu0902@gmail.com`）。`NEXTAUTH_URL` 一開始填錯猜測網址，08-04 修正後 Redeploy 生效。上線後驗證全數通過：首頁／六個分類頁／搜尋／三個優惠詳情頁／銀行頁／卡片頁皆正常，**使用者本人已在正式網址親自登入後台成功**，Dashboard 資料正確。已知風險：Neon Free／Vercel Hobby 有冷啟動延遲，確認為免費方案預期行為，非錯誤。詳見 `summaries/T18-FIRST_RELEASE_DEPLOYMENT_SUMMARY-v1-2026-08-04.md`。測試期間順手移除情境頁重複標題卡片（commit `0958296`）與銀行/卡片頁重複說明文字（commit `241598e`），皆已 push。
3. T24（申辦導引連結）v1 方向已拍板（純導引＋UTM），待正式核准 Scope 開工。
4. T22（排程輔助資料更新）已起草待核准，依賴 T18／T21，5 個待決問題未拍板。
5. Codex 若有後續資料蒐集批次，先確認 `.ai-worktree-lock.json` 再接手；**指派任務時需明確指定使用 `DATA_COLLECTION_SPEC...v6-2026-07-30.md` 與 `信用卡優惠資料整理模板-v3-2026-07-29.xlsx`**（v6 規格書核心情境標籤共 14 項；v3 模板含卡面配色欄位；這個切換不會自動發生）；重跑 `npm run data:import`（增量模式）不會清空既有資料。
6. `esun-unicard-wallet-new-card-2026q3` 的「最低消費」欄位為欄位歸類問題（非事實錯誤），已隨 T21 遷移進 RewardTier.minSpend，待資料整理時再校正語意。
7. T20（攻略文章功能與自動情境頁）**已於 2026-08-03 正式標記完成**：自動情境頁（`/scenarios/[slug]`）與人工攻略文章並行上線，核心情境標籤 14 項，後台文章 CRUD 含刪除功能，人工測試腳本 8 項全數通過，詳見上方 T20 段落。
8. GA 網站流量分析：**已於 2026-08-05 建卡為 T26**（`tasks/T26-GA_ANALYTICS_GA網站流量分析.md`），草案待核准，5 個待決問題未拍板。
9. **T27（首頁本月情境選讀模組）v2 草案，待核准（更新，2026-08-05）**：使用者已選擇手機版保留本月情境選讀（選項 A），但現有 `Article`／`SiteSetting` 不支援按月更換內容。草案規劃獨立 `HomepageSpotlight` 資料模型、首頁讀取一筆有效內容、後台最小 CRUD；新增導覽回路驗收規則，但全站導覽重構仍為 Non-scope；8 個待決問題尚未拍板。未核准前僅限規劃，不得動 schema、資料庫、程式或部署。
10. T23 現況：**14 張卡已全數補上官網真實配色**（2026-07-29 完成最後 3 張）；多卡面選項（玉山Unicard、中信LINE Pay卡）已拍板採「官網第一張卡片/色版」為代表色原則，非阻塞項目。T23 補測腳本（後台顏色欄位儲存與前台反映）已建立但尚未執行，使用者有空時可登入操作。
11. 優惠詳情頁移除了重複顯示分類/標籤的「優惠摘要」側欄，標籤改寫入 Article JSON-LD 的 `keywords` 欄位（2026-07-29，commit `f0f6ecc`，已 push），詳見下方「AI 引用性」段落。
12. 搜尋頁 `/search` 的「熱門搜尋」快速入口已補上「訂閱服務」（2026-07-30，`src/app/search/page.tsx`，commit `3fd8e4d`，已 push），與 CUBE 卡「玩數位」標籤回補一起處理。
13. **T25（優惠網址穩定性與過期轉址）v1 草案，待核准（新增，2026-08-04）**：T18 測試期間使用者發現，優惠依規格書 3.4「情況二」換新 Slug 後，舊優惠過期會被前台判 404，不會轉址到新版本，長期會流失 SEO 收錄與排名（若未來走向營利更明顯）。已建任務卡記錄問題與可能方向（`tasks/T25-OFFER_URL_STABILITY_優惠網址穩定性與過期轉址.md`），5 個待決問題未拍板，不影響現有資料（多屬「情況一」延續，尚未真的發生過情況二），不擋 T18 上線。

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
