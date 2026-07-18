# T19 卡片結構化欄位與蒐集規格擴充 Summary

日期：2026-07-18（Asia/Taipei）
任務卡：`docs/implementation/tasks/T19-CARD_STRUCTURED_FIELDS_卡片結構化欄位與蒐集規格擴充.md`（v1 已核准，2026-07-18）
任務狀態：待驗收（等待使用者人工抽點與文件確認）

## 完成內容

### 1. 資料模型（本機 SQLite）

- `prisma/schema.prisma` 的 `Card` 新增六個可選欄位：`annualFee`（年費）、`annualFeeWaiver`（免年費條件）、`cardLevel`（卡片等級）、`cardNetwork`（發卡組織）、`prosJson`（優點，JSON 字串陣列）、`consJson`（注意事項，JSON 字串陣列）。
- 變更前備份：`prisma/backups/dev-before-t19-schema-20260718-160058.db`。
- **與任務卡的差異**：任務卡寫「建立 Prisma migration」，但專案從未建立 migrations 目錄（既有流程是 `prisma db push`），因此沿用 `npx prisma db push` 同步 schema，未新建 migration 基線。新增欄位皆為可選、純加法變更，資料無風險；PostgreSQL 的正式 migration 依原規劃屬 T18。
- 已驗證：`PRAGMA table_info(Card)` 六個新欄位齊全，既有 10 筆卡片資料完好。

### 2. 前台與後台

- `src/app/cards/[slug]/page.tsx`：卡片資訊區塊條件式顯示卡片等級、發卡組織、年費、免年費條件；新增「優點與注意事項」區塊（兩欄條列，無資料時整塊隱藏）。
- `src/components/AdminCardForm.tsx`（編輯表單）與 `src/app/admin/cards/page.tsx`（新增表單）：新增六個欄位的輸入；優點／注意事項採「一行一項」textarea。
- `src/lib/admin-actions.ts`：`cardData` 寫入新欄位；優缺點由多行文字轉 JSON 陣列（空白轉 null）。
- `src/lib/domain-parsing.ts`：新增 `parseJsonStringArray`、`linesToJsonArray`、`jsonArrayToLines` 三個純函式，前後台共用，無效 JSON 安全退回空陣列。

### 3. 資料蒐集規格與模板

- 規格書升版：`docs/data-collection/DATA_COLLECTION_SPEC_信用卡優惠資料蒐集與分類規格書-v2-2026-07-18.md`；v1 檔頭加註「已被取代」。v2 變更：
  - 5.2 `cards` 工作表新增六欄與填寫原則（優缺點一格內一行一項、只寫可查證事實）。
  - 4.3 新增八個消費情境標籤（使用者核准照草案）：繳稅、學費、水電瓦斯、保費、加油、外送、超市量販、旅遊訂房；含「情境標籤誠實原則」（官網寫排除就不加標籤）。
  - 第 6 節新增第 9 條（優缺點可查證）與第 10 條（情境標籤誠實）；FAQ 新增 Q9（繳稅優惠期間判斷）。
- 模板升版：`docs/data-collection/信用卡優惠資料整理模板-v2-2026-07-18.xlsx`；cards 工作表於「備註」前插入六欄，說明頁改版註記，既有 DAWHO 資料列完整保留。

### 4. 相依協調

- `T16` 任務卡新增「相依備註」：匯入腳本需以 v2 模板為準，cards 六個新欄位與優缺點逐行轉 JSON 的規則已寫明。

## 驗證結果

- `npx prisma db push` 成功、Prisma Client 重新生成。
- `npm run build` 通過（全站編譯與型別檢查）。
- Runtime 冒煙測試（臨時 dev server，port 3105，測後停止）：
  - 首頁與 `/cards/dawho-cashback-card` 均 200。
  - 新欄位皆空時，卡片頁不出現空區塊（符合預期）。
  - 以暫時測試值寫入 DAWHO 卡後，年費、等級、優點（兩項）、注意事項（一項）皆正確渲染；測試後已將該卡六個新欄位還原為 NULL 並驗證。
- 模板 v2 經腳本驗證：欄位順序正確、無公式、資料列保留。

## 未執行（依任務卡）

- 未執行 `git add`、commit、push（不授權）。
- 未回填任何卡片的正式年費／優缺點內容（Non-scope；由整理人員依規格 v2 提供）。
- lint 未單獨執行（build 已含編譯檢查；驗證指令分類仍為 unclassified）。

## 待使用者驗收

1. 後台開任一張卡（`/admin/cards`），填入年費／等級／優點等欄位並儲存，確認前台卡片頁正確顯示。
2. 審閱規格書 v2 與模板 v2，確認可交付給資料整理人員。
3. 驗收通過後，任務狀態由「待驗收」改為「完成」。
