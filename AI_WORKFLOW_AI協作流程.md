# AI 協作流程

最後更新：2026-07-04（Asia/Taipei）  
用途：所有能讀取本專案的 AI 共用之正式工作流程

## 1. 核心目標

讓 AI 在清楚邊界內自動處理低風險工作，把需要使用者判斷的事項集中到真正重要的產品、資料與正式環境節點。流程優先降低重工、上下文混亂與低價值決策，不追求無限制自動化。

## 2. 新 session 啟動

依序執行：

1. `git rev-parse --show-toplevel`，確認專案根目錄。
2. 讀取 `AGENTS.md`、本文件及 `CURRENT_STATE_目前專案狀態.md`。
3. 核對 branch、HEAD、Git status 與 `CURRENT_STATE`；狀態不一致時，以實際 Git 事實為準並回報。
4. 讀取目前任務卡及最近一份相關 Summary。
5. 檢查 `.ai-worktree-lock.json`、來源不明變更及重疊修改範圍。
6. 只在任務需要時讀產品規格、schema、驗收規則或 SOP。
7. 先回報任務類型、Scope 版本、Non-scope、權限層級、工作區風險及待決問題。

若環境路徑與正式 Git root 不同，先判斷是否為同一目錄的 junction／連結；不是同一 repo 就停止寫入。

## 3. 問題分類與 Discovery

先把請求分類為：

- Bug 修正
- UX 改善
- 功能需求
- 產品定位
- 架構設計
- Roadmap 規劃
- 任務交接
- 驗收與部署
- 內容或文件工作

新想法預設先做 Discovery，確認根因屬於 UI、資料、API、同步、部署、內容或真正缺少功能。Discovery 需產出：已知事實、假設、風險、替代方案、推薦方向、Scope 草案與 Non-scope。

小任務可以使用簡短任務卡，但不得省略 Scope、Non-scope、驗證與安全限制。

## 4. 三層操作權限

### 第一層：可以自動執行，完成後回報

- 讀檔、搜尋、盤點專案結構。
- `git status`、`git diff`、branch、HEAD 與 log。
- 型別檢查與 lint，但若工具會產生檔案，改依第二層處理。
- `AI_VERIFICATION_POLICY_自動驗證政策.json` 中分類有效且核准為 `readonly` 的測試。
- 讀取本機驗證輸出。

不得因檔名看似安全就自行認證。未列入白名單、核准欄位不完整、fingerprint 不符或條件無法證明，一律降為 `unclassified`。

### 第二層：可以先做，但必須回報

- 技術分析、根因調查、修改計畫與風險清單。
- 資料流、UI flow、驗證與回復方案。
- Discovery、任務卡草稿、Roadmap 記錄。
- 更新 `CURRENT_STATE` 中可驗證的事實。
- 白名單核准為 `generated-output`，且已確認不干擾共用 dev server 的指令。
- 白名單核准為 `isolated-stateful`，且資料庫隔離、禁止正式連線與清理條件都成立的測試。

第二層不代表可以修改產品程式、正式規格、共用資料或正式環境。

### 第三層：必須先確認

- Prisma schema、其他正式資料模型或 migration。
- `db:seed`、`db:push`、共用資料新增／更新／刪除及批次修改。
- 對共用本機資料庫執行會寫資料的 smoke test。
- 權限模型、登入安全或正式環境設定。
- Preview／Production 部署或正式環境操作。
- push、force push、重寫 Git 歷史、丟棄未提交變更。
- 新套件、外部服務或會改變成本的依賴。
- 刪除、搬移或大量改名檔案，除非已列入核准 Scope。
- `AGENTS.md`、本文件及驗證政策核准資料等核心治理規則。
- 任何超出核准 Scope 的產品、程式或文件變更。

建立／切換 branch、`git add`、local commit 只有已核准任務卡明確授權時才可執行；未授權時屬第三層。

## 5. 驗證白名單

正式檔案：`docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json`

每筆指令至少記錄：

- 完整 `command`
- `classification`
- `entryFiles`
- `writes`
- `databaseTarget`
- dev server 條件
- 是否需要確認
- 核准者、核准時間與核准依據
- 列管檔案 fingerprints

允許分類：

- `readonly`
- `generated-output`
- `isolated-stateful`
- `shared-stateful`
- `unclassified`

新指令預設 `unclassified`。AI 可以提出分類草案與 fingerprint，但修改核准欄位需要使用者確認。package script、入口檔或列管副作用檔案改變時，分類失效。

## 6. Scope 核准

### 尚未核准

只能執行第一層、第二層及治理紀錄例外。不得修改一般程式碼、正式產品／schema 文件、產品行為、共用資料或正式環境。

### 核准證據

只有下列情況算核准：

- 使用者在目前對話明確批准；或
- 任務卡記錄核准者、日期、Scope 版本及可追溯核准摘要。

Roadmap 優先級、模糊語句及相似舊任務都不算核准。新 session 找不到核准版本與證據時，一律視為 `待核准`。

### 已核准

可在指定 Scope 版本內連續修改一般程式碼、文件、測試、任務索引及目前狀態，不必逐檔詢問。完成後集中回報修改、驗證、未完成內容與人工驗收項目。

Scope 擴大時，先更新版本、列出新增與移除內容，對變更部分重新取得核准；舊核准不得自動延伸。

## 7. Worktree 寫入鎖

任何 AI 第一次寫入前，都必須以原子且不可覆蓋方式建立專案根目錄的 `.ai-worktree-lock.json`。此檔必須被 `.gitignore` 排除。

lock 至少包含：session、AI、Task ID、Scope 版本、worktree root、修改範圍、建立時間、最後續期時間、時區與狀態。

規則：

1. 唯讀分析不需 lock。
2. 建立 lock 使用不存在才建立的原子操作，不可覆蓋。
3. 其他 session 已持有 lock 時不得寫入，可改做唯讀或使用獨立 worktree。
4. 只有相同 session 能續期。
5. 完成 Summary、任務索引及最後一次 `CURRENT_STATE` 更新後才釋放。
6. lock 過期、session 消失或疑似殘留時，不得自行刪除或接管，先請使用者確認。
7. lock 不會阻止一般編輯器，仍須配合 Git status 與重疊檔案檢查。

PowerShell 原子建立方式與完整欄位範例見 `docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md`。

## 8. 未提交變更與平行工作

- 同一 worktree 同時只能有一個寫入者。
- 不修改、格式化、刪除或覆蓋任務 Scope 外的既有變更。
- 發現來源不明或與本任務重疊的變更時停止相關寫入並回報。
- 不使用 reset、checkout 或其他方式丟棄使用者修改。
- 真正需要平行實作時使用獨立 worktree，且各自使用不同 branch 與 lock。

## 9. 任務狀態

- `Discovery`
- `待核准`
- `已核准`
- `實作中`
- `自動驗證通過`
- `待人工驗收`
- `完成`
- `阻塞`
- `取消`
- `已被取代`

文件或產品行為尚未人工驗收前，不得標示完成。阻塞、取消或被取代都要記錄原因與未完成內容。

## 10. 部署狀態

部署與任務狀態分開：

- `不適用`
- `未部署`
- `Preview 已部署，未驗證`
- `Preview 已驗證`
- `Production 已部署，未驗證`
- `Production 已驗證`
- `已回復`
- `未知`

完成不等於已部署，已部署也不等於驗收通過。無法查證時使用 `未知`。

## 11. 驗證與 dev server

驗證前判斷是否會寫 `.next`、啟停程序、修改 SQLite、呼叫外部服務或改正式狀態。

Windows build 前：

1. 從目前狀態、package script 或啟動紀錄取得預期 port。
2. 使用 `Get-NetTCPConnection`，不可用時使用 `netstat -ano`。
3. 依 PID 核對 Node／Next、命令列與專案目錄。
4. 檢查本 session 啟動紀錄與 worktree lock。
5. 無法確認程序所有者、沒有程序查看權限，或使用者正在測試時，一律視為有共用 dev server。

有或無法排除共用 dev server 時，不得自動執行共用 `.next` 的 build、停止程序或清 `.next`。只有確認無共用程序或使用獨立 worktree／輸出目錄，才可依白名單執行。

`db:seed`、`db:push`、migration 與正式環境測試永遠不屬於自動驗證。

## 12. 人工驗收

- 使用者可見、後台可見、資料流程或權限變更：建立帶版本與日期的人工測試腳本。
- 純治理、純文件或不影響執行行為：使用文件審閱清單。
- 純內部重構：自動驗證加回歸檢查；有使用者流程風險時仍需人工腳本。

AI 必須區分未執行、失敗、通過與無法確認；未驗證不得宣稱完成。

## 13. 文件更新責任

狀態轉換時依序更新：

1. Summary 草稿。
2. `01-ACTIVE_TASK_INDEX_目前任務索引.md`。
3. `CURRENT_STATE_目前專案狀態.md`。

如此避免目前狀態指向不存在的摘要。任何一步失敗都需標示不一致，不得假裝全部完成。每個小修改不必同步更新三處。

持續更新文件使用穩定檔名並在內容記錄最後更新時間；測試腳本、Summary、正式設計及必要歷史交接使用日期或版本。

## 14. Session 交接

依 `HANDOFF_TEMPLATE_新對話交接模板.md` 產生最小交接摘要。預設貼入新對話，不強制建立永久檔；跨多人或使用者要求保存時才寫入 `docs/implementation/handoffs/`。

交接不取代 `CURRENT_STATE`。新 session 仍必須用 Git 實際狀態重新核對。

## 15. 規則衝突與停止條件

優先順序：平台／系統／工具安全 → 使用者最新指令 → 專門流程 → 已核准任務卡 → 本文件預設 → 未核准草稿 → 一般慣例。

已核准任務卡可以授權本流程明確允許委派的操作，例如 local commit；不能跳過更高層規則。專門流程的確認可由任務卡滿足，但任務卡必須具有相同的明確清單、Scope 版本與核准證據。

遇到下列情況立即停止相關寫入並回報：

- Scope、核准證據或資料目標不清楚。
- 其他 session 持有 lock。
- 未提交變更來源不明或與任務重疊。
- 驗證指令未分類、分類失效或條件無法證明。
- 需要高風險操作而尚未確認。
- 文件規則互相矛盾或實際 Git 狀態與目前狀態無法合理對應。

## 16. 每輪回報格式

完成後至少回報：

- 完成內容。
- 主要修改檔案。
- 自動驗證指令與結果。
- 未執行或無法確認的項目。
- 人工驗收文件。
- 是否觸及 schema、資料、Git 遠端或部署。
- 下一步及需要使用者決定的事項。
