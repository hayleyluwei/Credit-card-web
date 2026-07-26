# T15 AI 開發治理導入

建立日期：2026-07-04（Asia/Taipei）  
任務卡版本：v1  
問題類型：架構設計／開發流程／文件治理

## 背景

信用卡網站已有產品規格、schema 流程、任務索引、驗收規則、測試腳本與 summaries，但規則散落，缺少所有 AI 共用的目前狀態、權限分級、Scope 核准、session 交接、Roadmap 與防止多 AI 同時寫入的機制。

正式設計：`docs/superpowers/specs/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理架構設計.md`

實作計畫：`docs/superpowers/plans/2026-07-04-AI_DEVELOPMENT_GOVERNANCE_AI開發治理實作計畫.md`

## 已確認決策

- 所有 AI 共用同一套治理文件。
- `AGENTS.md` 是短入口，詳細流程放在 `AI_WORKFLOW_AI協作流程.md`。
- `CURRENT_STATE_目前專案狀態.md` 使用穩定檔名持續更新。
- Scope 核准後可在範圍內連續實作；高風險操作仍須確認。
- 驗證使用核准白名單，未知測試不可由 AI 自行認證。
- 同一 worktree 的寫入型工作必須取得 `.ai-worktree-lock.json`。
- 任務狀態與部署狀態分開。

## 目標

建立可供新 AI session 直接接續、可降低低價值決策、能保護既有工作區與資料的治理文件本體及唯讀驗證器。

## Scope v1

- 重整 `AGENTS.md`。
- 建立 `AI_WORKFLOW`、`CURRENT_STATE`、任務模板、交接模板及 Roadmap。
- 建立目前階段任務索引與 T15 任務卡。
- 建立 SOP 索引、四份 SOP 及機器可讀驗證政策。
- 建立治理文件唯讀驗證器。
- 最小幅度更新 `.gitignore` 與 T01–T14 歷史任務索引入口。
- 建立 T15 文件審閱清單及 Summary 草稿。

## Non-scope

- 不修改產品功能、UI、API、資料流、Prisma schema、migration 或資料。
- 不修改產品規格內容或既有 schema 文件。
- 不重寫 T01–T14 歷史與既有 summaries。
- 不修改首頁信用卡入口既有未提交內容。
- 不替既有測試核准安全分類。
- 不安裝套件。
- 不執行 `git add`、commit、push 或部署。

## 安全限制

- 實作前使用原子 lock，範圍限制為本任務治理檔案。
- 所有新增文件使用繁體中文與 UTF-8。
- 不讀取或輸出 `.env` 的實際秘密值。
- 自動檢查只能讀取檔案，不得修改資料庫、`.next` 或正式狀態。
- 發現與首頁既有變更重疊時立即停止相關修改。

## 影響範圍

- 專案根目錄治理入口與模板。
- `docs/implementation/` 的後續任務入口。
- `docs/sop/`。
- `scripts/verify-ai-governance.mjs`。
- `.gitignore` 的 AI lock 排除項目。

不影響任何產品 route、API、model、資料或部署設定。

## 驗證方式

- `node scripts/verify-ai-governance.mjs` 通過。
- `git diff --check` 通過。
- JSON policy 可解析，預設分類為 `unclassified`，初始不核准任何既有測試。
- Git 差異只包含 T15 列出的治理檔案，首頁既有變更未被改寫。
- 使用者依 T15 文件審閱清單人工驗收。

## 資料保護與回復方式

- 不執行任何資料庫命令。
- 不刪除既有檔案。
- 若治理內容不接受，可只撤回 T15 新增文件及三個明確入口修改；不得使用會丟棄其他未提交內容的 Git 指令。

## Git 授權

- 允許：status、diff、log、rev-parse、diff check。
- 不允許：branch 變更、add、commit、push、reset、checkout 丟棄變更、force 操作。

## 風險

- 目前工作區已有首頁未提交內容，需以檔案範圍隔離。
- 新流程若重複舊規則會產生分歧，因此 `AGENTS.md` 只保留摘要與入口。
- 驗證政策若由 AI 自我核准會失效，因此初始 `commands` 保持空白。

## 核准證據

- 核准者：使用者
- 核准日期：2026-07-04
- 核准 Scope：v1
- 核准原文摘要：使用者要求「建立治理文件本體」，其後選擇「Inline Execution」。
- Git 特別授權：無

## Scope 變更紀錄

- v1／2026-07-04：首次核准，尚無後續擴大或縮減。
