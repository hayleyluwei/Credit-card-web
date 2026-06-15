# 信用卡查詢網站 Prisma Schema 技術規格

版本：2026-06-07 / v1  
對應產品規格：credit-card-mvp-spec-v10-2026-06-07  
目標：個人開發者、MVP、低成本、可先在本機完成

## 1. 這份文件的用途

這份文件不是給一般使用者看的產品介紹，而是給開發時使用的資料模型說明。

產品規格書回答「網站要長什麼樣、後台要怎麼操作」。  
這份 Prisma Schema 規格回答「資料要怎麼存、資料之間怎麼關聯、哪些欄位會影響前台與後台」。

用比較白話的方式說：

- `Bank` 是銀行資料。
- `Card` 是信用卡資料。
- `Category` 是分類資料。
- `Offer` 是優惠資料。
- `OfferCard` 是「哪個優惠對應哪些信用卡」的連接表。
- `SiteSetting` 是全站設定。
- `AdminUser` 是後台管理員帳號。

## 2. 低成本 MVP 設計原則

### 2.1 初期使用 SQLite

初期建議使用 SQLite，原因是：

- 不需要先租資料庫。
- 不需要自己架伺服器。
- 一個檔案就能當資料庫，適合個人開發。
- Prisma 可以之後再切換到 PostgreSQL。

`.env` 初期可以這樣設定：

```env
DATABASE_URL="file:./dev.db"
```

### 2.2 圖片不直接存進資料庫

信用卡卡面圖、銀行 Logo 不直接存圖片檔本體。

資料庫只存：

- `/uploads/cards/cube-card.png`
- `/uploads/banks/cathay-logo.png`
- 或未來的公開圖片網址

這樣比較省錢，也比較好維護。

### 2.3 不強制使用昂貴雲端服務

MVP 階段不預設：

- 昂貴雲端圖片服務
- 付費搜尋服務
- 付費 CMS
- 複雜會員系統
- 複雜權限系統

先把資料維護、前台顯示、SEO、排序做好。

### 2.4 SQLite 版本先不用 enum

Prisma 在不同資料庫對 enum 的支援與遷移細節不同。為了讓個人開發者先順利完成 MVP，本版把像 `summaryMode`、`rewardType` 這類選項先設計成 `String`。

後台畫面仍然可以用下拉選單限制選項，例如：

- `summaryMode`: `system` 或 `manual`
- `rewardType`: `cashback`、`points`、`miles`、`installment`、`other`

這樣資料庫簡單，畫面仍然可控。

## 3. Prisma Schema

實際 schema 檔案位置：

```text
engineering-data-model-spec/schema.prisma
```

完整內容如下：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model AdminUser {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  displayName  String?
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Bank {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  logoUrl     String?
  logoAlt     String?
  websiteUrl  String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  cards Card[]

  @@index([isActive])
}

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
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  bank   Bank        @relation(fields: [bankId], references: [id], onDelete: Restrict)
  offers OfferCard[]

  @@index([bankId])
  @@index([isActive])
}

model Category {
  id             Int      @id @default(autoincrement())
  name           String
  slug           String   @unique
  iconName       String?
  description    String?
  sortOrder      Int      @default(0)
  isActive       Boolean  @default(true)
  seoTitle       String?
  seoDescription String?
  faqJson        String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  offers Offer[]

  @@index([isActive, sortOrder])
}

model Offer {
  id              Int       @id @default(autoincrement())
  categoryId      Int
  title           String
  slug            String    @unique
  summary         String?
  summaryMode     String    @default("system")
  targetAudience  String?
  highlight1      String?
  highlight2      String?
  manualSummary   String?
  summaryPreview  String?
  description     String?
  startDate       DateTime?
  endDate         DateTime?
  rewardType      String?
  rewardValue     String?
  rewardCap       String?
  minSpend        String?
  conditions      String?
  sourceUrl       String?
  lastVerifiedAt  DateTime?
  tags            String?
  isFeatured      Boolean   @default(false)
  recommendScore  Int       @default(0)
  sortOrder       Int       @default(0)
  isPublished     Boolean   @default(false)
  seoTitle        String?
  seoDescription  String?
  faqJson         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  category Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  cards    OfferCard[]

  @@index([categoryId])
  @@index([isPublished, isFeatured, recommendScore, sortOrder, updatedAt])
  @@index([endDate])
}

model OfferCard {
  offerId Int
  cardId  Int

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)
  card  Card  @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@id([offerId, cardId])
  @@index([cardId])
}

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
```

## 4. Model 白話說明

### 4.1 AdminUser：後台管理員

`AdminUser` 是可以登入後台的人。

MVP 階段可以只有一個管理員，不需要先做複雜角色權限。

| 欄位 | 白話意思 |
|---|---|
| email | 登入後台用的 Email |
| passwordHash | 加密後的密碼，不存明文密碼 |
| displayName | 管理者顯示名稱 |
| isActive | 這個帳號是否啟用 |
| lastLoginAt | 最後登入時間 |

給老闆的說法：  
這張表是「後台鑰匙」。誰能進後台，就在這裡管理。

### 4.2 Bank：銀行

`Bank` 是銀行資料，例如台新銀行、國泰世華、台北富邦。

| 欄位 | 白話意思 |
|---|---|
| name | 銀行名稱 |
| slug | 網址用代碼，例如 `cathay` |
| logoUrl | 銀行 Logo 圖片路徑或網址 |
| logoAlt | Logo 的替代文字，給 SEO 和無障礙使用 |
| websiteUrl | 銀行官網 |
| description | 銀行介紹 |
| isActive | 是否啟用 |

前台會用在：

- 銀行篩選
- 信用卡卡片上的銀行名稱
- 銀行頁 `/banks/[slug]`

後台會用在：

- 銀行管理
- 信用卡新增時選擇所屬銀行

給老闆的說法：  
這張表像是銀行名片庫。每張信用卡都要知道它是哪一家銀行發的。

### 4.3 Card：信用卡

`Card` 是信用卡本身，例如 CUBE 卡、太陽卡、J 卡。

| 欄位 | 白話意思 |
|---|---|
| bankId | 這張卡屬於哪家銀行 |
| name | 信用卡名稱 |
| slug | 信用卡頁網址代碼 |
| imageUrl | 卡面圖路徑或網址 |
| imageAlt | 卡面圖替代文字 |
| summary | 卡片簡短介紹 |
| description | 卡片較完整介紹 |
| targetAudience | 適合族群 |
| isActive | 是否啟用 |

前台會用在：

- 分類頁卡片
- 優惠詳情頁
- 信用卡頁 `/cards/[slug]`
- 銀行頁的信用卡列表

後台會用在：

- 信用卡管理
- 優惠編輯時關聯信用卡

給老闆的說法：  
這張表是「信用卡資料庫」。它記錄卡片本身，但優惠活動不直接寫在這裡，因為同一張卡可能有很多不同優惠。

### 4.4 Category：分類

`Category` 是前台分類入口，例如現金回饋、網購、旅遊、海外消費。

| 欄位 | 白話意思 |
|---|---|
| name | 分類名稱 |
| slug | 分類網址代碼 |
| iconName | 分類 icon 名稱 |
| description | 分類說明 |
| sortOrder | 分類排序 |
| isActive | 是否顯示 |
| seoTitle | 分類頁 SEO 標題 |
| seoDescription | 分類頁 SEO 描述 |
| faqJson | FAQ 資料，先用 JSON 文字存 |

前台會用在：

- 首頁分類入口
- 分類列表頁 `/categories/[slug]`
- SEO 與 FAQ

後台會用在：

- 分類管理
- 優惠編輯時選擇分類

給老闆的說法：  
這張表是網站的「貨架分類」。使用者想找現金回饋或旅遊卡，就是從這裡進去。

### 4.5 Offer：優惠

`Offer` 是最重要的表，代表一筆信用卡優惠。

例如：

- CUBE 卡指定通路最高 3%
- 太陽卡一般消費最高 5%
- J 卡旅遊場景最高 5%

| 欄位 | 白話意思 |
|---|---|
| categoryId | 這筆優惠屬於哪個分類 |
| title | 優惠標題 |
| slug | 優惠詳情頁網址代碼 |
| summary | 一般摘要 |
| summaryMode | 使用系統摘要或人工摘要 |
| targetAudience | 適合族群 |
| highlight1 / highlight2 | 兩個主優勢 |
| manualSummary | 人工覆寫摘要 |
| summaryPreview | 前台列表真正顯示的二行摘要 |
| description | 詳細說明 |
| startDate / endDate | 優惠開始與結束時間 |
| rewardType | 回饋類型 |
| rewardValue | 回饋數值，例如最高 3% |
| rewardCap | 回饋上限 |
| minSpend | 最低消費門檻 |
| conditions | 適用條件 |
| sourceUrl | 官方來源網址 |
| lastVerifiedAt | 最後校對時間 |
| tags | 標籤，MVP 先用逗號字串 |
| isFeatured | 是否本站推薦 |
| recommendScore | 推薦分數 |
| sortOrder | 人工排序 |
| isPublished | 是否上架 |
| seoTitle / seoDescription | SEO 欄位 |
| faqJson | 優惠 FAQ |

前台會用在：

- 首頁精選優惠
- 分類列表頁
- 搜尋結果頁
- 優惠詳情頁 `/offers/[slug]`
- SEO、JSON-LD、FAQ

後台會用在：

- 優惠管理列表
- 單筆優惠編輯
- 上架 / 下架
- 預覽
- 排序
- 來源校對

給老闆的說法：  
這張表是網站的「內容主體」。網站上真正吸引用戶看的內容，大部分都來自這張表。

### 4.6 OfferCard：優惠與信用卡的關聯

`OfferCard` 是連接表。

為什麼需要它？因為一筆優惠可能適用多張信用卡，一張信用卡也可能有很多優惠。

例子：

- 「國泰指定通路回饋」可能適用 CUBE 卡與 CUBE COMBO 卡。
- CUBE 卡本身也可能同時有網購優惠、旅遊優惠、行動支付優惠。

給老闆的說法：  
這張表像是「連線貼紙」，用來告訴系統：哪一筆優惠可以掛在哪幾張卡下面。

### 4.7 SiteSetting：全站設定

`SiteSetting` 存網站整體設定。

| 欄位 | 白話意思 |
|---|---|
| siteName | 網站名稱 |
| defaultSeoTitle | 預設 SEO 標題 |
| defaultSeoDescription | 預設 SEO 描述 |
| homepageFeaturedCount | 首頁顯示幾筆精選 |
| categoryPageSize | 分類頁每頁幾筆 |
| showExpiredOffers | 是否顯示過期優惠 |

給老闆的說法：  
這張表像是網站的「總開關與基本設定」。例如首頁要顯示 6 張精選卡，還是 8 張，就從這裡控制。

## 5. 關聯說明

### 5.1 一家銀行有多張信用卡

```text
Bank 1 --- many Card
```

意思是：

- 一家銀行可以發很多張信用卡。
- 每張信用卡只屬於一家銀行。

### 5.2 一個分類有多筆優惠

```text
Category 1 --- many Offer
```

意思是：

- 現金回饋分類底下可以有很多優惠。
- 一筆優惠主要歸屬一個分類。

MVP 先用一筆優惠一個主分類，避免初期系統過度複雜。

### 5.3 優惠與信用卡是多對多

```text
Offer many --- many Card
```

中間用 `OfferCard` 連接。

這是必要設計，否則會變成一筆優惠只能掛一張卡，或一張卡只能有一筆優惠，會不符合真實信用卡活動情境。

## 6. 排序規則對應

前台分類頁與首頁精選建議用這個排序：

```text
isFeatured -> recommendScore -> sortOrder -> updatedAt
```

白話意思：

1. 先看是不是本站推薦。
2. 再看推薦分數高不高。
3. 分數一樣時，看人工排序。
4. 還是一樣時，看最後更新時間。

這對應產品規格書裡的排序規則。

## 7. 路由對應

這份 schema 已經替主要頁面保留 `slug`。

| 前台頁面 | 需要的資料 |
|---|---|
| `/` | SiteSetting、Category、Offer |
| `/categories/[slug]` | Category.slug、Offer |
| `/banks/[slug]` | Bank.slug、Card、Offer |
| `/cards/[slug]` | Card.slug、Bank、Offer |
| `/offers/[slug]` | Offer.slug、Category、Card、Bank |
| `/search` | Offer、Card、Bank、Category |

`slug` 可以理解成網址代碼。  
例如分類名稱是「現金回饋」，網址可以用 `/categories/cashback`，這比中文網址更穩定，也比較適合 SEO。

## 8. 為什麼 FAQ 先用 faqJson

MVP 階段先用 `faqJson String?`，原因是比較省工。

可以先存成類似：

```json
[
  {
    "question": "現金回饋信用卡怎麼選？",
    "answer": "先看常用通路、回饋上限與是否需要登錄。"
  }
]
```

未來如果 FAQ 變很多，再拆成獨立 `FaqItem` 表。

這樣初期不會因為資料表太多而拖慢開發。

## 9. 為什麼 tags 先用 String

MVP 階段 `tags` 先用字串，例如：

```text
現金回饋,網購,新戶
```

理由：

- 初期資料量不大。
- 後台維護比較簡單。
- 不需要一開始就做複雜標籤系統。

未來如果要做熱門標籤、標籤頁、標籤 SEO，再拆成 `Tag` 和 `OfferTag`。

## 10. 後續可擴充但不急著做的 Model

以下先不放進 MVP schema，避免初期過度設計：

| 未來 Model | 用途 | 為什麼先不做 |
|---|---|---|
| AuditLog | 記錄誰改了什麼 | MVP 只有單一管理者，可以先不做 |
| FaqItem | FAQ 正規化資料表 | 初期用 faqJson 夠用 |
| Tag / OfferTag | 標籤系統 | 初期 tags 字串夠用 |
| CrawlSource | 爬蟲來源設定 | 第二階段才做爬蟲 |
| ImportJob | 匯入任務紀錄 | 第二階段才需要 |
| Redirect | slug 改名後轉址 | 初期可先避免修改 slug |

## 11. 初期 Seed Data 建議

為了開發與測試畫面，建議先準備：

- 3 到 5 家銀行
- 8 到 12 張信用卡
- 6 個分類
- 20 筆優惠
- 1 筆 SiteSetting
- 1 個 AdminUser

這樣才能測試：

- 首頁精選
- 分類列表
- 搜尋結果
- 詳情頁
- 銀行頁
- 信用卡頁
- 後台 CRUD
- 排序
- RWD 卡片高度
- 空狀態

## 12. 給非 IT 背景的總結

這份 Schema 可以想成網站的「倉庫分類方式」。

如果倉庫一開始分類錯，後面網站就會很難維護。  
所以這份設計先把最重要的東西分清楚：

- 銀行是一種資料。
- 信用卡是一種資料。
- 優惠是一種資料。
- 分類是一種資料。
- 優惠和信用卡之間需要一張連接表。
- 圖片只存路徑，不把圖片塞進資料庫。
- SEO 與後台維護需要的欄位先預留。

這樣做的好處是：

- 個人開發者可以先用低成本完成 MVP。
- 後台管理者可以真的維護資料。
- 前台頁面有足夠資料可以顯示。
- 未來要上雲或換 PostgreSQL 時，不需要整個重做。
