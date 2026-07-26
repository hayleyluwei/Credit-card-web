import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const failures = [];

async function expectPage(path, requiredTexts, forbiddenTexts = []) {
  const response = await fetch(`${baseUrl}${path}`);
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
  const cards = await prisma.card.findMany({
    where: {
      isActive: true,
      bank: {
        isActive: true
      }
    },
    include: {
      bank: true,
      offers: {
        include: {
          offer: true
        }
      }
    },
    orderBy: [{ bank: { name: "asc" } }, { name: "asc" }],
    take: 3
  });

  const homepageHtml = await expectPage("/", [
    "依信用卡查優惠",
    "選你手上的信用卡",
    "查看這張卡"
  ], [
    "/admin/login"
  ]);

  if (cards.length === 0) {
    failures.push("No active cards found for homepage card-entry smoke test");
  }

  for (const card of cards) {
    if (!homepageHtml.includes(card.name)) failures.push(`Homepage missing active card name: ${card.name}`);
    if (!homepageHtml.includes(card.bank.name)) failures.push(`Homepage missing bank name for card ${card.name}: ${card.bank.name}`);
    if (!homepageHtml.includes(`/cards/${card.slug}`)) failures.push(`Homepage missing card detail link: /cards/${card.slug}`);
  }

  if (cards[0]) {
    await expectPage(`/cards/${cards[0].slug}`, [
      cards[0].name,
      "相關優惠"
    ]);
  }
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("Homepage card entry smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Homepage card entry smoke test passed.");
