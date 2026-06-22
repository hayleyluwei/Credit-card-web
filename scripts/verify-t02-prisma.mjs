import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const requiredModels = [
  "SiteSetting",
  "AdminUser",
  "Bank",
  "Card",
  "Category",
  "Offer",
  "OfferCard"
];

const excludedModels = [
  "AuditLog",
  "FaqItem",
  "Tag",
  "Redirect",
  "CrawlSource",
  "ImportJob"
];

const failures = [];
const schemaPath = "prisma/schema.prisma";

if (!existsSync(schemaPath)) {
  failures.push("Missing prisma/schema.prisma");
} else {
  const schema = await readFile(schemaPath, "utf8");

  for (const model of requiredModels) {
    if (!schema.includes(`model ${model} `)) {
      failures.push(`Missing required model: ${model}`);
    }
  }

  for (const model of excludedModels) {
    if (schema.includes(`model ${model} `)) {
      failures.push(`MVP-excluded model must not be present: ${model}`);
    }
  }

  if (!schema.includes('provider = "sqlite"')) {
    failures.push("Schema datasource must use SQLite for local MVP development");
  }
}

const prisma = new PrismaClient();

try {
  await prisma.siteSetting.findMany({ take: 1 });
} catch (error) {
  failures.push(`Prisma Client query failed: ${error.message}`);
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("T02 Prisma smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("T02 Prisma smoke test passed.");
