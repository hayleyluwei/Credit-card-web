// T18: copy local SQLite dev.db data into the (empty) Neon PostgreSQL
// database, preserving primary keys so relations stay intact. Excludes
// the leftover test article (id 2, slug "test0730") per user instruction
// on 2026-08-03. One-off migration script, not part of the app runtime.
import { PrismaClient as SqliteClient } from "../node_modules/.prisma/client-sqlite-readonly/index.js";
import { PrismaClient as PgClient } from "@prisma/client";

const EXCLUDED_ARTICLE_IDS = [2];

const source = new SqliteClient();
const dest = new PgClient();

async function resetSequence(table) {
  await dest.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
  );
}

async function copyTable(name, rows, createManyFn, { hasIdSequence = true } = {}) {
  if (rows.length === 0) {
    console.log(`${name}: 0 筆，略過`);
    return;
  }
  await createManyFn(rows);
  if (hasIdSequence) {
    await resetSequence(name);
    console.log(`${name}: 已搬 ${rows.length} 筆，sequence 已重設`);
  } else {
    console.log(`${name}: 已搬 ${rows.length} 筆（複合主鍵，無 sequence 需重設）`);
  }
}

const siteSettings = await source.siteSetting.findMany();
const adminUsers = await source.adminUser.findMany();
const banks = await source.bank.findMany();
const cards = await source.card.findMany();
const categories = await source.category.findMany();
const offers = await source.offer.findMany();
const offerCards = await source.offerCard.findMany();
const channels = await source.channel.findMany();
const rewardTiers = await source.rewardTier.findMany();
const rewardTierChannels = await source.rewardTierChannel.findMany();
const articlesAll = await source.article.findMany();
const articles = articlesAll.filter((a) => !EXCLUDED_ARTICLE_IDS.includes(a.id));

console.log(
  `Article: 來源 ${articlesAll.length} 筆，排除 ${EXCLUDED_ARTICLE_IDS.join(",")} 後搬 ${articles.length} 筆`
);

await copyTable("SiteSetting", siteSettings, (rows) => dest.siteSetting.createMany({ data: rows }));
await copyTable("AdminUser", adminUsers, (rows) => dest.adminUser.createMany({ data: rows }));
await copyTable("Bank", banks, (rows) => dest.bank.createMany({ data: rows }));
await copyTable("Card", cards, (rows) => dest.card.createMany({ data: rows }));
await copyTable("Category", categories, (rows) => dest.category.createMany({ data: rows }));
await copyTable("Offer", offers, (rows) => dest.offer.createMany({ data: rows }));
await copyTable("OfferCard", offerCards, (rows) => dest.offerCard.createMany({ data: rows }), {
  hasIdSequence: false,
});
await copyTable("Channel", channels, (rows) => dest.channel.createMany({ data: rows }));
await copyTable("RewardTier", rewardTiers, (rows) => dest.rewardTier.createMany({ data: rows }));
await copyTable(
  "RewardTierChannel",
  rewardTierChannels,
  (rows) => dest.rewardTierChannel.createMany({ data: rows }),
  { hasIdSequence: false }
);
await copyTable("Article", articles, (rows) => dest.article.createMany({ data: rows }));

console.log("\n=== 完成，開始核對筆數 ===");
const counts = {
  siteSettings: await dest.siteSetting.count(),
  adminUsers: await dest.adminUser.count(),
  banks: await dest.bank.count(),
  cards: await dest.card.count(),
  categories: await dest.category.count(),
  offers: await dest.offer.count(),
  offerCards: await dest.offerCard.count(),
  channels: await dest.channel.count(),
  rewardTiers: await dest.rewardTier.count(),
  rewardTierChannels: await dest.rewardTierChannel.count(),
  articles: await dest.article.count(),
};
console.log(counts);

await source.$disconnect();
await dest.$disconnect();
