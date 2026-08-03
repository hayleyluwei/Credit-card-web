# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-08-03 / v8
對應產品規格：credit-card-mvp-spec-v11-2026-06-08
對應 schema 檔案：schema.prisma
對應任務：T18 第一版部署上線（`docs/implementation/tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md`，Scope v1 已核准）
對應修正清單：schema-checklist-2026-08-03-postgresql.md
前一版：prisma-schema-spec-v7-2026-07-30.md

## 1. 這份文件的用途

本文件只說明 **v8 相對於 v7 的變更**。既有 model 結構不變，仍以前幾版規格書為準。

## 2. v8 的唯一變更：datasource provider 從 SQLite 改為 PostgreSQL

```prisma
datasource db {
  provider = "postgresql"   // 原本是 "sqlite"
  url      = env("DATABASE_URL")
}
```

## 3. 為什麼要改

第一版上線（T18）採用 Vercel Hobby（無伺服器平台）＋ Neon Free（PostgreSQL）。Vercel 的無伺服器環境沒有可寫入的本機檔案系統，無法使用 SQLite 檔案資料庫，因此正式環境必須改用雲端的 PostgreSQL；本機開發環境同步改用同一個 provider，避免正式與本機使用不同資料庫類型造成行為落差。

## 4. 型別相容性檢查

逐一檢查目前所有 model 的欄位型別，確認全部可直接對應到 PostgreSQL，不需要調整任何欄位定義：

| 用到的型別 | 對應 PostgreSQL 型態 | 備註 |
|---|---|---|
| `Int` / `Int @id @default(autoincrement())` | `INTEGER` / `SERIAL` | 直接對應 |
| `String` / `String?` | `TEXT` | 直接對應；`faqJson`／`prosJson`／`consJson`／`conditions` 等 JSON 內容也是用 `String` 存文字，非 Prisma 原生 `Json` 型別，維持既有做法不變 |
| `Boolean` | `BOOLEAN` | 直接對應 |
| `DateTime` / `DateTime?` | `TIMESTAMP` | 直接對應 |

沒有使用 Prisma enum（`capPeriod`／`rewardType` 等維持 String，為 T21 已拍板決策），沒有使用任何 SQLite 專屬型態，因此本次**不需要修改任何欄位、model、relation、index 或 default value**。

## 5. 對本機開發環境的影響

`DATABASE_URL` 改指向 PostgreSQL 連線字串後，本機才能重新執行 `prisma db push`／`prisma migrate`／`npm run dev` 等需要連線的指令；`prisma format`／`prisma validate` 不需要連線，不受影響。詳見 T18 部署流程中「建立 Neon 專案並取得連線字串」步驟。

## 6. 版本備份

- 正式執行檔：`schema.prisma`（＝`prisma/schema.prisma`）。
- 本版備份：`engineering-data-model-spec/schema-v8-2026-08-03.prisma`。
- 修正清單：`engineering-data-model-spec/schema-checklist-2026-08-03-postgresql.md`。
- 資料庫備份：本次未動本機資料內容，僅改 schema 的 datasource 宣告，不涉及資料寫入，故不需要另外備份 `prisma/dev.db`。
