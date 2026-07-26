# 信用卡網站 AI 專案入口

最後更新：2026-07-04（Asia/Taipei）

## 專案身分

本專案是信用卡優惠查詢網站。開始工作前必須執行 `git rev-parse --show-toplevel`，確認目前目錄指向本專案；目前正式 Git root 為 `C:/Users/user/Documents/Credit card web project`，`C:/Users/user/Documents/信用卡查詢網站` 是同一目錄的 junction alias。

若目錄不是同一個 Git 專案，停止所有寫入並回報。

## 規則優先順序

規則衝突時依序採用：

1. 平台、系統、工具及沙箱安全規則。
2. 使用者最新明確指令。
3. 產品規格或 schema 專門修改流程。
4. 已核准任務卡的明確 Scope 與操作授權。
5. `AI_WORKFLOW_AI協作流程.md` 的預設規則。
6. 未核准任務草稿。
7. 一般專案慣例。

已核准任務卡不得跳過更高層安全規則或專門流程的必要檢查。

## 新對話必讀順序

1. `AGENTS.md`
2. `AI_WORKFLOW_AI協作流程.md`
3. `CURRENT_STATE_目前專案狀態.md`
4. `CURRENT_STATE` 指向的目前任務卡
5. 最近一份相關 Summary
6. 只有任務需要時才讀產品規格、schema、驗收規則或 SOP

讀完後先回報目前 branch、HEAD、工作區變更、任務狀態、部署狀態、Scope 版本、Non-scope 與待決問題。

## 核心協作邊界

- Scope 尚未核准：只能做唯讀檢查、Discovery、分析、規劃，以及更新治理草稿或可驗證的狀態事實。
- Scope 已核准：可在核准範圍內連續修改一般程式碼、文件與測試，完成驗證後一次回報。
- 第一次寫入前必須依 `AI_WORKFLOW_AI協作流程.md` 取得 `.ai-worktree-lock.json`。
- 未列入核准驗證白名單的測試一律視為 `unclassified`，不得由 AI 自我認證為安全。
- 修改 schema、migration、共用資料、權限、正式環境、push、部署、破壞性 Git 操作及核心治理規則，必須先確認。
- `git add`、local commit、建立或切換 branch，只有任務卡明確授權時才可執行。
- 不覆蓋來源不明的未提交變更，不使用 reset 或 checkout 丟棄使用者工作。

完整規則以 `AI_WORKFLOW_AI協作流程.md` 為準。

## 專門流程入口

### 產品規格、Word、PDF 或產品示意圖

先讀：

- `規格書文件修正原則.md`
- `規格書修改流程.md`

先列修改清單並取得確認，只修改清單內容，不覆蓋既有正式版本，Word 與 PDF 必須同版。

### Prisma schema 與資料模型

先讀：

- `engineering-data-model-spec/schema修正原則.md`
- `engineering-data-model-spec/schema修改流程.md`

schema、規格說明及版本備份必須同步；未確認不得修改或建立 migration。

### 一般實作與驗收

正式依據：

- 歷史 MVP 任務：`docs/implementation/00-master-task-index.md`
- 目前任務：`docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`
- 驗收規則：`docs/acceptance/credit-card-mvp-development-acceptance-rules-v1-2026-06-15.md`
- 任務摘要：`docs/implementation/summaries/`
- SOP：`docs/sop/README_SOP索引.md`

使用者可見、後台可見、資料流程或權限變更需要人工測試腳本；純治理或純文件任務使用文件審閱清單。

## 語言、機密與完成標準

- 預設使用繁體中文與台灣用語。
- 不在對話、文件、Summary 或 log 顯示 `.env` 的密碼、Token、金鑰或完整連線字串。
- 優先讀 `.env.example`；只有任務必要時才讀 `.env`，且不得輸出值。
- 必須區分未執行、失敗、通過與無法確認；未驗證不得宣稱完成。
- 任務狀態與部署狀態分開；「完成」不等於「已部署」。
- 每個完成或阻塞任務都要有 Summary，並讓 `CURRENT_STATE_目前專案狀態.md` 指向最新可接續狀態。
