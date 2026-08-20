# 本機驗證與快取排查

最後更新：2026-07-04（Asia/Taipei）  
適用環境：Windows PowerShell、Next.js 14、本專案共用 `.next`

## 核心原則

- 不把「build 成功」等同於使用者流程通過。
- 不在共用 dev server 執行期間直接覆寫同一份 `.next`。
- 不自行停止使用者程序或刪除 `.next`。
- 不在使用者需要保留本機資料時執行 `db:seed`。
- 無法確認程序或資料目標時採保守結果並回報。

## 1. 取得預期執行資訊

依序查看：

1. `CURRENT_STATE_目前專案狀態.md`
2. 本輪 dev server 啟動紀錄
3. `package.json` scripts
4. 終端輸出中的實際 Local URL

不要只假設 port 為 3000；Next.js 可能因占用改用其他 port。

## 2. Windows port 與程序檢查

優先使用：

```powershell
Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

依 PID 查程序：

```powershell
Get-Process -Id <PID>
Get-CimInstance Win32_Process -Filter "ProcessId = <PID>" |
  Select-Object ProcessId,Name,CommandLine
```

若 `Get-NetTCPConnection` 不可用：

```powershell
netstat -ano
```

判定為共用 dev server 的情況：

- 預期 port 有 Node／Next listener。
- 命令列指向本專案。
- `CURRENT_STATE` 顯示使用者正在測試。
- 無權限查看 PID 或無法確認程序所有者。
- 其他 session 的 lock 或交接記錄顯示 dev server 仍在使用。

## 3. Build 前置條件

只有下列其中一項成立才可依白名單執行 build：

- 已確認本專案沒有共用 dev server。
- 使用獨立 worktree 與獨立 `.next`／輸出目錄。
- 使用者明確同意停止共用程序並清理輸出。

存在或無法排除共用 dev server 時，不得自行：

- 執行會覆寫共用 `.next` 的 build。
- 終止 Node／Next 程序。
- 刪除 `.next`。

## 4. Stale chunk 排查順序

遇到 `Cannot find module`、chunk 遺失或 build 後 dev server 異常：

1. 記錄錯誤、URL、時間及目前 PID。
2. 確認是否剛執行 build 或切換 branch。
3. 確認 `.next` 是否被不同程序共用。
4. 先回報需要停止 dev server 與清 `.next` 的理由。
5. 取得確認後才停止程序、移除 `.next` 並重新啟動。
6. 重新執行原本失敗的 route／smoke test。

不要在未確認前把 stale chunk 當成程式邏輯錯誤，也不要直接清除證據。

## 5. 資料庫與 seed

> **2026-08-20 更新**：本專案早已不用 SQLite（2026-08-03 T18 遷移至 Neon PostgreSQL），
> 且自 2026-08-20 起**本機連的是 Neon 的 `dev` 分支，不再是正式站**。
> 連到哪個分支、怎麼切換、Neon Free 的限制，一律見
> `LOCAL_DEV_ENVIRONMENT_本機開發環境與資料庫分支.md`。
>
> **執行任何資料庫寫入前，先確認目前連到哪個分支**，不可假設。

- 本專案 `db:seed` 會刪除並重建資料——**確認連到 dev 分支再執行**。
- 任何 seed、`db push` 或寫入型測試都需要確認目標分支；寫入 `production` 分支永遠是第三層操作。
- 需要自動執行寫入測試時，使用明確隔離的測試資料庫，並證明連線不可能指向 shared local、Preview 或 Production。
- 驗證後回報測試資料建立與清理結果。

## 6. 驗證結果紀錄

每次記錄：

- 指令。
- 白名單分類。
- 是否有 dev server。
- 使用的 port、PID 與資料庫目標。
- exit code 與結果。
- 未執行項目及原因。

只有取得實際證據的項目可以標示通過。
