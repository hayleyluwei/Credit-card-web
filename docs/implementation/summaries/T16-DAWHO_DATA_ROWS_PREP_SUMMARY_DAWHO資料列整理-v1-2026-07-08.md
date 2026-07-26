# T16 DAWHO 資料列整理摘要

版本：v1  
日期：2026-07-08（Asia/Taipei）  
狀態：完成資料整理與本機 SQLite 寫入，未部署

## 完成內容

- 依 `docs/data-collection/` 規格，將永豐 DAWHO 相關資料寫入試算表模板：
  - `banks`：永豐銀行。
  - `cards`：DAWHO現金回饋信用卡。
  - `offers`：兩筆優惠。
    - `dawho-general-cashback-2026h2`：現金回饋分類。
    - `dawho-easycard-autoload-cashback-2026h2`：交通通勤分類。
  - `offer_cards`：兩筆優惠皆對應 `dawho-cashback-card`。
- 更新 `prisma/seed.mjs` 中既有 DAWHO 兩筆 offer，將測試語氣改為正式資料內容，並分別放入：
  - `cashback`
  - `transport`
- 讓 seed offer 可使用每筆資料自己的 `lastVerifiedAt`；未填者仍維持原本預設值。
- 使用者核准 T16 v1 後，已備份並寫入本機 SQLite 開發資料庫。
- 本機 DB 已更新／新增：
  - `dawho-general-cashback-2026h2` → `cashback`
  - `dawho-easycard-autoload-cashback-2026h2` → `transport`
- 已確認兩筆資料皆對應 `dawho-cashback-card` 並為公開狀態。
- 已確認舊 slug 未殘留：
  - `dawho-high-cashback-2026`
  - `dawho-easycard-autoload-2026`

## 修改檔案

- `docs/data-collection/信用卡優惠資料整理模板-v1-2026-07-08.xlsx`
- `prisma/seed.mjs`
- `prisma/dev.db`（本機 SQLite 開發資料庫，未進 Git）
- `docs/implementation/tasks/T16-FIRST_RELEASE_DATA_IMPORT_第一版正式資料匯入.md`
- `CURRENT_STATE_目前專案狀態.md`

## 來源與查證

- 官方來源：`https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html`
- 查證日期：2026-07-08

## DB 備份

- 備份檔：`prisma/backups/dev-before-t16-dawho-20260708-225216.db`
- 備份檔受 `.gitignore` 的 `*.db` 規則排除，不進 Git。

## 驗證

- `node --check prisma/seed.mjs`：通過。
- `git diff --check -- prisma/seed.mjs docs/data-collection/信用卡優惠資料整理模板-v1-2026-07-08.xlsx`：通過；僅有 Git 行尾轉換提醒。
- Excel 已用 workbook inspect 確認四個資料表資料列位於正確欄位，並產生渲染預覽檢查。
- 本機 DB 寫入腳本：成功更新兩筆 DAWHO offer。
- 本機 DB 讀取驗證：成功確認新 slug、分類、卡片對應、官方來源、發布狀態；舊 slug 無殘留。

## 未執行

- 未啟動 dev server。
- 未執行 lint/build/smoke；目前驗證政策仍未核准這些指令分類。
- 未 git add、commit、push 或部署。

## 後續

- 若要以瀏覽器人工驗收，需啟動 dev server 後檢查：
  - `/categories/cashback`
  - `/categories/transport`
  - `/offers/dawho-general-cashback-2026h2`
  - `/offers/dawho-easycard-autoload-cashback-2026h2`
- 完整 T16 Excel 匯入腳本與全量第一版資料匯入仍待後續執行。
