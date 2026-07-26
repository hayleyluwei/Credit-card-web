# SOP 索引

最後更新：2026-07-04（Asia/Taipei）  
用途：集中列出本專案可重複使用的固定流程與排查指南

## 使用原則

- SOP 不會自行授權高風險操作；仍須依 `AGENTS.md`、`AI_WORKFLOW_AI協作流程.md` 與已核准任務卡判斷。
- 專門修改流程高於一般排查指南。
- SOP 使用穩定檔名持續更新，文件內記錄日期；測試證據與 Summary 另用版本或日期保存。
- 發現 SOP 與正式規格、schema 或使用者最新指令衝突時，停止相關動作並回報。

## AI 與開發治理

- `AUTOMATED_VERIFICATION_自動驗證安全分級.md`
  - 類型：正式操作約束
  - 用途：驗證分類、白名單、fingerprint、worktree lock 與未知指令處理

- `AI_VERIFICATION_POLICY_自動驗證政策.json`
  - 類型：機器可讀正式政策
  - 用途：記錄已核准驗證指令；空白或未分類不代表 AI 可以自行判斷

- `LOCAL_VERIFICATION_本機驗證與快取排查.md`
  - 類型：排查指南與安全約束
  - 用途：Windows dev server、port、`.next`、build 及快取問題

- `PRODUCTION_DEPLOYMENT_正式環境部署檢查.md`
  - 類型：高風險檢查流程
  - 用途：部署授權、commit、deployment、domain 及正式 smoke test

- `CHINESE_ENCODING_中文編碼與亂碼處理.md`
  - 類型：文件品質約束
  - 用途：UTF-8、PowerShell 輸出與亂碼檢查

## 產品規格專門流程

- `../../規格書文件修正原則.md`
- `../../規格書修改流程.md`

修改 Word、PDF、產品規格內容或示意圖前必讀，先列清單並取得確認。

## Schema 專門流程

- `../../engineering-data-model-spec/schema修正原則.md`
- `../../engineering-data-model-spec/schema修改流程.md`

修改 Prisma schema、schema 規格或版本備份前必讀；不得跳過同步與核准流程。

## 驗收與歷史

- `../acceptance/credit-card-mvp-development-acceptance-rules-v1-2026-06-15.md`
- `../implementation/00-master-task-index.md`
- `../implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`
- `../implementation/manual-test-scripts/`
- `../implementation/summaries/`
