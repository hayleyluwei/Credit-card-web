// T22 排程輔助資料更新（瘦身版）：比對與健康檢查邏輯的離線單元測試
// 任務卡：docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md
//
// 純函式測試：不連資料庫、不連網路、不寫任何檔案，可安全重複執行。
// 執行：npm run smoke:t22

import {
  normalizeText,
  containsNumericToken,
  extractAssertableTokens,
  buildAssertions,
  buildAnchors,
  evaluateHealth,
  checkOffer,
  summarize,
  normalizeNumericText,
  MIN_PAGE_TEXT_LENGTH
} from "./t22/assertions.mjs";

let passed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function equal(label, actual, expected) {
  check(`${label}（得到 ${JSON.stringify(actual)}，預期 ${JSON.stringify(expected)}）`, actual === expected);
}

// 用來墊高頁面長度，讓測試專注在被驗的那一件事，而不是意外撞到長度門檻。
const filler = "信".repeat(MIN_PAGE_TEXT_LENGTH);

// 一次成功的抓取結果，供多處測試共用。
const okFetch = { ok: true, status: 200 };

// --- normalizeText ---------------------------------------------------------

equal("全形數字與全形百分比會被正規化為半形", normalizeText("３％"), "3%");
equal("空白（含全形空白）會被移除", normalizeText("回饋 3 ％　上限"), "回饋3%上限");
equal("英文轉小寫", normalizeText("NT$300"), "nt$300");
equal("非字串輸入回傳空字串", normalizeText(null), "");

// --- containsNumericToken --------------------------------------------------

check("「3%」找得到頁面上的 3%", containsNumericToken("一般消費3%回饋", "3%"));
check(
  "「3%」不應命中 13%（否則回饋率調高會被誤判為沒變）",
  !containsNumericToken("一般消費13%回饋", "3%")
);
check("「3%」不應命中 3.5%", !containsNumericToken("一般消費3.5%回饋", "3%"));
check("「300」不應命中 3000", !containsNumericToken("上限3000元", "300"));
check("「300」不應命中 1300", !containsNumericToken("上限1300元", "300"));
check("「300」找得到獨立的 300", containsNumericToken("上限300元", "300"));
check("空字串輸入不會誤判為找到", !containsNumericToken("", "3%"));

// 回歸測試：資料庫與官網對千分位的寫法常常不一致（「1,000」vs「1000」）。
// 若正規化只套用在其中一邊，比對會永遠落空，把沒變的優惠誤報成疑似有變。
check(
  "【回歸】資料庫寫 1,000、官網寫 1000 時仍比對得到",
  containsNumericToken(normalizeNumericText("單筆滿1000元"), extractAssertableTokens("單筆滿 1,000 元")[0])
);
check(
  "【回歸】資料庫寫 1000、官網寫 1,000 時仍比對得到",
  containsNumericToken(normalizeNumericText("單筆滿1,000元"), extractAssertableTokens("單筆滿 1000 元")[0])
);

// --- extractAssertableTokens ----------------------------------------------

equal(
  "百分比一律納入斷言",
  JSON.stringify(extractAssertableTokens("最高 3.3%")),
  JSON.stringify(["3.3%"])
);
equal(
  "三位數以上金額納入斷言，並移除千分位逗號",
  JSON.stringify(extractAssertableTokens("每月上限 NT$1,500")),
  JSON.stringify(["1500"])
);
check(
  "一兩位數的裸數字不納入（任何頁面都幾乎必然出現，沒有鑑別力）",
  extractAssertableTokens("最多 30 次").length === 0
);
equal("空值不產生 token", extractAssertableTokens(null).length, 0);
equal(
  "重複 token 會去重",
  JSON.stringify(extractAssertableTokens("3% 與 3%")),
  JSON.stringify(["3%"])
);

// 回歸測試：2026-08-05 跑完整 34 筆時，在國泰 CUBE 卡發現的嚴重抽取錯誤。
// 原本的正規化會刪掉所有空白，使「Level 1 2%」黏成「level12%」，於是抽出資料裡
// 根本不存在的 token「12%」（必然找不到 → 假警報），真正的回饋率 2% 反而完全沒被檢查。
const cubeRate = "Level 1 2%；Level 2 3%；Level 3 3.3%；集精選2%；一般消費0.3%";
const cubeTokens = extractAssertableTokens(cubeRate);
check("【回歸】不得抽出被空白黏合而成的假 token 12%", !cubeTokens.includes("12%"));
check("【回歸】不得抽出被空白黏合而成的假 token 23%", !cubeTokens.includes("23%"));
check("【回歸】不得抽出被空白黏合而成的假 token 33.3%", !cubeTokens.includes("33.3%"));
check("【回歸】真正的回饋率 2% 要被抽出來檢查", cubeTokens.includes("2%"));
check("【回歸】真正的回饋率 3% 要被抽出來檢查", cubeTokens.includes("3%"));
check("【回歸】真正的回饋率 3.3% 要被抽出來檢查", cubeTokens.includes("3.3%"));
check("【回歸】真正的回饋率 0.3% 要被抽出來檢查", cubeTokens.includes("0.3%"));

// 官網把數字與百分號分開寫（「3 %」）時，仍應視為同一個值。
equal(
  "數字與百分號之間的空白會被收斂",
  JSON.stringify(extractAssertableTokens("回饋 3 %")),
  JSON.stringify(["3%"])
);
check(
  "【回歸】頁面寫「Level 1 2%」時，2% 要找得到（保留空白邊界）",
  containsNumericToken(normalizeNumericText("Level 1 2% 起"), "2%")
);
check(
  "【回歸】頁面寫「Level 1 2%」時，不應誤判為含有 12%",
  !containsNumericToken(normalizeNumericText("Level 1 2% 起"), "12%")
);

// --- buildAssertions / buildAnchors ---------------------------------------

const sampleOffer = {
  slug: "demo-offer",
  sourceUrl: "https://example.com/demo",
  tiers: [
    { label: "一般消費", rate: "3%", cap: "每月上限 NT$300", minSpend: null },
    { label: "指定通路", rate: "5%", cap: null, minSpend: "單筆滿 1,000 元" }
  ],
  cards: [{ card: { name: "示範卡", bank: { name: "示範銀行" } } }]
};

const built = buildAssertions(sampleOffer);
equal("預設只斷言 rate，兩層回饋產生 2 項（3%、5%）", built.length, 2);
check(
  "斷言包含第二層的 5%",
  built.some((item) => item.token === "5%" && item.field === "rate")
);
check(
  "預設不斷言 cap（細則條款多半不在行銷頁上，納入會產生大量誤報）",
  !built.some((item) => item.field === "cap")
);
check(
  "預設不斷言 minSpend（同上）",
  !built.some((item) => item.field === "minSpend")
);
check(
  "斷言保留來源欄位原文，便於報告顯示",
  built.some((item) => item.sourceValue === "3%")
);

const withCap = buildAssertions(sampleOffer, ["rate", "cap", "minSpend"]);
equal("明確指定欄位時可擴大斷言範圍（3%、300、5%、1000）", withCap.length, 4);

const anchors = buildAnchors(sampleOffer);
check("錨點包含卡片名稱", anchors.includes(normalizeText("示範卡")));
check("錨點包含銀行名稱", anchors.includes(normalizeText("示範銀行")));

// 回歸測試：2026-08-05 本機實測中國信託華航聯名卡時發現的誤報。
// 資料庫記載「中國信託銀行」但官網只寫「中國信託」，資料庫卡名含子卡名但官網分開寫，
// 若只比對完整名稱，健康檢查會把抓對的頁面判成「抓到錯誤頁面」。
const ctbcOffer = {
  slug: "ctbc-demo",
  sourceUrl: "https://example.com/ctbc",
  tiers: [],
  cards: [
    {
      card: {
        name: "中國信託中華航空聯名卡鼎尊無限卡",
        bank: { name: "中國信託銀行" }
      }
    }
  ]
};
const ctbcAnchors = buildAnchors(ctbcOffer);
check(
  "【回歸】錨點包含去掉「銀行」後綴的銀行簡稱",
  ctbcAnchors.includes(normalizeText("中國信託"))
);
check(
  "【回歸】錨點包含去掉銀行前綴後的卡片系列名",
  ctbcAnchors.includes(normalizeText("中華航空聯名卡鼎尊無限卡"))
);
check(
  "【回歸】剝除前綴後產生的單字錨點（如「卡」）會被過濾，否則錨點檢查形同虛設",
  !buildAnchors(sampleOffer).includes("卡")
);
check(
  "【回歸】官網只寫「中國信託中華航空聯名卡」時，健康檢查應通過而非誤判為錯誤頁面",
  evaluateHealth({
    fetchResult: okFetch,
    anchors: ctbcAnchors,
    normalizedPageText: normalizeText(`中國信託中華航空聯名卡 最優6元回饋1哩${filler}`)
  }).ok
);

// --- evaluateHealth --------------------------------------------------------

check(
  "抓取失敗即健康檢查未過",
  !evaluateHealth({
    fetchResult: { ok: false, error: "timeout" },
    anchors,
    normalizedPageText: normalizeText(filler)
  }).ok
);

check(
  "HTTP 4xx 視為未過",
  !evaluateHealth({
    fetchResult: { ok: true, status: 404 },
    anchors,
    normalizedPageText: normalizeText(`示範卡${filler}`)
  }).ok
);

check(
  "頁面過短視為未過（JS 未渲染或被導向錯誤頁）",
  !evaluateHealth({
    fetchResult: okFetch,
    anchors,
    normalizedPageText: normalizeText("示範卡")
  }).ok
);

check(
  "頁面不含任何預期卡片／銀行名稱時視為未過",
  !evaluateHealth({
    fetchResult: okFetch,
    anchors,
    normalizedPageText: normalizeText(`與本卡無關的內容${filler}`)
  }).ok
);

check(
  "內容足夠且含錨點時健康檢查通過",
  evaluateHealth({
    fetchResult: okFetch,
    anchors,
    normalizedPageText: normalizeText(`示範卡${filler}`)
  }).ok
);

// --- checkOffer：本任務最關鍵的行為 ---------------------------------------

const healthFailed = checkOffer({
  offer: sampleOffer,
  fetchResult: okFetch,
  pageText: "空白頁"
});
equal(
  "【關鍵】抽取規則失效／頁面異常時，判定為 health_failed",
  healthFailed.verdict,
  "health_failed"
);
check(
  "【關鍵】health_failed 絕不可被當成 unchanged 回報",
  healthFailed.verdict !== "unchanged"
);
equal("health_failed 不產出斷言結果", healthFailed.assertions.length, 0);

const fetchFailed = checkOffer({
  offer: sampleOffer,
  fetchResult: { ok: false, error: "net::ERR_TIMED_OUT" },
  pageText: ""
});
equal("抓取失敗時判定為 fetch_failed", fetchFailed.verdict, "fetch_failed");
check("【關鍵】fetch_failed 絕不可被當成 unchanged 回報", fetchFailed.verdict !== "unchanged");

const allPresent = checkOffer({
  offer: sampleOffer,
  fetchResult: okFetch,
  pageText: `示範卡 一般消費3%，每月上限NT$300；指定通路5%，單筆滿1,000元。${filler}`
});
equal("所有數值都還在頁面上時判定為 unchanged", allPresent.verdict, "unchanged");
equal("unchanged 時沒有缺漏項目", allPresent.missing.length, 0);

const rateChanged = checkOffer({
  offer: sampleOffer,
  fetchResult: okFetch,
  pageText: `示範卡 一般消費2%，每月上限NT$300；指定通路5%，單筆滿1,000元。${filler}`
});
equal("回饋率由 3% 改為 2% 時判定為 suspect", rateChanged.verdict, "suspect");
equal("缺漏項目正確指出是 3% 不見了", rateChanged.missing[0].token, "3%");

const rateRaised = checkOffer({
  offer: sampleOffer,
  fetchResult: okFetch,
  pageText: `示範卡 一般消費13%，每月上限NT$300；指定通路5%，單筆滿1,000元。${filler}`
});
equal(
  "【回歸】回饋率由 3% 改為 13% 也要被抓到（數字邊界防呆）",
  rateRaised.verdict,
  "suspect"
);

// --- summarize -------------------------------------------------------------

const summary = summarize([allPresent, rateChanged, healthFailed, fetchFailed]);
equal("總數統計正確", summary.total, 4);
equal("失敗數統計正確（health_failed + fetch_failed）", summary.failed, 2);
equal("成功數統計正確", summary.succeeded, 2);
check("有疑似變動或失敗時需要通知使用者", summary.needsAttention);

const quietSummary = summarize([allPresent]);
check("全部無變動時不需要通知（避免通知疲勞）", !quietSummary.needsAttention);

// --- 結果 ------------------------------------------------------------------

console.log(`\nT22 比對與健康檢查邏輯測試`);
console.log(`  通過：${passed}`);
console.log(`  失敗：${failures.length}`);

if (failures.length > 0) {
  console.log("\n失敗項目：");
  for (const failure of failures) {
    console.log(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("\n全部通過。");
