/**
 * [T30] 全站唯一的日期時區基準。
 *
 * ## 為什麼需要這個檔案
 *
 * 資料庫的日期欄位（`startDate`、`endDate`、`lastVerifiedAt`、`publishedAt`）存的是
 * 「**台北某一個日曆日的午夜**」，例如台北 2026-07-01 存成 `2026-06-30T16:00:00Z`。
 * 這個約定由匯入腳本 `scripts/import-offer-data.mjs` 建立（`T00:00:00+08:00`），資料本身正確。
 *
 * 但 T30 之前，讀取端全部使用「**伺服器本機時區**」：`toLocaleDateString()` 不帶 `timeZone`、
 * `setHours(0,0,0,0)`、`new Date("YYYY-MM-DDT00:00:00")` 皆是如此。
 * 本機是 `Asia/Taipei`、Vercel 是 `UTC`，同一份資料因此被解讀成兩個不同的日期：
 *
 * - 正式站把台北 7/1 顯示成 `2026/6/30`（少一天）
 * - `endDate` ＝台北 7/1 的優惠，在台北 7/1 上午 8 點就被判定過期而消失
 * - 後台表單讀出／存回一次，日期就往前跳一天，而且會累積
 *
 * **本機測試永遠看不到這個 bug**，因為本機時區剛好就是台北。
 *
 * ## 使用規則
 *
 * 公開頁面、後台與網域邏輯**一律透過本模組處理日期**，不得自行 `new Date(...)` 做
 * 格式化或日曆日比較。唯一的例外是 JSON-LD 與 sitemap 的完整 ISO 時間戳，
 * 那裡輸出瞬間（instant）本來就正確，不涉及日曆日。
 *
 * 台灣自 1979 年起未實施日光節約時間，`+08:00` 為固定偏移，因此可安全地以固定偏移解析。
 */

/** 全站日期的解讀基準時區。 */
export const SITE_TIME_ZONE = "Asia/Taipei";

/** 台北固定 UTC 偏移（自 1979 年起無日光節約時間）。 */
const TAIPEI_UTC_OFFSET = "+08:00";

/** `YYYY-MM-DD` 格式檢查，供 `parseTaipeiDate` 擋掉不合法輸入。 */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 取得某個瞬間在台北的日曆日，格式為 `YYYY-MM-DD`。
 *
 * 用 `en-CA` 是因為它的短日期格式剛好就是 `YYYY-MM-DD`，不必自行組字串。
 * @param date - 任一瞬間
 * @returns 台北日曆日字串；`date` 為空時回傳 null
 */
export function taipeiDayKey(date?: Date | string | null): string | null {
  if (!date) {
    return null;
  }

  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

/**
 * 把 `YYYY-MM-DD` 解析成「台北該日午夜」的瞬間。
 *
 * 與匯入腳本的寫入方式完全一致，確保後台存進去的值與匯入的值同一個約定。
 * @param value - `YYYY-MM-DD` 字串
 * @returns 對應的 Date；格式不合法或為空時回傳 null
 */
export function parseTaipeiDate(value?: string | null): Date | null {
  if (!value || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00${TAIPEI_UTC_OFFSET}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * 取得某個瞬間所屬「台北日曆日」的午夜瞬間。
 *
 * 這是所有日期比較的基準：先把兩邊都收斂到台北日曆日的午夜，再比大小，
 * 結果就與伺服器時區無關。取代原本各處的 `setHours(0, 0, 0, 0)`。
 * @param date - 任一瞬間
 * @returns 該台北日曆日的午夜；`date` 不合法時回傳 null
 */
export function taipeiDayStart(date?: Date | string | null): Date | null {
  return parseTaipeiDate(taipeiDayKey(date));
}

/**
 * 取得「今天（台北）」的午夜瞬間。
 * @returns 今天台北 00:00 對應的瞬間
 */
export function taipeiTodayStart(): Date {
  const today = taipeiDayStart(new Date());

  // taipeiDayKey(new Date()) 必定合法，這裡只是讓型別收斂為非 null。
  /* istanbul ignore next */
  if (!today) {
    throw new Error("無法取得台北今日日期");
  }

  return today;
}

/**
 * 以台北時區格式化日期，供前台顯示（例：`2026/7/1`）。
 *
 * 取代原本不帶 `timeZone` 的 `toLocaleDateString("zh-TW")`。
 * @param date - 要顯示的日期
 * @returns 格式化字串；`date` 為空時回傳 null
 */
export function formatTaipeiDate(date?: Date | string | null): string | null {
  if (!date) {
    return null;
  }

  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toLocaleDateString("zh-TW", { timeZone: SITE_TIME_ZONE });
}

/**
 * 以台北時區取 `YYYY-MM-DD`，供 `<input type="date">` 的預設值使用。
 *
 * 取代原本的 `value.toISOString().slice(0, 10)`——那是取 UTC 日期，
 * 會把台北午夜的值顯示成前一天，存回去就少一天，且每存一次累積一天。
 * @param date - 欄位現值
 * @returns `YYYY-MM-DD`；`date` 為空時回傳空字串（input 的空值）
 */
export function taipeiDateInput(date?: Date | string | null): string {
  return taipeiDayKey(date) ?? "";
}

/**
 * 判斷 `endDate` 是否已早於今天（台北日曆日）。
 *
 * `endDate` 視為**包含當日**：結束日當天仍算有效，隔天才算過期。
 * @param endDate - 優惠結束日；null 代表沒有結束日
 * @returns true 表示已過期
 */
export function isPastTaipeiDay(endDate?: Date | string | null): boolean {
  if (!endDate) {
    return false;
  }

  const end = taipeiDayStart(endDate);

  if (!end) {
    return false;
  }

  return end.getTime() < taipeiTodayStart().getTime();
}

/**
 * 計算距離某日還有幾天（以台北日曆日計算）。
 *
 * 已過期回傳負數，當天回傳 0。
 * @param endDate - 目標日期
 * @returns 天數差；`endDate` 為空或不合法時回傳 null
 */
export function daysUntilTaipeiDay(endDate?: Date | string | null): number | null {
  const end = taipeiDayStart(endDate);

  if (!end) {
    return null;
  }

  const diffMs = end.getTime() - taipeiTodayStart().getTime();

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 以台北日曆日為基準位移天數，供後台「未來 14 天」「過去 30 天」這類區間查詢使用。
 * @param days - 位移天數，可為負
 * @param from - 基準日，預設為今天
 * @returns 位移後該台北日曆日的午夜
 */
export function taipeiDayOffset(days: number, from?: Date): Date {
  const base = from ? taipeiDayStart(from) : taipeiTodayStart();

  if (!base) {
    throw new Error("taipeiDayOffset 收到不合法的基準日");
  }

  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}
