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

  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email: adminEmail,
    password: adminPassword,
    redirect: "false",
    json: "true"
  });

  const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar)
    },
    body
  });
  jar = mergeCookies(jar, parseSetCookie(response.headers));

  if (!response.ok) {
    failures.push(`Admin login failed with status ${response.status}`);
  }
  return jar;
}

const jar = await login();
const response = await fetch(`${baseUrl}/admin`, {
  headers: { cookie: cookieHeader(jar) }
});
const html = await response.text();

if (response.status !== 200) {
  failures.push(`/admin should return 200 after login, got ${response.status}`);
}

const requiredTexts = [
  "後台工作台",
  "優惠管理",
  "銀行管理",
  "信用卡管理",
  "分類管理",
  "網站設定",
  "已發布優惠",
  "草稿優惠",
  "過期優惠",
  "信用卡數",
  "銀行數",
  "維護提醒",
  "即將到期",
  "缺少來源連結",
  "缺少圖片",
  "待重新確認",
  "新增優惠",
  "新增信用卡"
];

for (const text of requiredTexts) {
  if (!html.includes(text)) {
    failures.push(`/admin dashboard missing text: ${text}`);
  }
}

if (failures.length > 0) {
  console.error("T10 dashboard smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("T10 dashboard smoke test passed.");
