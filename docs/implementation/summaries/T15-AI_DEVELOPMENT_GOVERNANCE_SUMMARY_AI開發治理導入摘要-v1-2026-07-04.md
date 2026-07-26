# T15 AI 開發治理導入摘要

版本：v1  
日期：2026-07-04  
狀態：完成

## 完成內容

- 將 `AGENTS.md` 重整為所有 AI 共用的短入口。
- 建立三層權限、Scope 核准、驗證白名單、write lock、任務／部署雙狀態及新 session 流程。
- 建立固定檔名的目前狀態、任務模板、交接模板與 Roadmap。
- 凍結 T01–T14 為歷史索引，建立 T15 起的 active index 與任務卡資料夾。
- 建立 SOP 索引、正式部署、本機驗證、自動驗證及中文編碼 SOP。
- 建立機器可讀驗證政策，預設 `unclassified`，未自行核准任何既有測試。
- 建立唯讀治理驗證器與 T15 文件審閱清單。

## 主要檔案

### 修改

- `AGENTS.md`
- `.gitignore`
- `docs/implementation/00-master-task-index.md`

### 建立

- `AI_WORKFLOW_AI協作流程.md`
- `CURRENT_STATE_目前專案狀態.md`
- `TASK_TEMPLATE_任務模板.md`
- `HANDOFF_TEMPLATE_新對話交接模板.md`
- `ROADMAP_產品路線圖.md`
- `docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`
- `docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md`
- `docs/sop/README_SOP索引.md`
- `docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md`
- `docs/sop/LOCAL_VERIFICATION_本機驗證與快取排查.md`
- `docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md`
- `docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json`
- `docs/sop/CHINESE_ENCODING_中文編碼與亂碼處理.md`
- `scripts/verify-ai-governance.mjs`
- `docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`

## Route／API／Model／資料變更

- Route：無。
- API：無。
- Prisma schema／model：無。
- migration：無。
- 資料庫讀寫：無。
- 產品 UI：無。

## 既有工作保護

T15 沒有修改下列首頁信用卡入口既有變更：

- `package.json`
- `src/app/page.tsx`
- `scripts/verify-homepage-card-entry.mjs`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`
- `docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`

## 自動驗證

- TDD 紅燈 1：治理文件不存在時，`node scripts/verify-ai-governance.mjs` exit code 1，正確列出缺檔。
- TDD 紅燈 2：編碼 SOP 直接包含 Unicode replacement character 時，驗證器正確失敗；改用 `U+FFFD` 名稱後通過。
- TDD 紅燈 3：T15 審閱清單與 Summary 尚未建立時，驗證器正確失敗。
- 最終 `node scripts/verify-ai-governance.mjs`：通過，exit code 0。
- 最終 `git diff --check`：通過，exit code 0。
- 機密值模式檢查：沒有命中 `DATABASE_URL=`、`NEXTAUTH_SECRET=`、`ADMIN_PASSWORD=` 或 Bearer Token 型態。

初始驗證 policy 的 `commands` 是空陣列，本任務沒有替任何既有測試建立核准分類。

## 人工審閱

- `docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`
- 驗收結果：通過
- 驗收日期：2026-07-05（Asia/Taipei）
- 驗收依據：使用者明確指示「把狀態更新為『完成』」。

本任務是純治理／文件任務，不需要啟動網站或執行產品手動測試。

## Git 與部署

- 未執行 `git add`。
- 未 commit。
- 未 push。
- 未部署 Preview 或 Production。
- Production 目前狀態未在 T15 查證，維持 `未知`。

## 後續工作

- 現有 smoke scripts 尚未分類；若要啟用自動執行，需另開任務並由使用者核准 policy。

## 下一個任務需要知道

- 新 session 先讀 `AGENTS.md`、`AI_WORKFLOW_AI協作流程.md` 與 `CURRENT_STATE_目前專案狀態.md`。
- policy 目前沒有核准指令，任何測試預設 `unclassified`。
- 首頁信用卡入口既有變更仍在工作區，與 T15 分離。
- T15 已完成人工審閱；後續治理變更必須依新流程建立任務與核准證據。

## 開放問題

- 是否另開任務分類現有 lint、build 與 smoke commands。
