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
const [bank, card, category] = await Promise.all([
  prisma.bank.findFirst({ orderBy: { id: "asc" } }),
  prisma.card.findFirst({ orderBy: { id: "asc" } }),
  prisma.category.findFirst({ orderBy: { id: "asc" } })
]);

await expectPage(jar, "/admin/settings", ["網站設定", "站台名稱", "預設 SEO 標題", "儲存設定"]);
await expectPage(jar, "/admin/banks", ["銀行管理", "新增銀行", "搜尋銀行", "啟用", "停用"]);
await expectPage(jar, "/admin/cards", ["信用卡管理", "新增信用卡", "搜尋信用卡", "所屬銀行"]);
await expectPage(jar, "/admin/categories", ["分類管理", "新增分類", "FAQ JSON", "排序"]);

if (bank) await expectPage(jar, `/admin/banks/${bank.id}`, ["編輯銀行", "Slug", "SEO 標題", "儲存銀行"]);
else failures.push("No bank seed data found for edit page smoke test");
if (card) await expectPage(jar, `/admin/cards/${card.id}`, ["編輯信用卡", "所屬銀行", "卡面圖片 URL", "儲存信用卡"]);
else failures.push("No card seed data found for edit page smoke test");
if (category) await expectPage(jar, `/admin/categories/${category.id}`, ["編輯分類", "FAQ JSON", "排序", "儲存分類"]);
else failures.push("No category seed data found for edit page smoke test");

await prisma.$disconnect();

if (failures.length > 0) {
  console.error("T11 admin CRUD smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("T11 admin CRUD smoke test passed.");
