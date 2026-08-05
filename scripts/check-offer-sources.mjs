// T22 排程輔助資料更新（瘦身版）：每月來源檢查主流程
// 任務卡：docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md
//
// ⚠️ 全程唯讀：本腳本只執行資料庫查詢（findMany）與外部網頁讀取，
//    絕不執行任何寫入。Scope v2 明確禁止寫入資料庫。
//
// 執行：
//   npm run t22:check            正式執行（會發 Telegram 通知，若已設定憑證）
//   npm run t22:check:dry        只印報告，不發通知
//   npm run t22:check -- --limit 3   只檢查前 3 筆，供本機試跑

import { PrismaClient } from "@prisma/client";
import { checkOffer, summarize } from "./t22/assertions.mjs";
import { createBrowser, fetchPageText, sleep, POLITE_DELAY_MS } from "./t22/fetch-page.mjs";
import { formatReport, sendTelegram } from "./t22/report.mjs";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitFlagIndex = args.indexOf("--limit");
const limit = limitFlagIndex >= 0 ? Number.parseInt(args[limitFlagIndex + 1], 10) : null;

const prisma = new PrismaClient();

function verdictLabel(verdict) {
  return {
    unchanged: "無變動",
    suspect: "疑似有變",
    fetch_failed: "抓取失敗",
    health_failed: "健康檢查未過"
  }[verdict] ?? verdict;
}

let browser;

try {
  const offers = await prisma.offer.findMany({
    where: { isPublished: true, sourceUrl: { not: null } },
    select: {
      slug: true,
      title: true,
      sourceUrl: true,
      tiers: { select: { label: true, rate: true, cap: true, minSpend: true } },
      cards: { select: { card: { select: { name: true, bank: { select: { name: true } } } } } }
    },
    orderBy: { slug: "asc" }
  });

  const targets = limit && limit > 0 ? offers.slice(0, limit) : offers;

  console.log(`T22 來源檢查：共 ${targets.length} 筆優惠待檢查${isDryRun ? "（dry-run，不發通知）" : ""}`);

  // 同一個來源網址可能對應多筆優惠，抓一次就好，省時也少打擾對方網站。
  const pageCache = new Map();
  const results = [];

  browser = await createBrowser();

  for (const [index, offer] of targets.entries()) {
    let fetchResult = pageCache.get(offer.sourceUrl);

    if (!fetchResult) {
      if (pageCache.size > 0) await sleep(POLITE_DELAY_MS);
      fetchResult = await fetchPageText(browser, offer.sourceUrl);
      pageCache.set(offer.sourceUrl, fetchResult);
    }

    const result = checkOffer({ offer, fetchResult, pageText: fetchResult.text });
    results.push(result);

    console.log(
      `  [${String(index + 1).padStart(2)}/${targets.length}] ${verdictLabel(result.verdict).padEnd(6)} ${offer.slug}`
    );
    for (const reason of result.health.reasons) {
      console.log(`        ${reason}`);
    }
    for (const item of result.missing ?? []) {
      console.log(`        ${item.field}：找不到 ${item.token}（原文「${item.sourceValue}」）`);
    }
  }

  const summary = summarize(results);
  const report = formatReport(summary);

  console.log("\n--- 報告 ---");
  console.log(report.replace(/<\/?b>/gu, ""));

  if (isDryRun) {
    console.log("\n(dry-run：未發送 Telegram 通知)");
  } else if (!summary.needsAttention) {
    console.log("\n全部無變動，依設計不發送通知，避免通知疲勞。");
  } else {
    const sendResult = await sendTelegram(report);
    console.log(
      sendResult.sent ? "\nTelegram 通知已送出。" : `\nTelegram 通知未送出：${sendResult.reason}`
    );
  }

  // 抓取失敗要讓 GitHub Actions 顯示為失敗，否則排程「綠燈但其實沒抓到」會失去意義。
  if (summary.failed > 0) {
    console.log(`\n有 ${summary.failed} 筆抓取失敗，以非零狀態碼結束以利在排程中察覺。`);
    process.exitCode = 1;
  }
} finally {
  await browser?.close().catch(() => {});
  await prisma.$disconnect();
}
