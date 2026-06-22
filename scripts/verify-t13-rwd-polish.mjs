import { readFile } from "node:fs/promises";

const filesWithoutRawImages = [
  "src/app/banks/[slug]/page.tsx",
  "src/app/cards/[slug]/page.tsx"
];
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "replace-with-a-local-admin-password";
const failures = [];

for (const file of filesWithoutRawImages) {
  const content = await readFile(file, "utf8");
  if (content.includes("<img")) {
    failures.push(`${file} still contains raw <img>; use next/image responsive rendering`);
  }
}

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

async function expectPage(path, requiredTexts, jar) {
  const response = await fetch(`${baseUrl}${path}`, jar ? { headers: { cookie: cookieHeader(jar) } } : undefined);
  const html = await response.text();
  if (response.status !== 200) failures.push(`${path} should return 200, got ${response.status}`);
  for (const text of requiredTexts) {
    if (!html.includes(text)) failures.push(`${path} missing text: ${text}`);
  }
}

const jar = await login();
await expectPage("/", ["搜尋"], null);
await expectPage("/search", ["搜尋"], null);
await expectPage("/admin", ["Admin Dashboard"], jar);
await expectPage("/admin/offers", ["搜尋優惠", "發布狀態", "分類篩選"], jar);
await expectPage("/admin/offers/new", ["基本內容", "關聯信用卡", "儲存並發布"], jar);

if (failures.length > 0) {
  console.error("T13 RWD polish smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("T13 RWD polish smoke test passed.");
