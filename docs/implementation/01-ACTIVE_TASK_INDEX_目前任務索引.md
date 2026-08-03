# 目前階段任務索引

最後更新：2026-08-03（Asia/Taipei）  
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
| T18 | 第一版部署上線 | v1 已核准（2026-07-30） | 待實作 | 未部署 | T17、T21（皆完成）、部署平台核准（已拍板） | `tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md` | 無 |
| T19 | 卡片結構化欄位與蒐集規格擴充 | v1 已核准 | 完成 | 不適用 | 排 T16 前（2026-07-18 拍板，已完成） | `tasks/T19-CARD_STRUCTURED_FIELDS_卡片結構化欄位與蒐集規格擴充.md` | `summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md` |
| T20 | 攻略文章功能與自動情境頁（AI 可引用性） | v3 已核准（2026-07-30） | 人工測試 8 項已跑完（2026-08-03）；過程中發現的 2 個問題已修正，**修正本身尚待使用者最後確認**（見 Summary） | 未部署 | T18（建議順序，未強制） | `tasks/T20-GUIDE_ARTICLES_攻略文章功能.md` | `summaries/T20-GUIDE_ARTICLES_SUMMARY-v1-2026-07-30.md` |
| T21 | 優惠條件結構化（重構 Offer＋RewardTier／Channel） | v1 已核准（2026-07-27） | 完成（2026-07-27，使用者已登入後台實測 tier 表單） | 不適用 | T16、T17（皆完成）；schema 專門流程 | `tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md` | `summaries/T21-CONDITION_SCHEMA_SUMMARY-v1-2026-07-27.md` |
| T22 | 排程輔助資料更新（半自動：抓取＋比對＋人工核准後匯入） | v1 草案，待核准；待決問題 (a)–(e) 未拍板 | 規劃中（待核准） | 不適用 | T18（資料庫上雲）、T21（結構化後比對較可靠） | `tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md` | 無 |
| T23 | 卡面圖像視覺風格規則（著作權/商標風險預防） | v1 已核准，完整實作並上線於本機環境；14 張卡全數已有官網真實配色 | 完成（後台顏色欄位「儲存＋前台反映」完整迴圈待補測） | 不適用（本機環境） | 無 | `tasks/T23-CARD_VISUAL_STYLE_卡面圖像視覺風格規則.md` | 無 |
| T24 | 信用卡申辦導引連結（含是否串聯盟行銷的待決） | v1 草案，待核准；待決問題：純導引 vs 聯盟行銷分潤（牽動 T18 部署平台選擇） | 規劃中（待核准） | 不適用 | 無（若做聯盟行銷則牽動部署平台決策） | `tasks/T24-APPLY_LINKS_信用卡申辦導引連結.md` | 無 |

**其他待辦（尚未建卡，先記錄）**：GA 網站流量分析——使用者 2026-07-27 決定排在 T18 上線後另開一個小任務處理，不佔用 T18 Scope。

第一版上線總計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`（T16–T18 的整體規劃、角色分工與待決事項）。

## 歷史入口

- MVP T01–T14：`00-master-task-index.md`
- 任務摘要：`summaries/`
- 人工測試與文件審閱：`manual-test-scripts/`
