import { PrismaClient } from "@prisma/client";

// Validation functions
function validateFaqJson(faqJson) {
  if (!faqJson) {
    return { valid: true };
  }

  try {
    const parsed = JSON.parse(faqJson);

    if (!Array.isArray(parsed)) {
      return { valid: false, error: "faqJson must be a JSON array" };
    }

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];

      if (typeof item !== "object" || item === null) {
        return { valid: false, error: `FAQ item ${i} must be an object` };
      }

      if (!"question" in item || typeof item.question !== "string" || !item.question.trim()) {
        return { valid: false, error: `FAQ item ${i} must have a non-empty "question" string` };
      }

      if (!"answer" in item || typeof item.answer !== "string" || !item.answer.trim()) {
        return { valid: false, error: `FAQ item ${i} must have a non-empty "answer" string` };
      }
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { valid: false, error: `Invalid JSON: ${errorMessage}` };
  }
}

function validateOfferPublish(offer) {
  const errors = [];

  if (!offer.title || !offer.title.trim()) {
    errors.push("title is required for published offers");
  }

  if (!offer.slug || !offer.slug.trim()) {
    errors.push("slug is required for published offers");
  }

  if (!offer.categoryId) {
    errors.push("categoryId is required for published offers");
  }

  if (!offer.summaryPreview || !offer.summaryPreview.trim()) {
    errors.push("summaryPreview is required for published offers");
  }

  if (!offer.sourceUrl || !offer.sourceUrl.trim()) {
    errors.push("sourceUrl is required for published offers");
  }

  if ((!offer.rewardType || !offer.rewardType.trim()) && (!offer.rewardValue || !offer.rewardValue.trim())) {
    errors.push("either rewardType or rewardValue is required for published offers");
  }

  if (!offer.cards || offer.cards.length === 0) {
    errors.push("at least one card must be linked for published offers");
  }

  return { valid: errors.length === 0, errors };
}

// Parsing functions
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(tagsString) {
  if (!tagsString) {
    return [];
  }

  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function tagsToString(tags) {
  return tags.filter((tag) => tag.trim().length > 0).join(", ");
}

function resolveSummaryPreview(offer) {
  if (offer.manualSummary && offer.manualSummary.trim()) {
    return offer.manualSummary.trim();
  }

  if (offer.highlight1 && offer.highlight1.trim()) {
    if (offer.highlight2 && offer.highlight2.trim()) {
      return `${offer.highlight1}、${offer.highlight2}`;
    }
    return offer.highlight1.trim();
  }

  if (offer.highlight2 && offer.highlight2.trim()) {
    return offer.highlight2.trim();
  }

  if (offer.summaryPreview && offer.summaryPreview.trim()) {
    return offer.summaryPreview.trim();
  }

  if (offer.title && offer.title.trim()) {
    return offer.title.trim();
  }

  return "";
}

function generateSystemSummary(offer) {
  const parts = [];

  if (offer.title) {
    parts.push(offer.title);
  }

  if (offer.highlight1) {
    parts.push(offer.highlight1);
  }

  return parts.join("，");
}

// Sorting functions
function compareOffers(a, b) {
  if (a.isFeatured !== b.isFeatured) {
    return b.isFeatured ? 1 : -1;
  }

  if (a.recommendScore !== b.recommendScore) {
    return b.recommendScore - a.recommendScore;
  }

  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  const aTime = new Date(a.updatedAt).getTime();
  const bTime = new Date(b.updatedAt).getTime();
  return bTime - aTime;
}

function sortOffers(offers) {
  return [...offers].sort(compareOffers);
}

function getPublicOffers(offers, showExpiredOffers) {
  const published = offers.filter((offer) => offer.isPublished);

  if (!showExpiredOffers) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return published.filter((offer) => {
      if (!offer.endDate) {
        return true;
      }

      const endDate = new Date(offer.endDate);
      endDate.setHours(0, 0, 0, 0);

      return endDate >= now;
    });
  }

  return published;
}

function getFeaturedOffers(offers, count, showExpiredOffers) {
  const publicOffers = getPublicOffers(offers, showExpiredOffers);
  const featured = publicOffers.filter((offer) => offer.isFeatured);
  return sortOffers(featured).slice(0, count);
}

function isOfferExpired(offer) {
  if (!offer.endDate) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const endDate = new Date(offer.endDate);
  endDate.setHours(0, 0, 0, 0);

  return endDate < now;
}

function daysUntilExpiry(offer) {
  if (!offer.endDate) {
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const endDate = new Date(offer.endDate);
  endDate.setHours(0, 0, 0, 0);

  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

function getOffersByCategory(offers, categoryId, showExpiredOffers) {
  const filtered = offers.filter((offer) => offer.categoryId === categoryId);
  return getPublicOffers(filtered, showExpiredOffers);
}

const prisma = new PrismaClient();
const failures = [];

async function testValidation() {
  // Test faqJson validation
  const validFaq = JSON.stringify([
    { question: "Q1?", answer: "A1" },
    { question: "Q2?", answer: "A2" },
  ]);

  const faqValidation1 = validateFaqJson(validFaq);
  if (!faqValidation1.valid) failures.push(`Valid FAQ should pass: ${faqValidation1.error}`);

  const invalidFaq1 = validateFaqJson("not json");
  if (invalidFaq1.valid) failures.push("Invalid JSON should fail FAQ validation");

  const invalidFaq2 = validateFaqJson(JSON.stringify([{ question: "Q", missing_answer: "A" }]));
  if (invalidFaq2.valid) failures.push("FAQ missing answer should fail");

  const nullFaq = validateFaqJson(null);
  if (!nullFaq.valid) failures.push("Null FAQ should be valid (optional field)");

  // Test offer publish validation
  const validOffer = {
    title: "Test Offer",
    slug: "test-offer",
    categoryId: 1,
    summaryPreview: "Test summary",
    sourceUrl: "https://example.com",
    rewardType: "cashback",
    rewardValue: "3%",
    cards: [{ id: 1 }],
  };

  const publishValidation1 = validateOfferPublish(validOffer);
  if (!publishValidation1.valid) {
    failures.push(`Valid offer should pass publish validation: ${publishValidation1.errors.join(", ")}`);
  }

  const invalidOfferNoTitle = { ...validOffer, title: "" };
  const publishValidation2 = validateOfferPublish(invalidOfferNoTitle);
  if (publishValidation2.valid) failures.push("Offer without title should fail publish validation");

  const invalidOfferNoCards = { ...validOffer, cards: [] };
  const publishValidation3 = validateOfferPublish(invalidOfferNoCards);
  if (publishValidation3.valid) failures.push("Offer without cards should fail publish validation");
}

async function testParsing() {
  // Test slug generation
  const slug1 = generateSlug("CUBE 卡現金回饋 3%");
  if (slug1 !== "cube" && !slug1.includes("cube")) {
    failures.push(`Slug generation failed for CJK: got "${slug1}"`);
  }

  const slug2 = generateSlug("Test-Offer  Name");
  if (slug2 !== "test-offer-name") failures.push(`Slug generation failed: got "${slug2}"`);

  // Test tags parsing
  const tags1 = parseTags("cashback, dining, featured");
  if (tags1.length !== 3 || tags1[0] !== "cashback") {
    failures.push(`Tag parsing failed: got ${JSON.stringify(tags1)}`);
  }

  const tags2 = parseTags(null);
  if (tags2.length !== 0) failures.push("Null tags should parse to empty array");

  const tags3 = parseTags("  tag1  ,  tag2  ,  ");
  if (tags3.length !== 2 || tags3[0] !== "tag1") {
    failures.push(`Tag trimming failed: got ${JSON.stringify(tags3)}`);
  }

  // Test tags to string
  const tagsStr = tagsToString(["cashback", "featured"]);
  if (!tagsStr.includes("cashback")) failures.push(`Tags to string failed: got "${tagsStr}"`);

  // Test summary preview resolution
  const summaryTest1 = resolveSummaryPreview({
    manualSummary: "Manual",
    highlight1: "H1",
    summaryPreview: "Preview",
    title: "Title",
  });
  if (summaryTest1 !== "Manual") failures.push("Manual summary should have highest priority");

  const summaryTest2 = resolveSummaryPreview({
    manualSummary: null,
    highlight1: "H1",
    highlight2: "H2",
    title: "Title",
  });
  if (!summaryTest2.includes("H1") || !summaryTest2.includes("H2")) {
    failures.push(`Highlight summary failed: got "${summaryTest2}"`);
  }

  // Test system summary generation
  const sysSummary = generateSystemSummary({
    title: "Offer Title",
    highlight1: "5% cashback",
    rewardValue: "5%",
  });
  if (!sysSummary.includes("Offer Title")) failures.push(`System summary generation failed: got "${sysSummary}"`);
}

async function testSorting() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const offers = [
    {
      id: 1,
      isFeatured: false,
      recommendScore: 50,
      sortOrder: 10,
      updatedAt: yesterday,
      endDate: tomorrow,
      isPublished: true,
      categoryId: 1,
      title: "O1",
      slug: "o1",
      summaryPreview: null,
      summaryMode: "system",
      targetAudience: null,
      highlight1: null,
      highlight2: null,
      manualSummary: null,
      description: null,
      startDate: null,
      rewardType: null,
      rewardValue: null,
      rewardCap: null,
      minSpend: null,
      conditions: null,
      sourceUrl: null,
      lastVerifiedAt: null,
      tags: null,
      seoTitle: null,
      seoDescription: null,
      faqJson: null,
      createdAt: now,
    },
    {
      id: 2,
      isFeatured: true,
      recommendScore: 40,
      sortOrder: 20,
      updatedAt: now,
      endDate: tomorrow,
      isPublished: true,
      categoryId: 1,
      title: "O2",
      slug: "o2",
      summaryPreview: null,
      summaryMode: "system",
      targetAudience: null,
      highlight1: null,
      highlight2: null,
      manualSummary: null,
      description: null,
      startDate: null,
      rewardType: null,
      rewardValue: null,
      rewardCap: null,
      minSpend: null,
      conditions: null,
      sourceUrl: null,
      lastVerifiedAt: null,
      tags: null,
      seoTitle: null,
      seoDescription: null,
      faqJson: null,
      createdAt: now,
    },
    {
      id: 3,
      isFeatured: true,
      recommendScore: 90,
      sortOrder: 30,
      updatedAt: yesterday,
      endDate: tomorrow,
      isPublished: true,
      categoryId: 1,
      title: "O3",
      slug: "o3",
      summaryPreview: null,
      summaryMode: "system",
      targetAudience: null,
      highlight1: null,
      highlight2: null,
      manualSummary: null,
      description: null,
      startDate: null,
      rewardType: null,
      rewardValue: null,
      rewardCap: null,
      minSpend: null,
      conditions: null,
      sourceUrl: null,
      lastVerifiedAt: null,
      tags: null,
      seoTitle: null,
      seoDescription: null,
      faqJson: null,
      createdAt: now,
    },
  ];

  const sorted = sortOffers(offers);

  // O3 should be first (featured, highest score)
  // O2 should be second (featured, lower score, newer)
  // O1 should be last (not featured)
  if (sorted[0].id !== 3) failures.push(`First offer should be 3, got ${sorted[0].id}`);
  if (sorted[1].id !== 2) failures.push(`Second offer should be 2, got ${sorted[1].id}`);
  if (sorted[2].id !== 1) failures.push(`Third offer should be 1, got ${sorted[2].id}`);

  // Test expired offer detection
  const expiredOffer = { ...offers[0], endDate: yesterday };
  if (!isOfferExpired(expiredOffer)) failures.push("Offer with past endDate should be expired");

  const futureOffer = { ...offers[0], endDate: tomorrow };
  if (isOfferExpired(futureOffer)) failures.push("Offer with future endDate should not be expired");

  // Test days until expiry
  const daysTest = daysUntilExpiry({ endDate: tomorrow });
  if (daysTest !== 1) failures.push(`Days until expiry should be 1, got ${daysTest}`);
}

async function testOfferFiltering() {
  try {
    // Get real data from database
    const offers = await prisma.offer.findMany({
      include: { cards: true },
    });

    const siteSetting = await prisma.siteSetting.findFirst();
    if (!siteSetting) {
      failures.push("SiteSetting not found for filtering tests");
      return;
    }

    // Test getPublicOffers filters correctly
    const allCount = offers.length;
    const publicCount = getPublicOffers(offers, siteSetting.showExpiredOffers).length;
    if (publicCount > allCount) failures.push("Public offers should be <= all offers");

    const publishedCount = offers.filter((o) => o.isPublished).length;
    if (publicCount > publishedCount) failures.push("Public offers should respect isPublished filter");

    // Test getFeaturedOffers respects count
    const featured = getFeaturedOffers(offers, siteSetting.homepageFeaturedCount, siteSetting.showExpiredOffers);
    if (featured.length > siteSetting.homepageFeaturedCount) {
      failures.push(
        `Featured offers should not exceed count: got ${featured.length}, expected max ${siteSetting.homepageFeaturedCount}`
      );
    }

    // Test getOffersByCategory
    if (offers.length > 0) {
      const firstOffer = offers[0];
      const categoryOffers = getOffersByCategory(offers, firstOffer.categoryId, siteSetting.showExpiredOffers);
      for (const offer of categoryOffers) {
        if (offer.categoryId !== firstOffer.categoryId) {
          failures.push("Category filtering returned wrong category");
          break;
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`Offer filtering test error: ${message}`);
  }
}

async function main() {
  try {
    testValidation();
    testParsing();
    testSorting();
    await testOfferFiltering();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`Unexpected error: ${message}`);
  } finally {
    await prisma.$disconnect();
  }

  if (failures.length > 0) {
    console.error("T04 domain validation smoke test failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("T04 domain validation smoke test passed.");
}

main();
