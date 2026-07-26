# 正式環境部署檢查

最後更新：2026-07-04（Asia/Taipei）  
性質：高風險檢查流程；本文件不構成 push 或部署授權

## 適用時機

- 使用者要求部署 Preview 或 Production。
- 正式站看不到最新功能。
- 需要確認 domain 是否指向正確 deployment。
- 部署失敗、需要回復或 smoke test 異常。

## 0. 授權閘門

開始前確認任務卡或使用者最新指令是否明確授權：

- 允許 push 的 branch 與 remote。
- 允許 Preview 或 Production。
- 允許修改哪些環境變數。
- 允許執行哪些正式 smoke tests。
- 失敗時是否允許回復。

缺少任何必要授權時，只能做唯讀查證與部署計畫，不能執行寫入。

## 1. 本機與 Git 證據

依序記錄：

1. `git rev-parse --show-toplevel`
2. `git branch --show-current`
3. `git rev-parse HEAD`
4. `git status --short --branch`
5. `git log -5 --oneline --decorate`
6. 預計部署 commit 是否包含核准任務
7. 是否混入來源不明或未驗收變更

工作區不乾淨不一定代表不能部署，但必須證明部署使用的是哪個 commit，且未提交內容不會被誤認為已上線。

## 2. 遠端分支

唯讀確認：

- local branch 與 remote branch 的差異。
- 預計部署 commit 是否已存在 remote。
- main 是否真的包含預期 commit。

push 仍屬第三層操作；沒有明確授權不得執行。

## 3. Deployment

部署後記錄：

- 平台名稱。
- Preview 或 Production。
- deployment ID／URL。
- 對應 Git commit。
- 建立時間與狀態。
- 是否由預期 branch 觸發。
- build log 是否有 warning 或失敗。

不能只因部署平台顯示成功就判定產品完成。

## 4. Domain 指向

確認：

- Production domain 指向哪個 deployment。
- deployment commit 與預期 commit 是否一致。
- DNS、alias 或自訂 domain 是否仍指向舊版本。
- 瀏覽器回應是否可能來自快取。

無法直接查證時標示 `未知`，不要推定已更新。

## 5. 正式 smoke test

只執行已核准、已分類且不會破壞正式資料的測試。至少檢查：

- 首頁與主要公開 route 回應。
- 預期功能可見。
- 管理頁需登入時，不在 log 暴露帳密。
- 資料是否正確顯示。
- 重大錯誤與瀏覽器 console。

任何會新增、修改或刪除正式資料的測試都需額外明確授權。

## 6. 回復

正式環境異常時先回報：

- 影響範圍。
- 當前 deployment 與上一個已知正常 deployment。
- 回復選項及資料相容性。
- 是否涉及 migration 或不可逆資料變更。

沒有回復授權不得自行切換 Production 或重寫資料。

## 7. 狀態更新

完成後更新：

1. 任務 Summary 的部署證據。
2. Active task index 的部署狀態。
3. `CURRENT_STATE_目前專案狀態.md` 的實際環境與查證時間。

「Production 已部署，未驗證」與「Production 已驗證」必須分開。
