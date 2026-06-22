"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/domain-parsing";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import { validateFaqJson, validateOfferPublish } from "@/lib/domain-validation";

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

async function ensureUniqueSlug(model: "bank" | "card" | "category" | "offer", slug: string, id?: number) {
  const where = { slug };
  const existing =
    model === "bank"
      ? await prisma.bank.findUnique({ where })
      : model === "card"
        ? await prisma.card.findUnique({ where })
        : model === "category"
          ? await prisma.category.findUnique({ where })
          : await prisma.offer.findUnique({ where });

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

function dateValue(formData: FormData, key: string): Date | null {
  const value = text(formData, key);
  return value ? new Date(`${value}T00:00:00`) : null;
}

function selectedCardIds(formData: FormData): number[] {
  return formData
    .getAll("cardIds")
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value));
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
    rewardType: nullableText(formData, "rewardType"),
    rewardValue: nullableText(formData, "rewardValue"),
    rewardCap: nullableText(formData, "rewardCap"),
    minSpend: nullableText(formData, "minSpend"),
    conditions: nullableText(formData, "conditions"),
    sourceUrl: nullableText(formData, "sourceUrl"),
    lastVerifiedAt: dateValue(formData, "lastVerifiedAt"),
    tags: nullableText(formData, "tags"),
    seoTitle: nullableText(formData, "seoTitle"),
    seoDescription: nullableText(formData, "seoDescription"),
    faqJson: nullableText(formData, "faqJson"),
    isFeatured: booleanValue(formData, "isFeatured"),
    recommendScore: intValue(formData, "recommendScore"),
    sortOrder: intValue(formData, "sortOrder")
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

function offerSaveErrors(data: ReturnType<typeof offerData>, cardIds: number[], publish: boolean) {
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
    rewardType: data.rewardType,
    rewardValue: data.rewardValue,
    cards: cardIds.map((id) => ({ id }))
  });

  if (!result.valid) {
    for (const error of result.errors) {
      if (error === "sourceUrl is required for published offers") {
        errors.push("發布前請填寫官方來源連結");
      } else if (error === "either rewardType or rewardValue is required for published offers") {
        errors.push("發布前請填寫回饋方式或回饋內容");
      } else if (error === "at least one card must be linked for published offers") {
        errors.push("發布前請至少勾選一張適用信用卡");
      } else {
        errors.push(error);
      }
    }
  }

  return errors;
}

export async function createOffer(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const title = text(formData, "title");
  const slug = text(formData, "slug") || generateSlug(title);
  const publish = text(formData, "intent") === "publish";
  const cardIds = selectedCardIds(formData);
  const data = offerData(formData, slug);
  try {
    await ensureUniqueSlug("offer", slug);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }
  const errors = offerSaveErrors(data, cardIds, publish);
  if (errors.length > 0) {
    return { errors, ok: false };
  }

  const offer = await prisma.offer.create({
    data: {
      ...data,
      isPublished: publish,
      cards: {
        create: cardIds.map((cardId) => ({ cardId }))
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
  try {
    await ensureUniqueSlug("offer", slug, id);
  } catch (error) {
    return {
      errors: [error instanceof Error && error.message.includes("Slug already exists") ? `Slug 已被使用：${slug}` : "儲存失敗，請稍後再試。"],
      ok: false
    };
  }
  const errors = offerSaveErrors(data, cardIds, publish);
  if (errors.length > 0) {
    return { errors, ok: false };
  }

  await prisma.offer.update({
    where: { id },
    data: {
      ...data,
      isPublished: unpublish ? false : publish ? true : undefined,
      cards: {
        deleteMany: {},
        create: cardIds.map((cardId) => ({ cardId }))
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

export async function redirectToAdmin(path: string) {
  redirect(path);
}
