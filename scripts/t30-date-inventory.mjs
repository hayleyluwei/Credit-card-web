// T30 Scope E step 1：既有資料日期盤點（唯讀，只做 findMany，不寫入任何資料）
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 約定：日期欄位應為「台北午夜」＝ UTC 前一天 16:00:00.000
function isTaipeiMidnight(d) {
  if (!d) return null;
  return (
    d.getUTCHours() === 16 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

function taipeiDate(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

function taipeiFull(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "short",
    timeStyle: "medium"
  }).format(d);
}

const OFFER_FIELDS = ["startDate", "endDate", "lastVerifiedAt"];
const ARTICLE_FIELDS = ["lastVerifiedAt", "publishedAt"];

async function main() {
  const offers = await prisma.offer.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      startDate: true,
      endDate: true,
      lastVerifiedAt: true,
      updatedAt: true
    },
    orderBy: { id: "asc" }
  });

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      lastVerifiedAt: true,
      publishedAt: true,
      updatedAt: true
    },
    orderBy: { id: "asc" }
  });

  console.log(`=== 優惠總數：${offers.length}　文章總數：${articles.length} ===\n`);

  const bad = [];
  const counts = { checked: 0, ok: 0, null: 0, deviant: 0 };

  for (const o of offers) {
    for (const f of OFFER_FIELDS) {
      const v = o[f];
      if (!v) {
        counts.null++;
        continue;
      }
      counts.checked++;
      if (isTaipeiMidnight(v)) {
        counts.ok++;
      } else {
        counts.deviant++;
        bad.push({ kind: "offer", id: o.id, slug: o.slug, title: o.title, field: f, value: v, updatedAt: o.updatedAt });
      }
    }
  }

  for (const a of articles) {
    for (const f of ARTICLE_FIELDS) {
      const v = a[f];
      if (!v) {
        counts.null++;
        continue;
      }
      counts.checked++;
      if (isTaipeiMidnight(v)) {
        counts.ok++;
      } else {
        counts.deviant++;
        bad.push({ kind: "article", id: a.id, slug: a.slug, title: a.title, field: f, value: v, updatedAt: a.updatedAt });
      }
    }
  }

  console.log("--- 統計 ---");
  console.log(`有值且已檢查：${counts.checked}`);
  console.log(`符合「台北午夜」約定：${counts.ok}`);
  console.log(`偏離約定（疑似被後台存壞）：${counts.deviant}`);
  console.log(`欄位為空：${counts.null}\n`);

  if (bad.length) {
    console.log("--- 偏離約定的筆數明細 ---");
    for (const b of bad) {
      console.log(
        `[${b.kind} #${b.id}] ${b.slug}\n` +
          `  欄位：${b.field}\n` +
          `  DB 實際值（UTC）：${b.value.toISOString()}\n` +
          `  換算台北時間：${taipeiFull(b.value)}\n` +
          `  該筆最後更新：${taipeiFull(b.updatedAt)}\n`
      );
    }
  } else {
    console.log("沒有任何欄位偏離「台北午夜」約定。\n");
  }

  console.log("--- 全部優惠的日期一覽（台北時區） ---");
  for (const o of offers) {
    const flag = OFFER_FIELDS.some((f) => o[f] && !isTaipeiMidnight(o[f])) ? " ⚠️" : "";
    console.log(
      `#${String(o.id).padStart(3)} ${o.slug}${flag}\n` +
        `      起 ${taipeiDate(o.startDate)}　迄 ${taipeiDate(o.endDate)}　查證 ${taipeiDate(o.lastVerifiedAt)}`
    );
  }

  // 對照：目前 UTC 環境會顯示成什麼（重現正式站行為）
  console.log("\n--- 正式站（UTC）目前會顯示的 endDate vs 正確值 ---");
  let mismatch = 0;
  for (const o of offers) {
    if (!o.endDate) continue;
    const wrong = new Intl.DateTimeFormat("zh-TW", { timeZone: "UTC" }).format(o.endDate);
    const right = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei" }).format(o.endDate);
    if (wrong !== right) {
      mismatch++;
      console.log(`  ${o.slug}：正式站顯示 ${wrong}　應為 ${right}`);
    }
  }
  console.log(`\n受顯示錯誤影響的優惠：${mismatch} / ${offers.filter((o) => o.endDate).length}（有 endDate 者）`);

  // 目前是否有優惠正被提早隱藏
  console.log("\n--- 過期判斷檢查（現在時刻） ---");
  const now = new Date();
  const utcNow = new Date(now);
  utcNow.setUTCHours(0, 0, 0, 0);
  console.log(`現在（台北）：${taipeiFull(now)}`);
  let earlyHidden = 0;
  for (const o of offers) {
    if (!o.endDate) continue;
    const e = new Date(o.endDate);
    e.setUTCHours(0, 0, 0, 0); // 重現 Vercel 上 setHours 的行為
    const hiddenNow = e < utcNow;
    // 正確判斷：台北日曆日比較
    const endTaipei = taipeiDate(o.endDate);
    const nowTaipei = taipeiDate(now);
    const shouldHide = endTaipei < nowTaipei;
    if (hiddenNow !== shouldHide) {
      earlyHidden++;
      console.log(`  ⚠️ ${o.slug}：迄 ${endTaipei}　正式站判定=${hiddenNow ? "已過期(隱藏)" : "有效"}　應為=${shouldHide ? "已過期" : "有效"}`);
    }
  }
  console.log(`目前判定不一致的優惠：${earlyHidden} 筆`);
}

main()
  .catch((e) => {
    console.error("盤點失敗：", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
