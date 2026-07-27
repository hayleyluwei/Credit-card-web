# T21 優惠條件結構化規劃（Promotion／RewardTier／Channel）

建立日期：2026-07-18（Asia/Taipei）
任務卡版本：v1
核准狀態：已核准（2026-07-27）
任務狀態：實作中（2026-07-27 起）
問題類型：架構設計／功能實作

> **狀態更新（2026-07-27）**：使用者於對話中正式核准 T21 Scope v1、指示「直接動 schema」開始實作。本卡不再是純規劃文件。實作依 `engineering-data-model-spec/schema修正原則.md`／`schema修改流程.md` 專門流程進行；每個高風險步驟（修改 Prisma schema、`db push`／migration、遷移真實資料）執行前仍先向使用者確認具體變更清單。原「規劃文件、不構成實作授權」的限制已由本次核准解除。

## 背景

2026-07-18，使用者取得一份由 Claude（claude.ai 對話）與 Hayley 討論產出的設計草案 `CONDITION_SCHEMA.md`（v0.1，尚未經人工審核）。該草案起點是永豐幣倍卡 2026 下半年活動介紹，被選為第一個建檔測試案例，因為它同時具備多層加碼與各自獨立上限的複雜度：

- 基本回饋：國內 1% / 國外 2%，無上限
- 精選通路加碼：+4%，帳單月上限 800 元，需同時滿足「電子帳單」＋「永豐扣繳」＋「（大戶等級 OR 前月 10 萬平均資產）」
- 新卡友 AP/GP 加碼：+2%，日曆月上限 200 元，限 2026 下半年新申辦
- 新戶禮指定行動支付：一次性上限 500 元，核卡 30 日內，限量 5,200 名

草案提出的核心設計方向：一檔優惠（Promotion）拆成多個回饋層（RewardTier），每層獨立管理率／上限／上限週期／通路／條件；上限存「回饋金額」不存「消費額度」；`capPeriod` 為獨立欄位；條件採「JSON＋人話文字」雙軌（`conditionsText` 前端顯示、`conditions` JSON 前期只建不用）；通路獨立成表並與 RewardTier 多對多；`Promotion` 上保留 `headlineRate`／`headlineSummary` 非正規化欄位與 `lastVerifiedAt`／`notes`。完整型別定義（`TierConditions`、`ConditionItem` discriminated union）見原始草案全文，本卡不重複列出。

同日，Hayley 與本 session 針對這份草案做了一次規劃層級的重新檢視，並對照了 T16–T20 現況與現有 `prisma/schema.prisma`，得出以下關鍵發現：

- 現有 `Offer` model 已有 `rewardType/rewardValue/rewardCap/minSpend/conditions` 等扁平欄位，`conditions`（String）事實上已經是草案要的 `conditionsText`。
- [規格書 v2](../../data-collection/DATA_COLLECTION_SPEC_信用卡優惠資料蒐集與分類規格書-v2-2026-07-18.md) 的 FAQ Q3、Q4 已經在用「把多層回饋拆解清楚寫進一格文字」的權宜方式處理多層回饋——這正是幣倍卡案例的情況，證明落差是真實存在、非假設性的。
- T19（Card 結構化欄位）的 Non-scope 明文排除修改 `Offer` model，T16 的 Non-scope 明文排除修改 schema；本任務因此不能掛在既有任一張已核准任務卡下，須獨立建卡。

相關文件：

- 上層計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`
- 規格書：`docs/data-collection/DATA_COLLECTION_SPEC_信用卡優惠資料蒐集與分類規格書-v2-2026-07-18.md`
- 資料模型：`prisma/schema.prisma`（`Offer`／`OfferCard` model）
- 部署決策：T18 任務卡（`docs/implementation/tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md`）——正式環境為 Vercel + Neon（PostgreSQL），本機開發為 SQLite。

## 已確認決策

- 使用者 2026-07-18 拍板：先以本任務卡記錄 `CONDITION_SCHEMA.md` v0.1 的討論成果與待決問題，**不核准任何實作**，待下一輪拍板後才升版 Scope。
- `CONDITION_SCHEMA.md` 草案本身的設計方向（RewardTier 拆解、JSON＋人話文字雙軌等）僅代表討論結論，尚未成為專案核准的設計決策，仍需逐項確認（見下方風險與待決問題）。
- **使用者 2026-07-18 拍板決定待決問題 (a)：採方案 B，重構現有 `Offer` model，不新增獨立的 `Promotion` model。** 決策依據：討論時比較了兩方案在前後台的實際長相——方案 A（新增獨立 Promotion）會讓後台優惠列表同時出現「Offer（舊）」與「Promotion（新）」兩種標籤、點開後跳出兩種不同編輯畫面，長期要維護兩套邏輯；方案 B（重構）雖然需要一次性資料遷移，但之後後台所有優惠只有一種統一的 tier 編輯畫面（即使是單層優惠也用同一種介面，多一個「新增回饋層」按鈕），前台也只需維護一套渲染邏輯。使用者評估目前資料量小（20+ 筆 seed + 2 筆 DAWHO，皆在開發階段未上線）、一次性遷移成本可控，選擇長期維護成本較低的方案 B。
  - 後續影響：現有 20+ 筆 seed offers 與 2 筆 DAWHO 正式資料需要資料遷移腳本，把既有 `rewardType/rewardValue/rewardCap/minSpend` 轉換成至少一筆 `RewardTier`；`domain-validation.ts` 的發布驗證規則需要重寫；`AdminOfferForm.tsx` 全面改為統一的 tier 動態表單。
  - 待決問題 (b)(c)(d) 與規格書 v3 時程問題**仍未拍板**，見下方風險與待決問題。
- **使用者 2026-07-18 拍板決定待決問題 (b)：`capPeriod`／`PaymentMethod` 永遠用 String，不做 Prisma enum**（不管開發環境或正式 PostgreSQL 環境）。決策依據：跟現有 `rewardType`／`summaryMode` 的既有慣例一致，驗證責任集中在 `domain-validation.ts` 程式碼層；零額外遷移風險，且不受待決問題 (d) 的排程結果影響。
  - 待決問題 (c)(d) 與規格書 v3 時程問題**仍未拍板**。
- **使用者 2026-07-18 拍板決定待決問題 (c)：暫不永久定案，維持現狀（GROUP 限一層），採「觀察後再議」而非「現在放寬」或「現在鎖死」。** 決策依據：目前只有幣倍卡一個真實案例頂到這個限制，樣本太小；且 `conditions`(JSON) 本身「前期只建不用」，短期內不影響前台顯示。比照草案自身的 `OTHER` type 升格慣例（同類需求出現 3 張卡以上才升格為正式 type），訂定回頭檢視門檻：**當累積到 3 張卡（含幣倍卡）以上的優惠條件需要兩層以上巢狀時，才重新評估是否放寬巢狀深度限制**；在門檻達到前，schema 實作沿用「限一層，超過則退回 `conditionsText` 純文字」的處理方式。
  - 待決問題 (d) 與規格書 v3 時程問題**仍未拍板**。
- **使用者 2026-07-18 拍板決定「規格書 v3」問題：現在不改規格書，維持 v2 原樣，不新增多層回饋寫法慣例。** 決策依據：使用者選擇零成本、不延誤 T16 試算表交付時程的方向；代價（之後拆解 RewardTier 時複雜優惠需人工反解析文字）由使用者知情接受。此決定與 (a)(b)(c)(d) 四個架構分岔路是不同軌道的獨立問題，不影響 (d) 的排程決定。
  - 待決問題僅剩 (d)：T21 排在 T18 之前還是之後執行。
- **使用者 2026-07-18 拍板決定待決問題 (d)：T21 排在 T18（部署上線）之前執行。** 決策依據：Promotion/RewardTier/Channel 的 schema 變更可以搭 T18 原本就要做的 SQLite → PostgreSQL 遷移一次做完，不需要在正式環境上再跑一次獨立遷移；代價是第一版上線時程再往後延，使用者知情接受。
  - **使用者 2026-07-18 進一步拍板子問題：T21 排在 T16／T17 之後、T18 之前執行。** 也就是完整順序為 T16 → T17 → T21 → T18。決策依據：使用者要先看過真實優惠資料匯入後的網站實際狀況，再決定 Promotion／RewardTier 的結構化規劃是否需要調整。後果：T21 的資料遷移腳本屆時要處理的是 T16 匯入的**全部真實優惠資料**（筆數未知，非目前僅 20+ 筆 seed／2 筆 DAWHO 測試資料的小範圍），遷移範圍、風險與工作量都會比排在 T16 之前更高，執行前須重新評估遷移腳本的測試涵蓋率與備份方式。
  - 至此 (a)(b)(c)(d)、規格書 v3、與 T16／T17 相對排序，六項分岔路全數拍板完成。完整任務順序：**T19（進行中）→ T16 → T17 → T21 → T18 → T20**。僅剩使用者正式核准 T21 整體 Scope v1 一事，才能進入實作階段。

## 目標

在不影響 T16–T18 上線主線的前提下，把「優惠條件結構化」這個已知需求正式記錄成可追蹤的任務卡，並把還沒拍板的架構分岔路明確列出，供使用者逐項決策後再核准實作 Scope。

## Scope v1（規劃內容；核准實作前不得執行）

若後續拍板通過，預期的實作範圍包含：

- `prisma/schema.prisma`：於 `Offer` model 新增 `RewardTier`、`Channel` model 與對應關聯（`Offer` 一對多 `RewardTier`，`RewardTier` 與 `Channel` 多對多 join table）；**不新增獨立 `Promotion` model**（2026-07-18 已拍板，見已確認決策）。既有 `rewardType/rewardValue/rewardCap/minSpend` 欄位是否移除或保留為過渡期相容欄位，於 Scope 正式核准時一併決定。
- 撰寫資料遷移腳本：把 T16 匯入後的**全部真實優惠資料**（排程已拍板為 T16→T17→T21→T18，屆時 seed 測試資料已被真實資料取代，筆數依實際交付資料而定）的扁平回饋欄位，轉換成至少一筆 `RewardTier`，並驗證遷移前後前台顯示內容一致。因資料量預期大於原本評估的 20+ 筆測試資料，需在 Scope 正式核准時一併規劃遷移腳本的測試涵蓋率與失敗回復方式。
- `capPeriod`、`PaymentMethod` 一律使用 String＋`domain-validation.ts` 程式碼驗證，不使用 Prisma enum，開發與正式環境策略相同（2026-07-18 已拍板，見已確認決策）。
- `TierConditions`／`ConditionItem` 比照專案既有慣例（`faqJson`、T19 新增的 `prosJson`／`consJson`）存成 String（JSON 文字），透過 `domain-parsing.ts`／`domain-validation.ts` 的共用函式手動解析與驗證，不使用 Prisma `Json` 型別。
- 規格書／試算表**維持 v2 不變**（2026-07-18 已拍板，不做 v3 輕量修訂）。因此 `scripts/import-offer-data.mjs`（T16）匯入的 `offers` 資料仍是扁平文字，若要拆解成 RewardTier，需另外處理既有文字的人工／半自動反解析，不會有現成的結構化原始素材可直接對應匯入。
- `seed.mjs`：以永豐幣倍卡為第一筆結構化測試資料。
- 前台：`/offers/[slug]` 是否新增 tier 明細呈現，或維持只顯示 `conditionsText`（人話文字），依待決問題決定，MVP 階段可能不需要任何新 UI。
- 後台：`AdminOfferForm.tsx` 是否需要新增/刪除 RewardTier 的動態表單，屬於本任務範圍內最大的一塊工作量，需與 Scope 核准時一併估算。
- 建立 T21 Summary，更新任務索引與 `CURRENT_STATE_目前專案狀態.md`。

## Non-scope

- **不修改 Prisma schema。**
- **不建立 migration。**
- **不修改任何程式碼**（前台、後台、`domain-parsing.ts`、`domain-validation.ts`、`admin-actions.ts` 等一律不動）。
- **本任務卡本身只是規劃文件**，唯一交付物是這份 Markdown 檔案；不建立 seed 資料、不修改試算表或規格書。
- 不修改既有 `Card`／`Bank`／`Category` model（與 T19、T16 的 Non-scope 一致）。
- 不涉及 T20（攻略文章）範圍；T20 走 tags 機制而非本任務的 conditions 結構，兩者為平行、不互相依賴的軌道。
- 不接觸正式環境、不部署、不執行 `git add`／commit／push。

## 安全限制

- 本任務卡的建立與修改屬於「治理紀錄／任務卡草稿」，依 `AI_WORKFLOW_AI協作流程.md` 第 3 層權限例外，可在唯讀分析後直接寫入文件，但**寫入前仍取得 `.ai-worktree-lock.json`**。
- 一旦後續要核准 Scope 進入實作，須另外走 T18 提及的 `engineering-data-model-spec/schema修正原則.md` 與 `schema修改流程.md` 專門流程。
- 不讀取或輸出 `.env` 秘密值。

## 影響範圍

- 頁面與 route：本卡不涉及；未來核准後預期影響 `/offers/[slug]`、後台 offer 編輯頁。
- API：不涉及；後台維持 server actions 模式。
- 資料模型與資料流：本卡不涉及；未來核准後預期新增 `Promotion`／`RewardTier`／`Channel` 三個 model 與一個 join table，並牽動既有 20+ 筆 seed offers 與 2 筆 DAWHO 正式資料的相容性（依待決問題 (a) 的決定，可能需要資料遷移腳本）。
- 共用元件：不涉及；未來核准後預期新增 tier 相關的後台表單元件。
- 文件與測試：本卡即為交付物；未來核准後需要 T21 Summary、規格書／試算表評估結果、可能的人工測試腳本。
- 外部服務：不涉及。

## 驗證方式與完成定義

- 本卡（規劃文件）完成定義：使用者審閱本卡內容，對「風險與待決問題」逐項給出决定，並明確核准或退回 Scope v1。
- 實作階段的驗證方式待 Scope 正式核准後另行在 Scope 修訂版中訂定。

## 資料保護與回復方式

- 本卡不涉及任何資料庫或檔案內容變更，無回復需求。

## Git 授權

- 允許：status、diff、log 唯讀操作。
- 不允許（核准時可另行授權）：建立或切換 branch、`git add`、local commit。
- 不允許：push、破壞性或重寫歷史操作。

## 風險與待決問題

以下四項為 2026-07-18 規劃檢視中識別、尚未拍板的架構分岔路，任何一項未決定前不應核准 Scope 進入實作：

1. ~~**(a) Promotion 是新增獨立 model，還是重構現有 Offer？**~~ **已於 2026-07-18 拍板：採方案 B，重構現有 Offer（不新增獨立 Promotion model）。** 詳見「已確認決策」。原始分析保留於此供追溯：若是重構，屬於破壞性 schema 變更，現有 20+ 筆 seed offers 與 2 筆 DAWHO 正式資料（T16 前置整理）都要寫資料遷移腳本，`domain-validation.ts` 的發布驗證規則也要重寫；若是新增獨立 model，影響範圍小很多，但需要想清楚 Promotion 與 Offer 兩個實體並存時的語意與維護成本。
2. ~~**(b) `capPeriod`／`PaymentMethod` 在 SQLite 用 String，正式環境是否升級為真正的 Prisma enum？**~~ **已於 2026-07-18 拍板：永遠用 String，不做 enum。** 詳見「已確認決策」。原始分析保留於此供追溯：Prisma 的 SQLite provider 不支援原生 enum，PostgreSQL 支援；若現在用 String 到底不再升級，日後不會有二次遷移；若計畫上線時升級，T18 的 PostgreSQL 遷移步驟需要一併納入這個轉換。
3. ~~**(c) 巢狀邏輯（GROUP，限一層）在第一個測試案例就已頂到上限。**~~ **已於 2026-07-18 拍板：暫不永久定案，維持現狀（限一層），訂觀察門檻（累積 3 張卡以上需要兩層以上巢狀才重新評估）。** 詳見「已確認決策」。原始分析保留於此供追溯：幣倍卡精選通路加碼的條件本身就是 `AND(電子帳單, 永豐扣繳, OR(大戶等級, 前月10萬平均資產))`，已用掉唯一一層巢狀，需要決定這是刻意的簡化上限還是需要放寬。
4. ~~**(d) 排在 T18（部署上線）之前還是之後執行？**~~ **已於 2026-07-18 拍板：排在 T18 之前。** 詳見「已確認決策」。與 T16／T17 的相對順序仍待確認（見已確認決策內的子問題）。原始分析保留於此供追溯：
   - **之前**：Promotion/RewardTier/Channel 的 schema 變更可以搭 T18 原本就要做的 SQLite → PostgreSQL 遷移一次做完，不需要在正式環境上再跑一次獨立遷移；代價是第一版上線時程再往後延。
   - **之後**：上線速度優先；代價是之後要在正式 Neon PostgreSQL 環境上獨立執行第二次 schema 遷移，須重新走 T18 提及的 schema 專門流程，風險與作業量都比搭在 T18 一起做更高。

此外還有兩個次要但值得記錄的觀察，供核准 Scope 時一併考慮：

- ~~現行規格書 v2 的 `offers` 工作表是扁平結構，是否需要 v3 輕量修訂~~ **已於 2026-07-18 拍板：現在不改，維持 v2。** 詳見「已確認決策」。之後如需把既有優惠拆解成 RewardTier，複雜案例需人工反解析 `offers` 工作表的文字內容，此為使用者知情接受的代價。
- `CONDITION_SCHEMA.md` 草案本身只涵蓋 Prisma 層的型別設計，未涉及「資料整理人員如何透過試算表提供這些結構化資料」，這個轉譯層是本任務未來 Scope 需要額外設計的部分，不是草案自帶的既有內容。

## 核准證據

- 核准者：使用者
- 核准日期與時區：2026-07-27（Asia/Taipei）
- 核准 Scope 版本：v1
- 核准原文或可追溯摘要：使用者於 2026-07-27 對話中回覆「進入 T21」並選擇「直接正式核准，開始動 schema」，正式核准 T21 Scope v1 進入實作。六項架構分岔路 (a)(b)(c)(d)＋規格書 v3＋T16/T17 排序先前皆已拍板（見「已確認決策」）。
- Git 特別授權：核准當下未特別授權 `git add`／commit／push；沿用專案預設（需另行確認）。
- 高風險操作特別授權：核准 Scope 即涵蓋 Prisma schema 變更與本機 SQLite `db push`／真實資料遷移，但**每個高風險步驟執行前仍先向使用者確認具體變更清單**（使用者選項明示）；正式 PostgreSQL 遷移屬 T18。
- 待實作時決定的 Scope 內設計問題：既有 `Offer` 扁平欄位（`rewardType`／`rewardValue`／`rewardCap`／`minSpend`）保留為過渡相容欄位或移除，於實作計畫中提出建議並經使用者確認（見風險與待決問題）。

## Scope 變更紀錄

- v1／2026-07-18：建立草稿，記錄 `CONDITION_SCHEMA.md` v0.1 討論成果與待決問題，待核准。
- v1／2026-07-18（決策更新）：使用者拍板待決問題 (a)，採方案 B（重構 Offer，不新增 Promotion）；Scope v1 首項與資料遷移腳本項目依此更新。(b)(c)(d) 與規格書 v3 時程問題仍待拍板，Scope 整體仍為待核准狀態。
- v1／2026-07-18（決策更新）：使用者拍板待決問題 (b)，`capPeriod`／`PaymentMethod` 永遠用 String、不做 enum；Scope v1 對應項目依此更新。(c)(d) 與規格書 v3 時程問題仍待拍板。
- v1／2026-07-18（決策更新）：使用者拍板待決問題 (c)，暫不永久定案，維持限一層並訂觀察門檻（累積 3 張卡以上需要兩層以上巢狀才重新評估）。(d) 與規格書 v3 時程問題仍待拍板。
- v1／2026-07-18（決策更新）：使用者拍板規格書 v3 問題，現在不改、維持 v2；Scope v1 對應項目依此更新。僅剩待決問題 (d) 尚未拍板。
- v1／2026-07-18（決策更新）：使用者拍板待決問題 (d)，排在 T18 之前執行。(a)(b)(c)(d) 與規格書 v3 五項分岔路全數拍板完成。仍待確認：T21 相對 T16／T17 的確切順序（影響資料遷移範圍與風險），以及是否正式核准整體 Scope v1 進入實作。
- v1／2026-07-18（決策更新）：使用者拍板 T21 排序子問題，完整順序為 T16 → T17 → T21 → T18。Scope v1 資料遷移腳本項目依此更新為涵蓋 T16 匯入後的全部真實資料。六項分岔路（(a)(b)(c)(d)、規格書 v3、T16/T17 相對排序）全數拍板完成，僅剩使用者正式核准整體 Scope v1 一事。
