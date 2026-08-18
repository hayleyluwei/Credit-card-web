/**
 * Domain Validation Module
 * Centralized business rules for offer validation, FAQ validation, and publish checks.
 */

import { isPastTaipeiDay } from "@/lib/domain-date";

/**
 * Validates faqJson field
 * @param faqJson - JSON string or null
 * @returns { valid: boolean, error?: string }
 */
export function validateFaqJson(faqJson: string | null | undefined): { valid: boolean; error?: string } {
  if (!faqJson) {
    return { valid: true }; // faqJson is optional
  }

  try {
    const parsed = JSON.parse(faqJson);

    // Must be an array
    if (!Array.isArray(parsed)) {
      return { valid: false, error: "faqJson must be a JSON array" };
    }

    // Check each FAQ item
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];

      if (typeof item !== "object" || item === null) {
        return { valid: false, error: `FAQ item ${i} must be an object` };
      }

      if (!("question" in item) || typeof item.question !== "string" || !item.question.trim()) {
        return { valid: false, error: `FAQ item ${i} must have a non-empty "question" string` };
      }

      if (!("answer" in item) || typeof item.answer !== "string" || !item.answer.trim()) {
        return { valid: false, error: `FAQ item ${i} must have a non-empty "answer" string` };
      }
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { valid: false, error: `Invalid JSON: ${errorMessage}` };
  }
}

/**
 * Validates an offer is ready for publishing
 * Checks required fields for published offers
 * @param offer - Partial offer object to validate
 * @returns { valid: boolean, errors: string[] }
 */
export function validateOfferPublish(offer: {
  title?: string;
  slug?: string;
  categoryId?: number | null;
  summaryPreview?: string | null;
  sourceUrl?: string | null;
  tiers?: { rewardType?: string | null; rate?: string | null }[] | null;
  cards?: { id: number }[] | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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

  // [T21] Require at least one reward tier that carries a reward type or a rate.
  const hasUsableTier = (offer.tiers ?? []).some(
    (tier) => (tier.rewardType && tier.rewardType.trim()) || (tier.rate && tier.rate.trim())
  );
  if (!hasUsableTier) {
    errors.push("at least one reward tier with a reward type or rate is required for published offers");
  }

  // Check for at least one card (OfferCard relation)
  if (!offer.cards || offer.cards.length === 0) {
    errors.push("at least one card must be linked for published offers");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks if an offer is expired
 * @param endDate - Offer end date or null
 * @returns boolean - true if offer is expired
 */
export function isOfferExpired(endDate: Date | null | undefined): boolean {
  // [T30] 原本這裡是與 domain-offers 重複的第二份實作，且同樣用伺服器本機時區。
  // 改為委派給唯一的日期基準，避免日後只修好其中一份。
  return isPastTaipeiDay(endDate);
}
