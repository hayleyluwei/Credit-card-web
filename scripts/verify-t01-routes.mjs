const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const routeChecks = [
  { path: "/", expectedText: "信用卡" },
  { path: "/search", expectedText: "搜尋" },
  { path: "/admin/login", expectedText: "Admin" },
  { path: "/admin", expectedText: "Admin" }
];

const failures = [];

for (const check of routeChecks) {
  const url = new URL(check.path, baseUrl);
  const response = await fetch(url);
  const body = await response.text();

  if (!response.ok) {
    failures.push(`${check.path} returned ${response.status}`);
    continue;
  }

  if (!body.includes(check.expectedText)) {
    failures.push(`${check.path} did not include expected text: ${check.expectedText}`);
  }

  if (check.path === "/" && (body.includes("/admin/login") || body.includes("後台登入"))) {
    failures.push("/ must not expose an admin login entry to public visitors");
  }
}

if (failures.length > 0) {
  console.error("T01 smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("T01 smoke test passed.");
