import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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

async function expectPage(jar, path, requiredTexts) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { cookie: cookieHeader(jar) } });
  const html = await response.text();
  if (response.status !== 200) failures.push(`${path} should return 200, got ${response.status}`);
  for (const text of requiredTexts) {
    if (!html.includes(text)) failures.push(`${path} missing text: ${text}`);
  }
}

const jar = await login();
const offer = await prisma.offer.findFirst({ orderBy: { id: "asc" } });

await expectPage(jar, "/admin/offers", [
  "優惠管理",
  "新增優惠",
  "搜尋優惠",
  "發布狀態",
  "分類篩選",
  "草稿",
  "已發布",
  "查看公開頁（另開新分頁）"
]);

await expectPage(jar, "/admin/offers/new", [
  "新增優惠",
  "前台欄位對應圖",
  "基本內容",
  "優惠內容",
  "適用信用卡",
  "發布前請填寫官方來源連結",
  "發布前請填寫回饋方式或回饋內容",
  "發布前請至少勾選一張適用信用卡",
  "儲存草稿",
  "儲存並發布"
]);

if (offer) {
  await expectPage(jar, `/admin/offers/${offer.id}`, [
    "編輯優惠",
    "優惠標題",
    "官方來源連結",
    "最後驗證日期",
    "FAQ JSON",
    "取消發布"
  ]);
} else {
  failures.push("No offer seed data found for edit page smoke test");
}

await prisma.$disconnect();

if (failures.length > 0) {
  console.error("T12 offer editor smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("T12 offer editor smoke test passed.");
