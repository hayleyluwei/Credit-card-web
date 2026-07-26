# 目前階段任務索引

最後更新：2026-07-26（Asia/Taipei）  
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
| T17 | 上線前完整測試 | v1 待核准 | 未開始 | 不適用 | T16（已完成） | `tasks/T17-PRE_LAUNCH_TESTING_上線前完整測試.md` | 無 |
| T18 | 第一版部署上線 | v1 待核准 | 未開始 | 未部署 | T17、T21、部署平台核准 | `tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md` | 無 |
| T19 | 卡片結構化欄位與蒐集規格擴充 | v1 已核准 | 完成 | 不適用 | 排 T16 前（2026-07-18 拍板，已完成） | `tasks/T19-CARD_STRUCTURED_FIELDS_卡片結構化欄位與蒐集規格擴充.md` | `summaries/T19-CARD_STRUCTURED_FIELDS_SUMMARY_卡片結構化欄位與蒐集規格擴充摘要-v1-2026-07-18.md` |
| T20 | 攻略文章功能（AI 可引用性） | v1 待核准 | 未開始 | 未部署 | T18、套件選型核准 | `tasks/T20-GUIDE_ARTICLES_攻略文章功能.md` | 無 |
| T21 | 優惠條件結構化規劃（Promotion／RewardTier／Channel） | v1 草案，六個分岔路 (a)(b)(c)(d)＋規格書 v3＋T16/T17 排序全部拍板，僅剩整體 Scope 正式核准 | 規劃中（待核准） | 不適用 | 無（獨立建卡；已拍板排序 T16→T17→T21→T18） | `tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md` | 無 |

第一版上線總計畫：`docs/superpowers/plans/2026-07-08-FIRST_RELEASE_第一版上線實作計畫.md`（T16–T18 的整體規劃、角色分工與待決事項）。

## 歷史入口

- MVP T01–T14：`00-master-task-index.md`
- 任務摘要：`summaries/`
- 人工測試與文件審閱：`manual-test-scripts/`
