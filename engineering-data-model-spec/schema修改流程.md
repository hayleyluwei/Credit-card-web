# schema.prisma 修改流程

日期：2026-06-08

用途：作為後續修改 `schema.prisma`、schema 版本備份檔與 schema 規格說明書時的固定搭配流程。

## 固定流程

1. 先讀 `engineering-data-model-spec/schema修正原則.md`。
2. 再讀目前正式執行檔 `engineering-data-model-spec/schema.prisma`。
3. 再讀目前最新版 schema 規格說明書，例如 `engineering-data-model-spec/prisma-schema-spec-v1-2026-06-07.md`。
4. 再讀 schema 修正清單。固定讀取 `schema-checklist`，若後面有加上日期，例如 `schema-checklist-2026-06-08` 或 `schema-checklist-2026-06-08.md`，也要依日期順序讀取。
5. 若有其他討論清單或本次修正清單，先讀該清單。
6. 列出本次要修改的清單，清單需明確分成：
   - `schema.prisma` 要改什麼。
   - schema 規格說明書要改什麼。
   - 是否要新增版本備份檔。
   - 是否需要執行 format 或 validate。
7. 等使用者確認清單後，才開始修改檔案。
8. 只修改清單內有提到的內容。
9. 不修改任何與清單無關的 model、欄位、relation、index、default value、註解或規格文字。
10. 修改正式執行檔 `schema.prisma`。
11. 同步修改同版號 schema 規格說明書 `prisma-schema-spec-v版本號-日期.md`。
12. 另存 schema 版本備份檔 `schema-v版本號-日期.prisma`。
13. 修改完成後檢查：
    - model 順序。
    - 欄位順序。
    - relation。
    - index。
    - default value。
    - 是否新增超出 MVP 範圍內容。
    - 中文是否亂碼。
    - `schema.prisma` 與規格說明書是否同步。
14. 若專案已有 Prisma 或 Node 環境，執行 Prisma format 或 validate；若沒有環境，不擅自下載套件，先回報使用者。
15. 最後回報本次修改內容，並列出產出的檔案。

## 版本檔案命名

- 正式執行檔固定維持為 `schema.prisma`。
- schema 版本備份檔命名規則為 `schema-v版本號-日期.prisma`，例如 `schema-v5-2026-06-08.prisma`。
- schema 規格說明書命名規則為 `prisma-schema-spec-v版本號-日期.md`，例如 `prisma-schema-spec-v5-2026-06-08.md`。
- schema 修正清單命名規則為 `schema-checklist-yyyy-mm-dd.md`，例如 `schema-checklist-2026-06-08.md`。

## 使用方式

之後若要修改 schema，可直接要求：

```text
請依 schema 修改流程執行
```
