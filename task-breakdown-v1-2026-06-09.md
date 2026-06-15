# 信用卡優惠查詢網站 Task Breakdown

版本：2026-06-09 / v1  
對應產品規格：credit-card-mvp-spec-v11-2026-06-08  
對應 Schema：schema.prisma 2026-06-08 / v2  
用途：作為正式開工前的技術拆解、環境設定、部署路線與待決事項清單。

## 1. 文件目的

這份文件是產品規格書與實作任務之間的橋接文件。

產品規格書定義「網站要做什麼」，schema 規格定義「資料怎麼存」，Task Breakdown 則定義「開發時要怎麼開始、用哪些工具、先做哪些環境與流程決策」。

本文件不取代產品規格書，也不取代 Prisma schema。它的用途是把技術選型、開發環境、登入方案、部署設定、資料庫切換與 URL 結構整理成可執行的開工依據。

## 2. 技術選型總覽

| 類別 | 選型 | 決定 | 理由 |
|---|---|---|---|
| 前端框架 | Next.js | 採用 | 同時支援前台、後台、SEO metadata、路由與 Vercel 部署。 |
| UI 樣式 | Tailwind CSS | 採用 | 適合快速建立 RWD 版面與後台表單。 |
| ORM | Prisma | 採用 | schema 清楚、可先用 SQLite，未來切 PostgreSQL。 |
| 開發期資料庫 | SQLite | 採用 | 本機低成本、啟動快、不需先租資料庫。 |
| 上線期資料庫 | Neon PostgreSQL | 採用 | 有免費層，適合 Vercel + Prisma。 |
| 後台登入 | NextAuth.js | 採用 | 可搭配 `AdminUser` model 實作單一管理員登入。 |
| 圖片開發期 | `/public` | 採用 | 本機開發簡單，可直接測試卡面圖與 Logo。 |
| 圖片上線期 | Cloudflare R2 | 建議採用 | 物件儲存成本低，適合公開圖片資產。 |
| 部署平台 | Vercel | 採用 | 與 Next.js 整合佳，支援 Git push 觸發部署。 |
| 密碼儲存 | password hash | 採用 | `AdminUser.passwordHash` 不存明文密碼。 |

## 3. 本機開發環境

### 3.1 Node 版本

建議使用：

```text
Node.js 20 LTS
```

理由：

- 與 Next.js、Prisma、Vercel 相容性穩定。
- LTS 版本適合 MVP 與後續部署。

### 3.2 建立步驟

建議開工步驟：

1. 建立 Next.js 專案。
2. 安裝 Tailwind CSS。
3. 安裝 Prisma。
4. 建立 `prisma/schema.prisma`。
5. 將目前 `engineering-data-model-spec/schema.prisma` 作為正式 schema 來源。
6. 建立 `.env`。
7. 執行 Prisma migration 或 `db push`。
8. 建立 seed script。
9. 啟動本機開發伺服器。
10. 確認前台與後台路由可進入。

### 3.3 `.env` 清單

本機開發期建議先準備：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="待產生安全亂數"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="開發期初始密碼"
```

未來若接 Cloudflare R2，可再加入：

```env
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_BASE_URL=""
```

### 3.4 啟動確認清單

本機啟動後需確認：

- 首頁可開啟。
- 分類頁可開啟。
- 搜尋頁可開啟。
- 銀行頁可開啟。
- 信用卡頁可開啟。
- 優惠詳情頁可開啟。
- 後台登入頁可開啟。
- 管理員 seed 帳號可登入。
- Prisma 可以讀取 SQLite。
- 圖片路徑可從 `/public` 正常載入。

## 4. 後台驗證方案

後台驗證採用 NextAuth.js 搭配 `AdminUser` model。

### 4.1 使用的 model

對應 schema：

```prisma
model AdminUser {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  displayName  String?
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([isActive])
}
```

### 4.2 登入邏輯

建議流程：

1. 使用者在後台登入頁輸入 email 與 password。
2. NextAuth Credentials Provider 查詢 `AdminUser.email`。
3. 若帳號不存在，拒絕登入。
4. 若 `isActive = false`，拒絕登入。
5. 使用 password hash 比對密碼。
6. 成功後更新 `lastLoginAt`。
7. 建立後台 session。

### 4.3 Seed 步驟

開發期 seed 建議建立一個管理員：

```text
email: admin@example.com
password: 由 .env ADMIN_PASSWORD 提供
displayName: 系統管理員
isActive: true
```

密碼必須 hash 後寫入 `passwordHash`。

## 5. Vercel + Neon 上線設定

### 5.1 免費層說明

建議 MVP 上線先使用：

- Vercel 免費層部署 Next.js。
- Neon 免費層提供 PostgreSQL。
- Cloudflare R2 儲存公開圖片。

免費層適合 MVP 測試，但正式營運前需檢查流量、儲存量、冷啟動與資料庫限制。

### 5.2 部署觸發方式

建議使用 Git push 觸發部署：

```text
push main branch -> Vercel 自動部署 production
push preview branch -> Vercel 自動部署 preview
```

### 5.3 Vercel 環境變數

上線期至少需要：

```env
DATABASE_URL="Neon PostgreSQL connection string"
NEXTAUTH_URL="https://正式網域"
NEXTAUTH_SECRET="正式環境安全亂數"
```

若使用 Cloudflare R2：

```env
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_BASE_URL=""
```

## 6. SQLite → PostgreSQL 切換流程

| 步驟 | SQLite 開發期 | PostgreSQL 上線期 |
|---|---|---|
| 1 | 確認本機功能完成 | 建立 Neon 專案 |
| 2 | `DATABASE_URL="file:./dev.db"` | 取得 Neon PostgreSQL connection string |
| 3 | schema datasource 使用 SQLite | schema datasource 改為 PostgreSQL |
| 4 | 本機 seed 測試資料 | 準備正式 seed 或匯入資料 |
| 5 | 本機執行 migration 或 db push | 對 Neon 執行 migration |
| 6 | 檢查 CRUD、排序、登入 | 檢查 production CRUD、排序、登入 |
| 7 | 圖片可用 `/public` | 圖片改用公開 URL 或 R2 |
| 8 | 本機測試完成 | Vercel 設定環境變數並部署 |

切換時要特別注意：

- SQLite 與 PostgreSQL 型別支援不同。
- 目前 schema 先不用 enum，是為了降低切換風險。
- 切換前需確認 migration 是否可重現。

## 7. 圖片策略

### 7.1 開發期 `/public`

開發期圖片放在 Next.js 專案的 `/public`。

範例：

```text
/public/uploads/cards/cube-card.png
/public/uploads/banks/cathay-logo.png
```

資料庫只存：

```text
/uploads/cards/cube-card.png
/uploads/banks/cathay-logo.png
```

### 7.2 上線期 Cloudflare R2

上線期建議使用 Cloudflare R2 儲存圖片，資料庫改存公開 URL。

範例：

```text
https://assets.example.com/cards/cube-card.png
https://assets.example.com/banks/cathay-logo.png
```

對應欄位：

- `Bank.logoUrl`
- `Card.imageUrl`

圖片 alt text 對應：

- `Bank.logoAlt`
- `Card.imageAlt`

## 8. URL 結構表

### 8.1 前台路由

| 頁面 | URL | 說明 |
|---|---|---|
| 首頁 | `/` | 搜尋、分類入口、精選優惠、最新優惠、SEO/FAQ 區塊 |
| 分類列表頁 | `/categories/[slug]` | 顯示單一分類下的優惠列表 |
| 搜尋結果頁 | `/search` | 關鍵字搜尋與篩選結果 |
| 銀行頁 | `/banks/[slug]` | 銀行介紹、該銀行卡片、該銀行優惠 |
| 信用卡頁 | `/cards/[slug]` | 卡片資訊、適合族群、關聯優惠 |
| 優惠詳情頁 | `/offers/[slug]` | 優惠完整條件、來源、最後校對時間 |

### 8.2 後台路由

| 頁面 | URL | 說明 |
|---|---|---|
| 後台登入 | `/admin/login` | 管理員登入 |
| 儀表板 | `/admin` | 統計、待處理提醒、快捷操作 |
| 銀行管理 | `/admin/banks` | 銀行列表、新增、編輯 |
| 銀行編輯 | `/admin/banks/[id]` | 單筆銀行資料維護 |
| 信用卡管理 | `/admin/cards` | 信用卡列表、新增、編輯 |
| 信用卡編輯 | `/admin/cards/[id]` | 單筆信用卡資料維護 |
| 分類管理 | `/admin/categories` | 分類列表、新增、編輯 |
| 分類編輯 | `/admin/categories/[id]` | 單筆分類資料維護 |
| 優惠管理 | `/admin/offers` | 優惠列表、篩選、上架狀態 |
| 優惠編輯 | `/admin/offers/[id]` | 單筆優惠完整編輯 |
| 設定 | `/admin/settings` | 全站設定與 SEO 預設值 |

## 9. 開工前待決定事項

| 項目 | 目前狀態 | 建議完成時間 |
|---|---|---|
| 正式專案資料夾位置 | 尚未建立 Next.js 專案 | Phase 0 前 |
| Node 版本 | 建議 Node 20 LTS | Phase 0 前 |
| UI 元件策略 | 尚未決定是否使用現成 component library | Phase 1 前 |
| 後台表單樣式 | 尚未決定 | Phase 1 前 |
| Seed data 內容 | 尚未建立 | Phase 1 前 |
| 圖片命名規則 | 尚未定稿 | Phase 1 前 |
| Cloudflare R2 是否立即使用 | 建議上線期再接 | Phase 3 前 |
| Neon 專案建立 | 尚未建立 | Phase 3 前 |
| 正式網域 | 尚未決定 | Phase 3 前 |
| canonical URL | MVP 不進資料庫，由系統依 slug 產生 | 已決定 |
| 首頁 FAQ | MVP 不進資料庫，由前端靜態維護 | 已決定 |

## 10. 版本說明

| 文件 | 版本 | 日期 | 說明 |
|---|---|---|---|
| 產品規格書 | credit-card-mvp-spec-v11 | 2026-06-08 | 補強 FAQ、SEO、canonical、schema 命名對應 |
| Prisma schema | schema.prisma v2 | 2026-06-08 | `Bank`、`Card` 補 SEO 欄位 |
| Schema 規格說明書 | prisma-schema-spec-v2 | 2026-06-08 | 說明 schema v2 與產品規格 v11 對應 |
| Task Breakdown | task-breakdown-v1 | 2026-06-09 | 本文件，整理開工技術拆解與流程 |
