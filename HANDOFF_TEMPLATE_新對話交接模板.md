# 新對話交接模板

用途：任務切換、階段完成或對話過長時，產生可直接貼到新 AI session 的最小交接資料。交接摘要不取代 `CURRENT_STATE_目前專案狀態.md`。

## 專案定位

- 正式 Git root
- 可接受的 junction／工作區 alias
- branch
- HEAD commit
- 與遠端關係

新 session 必須重新執行 Git 檢查，不可只相信交接文字。

## Worktree 與未提交變更

- `.ai-worktree-lock.json` 是否存在
- lock 持有者、Task、Scope 版本與狀態
- 已知未提交檔案及其來源
- 哪些檔案不得覆蓋
- 是否有其他 AI 或使用者正在寫入

## 目前任務

- Task ID 與名稱
- 任務卡路徑
- Scope 版本與核准證據
- 任務狀態
- 部署狀態
- Scope
- Non-scope
- Git 與高風險操作授權

## 本輪完成

只列已完成且有證據的內容，附上主要修改檔案及驗證結果。未驗證的內容不得列為完成。

## 尚未完成或阻塞

列出剩餘工作、失敗驗證、缺少的外部條件與需要使用者決定的事項。阻塞需說明已嘗試的安全檢查。

## 已確認產品決策

只保留後續任務仍然有效的決策，附來源文件或核准摘要；已被取代的決策不繼續帶入。

## 驗證與環境

- 已執行指令與結果
- 未執行指令與原因
- 本機狀態
- Preview 狀態
- Production 狀態
- 人工測試腳本或文件審閱清單

無法查證時寫 `未知`，不可自行推定。

## 下一步

寫一個最優先且範圍明確的下一個行動。其他想法放 Roadmap，不在交接中同時開工。

## 新 session 必讀文件

1. `AGENTS.md`
2. `AI_WORKFLOW_AI協作流程.md`
3. `CURRENT_STATE_目前專案狀態.md`
4. 目前任務卡
5. 最近相關 Summary
6. 任務需要的專門流程或 SOP

## 可直接貼入新對話的開場文字

請依 `AGENTS.md` 的專案啟動流程接續目前工作。先核對 Git root、branch、HEAD、Git status、worktree lock 與 `CURRENT_STATE_目前專案狀態.md`，再讀目前任務卡及最近 Summary。先回報 Scope、Non-scope、核准版本、任務狀態、部署狀態與待決問題；不要在核對完成前寫入檔案。

## 保存規則

一般交接直接貼到新對話，不建立永久文件。跨多人或使用者要求保存時，才寫入 `docs/implementation/handoffs/`，檔名包含日期與 Task ID；目前狀態仍以 `CURRENT_STATE_目前專案狀態.md` 為入口。
