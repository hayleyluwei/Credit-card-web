# T16 第一版正式資料匯入 Summary

日期：2026-07-26（Asia/Taipei）
任務卡：`docs/implementation/tasks/T16-FIRST_RELEASE_DATA_IMPORT_第一版正式資料匯入.md`（v1 已核准，2026-07-08）
任務狀態：完成

## 完成內容

### 1. 匯入腳本

- 建立 `scripts/import-offer-data.mjs`（用 Python openpyxl 讀 xlsx，不新增 npm 相依），支援：
  - `--dry-run`：只讀試算表並輸出檢查報告，不寫資料庫。
  - 正式匯入：檢查全數通過後寫入資料庫，匯入前自動備份 `prisma/dev.db`。
- 檢查項目依任務卡 Scope 全數實作：必填欄位、代號唯一性、offer_cards 引用完整性、每筆優惠至少一筆卡片對應、主分類與回饋類型合法值、日期格式與區間、來源網址與查證日期。
- `package.json` 新增 `data:import`、`data:import:dry` 兩個 npm script。
- 腳本已 commit：`cf0dc2d feat(T16): add real offer data import script`。

### 2. 資料匯入（兩輪）

- 第一輪（使用者本人資料）：5 家銀行／8 張卡／10 筆優惠，依 v1 模板匯入。
- 第二輪（Codex，`CORE-SCENARIOS-DATA-COLLECTION-BATCH-2`，補繳稅／學費／水電瓦斯情境）：新增 1 家銀行（ubot）、2 張卡（ubot-green-card、taishin-jkopay-card）、6 筆優惠。
- **累計結果**：6 家銀行／10 張卡／16 筆優惠／20 筆優惠卡片對應。
- 來源試算表：`docs/data-collection/信用卡優惠資料整理模板-v2-2026-07-18.xlsx`（v2，含 T19 新增的卡片六欄與情境標籤），已由使用者／Codex commit（`f06be30`、`5bcec14`）。
- 每次匯入前均備份 `prisma/dev.db` 至 `prisma/backups/`；依核准決策完全清除 seed 測試資料（Bank/Card/Offer/OfferCard），保留 Category/SiteSetting/AdminUser。

## 驗證結果

- `node scripts/import-offer-data.mjs --dry-run`：兩輪皆 0 錯誤。
- 正式匯入：兩輪皆 0 錯誤，各表筆數與試算表一致。
- 人工抽點（本輪對話期間已透過瀏覽器實際核對，本次為正式文件記錄）：首頁、分類頁、多筆優惠詳情頁與部分卡片頁，內容皆為真實資料，無測試資料殘留。
- lint／build 尚未獨立分類執行（驗證指令分類仍為 `unclassified`，依驗證政策由使用者執行或核准分類）。

## 未執行（依任務卡 Non-scope 或尚未進行）

- 未修改 Prisma schema、未建立 migration。
- 未修正試算表內容錯誤（腳本不自行猜測補值）。
- 未接觸正式環境、未部署、未執行 push。
- T17 定義的正式驗證腳本 `verify-release-data.mjs` 尚未建立（屬 T17 範圍）。

## 已知未解決事項（移交後續任務或人工核對）

- `esun-unicard-wallet-new-card-2026q3` 的「最低消費」欄位內容疑似填錯，dry-run 有警告但不阻擋匯入，尚未人工核對修正；待回饋給 Codex 或直接修正資料庫。
- 2 筆優惠（`sinopac-designated-tax-installment-2026h1`、`sinopac-tuition-payment-rebate-2026h1`，皆 2026 上半年活動）以系統目前日期（2026-07-26）已過期，前台正確隱藏，非 bug；下一輪報稅季可能需要新資料。
- HSBC 兩筆優惠（`hsbc-travelone-signature-first-spend-2026q3`、`hsbc-travelone-infinite-first-spend-2026q3`）的 `description`／`conditions` 欄位補上的年費金額文字（NT$2,500／NT$8,000）**只存在於資料庫，不在 xlsx 原始檔**。若之後重新執行 `npm run data:import`（資料庫會被清空重建），這兩處會被還原成沒有金額，需要重新補上（找對應 offer 的 `description`／`conditions` 欄位，把「繳付正卡全額年費、」取代為「繳付正卡全額年費（金額）、」）。
- 對 T16 真實資料做過一次「AI 引用性」檢視：`faqJson` 0/16 筆有填，優惠詳情頁只有基本 `Article` JSON-LD，多層回饋（幣倍卡、CUBE 卡）條件仍是整段散文——此缺口已記錄於 CURRENT_STATE，對應 T21（結構化）與 T20（FAQ／攻略文章）方向。

## 完成定義對照

- 匯入報告零錯誤：達成（兩輪皆 0 錯誤）。
- 人工抽點通過：達成（本輪對話期間已完成瀏覽器核對）。
- Summary 完成：本文件即為交付物。

任務卡 Scope v1 定義的完成標準已全數達成，任務狀態正式改為「完成」。部署狀態仍為「不適用」（本任務不涉及部署）。
