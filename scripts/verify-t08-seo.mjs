import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const seoBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const failures = [];

async function fetchText(path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    failures.push(`${path} returned HTTP ${response.status}`);
  }
  return text;
}

function includesAnyJsonLd(html, type) {
  return html.includes('type="application/ld+json"') && html.includes(`"@type":"${type}"`);
}

function expectIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    failures.push(`${label} missing: ${expected}`);
  }
}

function expectNotIncludes(source, unexpected, label) {
  if (source.includes(unexpected)) {
    failures.push(`${label} must not include: ${unexpected}`);
  }
}

try {
  const [category, bank, card, offer, draftOffer] = await Promise.all([
    prisma.category.findFirst({ where: { isActive: true, faqJson: { not: null } }, orderBy: { sortOrder: "asc" } }),
    prisma.bank.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } }),
    prisma.card.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } }),
    prisma.offer.findFirst({ where: { isPublished: true, faqJson: { not: null } }, orderBy: { recommendScore: "desc" } }),
    prisma.offer.findFirst({ where: { isPublished: false }, orderBy: { id: "asc" } })
  ]);

  if (!category) failures.push("No active category with FAQ seed data found");
  if (!bank) failures.push("No active bank seed data found");
  if (!card) failures.push("No active card seed data found");
  if (!offer) failures.push("No published offer with FAQ seed data found");

  const sitemap = await fetchText("/sitemap.xml");
  expectIncludes(sitemap, "<urlset", "sitemap.xml");
  expectIncludes(sitemap, `${seoBaseUrl}/categories/${category?.slug}`, "sitemap.xml");
  expectIncludes(sitemap, `${seoBaseUrl}/banks/${bank?.slug}`, "sitemap.xml");
  expectIncludes(sitemap, `${seoBaseUrl}/cards/${card?.slug}`, "sitemap.xml");
  expectIncludes(sitemap, `${seoBaseUrl}/offers/${offer?.slug}`, "sitemap.xml");
  if (draftOffer) {
    expectNotIncludes(sitemap, `/offers/${draftOffer.slug}`, "sitemap.xml");
  }

  const robots = await fetchText("/robots.txt");
  expectIncludes(robots, "User-Agent: *", "robots.txt");
  expectIncludes(robots, "Allow: /", "robots.txt");
  expectIncludes(robots, "Disallow: /admin", "robots.txt");
  expectIncludes(robots, "Disallow: /api", "robots.txt");
  expectIncludes(robots, `Sitemap: ${seoBaseUrl}/sitemap.xml`, "robots.txt");

  const home = await fetchText("/");
  expectIncludes(home, `<link rel="canonical" href="${seoBaseUrl}/"/>`, "homepage");
  if (!includesAnyJsonLd(home, "Organization")) {
    failures.push("homepage missing Organization JSON-LD");
  }

  const search = await fetchText("/search");
  expectIncludes(search, "<title>搜尋優惠｜信用卡優惠查詢網站</title>", "search page");
  expectIncludes(search, '<meta name="description" content="搜尋信用卡優惠、銀行、卡片與分類。"/>', "search page");
  expectIncludes(search, `<link rel="canonical" href="${seoBaseUrl}/search"/>`, "search page");

  const categoryHtml = await fetchText(`/categories/${category?.slug}`);
  expectIncludes(categoryHtml, `<link rel="canonical" href="${seoBaseUrl}/categories/${category?.slug}"/>`, "category page");
  if (!includesAnyJsonLd(categoryHtml, "WebPage")) {
    failures.push("category page missing WebPage JSON-LD");
  }
  if (!includesAnyJsonLd(categoryHtml, "FAQPage")) {
    failures.push("category page missing FAQPage JSON-LD");
  }

  const bankHtml = await fetchText(`/banks/${bank?.slug}`);
  expectIncludes(bankHtml, `<link rel="canonical" href="${seoBaseUrl}/banks/${bank?.slug}"/>`, "bank page");
  if (!includesAnyJsonLd(bankHtml, "WebPage")) {
    failures.push("bank page missing WebPage JSON-LD");
  }

  const cardHtml = await fetchText(`/cards/${card?.slug}`);
  expectIncludes(cardHtml, `<link rel="canonical" href="${seoBaseUrl}/cards/${card?.slug}"/>`, "card page");
  if (!includesAnyJsonLd(cardHtml, "WebPage")) {
    failures.push("card page missing WebPage JSON-LD");
  }

  const offerHtml = await fetchText(`/offers/${offer?.slug}`);
  expectIncludes(offerHtml, `<link rel="canonical" href="${seoBaseUrl}/offers/${offer?.slug}"/>`, "offer page");
  if (!includesAnyJsonLd(offerHtml, "Article")) {
    failures.push("offer page missing Article JSON-LD");
  }
  if (!includesAnyJsonLd(offerHtml, "FAQPage")) {
    failures.push("offer page missing FAQPage JSON-LD");
  }
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("T08 SEO smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("T08 SEO smoke test passed.");
