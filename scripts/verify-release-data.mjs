// T17 上線前完整測試：正式資料完整性檢查（唯讀，不寫資料庫）
// 任務卡：docs/implementation/tasks/T17-PRE_LAUNCH_TESTING_上線前完整測試.md

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// T16 匯入前的舊 seed／測試資料專屬 slug（皆已被真實資料取代，不應再出現）。
const LEGACY_SEED_CARD_SLUGS = [
  "cube-card",
  "cathay-shopee-card",
  "giving-card",
  "flygo-card",
  "sport-card",
  "hsbc-travellers-infinite-card",
  "hsbc-travelone-signature-card"
];
const LEGACY_SEED_OFFER_SLUGS = [
  "cube-cashback-3",
  "cube-dining-2026",
  "cube-fpc-2-percent",
  "hsbc-traveller-overseas-points",
  "hsbc-traveller-airport-benefits",
  "hsbc-travelone-spending-points",
  "hsbc-travelone-travel-benefits",
  "dawho-high-cashback-2026",
  "test-offer"
];

const failures = [];
const warnings = [];

function report(label, rows) {
  console.log(`\n${label}`);
  if (rows.length === 0) {
    console.log("  (無)");
    return;
  }
  for (const row of rows) {
    console.log(`  - ${row}`);
  }
}

try {
  const [banks, cards, categories, offers, offerCards] = await Promise.all([
    prisma.bank.findMany({ select: { id: true, slug: true, name: true, isActive: true } }),
    prisma.card.findMany({ select: { id: true, slug: true, name: true, isActive: true } }),
    prisma.category.findMany({ select: { id: true, slug: true, isActive: true } }),
    prisma.offer.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        categoryId: true,
        sourceUrl: true,
        lastVerifiedAt: true,
        endDate: true,
        isPublished: true,
        isFeatured: true,
        cards: { select: { cardId: true } }
      }
    }),
    prisma.offerCard.count()
  ]);

  // 1. 舊測試資料殘留檢查
  const staleCards = cards.filter((c) => LEGACY_SEED_CARD_SLUGS.includes(c.slug));
  const staleOffers = offers.filter((o) => LEGACY_SEED_OFFER_SLUGS.includes(o.slug));
  if (staleCards.length > 0) {
    failures.push(`發現舊測試卡片殘留：${staleCards.map((c) => c.slug).join(", ")}`);
  }
  if (staleOffers.length > 0) {
    failures.push(`發現舊測試優惠殘留：${staleOffers.map((o) => o.slug).join(", ")}`);
  }

  // 2. 每筆已發布優惠的必要欄位檢查
  const publishedOffers = offers.filter((o) => o.isPublished);
  for (const offer of publishedOffers) {
    const missing = [];
    if (!offer.title) missing.push("title");
    if (!offer.summary && !offer.description) missing.push("summary/description");
    if (!offer.categoryId) missing.push("category");
    if (offer.cards.length === 0) missing.push("對應卡片(OfferCard)");
    if (!offer.sourceUrl) missing.push("sourceUrl");
    if (!offer.lastVerifiedAt) missing.push("lastVerifiedAt");
    if (missing.length > 0) {
      failures.push(`優惠 ${offer.slug} 缺少欄位：${missing.join(", ")}`);
    }
  }

  // 3. 已過期優惠檢查（設計上 isPublished 保持 true，由前台依 endDate 過濾，不算失敗，僅列出供人工在前台核對）
  const now = new Date();
  const expiredButPublished = publishedOffers.filter((o) => o.endDate && o.endDate < now);
  if (expiredButPublished.length > 0) {
    warnings.push(
      `${expiredButPublished.length} 筆優惠已過期但資料庫 isPublished 仍為 true（設計上前台應依 endDate 隱藏，須人工於前台逐一確認不顯示）：${expiredButPublished
        .map((o) => o.slug)
        .join(", ")}`
    );
  }

  // 4. 精選優惠（isFeatured）現況
  const featuredCount = publishedOffers.filter((o) => o.isFeatured).length;
  if (featuredCount === 0) {
    warnings.push(
      "目前沒有任何優惠標示為精選（isFeatured=true）。若首頁「精選優惠」區塊需要有內容，需請整理人員或使用者指定至少一筆優惠標示精選。"
    );
  }

  // 5. 銀行/卡片 active 狀態現況（僅供對照，不視為失敗）
  const inactiveBanks = banks.filter((b) => !b.isActive).length;
  const inactiveCards = cards.filter((c) => !c.isActive).length;

  report(
    "銀行清單",
    banks.map((b) => `${b.slug}（${b.name}）${b.isActive ? "" : "［停用］"}`)
  );
  report(
    "卡片清單",
    cards.map((c) => `${c.slug}（${c.name}）${c.isActive ? "" : "［停用］"}`)
  );
  report(
    "分類清單",
    categories.map((c) => `${c.slug}${c.isActive ? "" : "［停用］"}`)
  );
  report(
    "優惠清單（已發布）",
    publishedOffers.map((o) => `${o.slug}｜${o.title}${o.isFeatured ? "［精選］" : ""}`)
  );

  console.log("\n筆數對照");
  console.log(`  銀行：${banks.length}（停用 ${inactiveBanks}）`);
  console.log(`  卡片：${cards.length}（停用 ${inactiveCards}）`);
  console.log(`  分類：${categories.length}`);
  console.log(`  優惠：${offers.length}（已發布 ${publishedOffers.length}）`);
  console.log(`  優惠卡片對應：${offerCards}`);

  if (warnings.length > 0) {
    console.log("\n警告（不阻擋，但需人工確認）：");
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
  }
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("\nT17 正式資料完整性檢查失敗：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nT17 正式資料完整性檢查通過。");
