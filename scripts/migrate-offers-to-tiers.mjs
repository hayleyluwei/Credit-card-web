// T21 Phase 2 資料遷移：把每筆 Offer 的扁平回饋欄位轉成 1 筆 RewardTier。
// 唯讀讀取扁平欄位 → 建立對應 RewardTier；不刪除、不修改 Offer 既有欄位。
// 具冪等性：同一 offer 已存在 tier 時跳過（可重複執行不重複建立）。
//
// 對照：
//   rewardType   → tier.rewardType
//   rewardValue  → tier.rate
//   rewardCap    → tier.cap
//   minSpend     → tier.minSpend
//   conditions   → tier.conditionsText
//   （capPeriod / conditions(JSON) / channels 舊資料無結構化來源，留空）
// 另把 offer.headlineRate 填為舊的 rewardValue（若原本為空）。

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

function blankToNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

async function main() {
  const offers = await prisma.offer.findMany({
    include: { tiers: true },
    orderBy: { id: "asc" }
  });

  let created = 0;
  let skipped = 0;
  const report = [];

  for (const offer of offers) {
    if (offer.tiers.length > 0) {
      skipped += 1;
      report.push(`  [skip] ${offer.slug}（已有 ${offer.tiers.length} 筆 tier）`);
      continue;
    }

    const tierData = {
      offerId: offer.id,
      label: null,
      rewardType: blankToNull(offer.rewardType),
      rate: blankToNull(offer.rewardValue),
      cap: blankToNull(offer.rewardCap),
      minSpend: blankToNull(offer.minSpend),
      capPeriod: null,
      conditionsText: blankToNull(offer.conditions),
      conditions: null,
      sortOrder: 0
    };

    const headlineRate = blankToNull(offer.headlineRate) ?? blankToNull(offer.rewardValue);

    report.push(
      `  [create] ${offer.slug} → tier{rewardType:${tierData.rewardType ?? "-"}, rate:${tierData.rate ?? "-"}, cap:${tierData.cap ?? "-"}, minSpend:${tierData.minSpend ? "有" : "-"}, conditionsText:${tierData.conditionsText ? "有" : "-"}}`
    );

    if (!isDryRun) {
      await prisma.rewardTier.create({ data: tierData });
      if (headlineRate && !offer.headlineRate) {
        await prisma.offer.update({ where: { id: offer.id }, data: { headlineRate } });
      }
    }
    created += 1;
  }

  console.log(`Offer 總數：${offers.length}`);
  console.log(report.join("\n"));
  console.log(`\n${isDryRun ? "[dry-run] 將" : "已"}建立 tier：${created}；跳過（已有 tier）：${skipped}`);
  if (isDryRun) console.log("--dry-run：未寫入資料庫。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
