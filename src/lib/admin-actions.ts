"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug, linesToJsonArray } from "@/lib/domain-parsing";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import { validateFaqJson, validateOfferPublish } from "@/lib/domain-validation";
import { parseTaipeiDate } from "@/lib/domain-date";

export type AdminActionState = {
  errors: string[];
  message?: string;
  ok: boolean;
  publicPath?: string;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function intValue(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

async function ensureUniqueSlug(model: "bank" | "card" | "category" | "offer" | "article", slug: string, id?: number) {
  const where = { slug };
  const existing =
    model === "bank"
      ? await prisma.bank.findUnique({ where })
      : model === "card"
        ? await prisma.card.findUnique({ where })
        : model === "category"
          ? await prisma.category.findUnique({ where })
          : model === "offer"
            ? await prisma.offer.findUnique({ where })
            : await prisma.article.findUnique({ where });

  if (existing && existing.id !== id) {
    throw new Error(`Slug already exists: ${slug}`);
  }
}

export async function updateSiteSetting(formData: FormData) {
  const id = intValue(formData, "id", 1);
  await prisma.siteSetting.upsert({
    where: { id },
    update: {
      siteName: text(formData, "siteName"),
      defaultSeoTitle: nullableText(formData, "defaultSeoTitle"),
      defaultSeoDescription: nullableText(formData, "defaultSeoDescription"),
      homepageFeaturedCount: intValue(formData, "homepageFeaturedCount", 6),
      categoryPageSize: intValue(formData, "categoryPageSize", 12),
      showExpiredOffers: booleanValue(formData, "showExpiredOffers")
    },
    create: {
      id,
      siteName: text(formData, "siteName") || "信用卡優惠查詢",
      defaultSeoTitle: nullableText(formData, "defaultSeoTitle"),
      defaultSeoDescription: nullableText(formData, "defaultSeoDescription"),
      homepageFeaturedCount: intValue(formData, "homepageFeaturedCount", 6),
      categoryPageSize: intValue(formData, "categoryPageSize", 12),
      showExpiredOffers: booleanValue(formData, "showExpiredOffers")
    }
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function createBank(formData: FormData) {
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("bank", slug);
  await prisma.bank.create({
    data: {
      name,
      slug,
      logoUrl: nullableText(formData, "logoUrl"),
      logoAlt: nullableText(formData, "logoAlt"),
      websiteUrl: nullableText(formData, "websiteUrl"),
      description: nullableText(formData, "description"),
      seoTitle: nullableText(formData, "seoTitle"),
      seoDescription: nullableText(formData, "seoDescription"),
      isActive: booleanValue(formData, "isActive")
    }
  });
  revalidatePath("/admin/banks");
  revalidatePath("/sitemap.xml");
}

export async function updateBank(formData: FormData) {
  const id = intValue(formData, "id");
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("bank", slug, id);
  await prisma.bank.update({
    where: { id },
    data: {
      name,
      slug,
      logoUrl: nullableText(formData, "logoUrl"),
      logoAlt: nullableText(formData, "logoAlt"),
      websiteUrl: nullableText(formData, "websiteUrl"),
      description: nullableText(formData, "description"),
      seoTitle: nullableText(formData, "seoTitle"),
      seoDescription: nullableText(formData, "seoDescription"),
      isActive: booleanValue(formData, "isActive")
    }
  });
  revalidatePath("/admin/banks");
  revalidatePath(`/admin/banks/${id}`);
  revalidatePath("/sitemap.xml");
}

export async function toggleBank(formData: FormData) {
  const id = intValue(formData, "id");
  await prisma.bank.update({ where: { id }, data: { isActive: booleanValue(formData, "nextIsActive") } });
  revalidatePath("/admin/banks");
}

export async function createCard(formData: FormData) {
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("card", slug);
  await prisma.card.create({
    data: cardData(formData, slug)
  });
  revalidatePath("/admin/cards");
  revalidatePath("/sitemap.xml");
}

export async function updateCard(formData: FormData) {
  const id = intValue(formData, "id");
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("card", slug, id);
  await prisma.card.update({ where: { id }, data: cardData(formData, slug) });
  revalidatePath("/admin/cards");
  revalidatePath(`/admin/cards/${id}`);
  revalidatePath(`/cards/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function updateCardWithState(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = intValue(formData, "id");
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);

  try {
    await ensureUniqueSlug("card", slug, id);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }

  await prisma.card.update({ where: { id }, data: cardData(formData, slug) });
  revalidatePath("/admin/cards");
  revalidatePath(`/admin/cards/${id}`);
  revalidatePath(`/cards/${slug}`);
  revalidatePath("/sitemap.xml");

  return {
    errors: [],
    message: "信用卡已成功儲存",
    ok: true,
    publicPath: `/cards/${slug}`
  };
}

function cardData(formData: FormData, slug: string) {
  return {
    bankId: intValue(formData, "bankId"),
    name: text(formData, "name"),
    slug,
    imageUrl: nullableText(formData, "imageUrl"),
    imageAlt: nullableText(formData, "imageAlt"),
    summary: nullableText(formData, "summary"),
    description: nullableText(formData, "description"),
    targetAudience: nullableText(formData, "targetAudience"),
    annualFee: nullableText(formData, "annualFee"),
    annualFeeWaiver: nullableText(formData, "annualFeeWaiver"),
    cardLevel: nullableText(formData, "cardLevel"),
    cardNetwork: nullableText(formData, "cardNetwork"),
    cardBgColorFrom: nullableText(formData, "cardBgColorFrom"),
    cardBgColorTo: nullableText(formData, "cardBgColorTo"),
    cardTextColor: nullableText(formData, "cardTextColor"),
    cardChipColorFrom: nullableText(formData, "cardChipColorFrom"),
    cardChipColorTo: nullableText(formData, "cardChipColorTo"),
    prosJson: linesToJsonArray(String(formData.get("prosLines") ?? "")),
    consJson: linesToJsonArray(String(formData.get("consLines") ?? "")),
    seoTitle: nullableText(formData, "seoTitle"),
    seoDescription: nullableText(formData, "seoDescription"),
    isActive: booleanValue(formData, "isActive")
  };
}

export async function toggleCard(formData: FormData) {
  const id = intValue(formData, "id");
  await prisma.card.update({ where: { id }, data: { isActive: booleanValue(formData, "nextIsActive") } });
  revalidatePath("/admin/cards");
}

export async function createCategory(formData: FormData) {
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("category", slug);
  validateCategoryFaq(formData);
  await prisma.category.create({ data: categoryData(formData, slug) });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/sitemap.xml");
}

export async function updateCategory(formData: FormData) {
  const id = intValue(formData, "id");
  const name = text(formData, "name");
  const slug = text(formData, "slug") || generateSlug(name);
  await ensureUniqueSlug("category", slug, id);
  validateCategoryFaq(formData);
  await prisma.category.update({ where: { id }, data: categoryData(formData, slug) });
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}`);
  revalidatePath("/categories");
  revalidatePath("/sitemap.xml");
}

function validateCategoryFaq(formData: FormData) {
  const faqJson = nullableText(formData, "faqJson");
  const result = validateFaqJson(faqJson);
  if (!result.valid) {
    throw new Error(result.error ?? "FAQ JSON is invalid");
  }
}

function categoryData(formData: FormData, slug: string) {
  return {
    name: text(formData, "name"),
    slug,
    iconName: nullableText(formData, "iconName"),
    description: nullableText(formData, "description"),
    seoTitle: nullableText(formData, "seoTitle"),
    seoDescription: nullableText(formData, "seoDescription"),
    faqJson: nullableText(formData, "faqJson"),
    sortOrder: intValue(formData, "sortOrder"),
    isActive: booleanValue(formData, "isActive")
  };
}

export async function toggleCategory(formData: FormData) {
  const id = intValue(formData, "id");
  await prisma.category.update({ where: { id }, data: { isActive: booleanValue(formData, "nextIsActive") } });
  revalidatePath("/admin/categories");
}

/**
 * [T30] 把 `<input type="date">` 的 `YYYY-MM-DD` 存成「台北該日午夜」。
 *
 * 原本的 `new Date(`${value}T00:00:00`)` 沒有時區後綴，會以伺服器本機時區解析——
 * 在 Vercel（UTC）與本機（台北）存出來的值不同，且與匯入腳本的約定不一致。
 */
function dateValue(formData: FormData, key: string): Date | null {
  return parseTaipeiDate(text(formData, key));
}

function selectedCardIds(formData: FormData): number[] {
  return formData
    .getAll("cardIds")
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value));
}

export type ParsedTier = {
  label: string | null;
  rewardType: string | null;
  rate: string | null;
  cap: string | null;
  capPeriod: string | null;
  minSpend: string | null;
  conditionsText: string | null;
  sortOrder: number;
};

// [T21] Parse the dynamic reward-tier rows submitted by AdminOfferForm.
// The form posts a `tierCount` and indexed fields `tier-<i>-<field>`.
// Fully-empty rows are skipped so an accidental blank tier is ignored.
function parseTiers(formData: FormData): ParsedTier[] {
  const count = intValue(formData, "tierCount", 0);
  const tiers: ParsedTier[] = [];
  for (let i = 0; i < count; i += 1) {
    const label = nullableText(formData, `tier-${i}-label`);
    const rewardType = nullableText(formData, `tier-${i}-rewardType`);
    const rate = nullableText(formData, `tier-${i}-rate`);
    const cap = nullableText(formData, `tier-${i}-cap`);
    const capPeriod = nullableText(formData, `tier-${i}-capPeriod`);
    const minSpend = nullableText(formData, `tier-${i}-minSpend`);
    const conditionsText = nullableText(formData, `tier-${i}-conditionsText`);

    if (!label && !rewardType && !rate && !cap && !capPeriod && !minSpend && !conditionsText) {
      continue; // skip empty row
    }

    tiers.push({
      label,
      rewardType,
      rate,
      cap,
      capPeriod,
      minSpend,
      conditionsText,
      sortOrder: tiers.length
    });
  }
  return tiers;
}

function offerData(formData: FormData, slug: string) {
  const draft = {
    categoryId: intValue(formData, "categoryId"),
    title: text(formData, "title"),
    slug,
    summary: nullableText(formData, "summary"),
    summaryMode: text(formData, "summaryMode") || "system",
    targetAudience: nullableText(formData, "targetAudience"),
    highlight1: nullableText(formData, "highlight1"),
    highlight2: nullableText(formData, "highlight2"),
    manualSummary: nullableText(formData, "manualSummary"),
    summaryPreview: nullableText(formData, "summaryPreview"),
    description: nullableText(formData, "description"),
    startDate: dateValue(formData, "startDate"),
    endDate: dateValue(formData, "endDate"),
    sourceUrl: nullableText(formData, "sourceUrl"),
    lastVerifiedAt: dateValue(formData, "lastVerifiedAt"),
    tags: nullableText(formData, "tags"),
    seoTitle: nullableText(formData, "seoTitle"),
    seoDescription: nullableText(formData, "seoDescription"),
    faqJson: nullableText(formData, "faqJson"),
    isFeatured: booleanValue(formData, "isFeatured"),
    recommendScore: intValue(formData, "recommendScore"),
    sortOrder: intValue(formData, "sortOrder"),
    badgeLabel: nullableText(formData, "badgeLabel")
  };

  return {
    ...draft,
    summaryPreview:
      draft.summaryPreview ??
      resolveSummaryPreview({
        manualSummary: draft.manualSummary,
        highlight1: draft.highlight1,
        highlight2: draft.highlight2,
        summaryPreview: draft.summary,
        title: draft.title
      })
  };
}

function offerSaveErrors(data: ReturnType<typeof offerData>, tiers: ParsedTier[], cardIds: number[], publish: boolean) {
  const errors: string[] = [];
  const faqResult = validateFaqJson(data.faqJson);
  if (!faqResult.valid) {
    errors.push(faqResult.error ?? "FAQ JSON 格式不正確");
  }

  if (!publish) return errors;

  const result = validateOfferPublish({
    title: data.title,
    slug: data.slug,
    categoryId: data.categoryId,
    summaryPreview: data.summaryPreview,
    sourceUrl: data.sourceUrl,
    tiers,
    cards: cardIds.map((id) => ({ id }))
  });

  if (!result.valid) {
    for (const error of result.errors) {
      if (error === "sourceUrl is required for published offers") {
        errors.push("發布前請填寫官方來源連結");
      } else if (error === "at least one reward tier with a reward type or rate is required for published offers") {
        errors.push("發布前請至少填寫一層回饋（回饋方式或回饋內容）");
      } else if (error === "at least one card must be linked for published offers") {
        errors.push("發布前請至少勾選一張適用信用卡");
      } else {
        errors.push(error);
      }
    }
  }

  return errors;
}

// [T21] The non-normalized headline shown on listing cards: use the first tier's rate.
function headlineRateFromTiers(tiers: ParsedTier[]): string | null {
  return tiers.find((tier) => tier.rate && tier.rate.trim())?.rate ?? null;
}

export async function createOffer(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const title = text(formData, "title");
  const slug = text(formData, "slug") || generateSlug(title);
  const publish = text(formData, "intent") === "publish";
  const cardIds = selectedCardIds(formData);
  const data = offerData(formData, slug);
  const tiers = parseTiers(formData);
  try {
    await ensureUniqueSlug("offer", slug);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }
  const errors = offerSaveErrors(data, tiers, cardIds, publish);
  if (errors.length > 0) {
    return { errors, ok: false };
  }

  const offer = await prisma.offer.create({
    data: {
      ...data,
      headlineRate: headlineRateFromTiers(tiers),
      isPublished: publish,
      cards: {
        create: cardIds.map((cardId) => ({ cardId }))
      },
      tiers: {
        create: tiers.map(({ sortOrder, ...tier }) => ({ ...tier, sortOrder }))
      }
    }
  });

  revalidatePath("/admin/offers");
  revalidatePath("/");
  revalidatePath("/search");
  redirect(`/admin/offers/${offer.id}`);
}

export async function updateOffer(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = intValue(formData, "id");
  const title = text(formData, "title");
  const slug = text(formData, "slug") || generateSlug(title);
  const intent = text(formData, "intent");
  const publish = intent === "publish";
  const unpublish = intent === "unpublish";
  const cardIds = selectedCardIds(formData);
  const data = offerData(formData, slug);
  const tiers = parseTiers(formData);
  try {
    await ensureUniqueSlug("offer", slug, id);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }
  const errors = offerSaveErrors(data, tiers, cardIds, publish);
  if (errors.length > 0) {
    return { errors, ok: false };
  }

  await prisma.offer.update({
    where: { id },
    data: {
      ...data,
      headlineRate: headlineRateFromTiers(tiers),
      isPublished: unpublish ? false : publish ? true : undefined,
      cards: {
        deleteMany: {},
        create: cardIds.map((cardId) => ({ cardId }))
      },
      tiers: {
        deleteMany: {},
        create: tiers.map(({ sortOrder, ...tier }) => ({ ...tier, sortOrder }))
      }
    }
  });

  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${id}`);
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/offers/${slug}`);
  return { errors: [], message: publish ? "已儲存並發布。" : unpublish ? "已取消發布。" : "已儲存草稿。", ok: true };
}

function articleData(formData: FormData, slug: string) {
  return {
    title: text(formData, "title"),
    slug,
    summary: nullableText(formData, "summary"),
    contentMd: text(formData, "contentMd"),
    seoTitle: nullableText(formData, "seoTitle"),
    seoDescription: nullableText(formData, "seoDescription"),
    faqJson: nullableText(formData, "faqJson"),
    lastVerifiedAt: dateValue(formData, "lastVerifiedAt")
  };
}

export async function createArticle(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const title = text(formData, "title");
  const slug = text(formData, "slug") || generateSlug(title);

  const faqResult = validateFaqJson(nullableText(formData, "faqJson"));
  if (!faqResult.valid) {
    return { errors: [faqResult.error ?? "FAQ JSON 格式錯誤，請檢查 question／answer 欄位名稱與逗號。"], ok: false };
  }

  try {
    await ensureUniqueSlug("article", slug);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }

  await prisma.article.create({ data: articleData(formData, slug) });
  revalidatePath("/admin/articles");
  revalidatePath("/guides");
  revalidatePath("/sitemap.xml");
  redirect("/admin/articles");
}

export async function updateArticle(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = intValue(formData, "id");
  const title = text(formData, "title");
  const slug = text(formData, "slug") || generateSlug(title);

  const faqResult = validateFaqJson(nullableText(formData, "faqJson"));
  if (!faqResult.valid) {
    return { errors: [faqResult.error ?? "FAQ JSON 格式錯誤，請檢查 question／answer 欄位名稱與逗號。"], ok: false };
  }

  try {
    await ensureUniqueSlug("article", slug, id);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }

  await prisma.article.update({ where: { id }, data: articleData(formData, slug) });
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/guides");
  revalidatePath(`/guides/${slug}`);
  revalidatePath("/sitemap.xml");
  return { errors: [], message: "已儲存文章。", ok: true };
}

export async function toggleArticlePublish(formData: FormData) {
  const id = intValue(formData, "id");
  const nextIsPublished = booleanValue(formData, "nextIsPublished");
  const article = await prisma.article.findUnique({ where: { id } });
  await prisma.article.update({
    where: { id },
    data: {
      isPublished: nextIsPublished,
      publishedAt: nextIsPublished ? (article?.publishedAt ?? new Date()) : article?.publishedAt
    }
  });
  revalidatePath("/admin/articles");
  revalidatePath("/guides");
  if (article) {
    revalidatePath(`/guides/${article.slug}`);
  }
  revalidatePath("/sitemap.xml");
}

export async function deleteArticle(formData: FormData) {
  const id = intValue(formData, "id");
  const article = await prisma.article.findUnique({ where: { id } });
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
  revalidatePath("/guides");
  if (article) {
    revalidatePath(`/guides/${article.slug}`);
  }
  revalidatePath("/sitemap.xml");
}

export async function redirectToAdmin(path: string) {
  redirect(path);
}
