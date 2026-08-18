// T30 日期時區正確性驗證
// 任務卡：docs/implementation/tasks/T30-DATE_TIMEZONE_日期時區正確性修正.md
//
// ⚠️ 全程唯讀：本腳本不連資料庫、不寫任何檔案、不啟動 dev server。
//
// 為什麼要跑兩次：
//   T30 的 bug 只在「伺服器時區 ≠ Asia/Taipei」時出現，本機時區剛好就是台北，
//   所以只在本機跑等於沒測。本腳本會用 TZ=UTC 與 TZ=Asia/Taipei 各跑一次同一組斷言，
//   **兩次結果必須完全相同**——這是唯一能證明修好的方式。
//
// 執行：
//   node scripts/verify-t30-date-timezone.mjs

import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const CHILD_FLAG = "T30_CHILD_TZ";

/** 資料庫實際存在的樣本：台北 2026-07-01 的午夜。 */
const SAMPLE_ISO = "2026-06-30T16:00:00.000Z";

// ---------------------------------------------------------------- child mode

async function runAssertions() {
  // Windows 上動態 import 絕對路徑必須轉成 file:// URL。
  const m = await import(pathToFileURL(path.join(ROOT, "src", "lib", "domain-date.ts")).href);
  const sample = new Date(SAMPLE_ISO);
  const results = [];

  const check = (name, actual, expected) => {
    results.push({ name, actual, expected, pass: actual === expected });
  };

  // --- 固定值：這些答案與執行時區無關 ---
  check("formatTaipeiDate（顯示）", m.formatTaipeiDate(sample), "2026/7/1");
  check("taipeiDayKey（日曆日）", m.taipeiDayKey(sample), "2026-07-01");
  check("taipeiDateInput（後台輸入框）", m.taipeiDateInput(sample), "2026-07-01");
  check("parseTaipeiDate（存回資料庫）", m.parseTaipeiDate("2026-07-01")?.toISOString(), SAMPLE_ISO);
  check("空值 → 空字串", m.taipeiDateInput(null), "");
  check("空值 → null", m.parseTaipeiDate(""), null);
  check("不合法格式 → null", m.parseTaipeiDate("2026/07/01"), null);

  // --- 後台往返不得漂移（缺陷三的回歸測試）---
  // 讀出 → 填入表單 → 存回 → 再讀出，連做三次，日期都必須不變。
  let roundTrip = sample;
  for (let i = 1; i <= 3; i += 1) {
    roundTrip = m.parseTaipeiDate(m.taipeiDateInput(roundTrip));
    check(`後台往返第 ${i} 次後仍為原值`, roundTrip?.toISOString(), SAMPLE_ISO);
  }

  // --- 過期邊界（缺陷二的回歸測試）---
  const today = m.taipeiTodayStart();
  const yesterday = m.taipeiDayOffset(-1);
  const tomorrow = m.taipeiDayOffset(1);

  check("結束日＝今天 → 仍有效（含當日）", m.isPastTaipeiDay(today), false);
  check("結束日＝昨天 → 已過期", m.isPastTaipeiDay(yesterday), true);
  check("結束日＝明天 → 仍有效", m.isPastTaipeiDay(tomorrow), false);
  check("無結束日 → 不算過期", m.isPastTaipeiDay(null), false);

  check("距今天 0 天", m.daysUntilTaipeiDay(today), 0);
  check("距明天 1 天", m.daysUntilTaipeiDay(tomorrow), 1);
  check("距昨天 -1 天", m.daysUntilTaipeiDay(yesterday), -1);
  check("距 14 天後", m.daysUntilTaipeiDay(m.taipeiDayOffset(14)), 14);

  // --- 今天的日曆日本身（跨時區必須一致）---
  check("台北今日午夜的 UTC 時刻以 16:00 結尾", today.toISOString().slice(11), "16:00:00.000Z");

  return {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    todayKey: m.taipeiDayKey(new Date()),
    results
  };
}

if (process.env[CHILD_FLAG]) {
  const payload = await runAssertions();
  process.stdout.write(`__T30__${JSON.stringify(payload)}`);
  process.exit(0);
}

// --------------------------------------------------------------- parent mode

function runChild(tz) {
  const out = spawnSync(process.execPath, [SELF], {
    encoding: "utf8",
    env: { ...process.env, TZ: tz, [CHILD_FLAG]: "1" }
  });

  if (out.status !== 0) {
    console.error(`TZ=${tz} 執行失敗：\n${out.stderr}`);
    process.exit(1);
  }

  const marker = out.stdout.indexOf("__T30__");

  if (marker < 0) {
    console.error(`TZ=${tz} 沒有輸出結果：\n${out.stdout}\n${out.stderr}`);
    process.exit(1);
  }

  return JSON.parse(out.stdout.slice(marker + 7));
}

/** 靜態檢查：確認沒有任何檔案繞過 domain-date 自行處理日期。 */
function scanForBypasses() {
  const banned = [
    { pattern: /setHours\(0,\s*0,\s*0,\s*0\)/, why: "以伺服器本機時區歸零，應改用 taipeiDayStart" },
    { pattern: /toLocaleDateString\((?![^)]*timeZone)/, why: "未指定 timeZone，應改用 formatTaipeiDate" },
    { pattern: /toISOString\(\)\.slice\(0,\s*10\)/, why: "取的是 UTC 日曆日，應改用 taipeiDayKey" }
  ];
  const hits = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);

      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }

      if (!/\.tsx?$/.test(entry)) {
        continue;
      }

      // domain-date.ts 的說明文字會提到這些舊寫法，本身不是違規。
      if (full.endsWith(path.join("lib", "domain-date.ts"))) {
        continue;
      }

      const text = readFileSync(full, "utf8");

      text.split(/\r?\n/).forEach((line, index) => {
        // 略過註解行，避免說明文字被誤判。
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) {
          return;
        }

        for (const { pattern, why } of banned) {
          if (pattern.test(line)) {
            hits.push({ file: path.relative(ROOT, full), line: index + 1, why, text: line.trim() });
          }
        }
      });
    }
  };

  walk(path.join(ROOT, "src"));

  return hits;
}

console.log("=== T30 日期時區驗證 ===\n");

const utc = runChild("UTC");
const taipei = runChild("Asia/Taipei");

console.log(`子行程 1 時區：${utc.timeZone}（今日 ${utc.todayKey}）`);
console.log(`子行程 2 時區：${taipei.timeZone}（今日 ${taipei.todayKey}）\n`);

let failed = 0;

console.log("--- 斷言結果（左：UTC　右：Asia/Taipei）---");

utc.results.forEach((u, i) => {
  const t = taipei.results[i];
  const same = JSON.stringify(u.actual) === JSON.stringify(t.actual);
  const ok = u.pass && t.pass && same;

  if (!ok) {
    failed += 1;
  }

  const mark = ok ? "OK  " : "FAIL";
  const detail = same
    ? `${JSON.stringify(u.actual)}`
    : `UTC=${JSON.stringify(u.actual)}　台北=${JSON.stringify(t.actual)} ← 跨時區不一致`;

  console.log(`  ${mark} ${u.name}：${detail}${ok ? "" : `　期望 ${JSON.stringify(u.expected)}`}`);
});

console.log("\n--- 靜態檢查：是否有檔案繞過 domain-date ---");

const bypasses = scanForBypasses();

if (bypasses.length === 0) {
  console.log("  OK   src 下沒有殘留的舊日期寫法");
} else {
  failed += bypasses.length;
  for (const hit of bypasses) {
    console.log(`  FAIL ${hit.file}:${hit.line}　${hit.why}\n         ${hit.text}`);
  }
}

console.log(`\n=== ${failed === 0 ? "全部通過" : `${failed} 項失敗`} ===`);
process.exit(failed === 0 ? 0 : 1);
