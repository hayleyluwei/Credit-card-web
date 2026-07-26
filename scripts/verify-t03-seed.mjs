// [T17 停用，2026-07-27] 本腳本斷言的是舊 seed 測試資料的固定範圍（3-5家銀行、8-12張卡、
// 至少一筆草稿/停用/過期優惠、admin@example.com）。T16 匯入真實資料後（6家銀行/10張卡/16筆
// 優惠，全數已發布且啟用）不再符合這些斷言，執行必定失敗。保留本檔供歷史回溯，不刪除；
// 正式資料時期的對應檢查由 scripts/verify-release-data.mjs 取代。詳見 T17 Summary。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const failures = [];

try {
  const [
    siteSettings,
    adminUsers,
    banks,
    activeBanks,
    inactiveBanks,
    cards,
    activeCards,
    inactiveCards,
    categories,
    activeCategories,
    offers,
    publishedOffers,
    draftOffers,
    featuredOffers,
    nonFeaturedOffers,
    expiredOffers,
    offerCards
  ] = await Promise.all([
    prisma.siteSetting.count(),
    prisma.adminUser.findMany(),
    prisma.bank.count(),
    prisma.bank.count({ where: { isActive: true } }),
    prisma.bank.count({ where: { isActive: false } }),
    prisma.card.count(),
    prisma.card.count({ where: { isActive: true } }),
    prisma.card.count({ where: { isActive: false } }),
    prisma.category.count(),
    prisma.category.count({ where: { isActive: true } }),
    prisma.offer.count(),
    prisma.offer.count({ where: { isPublished: true } }),
    prisma.offer.count({ where: { isPublished: false } }),
    prisma.offer.count({ where: { isFeatured: true } }),
    prisma.offer.count({ where: { isFeatured: false } }),
    prisma.offer.count({ where: { endDate: { lt: new Date() } } }),
    prisma.offerCard.count()
  ]);

  if (siteSettings !== 1) failures.push(`Expected 1 SiteSetting, found ${siteSettings}`);
  if (adminUsers.length !== 1) failures.push(`Expected 1 AdminUser, found ${adminUsers.length}`);
  if (adminUsers[0]?.email !== "admin@example.com") failures.push("Expected admin@example.com seed admin");
  if (!adminUsers[0]?.isActive) failures.push("Expected seed admin to be active");
  if (!adminUsers[0]?.passwordHash || adminUsers[0].passwordHash === "admin12345") {
    failures.push("Expected admin password to be hashed, not plain text");
  }
  if (banks < 3 || banks > 5) failures.push(`Expected 3 to 5 banks, found ${banks}`);
  if (activeBanks < 1) failures.push("Expected at least one active bank");
  if (inactiveBanks < 1) failures.push("Expected at least one inactive bank example");
  if (cards < 8 || cards > 12) failures.push(`Expected 8 to 12 cards, found ${cards}`);
  if (activeCards < 1) failures.push("Expected at least one active card");
  if (inactiveCards < 1) failures.push("Expected at least one inactive card example");
  if (categories !== 6) failures.push(`Expected 6 categories, found ${categories}`);
  if (activeCategories < 6) failures.push("Expected all 6 seed categories to be active");
  if (offers < 20) failures.push(`Expected at least 20 offers, found ${offers}`);
  if (publishedOffers < 1) failures.push("Expected at least one published offer");
  if (draftOffers < 1) failures.push("Expected at least one draft offer");
  if (featuredOffers < 1) failures.push("Expected at least one featured offer");
  if (nonFeaturedOffers < 1) failures.push("Expected at least one non-featured offer");
  if (expiredOffers < 1) failures.push("Expected at least one expired offer");
  if (offerCards < offers) failures.push("Expected at least one OfferCard relation per offer on average");
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("T03 seed smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("T03 seed smoke test passed.");
