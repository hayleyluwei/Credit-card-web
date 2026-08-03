# schema 修正清單 2026-08-03-postgresql（v8，datasource 改為 PostgreSQL）

依 `schema修改流程.md` 產出。對應：T18 第一版部署上線（`docs/implementation/tasks/T18-FIRST_RELEASE_DEPLOYMENT_第一版部署上線.md`，Scope v1 已核准 2026-07-30），Scope v1 第一項「PostgreSQL 遷移」的 datasource 調整步驟。前一版：v7（`schema-checklist-2026-07-30-badge.md`）。

## 本次背景

部署平台採 Vercel Hobby（無伺服器）＋ Neon Free（PostgreSQL），無伺服器環境無法使用 SQLite 檔案資料庫，需將 datasource provider 改為 PostgreSQL。逐一檢查現有全部欄位型別（`Int`／`String`／`Boolean`／`DateTime`，無 enum、無 SQLite 專屬型態），確認可直接對應，不需要調整任何欄位定義。

## `schema.prisma` 要改什麼

1. `datasource db` 區塊的 `provider` 從 `"sqlite"` 改為 `"postgresql"`。
2. 檔頭版本註解升級為 `v8 / 2026-08-03`，`Schema Spec` 指向 `prisma-schema-spec-v8-2026-08-03.md`，`Database` 說明改為 PostgreSQL（Neon），補上 v8 變更說明。
3. 其餘 model、欄位、relation、index、default value 全部不變。

## 一併處理的程式碼（非 schema）

- 無。本次僅改 datasource 宣告，不涉及前後台程式碼。

## schema 規格說明書要改什麼

- 新增 `prisma-schema-spec-v8-2026-08-03.md`：說明為何改 provider、型別相容性檢查結果、對本機開發環境的影響。

## 版本備份檔

- `schema-v8-2026-08-03.prisma`（＝本次修改後的 `prisma/schema.prisma`）。

## 使用者確認紀錄

- 使用者於 2026-08-03 對話中確認本清單，確認後才開始修改檔案，符合 `schema修改流程.md` 第 7 條。

## format / validate / db push

- `npx prisma format` → 已執行，無格式異動（原檔已符合格式）。
- `npx prisma validate` → 已執行，通過。
- `npx prisma db push` → **本次不執行**：`.env` 的 `DATABASE_URL` 仍指向本機 SQLite 檔案，尚未建立 Neon 資料庫連線，需待 T18 下一步（建立 Neon 專案並取得連線字串）完成後才能執行，避免連線失敗或誤連錯資料庫。

## MVP 範圍檢查

- 僅改 datasource provider 宣告，未修改任何 model／欄位／relation／index／default value。
- `prisma/schema.prisma` 與 `engineering-data-model-spec/schema.prisma` 已核對一致。
