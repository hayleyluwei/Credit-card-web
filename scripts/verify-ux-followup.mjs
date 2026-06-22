const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "replace-with-a-local-admin-password";
const failures = [];

function parseSetCookie(headers) {
  return headers.getSetCookie?.() ?? [];
}

function mergeCookies(existing, setCookies) {
  const jar = new Map(existing);
  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return Array.from(jar.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
}

async function login() {
  let jar = new Map();
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  jar = mergeCookies(jar, parseSetCookie(csrfResponse.headers));
  const csrfData = await csrfResponse.json();
  const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar)
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: adminEmail,
      password: adminPassword,
      redirect: "false",
      json: "true"
    })
  });
  jar = mergeCookies(jar, parseSetCookie(response.headers));
  if (!response.ok) failures.push(`Admin login failed with status ${response.status}`);
  return jar;
}

async function expectPage(path, requiredTexts, forbiddenTexts = [], jar = null) {
  const response = await fetch(`${baseUrl}${path}`, jar ? { headers: { cookie: cookieHeader(jar) } } : undefined);
  const html = await response.text();
  if (response.status !== 200) failures.push(`${path} should return 200, got ${response.status}`);
  for (const text of requiredTexts) {
    if (!html.includes(text)) failures.push(`${path} missing text: ${text}`);
  }
  for (const text of forbiddenTexts) {
    if (html.includes(text)) failures.push(`${path} should not include text: ${text}`);
  }
  return html;
}

const jar = await login();

await expectPage("/admin/cards", ["回後台首頁", "卡面圖片 URL", "銀行詳情頁", "優惠詳情頁", "Slug 是公開網址識別"], [], jar);
await expectPage("/admin/offers/new", ["回後台首頁", "前台欄位對應圖", "發布前請填寫官方來源連結"], [], jar);
await expectPage("/admin/settings", ["回後台首頁"], [], jar);

await expectPage("/search?q=%E6%B0%B8%E8%B1%90", ["永豐銀行", "DAWHO現金回饋信用卡"], ["搜尋說明"]);
await expectPage("/offers/cube-cashback-3", ["國泰世華銀行", "台新銀行", "CUBE 卡", "FlyGo 卡"]);
await expectPage("/banks/cathay", ["CUBE 卡", "卡面圖片"]);
await expectPage("/offers/dawho-high-cashback-2026", ["永豐銀行", "DAWHO現金回饋信用卡"]);

if (failures.length > 0) {
  console.error("UX follow-up smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("UX follow-up smoke test passed.");
