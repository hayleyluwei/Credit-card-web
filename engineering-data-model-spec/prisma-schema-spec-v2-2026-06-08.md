# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-06-08 / v2  
對應產品規格：credit-card-mvp-spec-v11-2026-06-08  
對應 schema 檔案：schema.prisma  
目標：個人開發者、MVP、低成本、可先在本機完成

## 1. 這份文件的用途

這份文件說明 `schema.prisma` 如何支撐信用卡優惠查詢網站 MVP。

產品規格書回答「網站要長什麼樣、後台要怎麼操作」。  
這份 Prisma Schema 規格回答「資料要怎麼存、資料之間怎麼關聯、哪些欄位會影響前台、後台、SEO 與排序」。

本版依 `schema-checklist-2026-06-08.md` 修正，重點是：

- `Bank` 補上 SEO 欄位。
- `Card` 補上 SEO 欄位。
- MVP 先不新增 `canonicalUrl`。
- 明確說明產品規格中的 `faq` 在 Prisma schema 中對應 `faqJson`。
- 明確說明產品規格使用 snake_case，Prisma schema 使用 camelCase。
- MVP 先不新增 `SiteSetting.homepageFaqJson`。

## 2. 命名規則對應

產品規格書為了讓非工程背景讀者容易理解，使用 snake_case 表達資料概念，例如：

- `seo_title`
- `seo_description`
- `image_url`
- `is_featured`
- `recommend_score`
- `sort_order`

Prisma schema 則使用 camelCase，較符合 Prisma Client 與 TypeScript 專案慣例，例如：

- `seoTitle`
- `seoDescription`
- `imageUrl`
- `isFeatured`
- `recommendScore`
- `sortOrder`

所以產品規格中的 `seo_title`，在 Prisma schema 中會寫成 `seoTitle`。兩者是同一個資料概念，不是不同欄位。

## 3. FAQ 欄位對應

`credit-card-mvp-spec-v11-2026-06-08` 中提到的 `faq`，在 Prisma schema 中對應 `faqJson`。

原因是 MVP 階段先用 JSON 字串儲存 FAQ，避免一開始就新增過多資料表。

例如可以存成：

```json
[
  {
    "question": "現金回饋信用卡怎麼選？",
    "answer": "先看常用通路、回饋上限與是否需要登錄。"
  }
]
```

目前有 FAQ 的資料表：

- `Category.faqJson`
- `Offer.faqJson`

未來如果 FAQ 資料量變多，或需要獨立管理排序、上下架、結構化資料，可再拆成 `FaqItem` model。

## 4. 本版不新增的欄位

### 4.1 MVP 先不新增 canonicalUrl

本版不在 `Offer`、`Category`、`Bank`、`Card` 或 `SiteSetting` 新增 `canonicalUrl`。

初期 canonical URL 由系統依 site base URL 與各頁 `slug` 自動產生，例如：

```text
/categories/cashback
/banks/cathay
/cards/cube-card
/offers/cube-cashback
```

這樣可以避免後台多一個容易填錯的 SEO 欄位，也降低 MVP 資料治理成本。

未來如果出現多個 URL 指向同一內容、slug 改名、重複內容或 SEO 精修需求，再評估新增 `canonicalUrl` 或 `Redirect` model。

### 4.2 MVP 先不新增 SiteSetting.homepageFaqJson

首頁 FAQ 初期由前端靜態內容維護，不進資料庫。

原因是首頁 FAQ 雖然對 SEO 與 AI 搜尋有幫助，但若在 MVP 初期放進 `SiteSetting`，後台設定頁會提早增加 FAQ 編輯區與 JSON 維護成本。

未來如果需要讓後台維護首頁 FAQ，再於 `SiteSetting` 新增：

```prisma
homepageFaqJson String?
```

此欄位未來擴充容易，因為它是 nullable 欄位，不影響既有 relation。

## 5. 低成本 MVP 設計原則

### 5.1 初期使用 SQLite

初期建議使用 SQLite，原因是：

- 不需要先租資料庫。
- 不需要自己架伺服器。
- 一個檔案就能當資料庫，適合個人開發。
- Prisma 可以之後再切換到 PostgreSQL。

`.env` 初期可以這樣設定：

```env
DATABASE_URL="file:./dev.db"
```

### 5.2 圖片不直接存進資料庫

信用卡卡面圖、銀行 Logo 不直接存圖片檔本體。

資料庫只存圖片路徑或公開網址，例如：

- `/uploads/cards/cube-card.png`
- `/uploads/banks/cathay-logo.png`
- 未來的公開圖片網址

### 5.3 SQLite 版本先不用 enum

Prisma 在不同資料庫對 enum 的支援與遷移細節不同。為了讓 MVP 先順利完成，本版把 `summaryMode`、`rewardType` 這類選項先設計成 `String`。

後台畫面仍然可以用下拉選單限制選項，例如：

- `summaryMode`: `system` 或 `manual`
- `rewardType`: `cashback`、`points`、`miles`、`installment`、`other`

## 6. Prisma Schema

實際 schema 檔案位置：

```text
engineering-data-model-spec/schema.prisma
```

完整內容如下：

```prisma
// Credit Card MVP - Prisma Schema
// Version: 2026-06-08 / v2
// Product Spec: credit-card-mvp-spec-v11-2026-06-08
// Schema Spec: prisma-schema-spec-v2-2026-06-08.md
// Target: personal developer MVP, low-cost setup
// Database: SQLite for local MVP development

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

/// Site-wide settings used by the frontend and admin defaults.
model SiteSetting {
  id                    Int      @id @default(autoincrement())
  siteName              String   @default("信用卡優惠查詢")
  defaultSeoTitle       String?
  defaultSeoDescription String?
  homepageFeaturedCount Int      @default(6)
  categoryPageSize      Int      @default(12)
  showExpiredOffers     Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

/// Admin account for the MVP back office.
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

/// Bank issuer data used for filtering, card ownership, and bank pages.
model Bank {
  id             Int      @id @default(autoincrement())
  name           String
  slug           String   @unique
  logoUrl        String?
  logoAlt        String?
  websiteUrl     String?
  description    String?
  seoTitle       String?
  seoDescription String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  cards Card[]

  @@index([isActive])
}

/// Credit card data. Offers are attached through OfferCard.
model Card {
  id             Int      @id @default(autoincrement())
  bankId         Int
  name           String
  slug           String   @unique
  imageUrl       String?
  imageAlt       String?
  summary        String?
  description    String?
  targetAudience String?
  seoTitle       String?
  seoDescription String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  bank   Bank        @relation(fields: [bankId], references: [id], onDelete: Restrict)
  offers OfferCard[]

  @@index([bankId])
  @@index([isActive])
}

/// Frontend offer category, including SEO and FAQ metadata.
model Category {
  id             Int      @id @default(autoincrement())
  name           String
  slug           String   @unique
  iconName       String?
  description    String?
  seoTitle       String?
  seoDescription String?
  faqJson        String?
  isActive       Boolean  @default(true)
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  offers Offer[]

  @@index([isActive, sortOrder])
}

/// Main credit-card offer content shown on listing and detail pages.
model Offer {
  id             Int     @id @default(autoincrement())
  categoryId     Int
  title          String
  slug           String  @unique
  summary        String?
  summaryMode    String  @default("system")
  targetAudience String?
  highlight1     String?
  highlight2     String?
  manualSummary  String?
  summaryPreview String?
  description    String?

  startDate      DateTime?
  endDate        DateTime?
  rewardType     String?
  rewardValue    String?
  rewardCap      String?
  minSpend       String?
  conditions     String?
  sourceUrl      String?
  lastVerifiedAt DateTime?
  tags           String?

  seoTitle       String?
  seoDescription String?
  faqJson        String?

  isFeatured     Boolean @default(false)
  recommendScore Int     @default(0)
  sortOrder      Int     @default(0)
  isPublished    Boolean @default(false)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  category Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  cards    OfferCard[]

  @@index([categoryId])
  @@index([isPublished, isFeatured, recommendScore, sortOrder, updatedAt])
  @@index([endDate])
}

/// Join table for the many-to-many relation between offers and cards.
model OfferCard {
  offerId Int
  cardId  Int

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)
  card  Card  @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@id([offerId, cardId])
  @@index([cardId])
}
```

## 7. Model 白話說明

### 7.1 SiteSetting：全站設定

`SiteSetting` 存網站整體設定，例如網站名稱、預設 SEO、首頁精選數量、分類頁每頁筆數與是否顯示過期優惠。

本版不新增 `homepageFaqJson`。首頁 FAQ 初期由前端靜態內容維護。

### 7.2 AdminUser：後台管理員

`AdminUser` 是可以登入後台的人。MVP 階段可以只有一個管理員，不需要先做複雜角色權限。

### 7.3 Bank：銀行

`Bank` 是銀行資料，例如台新銀行、國泰世華、台北富邦。

本版新增：

| 欄位 | 白話意思 |
|---|---|
| seoTitle | 銀行頁 SEO 標題，可人工覆寫 |
| seoDescription | 銀行頁 SEO 描述，可人工覆寫 |

新增這兩個欄位的原因是 `credit-card-mvp-spec-v11-2026-06-08` 已將銀行頁列為正式前台頁面，且 SEO metadata 來源包含銀行資料。

### 7.4 Card：信用卡

`Card` 是信用卡本身，例如 CUBE 卡、太陽卡、J 卡。

本版新增：

| 欄位 | 白話意思 |
|---|---|
| seoTitle | 信用卡頁 SEO 標題，可人工覆寫 |
| seoDescription | 信用卡頁 SEO 描述，可人工覆寫 |

新增這兩個欄位的原因是信用卡頁也是固定可收錄 URL，後台需要有能力針對單張信用卡調整搜尋標題與描述。

### 7.5 Category：分類

`Category` 是前台分類入口，例如現金回饋、網購、旅遊、海外消費。  
分類頁已有 `seoTitle`、`seoDescription` 與 `faqJson`。

### 7.6 Offer：優惠

`Offer` 是最重要的表，代表一筆信用卡優惠。  
優惠頁已有 `seoTitle`、`seoDescription` 與 `faqJson`。

### 7.7 OfferCard：優惠與信用卡的關聯

`OfferCard` 是連接表。  
一筆優惠可能適用多張信用卡，一張信用卡也可能有很多優惠，所以需要多對多關聯。

## 8. 關聯說明

### 8.1 一家銀行有多張信用卡

```text
Bank 1 --- many Card
```

意思是：

- 一家銀行可以發很多張信用卡。
- 每張信用卡只屬於一家銀行。

### 8.2 一個分類有多筆優惠

```text
Category 1 --- many Offer
```

意思是：

- 現金回饋分類底下可以有很多優惠。
- 一筆優惠主要歸屬一個分類。

### 8.3 優惠與信用卡是多對多

```text
Offer many --- many Card
```

中間用 `OfferCard` 連接。

## 9. 路由與 SEO 對應

| 前台頁面 | 主要資料 | SEO 欄位 |
|---|---|---|
| `/` | SiteSetting、Category、Offer | `defaultSeoTitle`、`defaultSeoDescription` |
| `/categories/[slug]` | Category、Offer | `Category.seoTitle`、`Category.seoDescription` |
| `/banks/[slug]` | Bank、Card、Offer | `Bank.seoTitle`、`Bank.seoDescription` |
| `/cards/[slug]` | Card、Bank、Offer | `Card.seoTitle`、`Card.seoDescription` |
| `/offers/[slug]` | Offer、Category、Card、Bank | `Offer.seoTitle`、`Offer.seoDescription` |
| `/search` | Offer、Card、Bank、Category | 系統產生 |

`slug` 是固定 URL 的基礎。canonical URL 初期由系統依 `slug` 自動產生，不另存入資料庫。

## 10. 排序規則對應

前台分類頁與首頁精選建議用這個排序：

```text
isFeatured -> recommendScore -> sortOrder -> updatedAt
```

白話意思：

1. 先看是不是本站推薦。
2. 再看推薦分數高不高。
3. 分數一樣時，看人工排序。
4. 還是一樣時，看最後更新時間。

## 11. 後續可擴充但不急著做的 Model 或欄位

以下先不放進 MVP schema，避免初期過度設計：

| 未來項目 | 用途 | 為什麼先不做 |
|---|---|---|
| `AuditLog` | 記錄誰改了什麼 | MVP 只有單一管理者，可以先不做 |
| `FaqItem` | FAQ 正規化資料表 | 初期用 `faqJson` 夠用 |
| `Tag` / `OfferTag` | 標籤系統 | 初期 `tags` 字串夠用 |
| `CrawlSource` | 爬蟲來源設定 | 第二階段才做爬蟲 |
| `ImportJob` | 匯入任務紀錄 | 第二階段才需要 |
| `Redirect` | slug 改名後轉址 | 初期可先避免修改 slug |
| `canonicalUrl` | 人工覆寫 canonical | 初期由系統依 `slug` 產生 |
| `SiteSetting.homepageFaqJson` | 後台維護首頁 FAQ | 初期由前端靜態內容維護 |

## 12. 初期 Seed Data 建議

為了開發與測試畫面，建議先準備：

- 3 到 5 家銀行
- 8 到 12 張信用卡
- 6 個分類
- 20 筆優惠
- 1 筆 SiteSetting
- 1 個 AdminUser

這樣才能測試首頁精選、分類列表、搜尋結果、優惠詳情、銀行頁、信用卡頁、後台 CRUD、排序、RWD 卡片高度與空狀態。

## 13. 給非 IT 背景的總結

這份 schema 可以想成網站的「資料倉庫分類方式」。

本版補強銀行頁與信用卡頁的 SEO 欄位，讓固定頁面更適合搜尋引擎與 AI 搜尋理解。

同時，本版刻意不新增 `canonicalUrl` 與 `homepageFaqJson`，因為這兩項可以先由系統或前端處理，未來需要後台維護時再擴充即可。

這樣做的好處是：

- 個人開發者可以先用低成本完成 MVP。
- 後台管理者可以維護銀行、信用卡、分類、優惠與 SEO。
- 前台主要頁面都有足夠資料可以顯示。
- 未來要上雲、換 PostgreSQL、補 canonical 或首頁 FAQ 時，不需要整個重做。
