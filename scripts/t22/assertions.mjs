// T22 排程輔助資料更新（瘦身版）：比對與健康檢查的純函式核心
// 任務卡：docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md
//
// 本檔不連資料庫、不連網路、不做 I/O，全部為可離線單元測試的純函式。
// 對應測試：scripts/verify-t22-source-check.mjs

// 頁面正規化後的最小可接受長度。低於此值視為抓取失敗（多半是 JS 未渲染或被導到錯誤頁）。
export const MIN_PAGE_TEXT_LENGTH = 200;

// 金額類數值至少要三位數才拿來斷言。一兩位數（如「1」「30」）在任何頁面都幾乎必然出現，
// 拿來比對只會恆為「找得到」，對偵測變動沒有鑑別力，反而稀釋訊號。
const MIN_AMOUNT_TOKEN_VALUE = 100;

/**
 * 文字正規化：把全形/半形、大小寫、空白與千分位差異抹平，讓比對只看實質內容。
 *
 * NFKC 會把全形數字與全形百分比（３％）轉成半形（3%），這是銀行頁面常見的寫法差異。
 *
 * 千分位逗號必須在這裡一併處理，且頁面文字與資料庫值要用同一套規則：資料庫寫
 * 「1,000」而官網寫「1000」（或反過來）是很常見的，若只有單邊去逗號，比對會永遠
 * 落空，把根本沒變的優惠誤報成疑似有變。只移除夾在數字之間的逗號，一般標點不受影響。
 */
export function normalizeText(input) {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFKC")
    .replace(/\s+/gu, "")
    .replace(/(?<=\d),(?=\d)/gu, "")
    .toLowerCase();
}

/**
 * 數值比對專用的正規化：與 normalizeText 的關鍵差異是「保留空白」。
 *
 * 兩者不能共用一套規則，因為需求互相矛盾：
 *   - 錨點比對要刪掉所有空白。卡片名稱在頁面上常被換行或不同 DOM 節點切開
 *     （「中國信託\n中華航空聯名卡」），不刪空白就比不到。
 *   - 數值比對要保留空白當邊界。2026-08-05 實測發現，刪掉空白會讓
 *     「Level 1 2%」黏成「level12%」，於是抽出憑空捏造的 token「12%」，
 *     真正的回饋率 2% 反而完全沒被檢查——假警報與漏檢同時發生。
 *
 * 空白統一收斂為單一半形空格；但數字與百分號之間的空白要去掉，
 * 因為官網常寫成「3 %」而資料庫寫「3%」，那是同一個值。
 */
export function normalizeNumericText(input) {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(\d)\s+%/gu, "$1%")
    .replace(/(?<=\d),(?=\d)/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * 數值是否出現在頁面文字中，且不是另一個更長數字的一部分。
 *
 * 直接用 includes() 會誤判：搜尋「3%」時「13%」也會命中，於是回饋率從 3% 改成 13%
 * 這種真正該被抓到的變動反而被判為「沒變」。前後加數字邊界可避免這個方向的漏報。
 */
export function containsNumericToken(normalizedPageText, token) {
  if (!normalizedPageText || !token) return false;
  const pattern = new RegExp(`(?<![\\d.])${escapeRegExp(token)}(?![\\d])`, "u");
  return pattern.test(normalizedPageText);
}

/**
 * 從資料庫欄位值抽出值得斷言的數值 token。
 *
 * 欄位內容是自由文字（如「每月上限 NT$300」「單筆滿 3,000 元」），整串不會逐字出現在
 * 官網上，因此比對的對象是其中的數字，而不是整個字串。
 */
export function extractAssertableTokens(rawValue) {
  // 必須用保留空白的正規化，否則「Level 1 2%」會黏成「level12%」而抽出錯誤的 12%。
  const normalized = normalizeNumericText(rawValue);
  if (!normalized) return [];

  const matches = normalized.match(/\d+(?:\.\d+)?%?/gu) ?? [];
  const tokens = [];

  for (const match of matches) {
    const isPercent = match.endsWith("%");
    if (isPercent) {
      // 百分比是回饋率的核心，鑑別力高，一律納入。
      tokens.push(match);
      continue;
    }
    if (Number.parseFloat(match) >= MIN_AMOUNT_TOKEN_VALUE) {
      tokens.push(match);
    }
  }

  return [...new Set(tokens)];
}

/**
 * 依一筆優惠（含其 RewardTier）建立本次要斷言的項目清單。
 *
 * 設計取捨：不採「每家銀行維護 CSS 選擇器」的做法，而是反過來問——
 * 「資料庫記載的這些數字，現在還出現在官網上嗎？」
 * 選擇器會隨官網改版失效且難以察覺；數字本身則是銀行真的改了條件時才會消失，
 * 對頁面結構調整不敏感，維護成本低很多。
 */
// 預設只斷言 rate（回饋率）。
//
// 2026-08-05 以真實資料實測後收斂：cap／minSpend 記載的多半是細則條款（退票手續費、
// 每月哩程上限、各子卡不同的門檻金額），這些寫在條款頁或 PDF，本來就不會出現在行銷
// 首頁上。把它們納入斷言會讓 6 筆裡有 4 筆報「疑似有變」，全是誤報，每月產生一整面
// 雜訊後使用者就不會再看通知了——這正是設計上要避免的通知疲勞。
//
// rate 則是行銷頁一定會寫的主打數字，且驗收規則把「回饋數字錯誤」列為重大錯誤，
// 鑑別力與重要性都最高。
export const DEFAULT_ASSERT_FIELDS = ["rate"];

export function buildAssertions(offer, fields = DEFAULT_ASSERT_FIELDS) {
  const assertions = [];
  const seen = new Set();
  const fieldSet = new Set(fields);

  for (const tier of offer.tiers ?? []) {
    for (const [field, rawValue] of [
      ["rate", tier.rate],
      ["cap", tier.cap],
      ["minSpend", tier.minSpend]
    ]) {
      if (!fieldSet.has(field)) continue;
      for (const token of extractAssertableTokens(rawValue)) {
        const key = `${field}:${token}`;
        if (seen.has(key)) continue;
        seen.add(key);
        assertions.push({
          field,
          token,
          tierLabel: tier.label ?? null,
          sourceValue: rawValue
        });
      }
    }
  }

  return assertions;
}

// 錨點的最小長度。剝除銀行前綴後可能剩下「卡」這種單字，幾乎任何頁面都會命中，
// 留著會讓健康檢查形同虛設。二字以上才保留（真實銀行簡稱如「玉山」「永豐」皆為二字）。
const MIN_ANCHOR_LENGTH = 2;

// 資料庫記載的銀行全名常帶有官網不會寫出來的後綴（資料庫「中國信託銀行」vs 官網「中國信託」）。
const BANK_NAME_SUFFIXES = [
  "商業銀行股份有限公司",
  "銀行股份有限公司",
  "股份有限公司",
  "商業銀行",
  "銀行"
];

function buildBankVariants(bankName) {
  if (!bankName) return [];
  const variants = [bankName];
  for (const suffix of BANK_NAME_SUFFIXES) {
    if (bankName.endsWith(suffix) && bankName.length > suffix.length) {
      variants.push(bankName.slice(0, -suffix.length));
      break;
    }
  }
  return variants;
}

/**
 * 建立「錨點關鍵字」：用來確認抓到的是預期的那一頁，而不是錯誤頁、登入頁或首頁。
 *
 * 只要頁面上出現任一個錨點，就視為抓到正確頁面。錨點刻意包含多種寬鬆程度的寫法，
 * 因為資料庫的正式名稱與官網的行銷寫法經常不一致，實測發現兩種常見落差：
 *   1. 銀行名後綴：資料庫「中國信託銀行」，官網只寫「中國信託」。
 *   2. 子卡名分開寫：資料庫「中國信託中華航空聯名卡鼎尊無限卡」，官網把系列名與
 *      子卡名拆在頁面不同位置，整串不會連續出現。
 * 若只用完整名稱比對，幾乎每一頁都會被誤判成「抓到錯誤頁面」，讓健康檢查失去意義。
 */
export function buildAnchors(offer) {
  const anchors = [];

  for (const link of offer.cards ?? []) {
    const card = link.card;
    const bankVariants = buildBankVariants(card?.bank?.name);
    anchors.push(...bankVariants);

    if (card?.name) {
      anchors.push(card.name);
      // 去掉開頭的銀行名，保留卡片系列名（如「中華航空聯名卡鼎尊無限卡」）。
      for (const variant of bankVariants) {
        if (variant && card.name.startsWith(variant) && card.name.length > variant.length) {
          anchors.push(card.name.slice(variant.length));
        }
      }
    }
  }

  return [
    ...new Set(
      anchors
        .map((value) => normalizeText(value))
        .filter((value) => value.length >= MIN_ANCHOR_LENGTH)
    )
  ];
}

/**
 * 健康檢查：區分「確認沒變」與「根本沒抓到」。
 *
 * 這是本任務最關鍵的一段。確定性爬蟲最危險的失效方式，是規則壞掉後抽到空值、
 * 比對結果為「無變動」，使用者於是誤以為官網真的沒變。因此凡是無法證明
 * 「這一頁確實被正確抓到」的情況，一律回報失敗，不得混入「無變動」。
 */
export function evaluateHealth({ fetchResult, anchors, normalizedPageText }) {
  const reasons = [];

  if (!fetchResult?.ok) {
    reasons.push(fetchResult?.error ? `抓取失敗：${fetchResult.error}` : "抓取失敗");
    return { ok: false, reasons };
  }

  if (typeof fetchResult.status === "number" && fetchResult.status >= 400) {
    reasons.push(`HTTP 狀態碼 ${fetchResult.status}`);
  }

  if (normalizedPageText.length < MIN_PAGE_TEXT_LENGTH) {
    reasons.push(
      `頁面內容過短（${normalizedPageText.length} < ${MIN_PAGE_TEXT_LENGTH}），可能未完成渲染或被導向錯誤頁`
    );
  }

  if (anchors.length > 0 && !anchors.some((anchor) => normalizedPageText.includes(anchor))) {
    reasons.push("頁面未出現任何預期的卡片或銀行名稱，可能抓到錯誤頁面");
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * 綜合單筆優惠的檢查結果，產出判定。
 *
 * verdict 只有四種，且「健康檢查未過」永遠不會被歸類為 unchanged。
 */
export function checkOffer({ offer, fetchResult, pageText }) {
  // 同一份頁面文字要用兩套正規化：錨點比對刪空白，數值比對保留空白當邊界。
  const normalizedPageText = normalizeText(pageText);
  const numericPageText = normalizeNumericText(pageText);
  const anchors = buildAnchors(offer);
  const health = evaluateHealth({ fetchResult, anchors, normalizedPageText });

  if (!fetchResult?.ok) {
    return {
      slug: offer.slug,
      sourceUrl: offer.sourceUrl,
      verdict: "fetch_failed",
      health,
      assertions: []
    };
  }

  if (!health.ok) {
    return {
      slug: offer.slug,
      sourceUrl: offer.sourceUrl,
      verdict: "health_failed",
      health,
      assertions: []
    };
  }

  const assertions = buildAssertions(offer).map((assertion) => ({
    ...assertion,
    found: containsNumericToken(numericPageText, assertion.token)
  }));

  const missing = assertions.filter((assertion) => !assertion.found);

  return {
    slug: offer.slug,
    sourceUrl: offer.sourceUrl,
    verdict: missing.length > 0 ? "suspect" : "unchanged",
    health,
    assertions,
    missing
  };
}

/**
 * 彙總所有結果，供報告與通知使用。
 *
 * needsAttention 是「這次要不要打擾使用者」的唯一依據：只要有任何一筆疑似有變、
 * 抓取失敗或健康檢查未過就為真；全部 unchanged 則不發通知。
 */
export function summarize(results) {
  const byVerdict = {
    unchanged: [],
    suspect: [],
    fetch_failed: [],
    health_failed: []
  };

  for (const result of results) {
    byVerdict[result.verdict].push(result);
  }

  const failed = byVerdict.fetch_failed.length + byVerdict.health_failed.length;

  return {
    total: results.length,
    succeeded: results.length - failed,
    failed,
    byVerdict,
    needsAttention: byVerdict.suspect.length + failed > 0
  };
}
