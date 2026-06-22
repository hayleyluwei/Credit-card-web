import bcrypt from "bcryptjs";
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
    if (index > 0) {
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }
  return jar;
}

function cookieHeader(jar) {
  return Array.from(jar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

async function getCsrf(jar) {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: jar.size ? { cookie: cookieHeader(jar) } : {}
  });
  const nextJar = mergeCookies(jar, parseSetCookie(response.headers));
  if (!response.ok) {
    failures.push(`/api/auth/csrf should return 200, got ${response.status}`);
    return { csrfToken: "", jar: nextJar };
  }
  const data = await response.json();
  return { csrfToken: data.csrfToken, jar: nextJar };
}

async function credentialsLogin(email, password) {
  let jar = new Map();
  const csrf = await getCsrf(jar);
  jar = csrf.jar;

  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
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
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { parseError: true };
  }
  return { response, data, jar };
}

try {
  const anonymousAdmin = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
  if (![302, 303, 307, 308].includes(anonymousAdmin.status)) {
    failures.push(`Anonymous /admin should redirect, got ${anonymousAdmin.status}`);
  }
  const anonymousLocation = anonymousAdmin.headers.get("location") ?? "";
  if (!anonymousLocation.includes("/admin/login")) {
    failures.push(`Anonymous /admin should redirect to /admin/login, got ${anonymousLocation}`);
  }

  const beforeAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!beforeAdmin) {
    failures.push(`Seed admin not found: ${adminEmail}`);
  }

  const wrongPassword = await credentialsLogin(adminEmail, "definitely-wrong-password");
  if (wrongPassword.response.ok && !wrongPassword.data.error) {
    failures.push("Wrong password login should fail");
  }

  const inactiveEmail = "inactive-admin@example.com";
  await prisma.adminUser.upsert({
    where: { email: inactiveEmail },
    update: {
      passwordHash: await bcrypt.hash("inactive-password", 10),
      isActive: false
    },
    create: {
      email: inactiveEmail,
      passwordHash: await bcrypt.hash("inactive-password", 10),
      displayName: "Inactive Admin",
      isActive: false
    }
  });

  const inactiveLogin = await credentialsLogin(inactiveEmail, "inactive-password");
  if (inactiveLogin.response.ok && !inactiveLogin.data.error) {
    failures.push("Inactive admin login should fail");
  }

  const validLogin = await credentialsLogin(adminEmail, adminPassword);
  if (!validLogin.response.ok || validLogin.data.error) {
    failures.push(`Valid admin login should succeed, got status ${validLogin.response.status} error ${validLogin.data.error ?? ""}`);
  }

  const authedAdmin = await fetch(`${baseUrl}/admin`, {
    headers: { cookie: cookieHeader(validLogin.jar) },
    redirect: "manual"
  });
  if (authedAdmin.status !== 200) {
    failures.push(`Authenticated /admin should return 200, got ${authedAdmin.status}`);
  }

  const afterAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!afterAdmin?.lastLoginAt) {
    failures.push("Successful login should update AdminUser.lastLoginAt");
  } else if (beforeAdmin?.lastLoginAt && afterAdmin.lastLoginAt <= beforeAdmin.lastLoginAt) {
    failures.push("Successful login should advance AdminUser.lastLoginAt");
  }

  await prisma.adminUser.delete({ where: { email: inactiveEmail } }).catch(() => undefined);
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("T09 auth smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("T09 auth smoke test passed.");
