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

async function expectPage(path, requiredTexts, forbiddenTexts = [], jar) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: jar ? { cookie: cookieHeader(jar) } : undefined
  });
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

try {
  const jar = await login();
  const [card, offer] = await Promise.all([
    prisma.card.findFirst({ orderBy: { id: "asc" } }),
    prisma.offer.findFirst({ where: { isPublished: true }, orderBy: { id: "asc" } })
  ]);

  if (!card) failures.push("No card exists for admin card edit smoke test");
  if (!offer) failures.push("No published offer exists for admin offer edit smoke test");

  if (card) {
    await expectPage(`/admin/cards/${card.id}`, [
      "編輯信用卡",
      "Slug 會影響公開網址",
      "還原本次修改",
      "回信用卡管理列表",
      "回後台首頁"
    ], [], jar);
  }

  if (offer) {
    await expectPage(`/admin/offers/${offer.id}`, [
      "Slug 會影響公開網址",
      "還原本次修改",
      "回優惠管理列表",
      "回後台首頁",
      "優惠亮點"
    ], [], jar);
  }

  await expectPage("/categories/cashback", [], ["分類 Slug", "SEO 標題"]);
  await expectPage("/search", ["搜尋優惠"], []);
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("Admin UX fixes v3 smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin UX fixes v3 smoke test passed.");
