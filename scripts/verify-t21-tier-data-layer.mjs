// T21 資料層測試（唯讀性質：建立獨立測試優惠、驗證、最後清除，不影響既有真實資料）
// 目的：直接用 Prisma 模擬 admin-actions.ts 的 tiers 讀寫邏輯（createOffer 的
// `tiers: { create: [...] }`、updateOffer 的 `tiers: { deleteMany: {}, create: [...] }`），
// 繞過網頁表單與登入，驗證多層 tier 的建立／整批替換／刪除／headlineRate 賦值邏輯是否正確。
// 注意：本腳本不測試 AdminOfferForm.tsx 的前端表單欄位命名與送出邏輯，那部分仍需使用者登入實測。

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_SLUG = "t21-data-layer-test-offer-DO-NOT-KEEP";
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
  console.log(`  ${condition ? "✅" : "❌"} ${message}`);
}

function headlineRateFromTiers(tiers) {
  return tiers.find((t) => t.rate && t.rate.trim())?.rate ?? null;
}

async function main() {
  // 前置清理：若上次執行失敗留下殘留，先清掉
  const stale = await prisma.offer.findUnique({ where: { slug: TEST_SLUG } });
  if (stale) {
    await prisma.rewardTier.deleteMany({ where: { offerId: stale.id } });
    await prisma.offerCard.deleteMany({ where: { offerId: stale.id } });
    await prisma.offer.delete({ where: { id: stale.id } });
    console.log("（清除上次殘留的測試優惠）");
  }

  const category = await prisma.category.findFirst();
  const card = await prisma.card.findFirst();
  if (!category || !card) throw new Error("測試前置資料不足：資料庫沒有任何 Category 或 Card");

  console.log("\n=== 步驟 1：模擬 createOffer — 一次建立 3 層 tier ===");
  const initialTiers = [
    { label: "基本回饋", rewardType: "cashback", rate: "1%", cap: null, capPeriod: null, minSpend: null, conditionsText: "一般消費", conditions: null, sortOrder: 0 },
    { label: "精選通路加碼", rewardType: "cashback", rate: "4%", cap: "NT$800", capPeriod: "月帳單週期", minSpend: null, conditionsText: "指定通路", conditions: null, sortOrder: 1 },
    { label: "新卡友加碼", rewardType: "cashback", rate: "2%", cap: "NT$200", capPeriod: "日曆月", minSpend: null, conditionsText: "限新申辦", conditions: null, sortOrder: 2 }
  ];

  const created = await prisma.offer.create({
    data: {
      categoryId: category.id,
      title: "T21 資料層測試優惠（請勿保留）",
      slug: TEST_SLUG,
      summaryPreview: "測試用",
      headlineRate: headlineRateFromTiers(initialTiers),
      isPublished: false,
      cards: { create: [{ cardId: card.id }] },
      tiers: { create: initialTiers }
    },
    include: { tiers: { orderBy: { sortOrder: "asc" } }, cards: true }
  });

  assert(created.tiers.length === 3, `建立後應有 3 層 tier，實際 ${created.tiers.length} 層`);
  assert(created.tiers[0].label === "基本回饋" && created.tiers[1].label === "精選通路加碼" && created.tiers[2].label === "新卡友加碼", "三層的 label 與 sortOrder 順序正確");
  assert(created.headlineRate === "1%", `headlineRate 應為第一層的 rate「1%」，實際「${created.headlineRate}」`);
  assert(created.cards.length === 1, "適用卡片關聯建立正確");

  console.log("\n=== 步驟 2：模擬 updateOffer — 整批替換成 2 層（少一層）===");
  const updatedTiers = [
    { label: "基本回饋", rewardType: "cashback", rate: "1.5%", cap: null, capPeriod: null, minSpend: null, conditionsText: "一般消費（已更新）", conditions: null, sortOrder: 0 },
    { label: "新戶禮", rewardType: "cashback", rate: "500", cap: "一次性", capPeriod: null, minSpend: "核卡30日內", conditionsText: "限量5000名", conditions: null, sortOrder: 1 }
  ];

  await prisma.offer.update({
    where: { id: created.id },
    data: {
      headlineRate: headlineRateFromTiers(updatedTiers),
      tiers: { deleteMany: {}, create: updatedTiers }
    }
  });

  const afterUpdate = await prisma.offer.findUnique({
    where: { id: created.id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } }
  });

  assert(afterUpdate.tiers.length === 2, `更新後應剩 2 層 tier（原 3 層被整批替換），實際 ${afterUpdate.tiers.length} 層`);
  assert(!afterUpdate.tiers.some((t) => t.label === "精選通路加碼"), "舊的「精選通路加碼」層應已被刪除，沒有殘留");
  assert(afterUpdate.tiers.some((t) => t.label === "新戶禮" && t.minSpend === "核卡30日內"), "新增的「新戶禮」層資料正確（含 minSpend）");
  assert(afterUpdate.headlineRate === "1.5%", `headlineRate 應更新為「1.5%」，實際「${afterUpdate.headlineRate}」`);

  const orphanTierCount = await prisma.rewardTier.count({ where: { offerId: created.id } });
  assert(orphanTierCount === 2, `資料庫實際 tier 筆數應為 2（無孤兒殘留），實際 ${orphanTierCount}`);

  console.log("\n=== 步驟 3：模擬 updateOffer — 替換成只剩 1 層（測試單層情境） ===");
  const singleTier = [
    { label: null, rewardType: "points", rate: "10倍", cap: null, capPeriod: null, minSpend: null, conditionsText: null, conditions: null, sortOrder: 0 }
  ];
  await prisma.offer.update({
    where: { id: created.id },
    data: { tiers: { deleteMany: {}, create: singleTier } }
  });
  const afterSingle = await prisma.offer.findUnique({ where: { id: created.id }, include: { tiers: true } });
  assert(afterSingle.tiers.length === 1, `單層更新後應只有 1 層，實際 ${afterSingle.tiers.length} 層`);

  console.log("\n=== 步驟 4：清理測試資料 ===");
  await prisma.rewardTier.deleteMany({ where: { offerId: created.id } });
  await prisma.offerCard.deleteMany({ where: { offerId: created.id } });
  await prisma.offer.delete({ where: { id: created.id } });
  const stillExists = await prisma.offer.findUnique({ where: { slug: TEST_SLUG } });
  assert(stillExists === null, "測試優惠已完全清除，未留在資料庫");

  console.log(`\n${failures.length === 0 ? "全部通過" : `${failures.length} 項失敗`}`);
  if (failures.length > 0) {
    console.error("\n失敗項目：");
    failures.forEach((f) => console.error("  - " + f));
  }
}

main()
  .catch((e) => {
    console.error("測試腳本執行錯誤：", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failures.length > 0) process.exitCode = 1;
  });
