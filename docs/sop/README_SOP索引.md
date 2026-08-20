# SOP 索引

最後更新：2026-08-20（Asia/Taipei，新增本機開發環境與資料庫分支 SOP、資料庫結構變更流程 SOP）  
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

- `LOCAL_DEV_ENVIRONMENT_本機開發環境與資料庫分支.md`
  - 類型：環境約束（**2026-08-20 新增，動任何資料庫前必讀**）
  - 用途：本機連到哪個資料庫、dev 與 production 分支的分工與切換、Neon Free 限制
    （自動休眠、6 小時還原窗口、10 個分支額度）、連線字串的機密處理
  - **關鍵**：2026-08-20 起本機連 `dev` 分支，**本機後台改的資料不會出現在正式站**

- `DATABASE_MIGRATION_資料庫結構變更流程.md`
  - 類型：正式操作流程（**2026-08-20 新增，改資料庫結構前必讀**）
  - 用途：migration 標準流程、`migrate dev`／`migrate deploy`／`db push` 的分工、
    三個實測陷阱（drift 會提議重置資料庫、**Vercel 不會自動套用 migration**、Neon 休眠 `P1001`）、
    六項驗證清單、T33 實例
  - **關鍵**：**不得把 SQL 語法當成使用者的把關點**——AI 用執行前後可比對的數字自證，
    使用者判斷結果對不對（2026-08-20 使用者指出「看不懂的東西當關卡等於沒有關卡」）

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

## 內容作業（攻略文章）

- `GUIDE_ARTICLE_WRITING_攻略文章撰寫準則.md`
  - 類型：內容品質準則
  - 用途：文章**怎麼寫**。結論先行、數字附官方來源與查證日期、術語白話、比較表與 FAQ 格式、與情境頁的分工、著作權原則

- `GUIDE_ARTICLE_PUBLISHING_攻略文章上稿流程.md`
  - 類型：固定作業流程
  - 用途：文章**寫好之後怎麼上**。上稿前檢視清單（標題與 SEO 欄位、slug 與情境對應、連結、FAQ JSON、查證日期）、上稿與發布步驟、發布後驗證，以及「草稿無法預覽」「情境頁需重新部署才會連上文章」等已知限制
  - 界線：不授權 AI 代為建立、修改或發布文章

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
