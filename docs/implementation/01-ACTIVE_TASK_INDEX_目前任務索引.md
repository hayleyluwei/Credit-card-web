# 目前階段任務索引

最後更新：2026-08-05（Asia/Taipei）  
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
| T22 | 排程輔助資料更新（瘦身版：抓取＋比對＋Telegram 通知；完整版列為未來階段） | **v2 草案，待核准**（2026-08-05 由完整版縮減為瘦身版）；(a)–(g) 七題皆已拍板，其中 (e)(f)(g) 歸屬未來完整版 | 規劃中（待核准） | 不適用 | T18（資料庫上雲）、T21（結構化後比對較可靠）；皆已完成 | `tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md` | 無 |
| T23 | 卡面圖像視覺風格規則（著作權/商標風險預防） | v1 已核准，完整實作並上線於本機環境；14 張卡全數已有官網真實配色 | 完成（後台顏色欄位「儲存＋前台反映」完整迴圈待補測） | 不適用（本機環境） | 無 | `tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md` | 無 |
| T24 | 信用卡申辦導引連結（含是否串聯盟行銷的待決） | v1 草案，待核准；待決問題：純導引 vs 聯盟行銷分潤（牽動 T18 部署平台選擇） | 規劃中（待核准） | 不適用 | 無（若做聯盟行銷則牽動部署平台決策） | `tasks/T24-APPLY_LINKS_信用卡申辦導引連結.md` | 無 |
| T25 | 優惠網址穩定性與過期轉址（SEO 資產保護） | v1 草案，待核准；待決問題 (a)–(e) 未拍板 | 規劃中（待核准） | 不適用 | 無（設計上與 T21、T22 有介面銜接） | `tasks/T25-OFFER_URL_STABILITY_優惠網址穩定性與過期轉址.md` | 無 |
| T26 | GA 網站流量分析 | v1 草案，待核准；待決問題 (a)–(e) 未拍板 | 規劃中（待核准） | 不適用 | T18（已完成，前提依賴）；與 T24 有介面銜接（UTM 參數） | `tasks/T26-GA_ANALYTICS_GA網站流量分析.md` | 無 |
| T27 | 首頁本月情境選讀模組 | v2 草案，待核准；(a)–(h) 中 **(e) 已因風格契約交付而解決**，其餘未拍板 | 規劃中（待核准） | 不適用 | T20（可連結既有情境／文章）；**T28（風格契約已交付，負責版位與視覺預留）**；schema 專門流程與正式資料庫安全決策 | `tasks/T27-HOMEPAGE_EDITORIAL_SPOTLIGHT_首頁本月情境選讀模組.md` | 無 |
| T28 | 卡片生活誌設計系統套用（公開頁面視覺改版） | v1 草案，待核准；6 個待決問題未拍板 | 規劃中（待核准） | 不適用 | 使用者已交付風格契約 `docs/design-system/card-life-pop-style/`（v1，鎖定）；與 T27 分工（T28 做版位視覺、T27 做資料功能） | `tasks/T28-DESIGN_SYSTEM_ROLLOUT_卡片生活誌設計系統套用.md` | 無 |

第一版上線總計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`（T16–T18 的整體規劃、角色分工與待決事項）。

## 歷史入口

- MVP T01–T14：`00-master-task-index.md`
- 任務摘要：`summaries/`
- 人工測試與文件審閱：`manual-test-scripts/`
