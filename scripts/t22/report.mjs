// T22 排程輔助資料更新（瘦身版）：報告產生與 Telegram 通知
// 任務卡：docs/implementation/tasks/T22-SCHEDULED_DATA_UPDATE_排程輔助資料更新.md
//
// 唯讀：本檔不寫資料庫。formatReport 為純函式，可離線測試。

const TELEGRAM_MAX_LENGTH = 4096;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

/**
 * 產生人可讀的報告內文（Telegram HTML parse mode）。
 *
 * 報告一定會寫出「成功／失敗數」，讓使用者一眼看出這次的覆蓋率——沒有這個數字，
 * 「沒有疑似變動」這句話就無法判斷是真的沒變，還是根本沒抓到。
 */
export function formatReport(summary, { checkedAt = new Date() } = {}) {
  const lines = [];
  const dateLabel = checkedAt.toISOString().slice(0, 10);

  lines.push(`<b>信用卡優惠來源檢查（${dateLabel}）</b>`);
  lines.push(
    `檢查 ${summary.total} 筆｜成功 ${summary.succeeded}｜失敗 ${summary.failed}｜疑似有變 ${summary.byVerdict.suspect.length}`
  );

  if (summary.byVerdict.suspect.length > 0) {
    lines.push("");
    lines.push("<b>疑似有變</b>");
    for (const result of summary.byVerdict.suspect) {
      lines.push("");
      lines.push(`• <b>${escapeHtml(result.slug)}</b>`);
      for (const item of result.missing) {
        lines.push(
          `  ${escapeHtml(item.field)}：資料庫記載 <b>${escapeHtml(item.token)}</b>（原文「${escapeHtml(item.sourceValue)}」）在官網上找不到`
        );
      }
      lines.push(`  ${escapeHtml(result.sourceUrl)}`);
    }
  }

  const failures = [...summary.byVerdict.fetch_failed, ...summary.byVerdict.health_failed];
  if (failures.length > 0) {
    lines.push("");
    lines.push("<b>抓取失敗（無法判斷是否有變動，需人工確認）</b>");
    for (const result of failures) {
      lines.push("");
      lines.push(`• <b>${escapeHtml(result.slug)}</b>`);
      for (const reason of result.health.reasons) {
        lines.push(`  ${escapeHtml(reason)}`);
      }
      lines.push(`  ${escapeHtml(result.sourceUrl)}`);
    }
  }

  if (!summary.needsAttention) {
    lines.push("");
    lines.push("本次全部無變動，不需處理。");
  } else {
    lines.push("");
    lines.push("處理方式：在對話中請 AI 依規格書查證官網 → 更新 xlsx → 執行 npm run data:import。");
  }

  return lines.join("\n");
}

/**
 * 過長時截斷，保留開頭的統計與最前面幾筆，避免 Telegram 直接拒收整則訊息。
 */
export function truncateForTelegram(text, maxLength = TELEGRAM_MAX_LENGTH) {
  if (text.length <= maxLength) return text;
  const notice = "\n\n（內容過長已截斷，完整結果請見 GitHub Actions 執行記錄）";
  return `${text.slice(0, maxLength - notice.length)}${notice}`;
}

/**
 * 送出 Telegram 通知。
 *
 * 憑證只從環境變數讀取，永遠不寫進檔案、不印在 log 裡。
 */
export async function sendTelegram(text, { botToken, chatId } = {}) {
  const token = botToken ?? process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId ?? process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat) {
    return { sent: false, reason: "未設定 TELEGRAM_BOT_TOKEN／TELEGRAM_CHAT_ID" };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: truncateForTelegram(text),
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    // 只回報狀態碼，不回傳內容，避免把含 token 的錯誤訊息寫進 log。
    return { sent: false, reason: `Telegram API 回應 ${response.status}` };
  }

  return { sent: true, reason: null };
}
