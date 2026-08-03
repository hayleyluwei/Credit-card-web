// TEMPORARY read-only check for T18 data migration.
// Confirms the local SQLite dev.db has no leftover test data before it
// gets copied to Neon. Does not modify anything.
import { PrismaClient } from "../node_modules/.prisma/client-sqlite-readonly/index.js";

const prisma = new PrismaClient();

const banks = await prisma.bank.count();
const cards = await prisma.card.count();
const categories = await prisma.category.count();
const offers = await prisma.offer.count();
const offerCards = await prisma.offerCard.count();
const rewardTiers = await prisma.rewardTier.count();
const channels = await prisma.channel.count();
const articles = await prisma.article.findMany({
  select: { id: true, title: true, slug: true, isPublished: true, createdAt: true, updatedAt: true },
  orderBy: { id: "asc" },
});
const adminUsers = await prisma.adminUser.count();

console.log("=== 資料表筆數 ===");
console.log({ banks, cards, categories, offers, offerCards, rewardTiers, channels, adminUsers });

console.log("\n=== Article 全部內容（檢查是否有測試文章殘留）===");
console.log(articles);

console.log("\n=== 每筆 Offer 的 RewardTier 數量（檢查 T21 測試第 4 層是否已移除）===");
const offersWithTierCount = await prisma.offer.findMany({
  select: { slug: true, _count: { select: { tiers: true } } },
  orderBy: { slug: "asc" },
});
console.log(offersWithTierCount);

await prisma.$disconnect();
