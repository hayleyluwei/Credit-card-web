// T22 排程輔助資料更新（瘦身版）：頁面抓取層（Playwright 真瀏覽器渲染）
// 任務卡：docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md
//
// 唯讀：本檔只讀取外部網頁，不寫資料庫、不寫專案檔案。
//
// 為什麼一定要真瀏覽器渲染：T17 資料抽查時，國泰 CUBE 卡官網以純 HTTP 抓取讀到的是
// 2024 舊版內容，因為現行內容是 JavaScript 動態載入的。純讀 HTML 會安靜地拿到過期資料，
// 這正是本任務要防的那種靜默失敗。

import { chromium } from "playwright";

// 單頁最長等待時間。銀行官網偶爾很慢，但也不能無限等，否則整批排程會卡住。
const PAGE_TIMEOUT_MS = 45_000;

// 頁面載入後額外等待的時間，讓延遲載入的區塊有機會渲染完成。
const SETTLE_MS = 2_000;

// 對同一個網站連續請求之間的間隔，避免造成對方負擔或觸發封鎖。
export const POLITE_DELAY_MS = 3_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function createBrowser() {
  return chromium.launch({ headless: true });
}

/**
 * 取得單一頁面渲染後的可見文字。
 *
 * 回傳結構固定為 { ok, status, text, error }，讓呼叫端不必區分例外與正常回應——
 * 任何失敗都會以 ok:false 表達，交由健康檢查統一判定，避免例外讓整批中斷。
 */
export async function fetchPageText(browser, url) {
  let context;
  try {
    context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: "zh-TW",
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS
    });

    // 等待網路安靜下來，讓 JS 載入的內容補齊；逾時不算失敗，後續健康檢查會判斷內容夠不夠。
    await page.waitForLoadState("networkidle", { timeout: PAGE_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);

    const text = await page.evaluate(() => document.body?.innerText ?? "");

    return {
      ok: true,
      status: response?.status() ?? null,
      text,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      text: "",
      error: error?.message ?? String(error)
    };
  } finally {
    await context?.close().catch(() => {});
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
