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

async function expectPage(jar, path, requiredTexts, forbiddenTexts = []) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { cookie: cookieHeader(jar) } });
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

const offersHtml = await expectPage(jar, "/admin/offers", [
  "優惠管理",
  "查看公開頁",
  "target=\"_blank\"",
  "rel=\"noreferrer\""
]);

if (!offersHtml.includes("另開新分頁")) {
  failures.push("/admin/offers should explain public page links open in a new tab");
}

await expectPage(jar, "/admin/offers/new", [
  "新增優惠",
  "前台欄位對應圖",
  "優惠卡片 / 搜尋結果",
  "優惠詳情頁",
  "每週四國內餐廳單筆滿 NT$2,000，享 5% 小樹點優惠券",
  "常在國內餐廳消費、持有 CUBE 卡的使用者",
  "餐飲,CUBE,小樹點,週四",
  "加碼 5% 優惠券",
  "每張優惠券上限 100 點小樹點",
  "活動期間、適用通路、消費門檻、回饋方式、上限與注意事項",
  "發布前請填寫官方來源連結",
  "發布前請填寫回饋方式或回饋內容",
  "發布前請至少勾選一張適用信用卡"
]);

await expectPage(jar, "/admin/cards", [
  "Slug 是公開網址識別，建立後預設不要修改",
  "SEO 欄位不會因優惠更新自動覆蓋"
]);

await expectPage(jar, "/admin/banks", [
  "Slug 是公開網址識別，建立後預設不要修改",
  "SEO 欄位不會因優惠更新自動覆蓋"
]);

if (failures.length > 0) {
  console.error("Admin UX fixes v2 smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin UX fixes v2 smoke test passed.");
