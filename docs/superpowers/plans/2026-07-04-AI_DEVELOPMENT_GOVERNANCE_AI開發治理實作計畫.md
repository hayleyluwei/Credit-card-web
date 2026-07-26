# AI 開發治理架構實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立信用卡網站所有 AI 共用的分層治理文件、驗證白名單、worktree 寫入鎖規則、目前狀態入口及可重複執行的治理驗證。

**Architecture:** `AGENTS.md` 作為短入口，`AI_WORKFLOW_AI協作流程.md` 作為唯一詳細流程，`CURRENT_STATE_目前專案狀態.md` 作為持續更新的目前狀態。任務、交接、Roadmap、SOP 與機器可讀驗證政策各自只負責一種資訊，既有 T01–T14 任務索引凍結為歷史。

**Tech Stack:** Markdown、JSON、Node.js ESM、PowerShell、Git。

**Git 限制：** 本計畫不執行 `git add`、`git commit`、`git push` 或部署。每個任務以唯讀差異檢查取代 commit。

---

## 檔案配置

**修改：**

- `AGENTS.md`：AI 標準入口、規則優先序及專門流程導流。
- `.gitignore`：忽略執行期間的 `.ai-worktree-lock.json`。
- `docs/implementation/00-master-task-index.md`：凍結為 T01–T14 歷史並連結新入口。

**建立：**

- `AI_WORKFLOW_AI協作流程.md`：三層權限、Scope、白名單、寫入鎖、狀態與驗證規則。
- `CURRENT_STATE_目前專案狀態.md`：目前 branch、commit、工作區、任務及部署狀態。
- `TASK_TEMPLATE_任務模板.md`：新任務卡固定格式。
- `HANDOFF_TEMPLATE_新對話交接模板.md`：新 session 最小交接格式。
- `ROADMAP_產品路線圖.md`：延後想法與啟動條件。
- `docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`：T15 起的目前階段任務索引。
- `docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md`：本次核准任務卡。
- `docs/implementation/summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md`：本次完成摘要草稿。
- `docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`：文件型任務審閱清單。
- `docs/sop/README_SOP索引.md`：SOP 總入口。
- `docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md`。
- `docs/sop/LOCAL_VERIFICATION_本機驗證與快取排查.md`。
- `docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md`。
- `docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json`。
- `docs/sop/CHINESE_ENCODING_中文編碼與亂碼處理.md`。
- `scripts/verify-ai-governance.mjs`：治理文件與 JSON policy 的唯讀檢查器。

**不得修改：**

- `src/`、`prisma/`、產品規格、schema 正式檔、既有 summaries、既有測試腳本。
- 目前未提交的 `package.json`、`src/app/page.tsx`、首頁驗證腳本與首頁 Summary。

---

### Task 1：建立治理驗證器的失敗基準

**Files:**

- Create: `scripts/verify-ai-governance.mjs`

- [ ] **Step 1：建立只讀驗證器，先檢查預期檔案不存在**

建立 Node.js ESM 腳本，使用 `node:fs/promises` 的 `access`、`readFile`，不得呼叫任何寫入 API。第一版至少檢查：

```js
const requiredFiles = [
  "AGENTS.md",
  "AI_WORKFLOW_AI協作流程.md",
  "CURRENT_STATE_目前專案狀態.md",
  "TASK_TEMPLATE_任務模板.md",
  "HANDOFF_TEMPLATE_新對話交接模板.md",
  "ROADMAP_產品路線圖.md",
  "docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md",
  "docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md",
  "docs/sop/README_SOP索引.md",
  "docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md",
  "docs/sop/LOCAL_VERIFICATION_本機驗證與快取排查.md",
  "docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md",
  "docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json",
  "docs/sop/CHINESE_ENCODING_中文編碼與亂碼處理.md",
];
```

缺檔時輸出每個相對路徑並設定 `process.exitCode = 1`；全部存在時輸出 `AI governance verification passed.`。

- [ ] **Step 2：執行失敗基準**

Run:

```powershell
node scripts/verify-ai-governance.mjs
```

Expected: FAIL，列出尚未建立的治理文件；腳本本身不得建立或修改任何檔案。

- [ ] **Step 3：確認沒有碰到既有首頁變更**

Run:

```powershell
git status --short
```

Expected: 原有首頁相關變更仍在，只新增治理計畫與驗證腳本；`package.json` 與 `src/app/page.tsx` 的既有內容不被本任務改寫。

---

### Task 2：建立核心入口、協作流程與驗證政策

**Files:**

- Modify: `AGENTS.md`
- Create: `AI_WORKFLOW_AI協作流程.md`
- Create: `docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json`

- [ ] **Step 1：將 `AGENTS.md` 重整為短入口**

文件固定包含：

1. 中文專案身分與正式 Git 根目錄檢查。
2. 優先序：平台安全 → 使用者最新指令 → 專門流程 → 已核准任務卡 → `AI_WORKFLOW` → 未核准草稿 → 一般慣例。
3. 新 session 必讀 `AI_WORKFLOW`、`CURRENT_STATE`、目前任務卡及最近 Summary。
4. Scope 未核准只能 Discovery；核准後可在 Scope 內連續實作。
5. schema、migration、共用資料、正式環境、push、部署及核心治理變更必須確認。
6. 規格書、schema、驗收與任務索引的既有正式入口。
7. 繁體中文、機密資料及驗證底線。

詳細流程只連結 `AI_WORKFLOW_AI協作流程.md`，不複製完整表格。

- [ ] **Step 2：建立 `AI_WORKFLOW_AI協作流程.md`**

依正式設計 v2 寫入完整章節：

- 問題分類與 Discovery。
- 三層權限。
- Scope 核准證據及版本變更。
- 驗證白名單與 `unclassified` 預設。
- `.ai-worktree-lock.json` 原子取得、續期、釋放及不得自行清除殘留 lock。
- 任務狀態與部署狀態分離。
- Windows dev server 檢查。
- Git、秘密資料、並行及文件更新順序。
- 專門流程和任務卡授權優先序。

- [ ] **Step 3：建立機器可讀驗證政策**

JSON 根節點使用：

```json
{
  "version": 1,
  "lastUpdated": "2026-07-04T00:00:00+08:00",
  "defaultClassification": "unclassified",
  "policyChangeRequiresUserApproval": true,
  "commands": []
}
```

初始 `commands` 保持空陣列，不替任何既有測試偽造核准。文件明確說明：使用者完成本次文件審閱後，另開任務分類實際驗證指令。

- [ ] **Step 4：檢查 JSON 語法**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json','utf8')); console.log('policy json valid')"
```

Expected: `policy json valid`。

---

### Task 3：建立目前狀態、後續任務索引與 T15 任務卡

**Files:**

- Create: `CURRENT_STATE_目前專案狀態.md`
- Create: `docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`
- Create: `docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md`

- [ ] **Step 1：建立第一版目前狀態**

內容必須忠實記錄：

- 最後更新時間與 `Asia/Taipei`。
- 正式 Git root：`C:/Users/user/Documents/Credit card web project`。
- 工作區 alias：`C:/Users/user/Documents/信用卡查詢網站`，類型為 junction。
- branch：`main`。
- HEAD：`43b724f`。
- 遠端狀態：`main...origin/main [ahead 1]`。
- 首頁信用卡入口相關未提交變更，來源為使用者既有工作，不屬於 T15。
- T15 狀態：`實作中`；部署狀態：`不適用`。
- Production 狀態：`未知`，不得推定。
- 下一步：完成治理文件自動檢查後等待文件審閱。

- [ ] **Step 2：建立目前階段任務索引**

只登記 T15，欄位包含 Task ID、名稱、Scope 版本、任務狀態、部署狀態、依賴、任務卡及 Summary。T01–T14 只連結 `00-master-task-index.md`，不複製歷史表格。

- [ ] **Step 3：建立 T15 任務卡**

記錄：

- Scope v1。
- 核准者：使用者。
- 核准日期：2026-07-04。
- 核准依據：使用者明確要求「建立治理文件本體」。
- Scope：本計畫列出的治理文件、驗證器及必要入口調整。
- Non-scope：產品功能、UI、API、schema、資料、既有首頁變更、commit、push、部署。
- Git 授權：允許唯讀檢查，不允許 add／commit／push。
- 完成定義：自動驗證通過後進入 `待人工驗收`。

---

### Task 4：建立任務、交接與 Roadmap 模板

**Files:**

- Create: `TASK_TEMPLATE_任務模板.md`
- Create: `HANDOFF_TEMPLATE_新對話交接模板.md`
- Create: `ROADMAP_產品路線圖.md`

- [ ] **Step 1：建立任務模板**

固定包含 Task ID、版本、背景、問題類型、已確認決策、目標、Scope、Non-scope、安全限制、影響範圍、驗證、資料保護、回復方式、Git 授權、風險、核准證據及 Scope 變更紀錄。每個欄位都附繁體中文填寫說明，不保留 `TBD` 或 `TODO`。

- [ ] **Step 2：建立交接模板**

固定包含 Git root、branch、commit、工作區狀態、worktree lock、任務狀態、部署狀態、完成／未完成、產品決策、Scope、Non-scope、驗證結果、下一步、必讀文件與可貼入新 session 的開場文字。

- [ ] **Step 3：建立 Roadmap**

建立「現在必做、下一階段、長期、暫記不做、併入既有模組、獨立模組」六區。將既有驗收文件第二階段項目以連結方式列入，不複製完整規格；每筆標明 Roadmap 不代表實作授權。

---

### Task 5：建立 SOP 與機械化操作規則

**Files:**

- Create: `docs/sop/README_SOP索引.md`
- Create: `docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md`
- Create: `docs/sop/LOCAL_VERIFICATION_本機驗證與快取排查.md`
- Create: `docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md`
- Create: `docs/sop/CHINESE_ENCODING_中文編碼與亂碼處理.md`

- [ ] **Step 1：建立 SOP 索引**

連結四份新 SOP、既有規格書修改流程、schema 修改流程及驗收規則；標示哪些 SOP 是正式約束、哪些只是排查指南。

- [ ] **Step 2：建立正式環境部署檢查 SOP**

順序固定為：確認部署授權 → branch／commit → 遠端 main → deployment 建立 → domain 指向 → smoke test → 記錄 Production 狀態。不得在 SOP 中自動授權 push 或部署。

- [ ] **Step 3：建立本機驗證與快取排查 SOP**

寫入 Windows 檢查：`Get-NetTCPConnection`、`netstat -ano`、PID、Node／Next 程序、預期 port、共用 `.next`。偵測到或無法排除 dev server 時，不得自行停止程序或清 `.next`。

- [ ] **Step 4：建立自動驗證安全分級 SOP**

解釋五種分類、JSON policy 欄位、fingerprint 失效、未知指令降級、隔離資料庫要求，以及 `db:seed`／`db:push` 永不屬於 readonly。

寫入 PowerShell lock 建立範例，使用 `.NET FileMode.CreateNew`，確保已存在時失敗，不覆蓋：

```powershell
$stream = [System.IO.File]::Open(
  ".ai-worktree-lock.json",
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::Write,
  [System.IO.FileShare]::None
)
```

- [ ] **Step 5：建立中文編碼 SOP**

記錄 UTF-8、PowerShell `OutputEncoding`、中文亂碼檢查、禁止直接以不明編碼覆寫，以及文件交付前搜尋 `??` 與替代字元的方法。

---

### Task 6：更新歷史入口與 lock 忽略規則

**Files:**

- Modify: `.gitignore`
- Modify: `docs/implementation/00-master-task-index.md`

- [ ] **Step 1：忽略執行中的 write lock**

在 `.gitignore` 增加：

```gitignore
# AI worktree write coordination
.ai-worktree-lock.json
```

- [ ] **Step 2：凍結歷史任務索引**

只修改 `00-master-task-index.md` 的開頭與接續工作說明：

- 標明 T01–T14 是已凍結的 MVP 歷史索引。
- 後續任務改讀 `01-ACTIVE_TASK_INDEX_目前任務索引.md`。
- 新 session 先讀 `AGENTS.md`、`AI_WORKFLOW`、`CURRENT_STATE`。

不得修改 T01–T14 的歷史狀態、Scope 或 Summary 連結。

- [ ] **Step 3：確認修改範圍**

Run:

```powershell
git diff -- .gitignore AGENTS.md docs/implementation/00-master-task-index.md
```

Expected: 只有治理入口、歷史凍結說明及 lock ignore；沒有首頁、產品或 schema 變更。

---

### Task 7：完成治理驗證器並讓檢查通過

**Files:**

- Modify: `scripts/verify-ai-governance.mjs`

- [ ] **Step 1：加入內容規則檢查**

驗證器需檢查：

- `AGENTS.md` 連結三份啟動必讀文件。
- `AI_WORKFLOW` 包含三層權限、Scope 核准、`unclassified`、write lock、Windows dev server、任務／部署雙狀態及授權優先序。
- `CURRENT_STATE` 包含時區、Git root、branch、HEAD、工作區、任務與部署狀態。
- `00-master-task-index.md` 連結 active index，active index 連結 T15 任務卡。
- `.gitignore` 包含 `.ai-worktree-lock.json`。
- JSON policy 可解析、`defaultClassification` 為 `unclassified`、`commands` 是陣列且初始為空、policy change 需要使用者核准。
- 治理文件不存在 `TBD`、`TODO`、`PLACEHOLDER` 或無法辨識的替代字元。

- [ ] **Step 2：執行治理驗證**

Run:

```powershell
node scripts/verify-ai-governance.mjs
```

Expected: `AI governance verification passed.`，exit code 0。

- [ ] **Step 3：執行 Markdown／差異格式檢查**

Run:

```powershell
git diff --check
```

Expected: exit code 0，沒有 trailing whitespace 或 patch 格式錯誤。

- [ ] **Step 4：確認 JSON 與機密資料**

Run:

```powershell
rg -n "password|secret|token|api[_-]?key|DATABASE_URL" AGENTS.md AI_WORKFLOW_AI協作流程.md CURRENT_STATE_目前專案狀態.md docs/sop docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md
```

Expected: 只能出現規則名稱或遮蔽說明，不得出現 `.env` 的實際值。

---

### Task 8：建立審閱清單、Summary 草稿並收尾目前狀態

**Files:**

- Create: `docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md`
- Create: `docs/implementation/summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md`
- Modify: `docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md`
- Modify: `CURRENT_STATE_目前專案狀態.md`

- [ ] **Step 1：建立文件審閱清單**

讓使用者逐項確認：新對話入口、三層權限、Scope 核准、白名單、lock、dev server、任務／部署狀態、Roadmap、SOP、繁體中文及既有歷史未被改寫。

- [ ] **Step 2：建立 Summary 草稿**

記錄完成內容、主要檔案、未修改項目、自動驗證結果、審閱清單路徑、既有首頁未提交變更保護、未執行 commit／push／部署，以及下一步等待使用者審閱。

- [ ] **Step 3：更新 active index**

將 T15 設為 `待人工驗收`，部署狀態設為 `不適用`，連結 Summary 草稿與審閱清單。

- [ ] **Step 4：最後更新 CURRENT_STATE**

最後才把 T15 改為 `待人工驗收`，記錄驗證通過時間、Summary、審閱清單與下一步。保留首頁既有未提交變更的來源說明。

- [ ] **Step 5：執行最終檢查**

Run:

```powershell
node scripts/verify-ai-governance.mjs
git diff --check
git status --short --branch
```

Expected:

- 治理驗證通過。
- diff check 通過。
- 只新增或修改本計畫列出的治理檔案；原有首頁相關變更仍存在且未被覆蓋。
- 沒有 commit、push 或部署。

---

## 計畫自我檢查

- 規格涵蓋：六份治理入口／模板、active index、T15 任務卡、四份 SOP、JSON policy、lock、驗證器、審閱清單及 Summary 均有對應任務。
- 衝突處理：舊 T01–T14 不重寫；首頁既有變更列為禁止碰觸；文件任務使用審閱清單而非網站操作測試。
- 安全處理：初始 policy 不自我核准任何既有測試；lock 不提交；未知測試維持 `unclassified`。
- 占位符檢查：計畫內沒有未指定的 `TBD`、`TODO` 或「之後再處理」。
- Git 限制：整份計畫不包含 commit、push、deploy 步驟。
