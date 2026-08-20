# 目前階段任務索引

最後更新：2026-08-20（Asia/Taipei，資訊架構收斂完成；規格書出 v9；T29 升 v1.3；T32 完成 Scope A 乾跑模擬；新增 T33 資料庫遷移基準）  
用途：管理 T15 起的目前階段任務；T01–T14 歷史請讀 `00-master-task-index.md`

## 使用規則

1. 新 session 先讀 `AGENTS.md`、`AI_WORKFLOW_AI協作流程.md` 與 `CURRENT_STATE_目前專案狀態.md`。
2. 本索引只保存任務 ID、狀態、依賴與文件連結，不複製任務卡全文。
3. Scope 核准證據以任務卡為準；目前狀態以 `CURRENT_STATE_目前專案狀態.md` 為入口並由實際 Git 狀態校正。
4. T01–T14 不在此重新登錄或改寫。

## 任務狀態

| Task | 名稱 | Scope | 任務狀態 | 部署狀態 | 依賴 | 任務卡 | Summary |
|---|---|---|---|---|---|---|---|
| T15 | AI 開發治理導入 | v1 已核准 | 完成 | 不適用 | 治理設計 v2 | `tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md` | `summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md` |
| T16 | 第一版正式資料匯入 | v1 已核准 | 完成 | 不適用 | 資料試算表交付（已完成兩輪） | `tasks/T16-FIRST_RELEASE_DATA_IMPORT_第一版正式資料匯入.md` | `summaries/T16-FIRST_RELEASE_DATA_IMPORT_SUMMARY-v1-2026-07-26.md` |
| T17 | 上線前完整測試 | v1 已核准 | 完成（2026-07-27 使用者拍板接受；後台登入編輯項由使用者自行補跑） | 不適用 | T16（已完成） | `tasks/T17-PRE_LAUNCH_TESTING_上線前完整測試.md` | `summaries/T17-PRE_LAUNCH_TESTING_SUMMARY-v1-2026-07-27.md` |
| T18 | 第一版部署上線 | v1 已核准（2026-07-30） | **已完成**（2026-08-04；同輪對話 08-03 開工跨日完成）：PostgreSQL 遷移、Neon 資料庫、Vercel 部署、正式管理員帳號皆完成；上線後驗證全數通過（含使用者親自登入後台確認） | **已部署，Production 已驗證**：`https://credit-card-web-pi.vercel.app` | T17、T21（皆完成）、部署平台核准（已拍板） | `tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md` | `summaries/T18-FIRST_RELEASE_DEPLOYMENT_SUMMARY-v1-2026-08-04.md` |
| T19 | 卡片結構化欄位與蒐集規格擴充 | v1 已核准 | 完成 | 不適用 | 排 T16 前（2026-07-18 拍板，已完成） | `tasks/T19-CARD_STRUCTURED_FIELDS_卡片結構化欄位與蒐集規格擴充.md` | `summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md` |
| T20 | 攻略文章功能與自動情境頁（AI 可引用性） | v3 已核准（2026-07-30） | **已完成**（2026-08-03）：人工測試 8 項全數通過，過程中發現的 2 個問題（FAQ/Slug 崩潰、缺刪除功能）已修正並經使用者最後確認 | 未部署 | T18（建議順序，未強制） | `tasks/T20-GUIDE_ARTICLES_攻略文章功能.md` | `summaries/T20-GUIDE_ARTICLES_SUMMARY-v1-2026-07-30.md` |
| T21 | 優惠條件結構化（重構 Offer＋RewardTier／Channel） | v1 已核准（2026-07-27） | 完成（2026-07-27，使用者已登入後台實測 tier 表單） | 不適用 | T16、T17（皆完成）；schema 專門流程 | `tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md` | `summaries/T21-CONDITION_SCHEMA_SUMMARY-v1-2026-07-27.md` |
| T22 | 排程輔助資料更新（瘦身版：抓取＋比對＋Telegram 通知；完整版列為未來階段） | **v2 已核准（2026-08-05）**；(a)–(g) 七題皆已拍板，其中 (e)(f)(g) 歸屬未來完整版 | **完成（端對端驗收通過，2026-08-06）**：三項 GitHub Secrets 設定完成；手動觸發 GitHub Actions（run `31065358168`）成功跑完全部 34 筆，Telegram 通知確認送達；每月 1 日自動執行，轉為長期營運觀察，非阻塞 | 不適用（獨立腳本，不影響前台） | T18、T21 皆已完成 | `tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md` | 無（規模較小，以任務卡「端對端驗收結果」章節代替獨立 Summary） |
| T23 | 卡面圖像視覺風格規則（著作權/商標風險預防） | v1 已核准，完整實作並上線於本機環境；14 張卡全數已有官網真實配色 | 完成（後台顏色欄位「儲存＋前台反映」完整迴圈待補測） | 不適用（本機環境） | 無 | `tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md` | 無 |
| T24 | 信用卡申辦導引連結（含是否串聯盟行銷的待決） | v1 草案，待核准；待決問題：純導引 vs 聯盟行銷分潤（牽動 T18 部署平台選擇） | 規劃中（待核准） | 不適用 | 無（若做聯盟行銷則牽動部署平台決策） | `tasks/T24-APPLY_LINKS_信用卡申辦導引連結.md` | 無 |
| T25 | 優惠網址穩定性與過期轉址（SEO 資產保護） | v1 草案，待核准；待決問題 (a)–(e) 未拍板 | 規劃中（待核准） | 不適用 | 無（設計上與 T21、T22 有介面銜接） | `tasks/T25-OFFER_URL_STABILITY_優惠網址穩定性與過期轉址.md` | 無 |
| T26 | GA 網站流量分析 | **v1 已核准（2026-08-06）**；拍板 Production only、`next/script` 手動載入、不新增套件、暫不做 cookie banner | **已實作並上線**（由 Codex 於 `codex/t26-ga-analytics` 完成，commit `4e7e871`，已在 `main`）：`src/app/layout.tsx` 加入 GA4 gtag.js（僅 `NODE_ENV=production` 且有 Measurement ID 才載入）、`scripts/verify-t26-ga.mjs`、`.env.example` 新增 `NEXT_PUBLIC_GA_MEASUREMENT_ID` | **已部署**：2026-08-06 核對正式站首頁確認 gtag.js 已載入且 Measurement ID 已設定 | T18（已完成）；與 T24 有介面銜接（UTM 參數） | `tasks/T26-GA_ANALYTICS_GA網站流量分析.md` | 無 |
| T27 | 首頁本月情境選讀模組 | v2 草案，待核准；(a)–(h) 中 **(e) 已因風格契約交付而解決**，其餘未拍板 | 規劃中（待核准） | 不適用 | T20（可連結既有情境／文章）；**T28（風格契約已交付，負責版位與視覺預留）**；schema 專門流程與正式資料庫安全決策 | `tasks/T27-HOMEPAGE_EDITORIAL_SPOTLIGHT_首頁本月情境選讀模組.md` | 無 |
| T28 | 卡片生活誌設計系統套用（公開頁面視覺改版） | **v2 已核准（2026-08-06）**；6 個待決問題全數拍板 | **實作完成並已上線**（2026-08-06 實作與首次部署，2026-08-09 定稿）：11 個公開 route 全部套用契約；補上網站原本完全缺少的全站表頭（含手機漢堡選單）與頁尾；修正 3 處麵包屑／區塊順序的結構性問題；上線後再修正手機橫向捲動裁切框線並依使用者指定改寫首頁 hero 文案。**人工逐頁驗收待使用者本人執行** | **已部署**：最新為 `7637dcb`（2026-08-09）；首次部署 `4e7e871..911eed8`（2026-08-06）。皆為快轉合併，Vercel 自動部署完成，12 個 URL 全數 200 並通過關鍵功能核對 | 風格契約 `docs/design-system/card-life-pop-style/`（v1，鎖定）；與 T27 分工（T28 做版位視覺、T27 做資料功能） | `tasks/T28-DESIGN_SYSTEM_ROLLOUT_卡片生活誌設計系統套用.md` | `summaries/T28-DESIGN_SYSTEM_ROLLOUT_SUMMARY-v1-2026-08-06.md` |
| T29 | 情境／攻略／優惠三方串接 | **v1.3** 草案，待核准；**(b) 已拍板為「自動依標籤撈為主、手動明確指定優先」**，連帶確定會新增 `Article` 選填欄位＝改 schema；**Scope D 的標籤判定規則已於 2026-08-20 依 D15 改為動態規則（有內容才可點），原「核准前須先定 14 個標籤清單」前置條件已解除**；Scope B 優先度上調為核心；其餘待決問題未拍板 | 規劃中（待核准） | 不適用 | T20（文章功能與 slug 對應機制已存在）、T28（情境卡文案與 `SCENARIO_COPY` 已建立）；與 T27 的導向規則需一致 | `tasks/T29-CONTENT_CROSSLINKS_情境攻略優惠三方串接.md` | 無 |
| T30 | 日期時區正確性修正（正式站日期少一天） | **v1 已核准（2026-08-18）**；7 個待決問題中 6 個已解決，僅「何時部署」待授權 | **自動驗證通過，待人工驗收**：新增 `src/lib/domain-date.ts` 作為全站唯一日期基準，修正三個缺陷（顯示早一天／過期提早一天／後台編輯累積往前跳），共改 11 個檔案；Scope E 唯讀盤點確認 105 個日期欄位全數完好、**不需修資料**。**已部署並通過上線後驗證**（正式站四種頁型實測日期正確），使用者本人逐項驗收待執行 | **Production 已部署，Production 已驗證**：commit `d41aed9`（2026-08-18），快轉推送 `3dd19a8..d41aed9`。8/31 的過期誤判風險已排除 | 無（獨立 Bug 修正；與 T25 過期轉址有概念關聯但不互相阻塞） | `tasks/T30-DATE_TIMEZONE_日期時區正確性修正.md` | 無（以任務卡「實作結果」章節代替） |
| T31 | 攻略文章草稿預覽 | v1 草案，待核准；4 個待決問題未拍板 | 規劃中（待核准） | 不適用 | T20（文章功能已存在）；起因為 2026-08-18 建立上稿流程 SOP 時發現的缺口 | `tasks/T31-ARTICLE_PREVIEW_攻略文章草稿預覽.md` | 無 |
| T32 | 資料回歸規格整理（第一批） | **v1.1** 草案，待核准；(a) 已由乾跑模擬解決，其餘 4 題未拍板 | 規劃中（待核准）。A–F 六項**全部寫入正式站資料庫**，屬第三層。**Scope A 已完成唯讀乾跑**：影響 12/35 筆、無優惠消失 | 不適用（資料變更；靜態頁需重新部署才反映） | 規格書 v9-2026-08-20；架構文件 2026-08-20 | `tasks/T32-DATA_ALIGNMENT_資料回歸規格整理.md` | 無 |
| T33 | 資料庫遷移基準與範例表清理 | **v1 已核准（2026-08-20）**；(b)(e) 已拍板（不備份假資料、不改 `db:push`），另新增決策 7「不得把 SQL 當使用者把關點」 | **自動驗證通過（A–F 全部完成）**：dev 與 production **兩個分支皆已套用** migration `20260820230418_drop_playing_with_neon`，表數 13→12、`_prisma_migrations` 1→2 筆、漂移歸零、資料筆數零變動（35／18／9／2／6）、本機與正式站前台皆正常。**E3 由使用者本人執行**（AI 被 auto mode 擋下，已寫成 SOP 常規）。**收尾未完成：`.env` 仍指向 production，須切回 dev** | 不適用（網站零引用該表，外觀與行為不變，**不需部署**） | Neon `dev` 分支（2026-08-20 已建立）；**T24／T25／T27／T29 四張卡的前置，現已解鎖** | `tasks/T33-DB_MIGRATION_BASELINE_資料庫遷移基準與範例表清理.md` | `summaries/T33-DB_MIGRATION_BASELINE_SUMMARY-v1-2026-08-20.md` |

第一版上線總計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`（T16–T18 的整體規劃、角色分工與待決事項）。

## 歷史入口

- MVP T01–T14：`00-master-task-index.md`
- 任務摘要：`summaries/`
- 人工測試與文件審閱：`manual-test-scripts/`
