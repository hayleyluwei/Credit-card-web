# T18 第一版部署上線 Summary

日期：2026-08-04（Asia/Taipei）；本輪對話橫跨兩個實際日期（2026-08-03 至 2026-08-04，同一輪對話中間有真實時間間隔，commit 時間戳可證實：schema 遷移／Neon 建立／資料搬遷／Vercel 第一次部署與 `postinstall` 修正為 08-03 `bd6e7c7`；`NEXTAUTH_URL` 修正、後台登入確認、本文件與 T25 建立為 08-04 `241598e`）
任務卡：`docs/implementation/tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md`（v1 已核准 2026-07-30）
任務狀態：**已完成**

## 完成內容

### PostgreSQL 遷移（schema v8）
- `prisma/schema.prisma` datasource 從 `sqlite` 改為 `postgresql`；逐一檢查全部欄位型別（`Int`／`String`／`Boolean`／`DateTime`，無 enum、無 SQLite 專屬型態），確認不需調整任何欄位定義。
- 依 schema 專門流程產出 `prisma-schema-spec-v8-2026-08-03.md`、`schema-v8-2026-08-03.prisma`、`schema-checklist-2026-08-03-postgresql.md`。
- 建立正式 migration：`prisma/migrations/20260803033914_init_postgresql/`。

### Neon 資料庫與資料搬遷
- 使用者建立 Neon 專案 `credit-card-web`（AWS Asia Pacific / Singapore），`.env` 的 `DATABASE_URL` 已指向該資料庫。
- `npx prisma migrate dev` 在 Neon 建立全部 10 個資料表。
- 搬遷前唯讀核對本機 `dev.db`：發現並排除 1 筆殘留測試文章（`test0730`，T20 人工測試留下、已發布但未清除）；`RewardTier` 資料核對正常（`ctbc-linepay-rewards-2026h2` 為 3 層，T21 測試層已確認移除）。
- 用一次性腳本（`scripts/t18-check-local-test-residue.mjs` 唯讀檢查、`scripts/t18-migrate-local-to-neon.mjs` 實際搬遷）把本機資料原封不動搬到 Neon，保留原始 ID 並重設 PostgreSQL sequence：9 銀行／14 卡／6 分類／26 優惠／30 優惠卡片對應／6 通路／28 RewardTier／1 管理員帳號／0 篇文章（已排除測試文章）。搬遷後筆數與來源一致。
- 正式管理員帳號：把搬過去的佔位帳號（`admin@example.com`，沿用本機測試值）改為使用者真實帳號 `hayleylu0902@gmail.com`，密碼為隨機產生的高強度亂碼，只在對話中顯示一次、未寫入任何檔案。

### Vercel 部署
- 使用者建立 Vercel 專案 `credit-card-web`，連結 GitHub repo `hayleyluwei/Credit-card-web`（`main` 分支），正式網址 `https://credit-card-web-pi.vercel.app`。
- 環境變數設定：`DATABASE_URL`／`NEXTAUTH_SECRET` 設為 Sensitive；`NEXTAUTH_URL` 設為正式網址。
- **第一次部署失敗**：`PrismaClientInitializationError`——Vercel 依賴快取導致 `@prisma/client` 安裝時的自動 `prisma generate` 未觸發，Client 與 schema 對不上。修法：`package.json` 新增 `"postinstall": "prisma generate"`，強制每次安裝依賴後都重新產生 Client（commit `bd6e7c7`）。修正後 push 自動觸發的部署成功。
- **環境變數修正**：`NEXTAUTH_URL` 一開始填的是猜測網址（`credit-card-web-project.vercel.app`），實際網址是 `credit-card-web-pi.vercel.app`；修正後手動 Redeploy 套用。

### 上線後驗證
自動驗證（PostgreSQL 連線下）：`prisma validate`／`tsc --noEmit`／`data:verify-release`（T17 驗證重跑，0 錯誤，僅 1 個既有非阻擋警告：目前無精選優惠）／`next build`（34 路由，14 情境頁 SSG）皆通過。

正式網址人工＋瀏覽器驗證（依任務卡完成定義逐項核對）：
- 首頁：200，正確顯示真實資料。
- 六個分類頁（`cashback`／`dining`／`travel`／`online-shopping`／`transport`／`installment`）：皆正常。
- 搜尋頁 `/search?q=繳稅`：正常。
- 三個優惠詳情頁（`ctbc-linepay-rewards-2026h2`／`cube-tiered-category-rewards-2026`／`dawho-general-cashback-2026h2`）：皆正常。
- 銀行頁（`/banks/sinopac`）、卡片頁（`/cards/dawho-cashback-card`）：皆正常。
- 瀏覽器 console 無錯誤。
- **後台登入**：使用者本人於正式網址用新帳號密碼親自登入成功，Admin Dashboard 正確顯示（26 已發布優惠／0 草稿／0 過期／14 卡／9 銀行），確認 `NEXTAUTH_URL` 修正生效、NextAuth 在正式環境完整可用。

### 順手處理的 UX 修正（非既有任務卡，測試期間即時核准）
- 移除 `/scenarios/[slug]` 重複的「符合「X」情境的優惠」標題卡片（跟頁面自己的 H1／說明重複，無資訊量），commit `0958296`。
- 移除銀行詳情頁（`/banks/[slug]`）「本行相關卡片」「相關優惠」與卡片詳情頁（`/cards/[slug]`）「相關優惠」下方重複的說明文字（同樣是純裝飾、無資訊量、後台無對應可編輯欄位）。**此項尚未 commit**，下次連同其他待處理項一併處理。

## 已知風險（觀察中，非阻擋）

- **Neon Free／Vercel Hobby 冷啟動延遲**：使用者實測發現閒置一段時間後第一次載入較慢，經確認為免費方案預期行為（任務卡原本就列為風險項），非錯誤，不影響資料正確性。

## 衍生任務

- **T25（優惠網址穩定性與過期轉址）v1 草案，待核准**：測試期間使用者發現，優惠依資料蒐集規格書 3.4「情況二」換新 Slug 後，舊優惠過期會被前台判 404、不會轉址，長期會流失 SEO 收錄與排名。已建任務卡記錄問題與可能方向，5 個待決問題未拍板，不影響本次上線（現有資料多屬「情況一」延續，尚未真的發生過情況二）。

## Non-scope 確認未觸及

- 未購買自訂網域，維持 Vercel 預設網址。
- 未設定廣告、分潤或任何商業化功能。
- 未建立自動爬蟲、排程匯入。
- 未修改產品功能與 UI（除上方記錄的兩項對話中即時核准的小型 UX 修正）。

## 待辦（不影響「完成」判定，留待後續處理）

- 銀行/卡片頁重複說明文字的移除（已在本機驗證，尚未 commit/push/部署）。
- T25 任務卡待使用者核准後才能排入實作。
