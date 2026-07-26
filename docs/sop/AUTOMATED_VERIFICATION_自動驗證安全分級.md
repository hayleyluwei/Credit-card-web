# 自動驗證安全分級

最後更新：2026-07-04（Asia/Taipei）  
正式政策：`AI_VERIFICATION_POLICY_自動驗證政策.json`

## 1. 目的

讓「安全」成為可查證的政策，而不是由執行中的 AI 主觀判斷。測試名稱、過往曾經通過或看起來只讀，都不能取代核准白名單。

## 2. 分類

### `readonly`

- 不寫專案檔案、產物、資料庫或外部服務。
- 不啟停程序。
- 不改 Preview／Production。
- 白名單分類有效時可自動執行。

### `generated-output`

- 只寫可重建產物，例如 `.next` 或 cache。
- 必須列出 `writes`。
- 若會干擾共用 dev server，先回報；隔離條件成立才可執行。

### `isolated-stateful`

- 會寫資料，但只能寫明確隔離的測試資料庫或沙箱。
- 需證明連線不可能指向 shared local、Preview 或 Production。
- 執行後回報建立與清理結果。

### `shared-stateful`

- 會寫共用 `dev.db`、共享服務或其他人使用中的狀態。
- 必須先確認。

### `unclassified`

- 新增、資料不完整、fingerprint 失效或無法證明條件的指令。
- 不得自動執行。

## 3. Policy 必要欄位

每個 command 至少包含：

```json
{
  "command": "完整且不可模糊展開的指令",
  "classification": "unclassified",
  "entryFiles": [],
  "writes": [],
  "databaseTarget": "none",
  "requiresDevServer": false,
  "requiresNoDevServer": false,
  "requiresConfirmation": true,
  "approvedBy": null,
  "approvedAt": null,
  "approvalReference": null,
  "fingerprints": {}
}
```

`databaseTarget` 只接受：`none`、`isolated-test`、`shared-local`、`preview`、`production`。

## 4. 分類有效性

執行前逐項確認：

1. 完整 command 相符。
2. policy 中存在該指令。
3. 核准欄位完整。
4. package script、入口檔與副作用相關檔案 fingerprints 相符。
5. `writes` 與資料庫目標符合實際環境。
6. dev server 條件成立。
7. 平台安全與目前任務 Scope 允許執行。

任一項不成立就降級為 `unclassified`。AI 可以提出重新分類草案，但不能自行填入已核准狀態。

測試檔名可以使用 `*.readonly.test.*` 等慣例協助辨識，但檔名沒有授權效力。

## 5. 永遠不得列為 readonly

- `db:seed`
- `db:push`
- migration
- 修改 schema 的 format 指令
- 會新增、更新或刪除資料的登入／CRUD smoke test
- 會停止程序、刪除 `.next` 或改正式環境的指令
- push、deploy 或外部訊息發送

## 6. Worktree 寫入鎖

寫入型任務第一次改檔前建立 `.ai-worktree-lock.json`，並加入 `.gitignore`。

PowerShell 使用 `.NET FileMode.CreateNew` 確保已存在時失敗，不可覆蓋：

```powershell
$lockPath = Join-Path (Get-Location) ".ai-worktree-lock.json"
$lockData = [ordered]@{
  sessionId = "目前 session 識別"
  agent = "AI 名稱"
  taskId = "目前 Task ID"
  scopeVersion = "已核准 Scope 版本"
  worktreeRoot = (git rev-parse --show-toplevel)
  plannedPaths = @("核准修改範圍")
  createdAt = (Get-Date).ToString("o")
  heartbeatAt = (Get-Date).ToString("o")
  timezone = "Asia/Taipei"
  status = "implementing"
}
$bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(
  ($lockData | ConvertTo-Json -Depth 4)
)
$stream = [System.IO.File]::Open(
  $lockPath,
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::Write,
  [System.IO.FileShare]::None
)
try {
  $stream.Write($bytes, 0, $bytes.Length)
} finally {
  $stream.Dispose()
}
```

若建立時發生檔案已存在錯誤，立即停止寫入並讀取既有 lock。不得改用 `-Force`、不得覆蓋。

## 7. Lock 續期與釋放

- 只有相同 `sessionId` 能續期。
- 完成 Summary、active index 及最後一次 `CURRENT_STATE` 更新後才釋放。
- 釋放只刪除相同 session 持有的 lock。
- lock 過期、session 不存在或內容損壞時，不自動刪除，先請使用者確認。
- lock 只協調遵守流程的 AI，不能阻止一般編輯器，因此仍需 Git status 與檔案重疊檢查。

## 8. Policy 變更流程

1. AI 唯讀分析指令與入口檔。
2. 列出可能副作用、writes、資料目標、dev server 條件及 fingerprints。
3. 產出 JSON 差異草案。
4. 使用者核准。
5. 寫入 policy 並執行 policy schema 檢查。
6. 在 Summary 記錄核准依據。

沒有第 4 步，不得把 `unclassified` 改為已核准分類。
