/**
 * Domain Search Module
 * Encapsulates search and filtering logic for offers across multiple fields
 */

import type { Bank, Card, Category, Offer } from "@prisma/client";
import { isPastTaipeiDay } from "@/lib/domain-date";

export type SearchOfferCard = {
  id?: number;
  offerId?: number;
  cardId?: number;
  card?: (Card & { bank?: Bank | null }) | null;
};

/**
 * Search result item combining offer with related card & category data
 */
export interface SearchResultItem {
  offer: Offer & {
    cards: SearchOfferCard[];
    category: Category;
  };
  matchedFields: string[];
}

/**
 * Normalize search query for matching
 * @param query - Raw search string
 * @returns normalized query in lowercase, trimmed
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * Check if a string matches any keywords (supports multiple keywords separated by space)
 * @param text - Text to search in
 * @param keywords - Space-separated keywords
 * @returns true if any keyword is found in text
 */
function containsKeywords(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Search offers across title, summary, description, tags, category, and card names
 * @param offers - Array of offers with full relations
 * @param query - Search query string
 * @param showExpiredOffers - Whether to include expired offers
 * @returns array of matching offers with matched fields info
 */
export function searchOffers(
  offers: (Offer & {
    cards: SearchOfferCard[];
    category: Category;
  })[],
  query: string,
  showExpiredOffers: boolean
): SearchResultItem[] {
  const normalized = normalizeQuery(query);

  if (!normalized || normalized.length === 0) {
    return offers
      .filter((o) => o.isPublished)
      .map((offer) => ({
        offer,
        matchedFields: []
      }));
  }

  const keywords = normalized.split(/\s+/).filter((k) => k.length > 0);

  return offers
    .filter((offer) => offer.isPublished)
    .map((offer) => {
      const matchedFields: string[] = [];

      if (containsKeywords(offer.title, keywords)) matchedFields.push("title");
      if (containsKeywords(offer.summaryPreview, keywords)) matchedFields.push("summary");
      if (containsKeywords(offer.description, keywords)) matchedFields.push("description");
      if (containsKeywords(offer.tags, keywords)) matchedFields.push("tags");
      if (containsKeywords(offer.category.name, keywords)) matchedFields.push("category");
      if (offer.cards.some((item) => containsKeywords(item.card?.name, keywords))) matchedFields.push("card");
      if (offer.cards.some((item) => containsKeywords(item.card?.bank?.name, keywords))) matchedFields.push("bank");

      return { offer, matchedFields };
    })
    .filter((result) => result.matchedFields.length > 0);
}

/**
 * Filter expired offers based on system setting
 * @param results - Search results
 * @param showExpiredOffers - Whether to include expired offers
 * @returns filtered results
 */
export function filterExpiredOffers(results: SearchResultItem[], showExpiredOffers: boolean): SearchResultItem[] {
  if (showExpiredOffers) {
    return results;
  }

  // [T30] 與 getPublicOffers 使用同一套台北日曆日判斷，避免兩處結果不一致。
  return results.filter((result) => !isPastTaipeiDay(result.offer.endDate));
}

/**
 * Rank search results by matched field priority and offer properties
 * Priority: title > tags > category > summary > description
 * Then by: isFeatured > recommendScore > sortOrder
 * @param results - Search results to rank
 * @returns ranked results
 */
export function rankResults(results: SearchResultItem[]): SearchResultItem[] {
  const fieldPriority: Record<string, number> = {
    title: 5,
    tags: 4,
    category: 3,
    bank: 3,
    card: 3,
    summary: 2,
    description: 1
  };

  return [...results].sort((a, b) => {
    const aMaxField = Math.max(...a.matchedFields.map((f) => fieldPriority[f] ?? 0));
    const bMaxField = Math.max(...b.matchedFields.map((f) => fieldPriority[f] ?? 0));

    if (aMaxField !== bMaxField) {
      return bMaxField - aMaxField;
    }

    if (a.offer.isFeatured !== b.offer.isFeatured) {
      return b.offer.isFeatured ? 1 : -1;
    }

    if (a.offer.recommendScore !== b.offer.recommendScore) {
      return b.offer.recommendScore - a.offer.recommendScore;
    }

    if (a.offer.sortOrder !== b.offer.sortOrder) {
      return a.offer.sortOrder - b.offer.sortOrder;
    }

    const aTime = new Date(a.offer.updatedAt).getTime();
    const bTime = new Date(b.offer.updatedAt).getTime();
    return bTime - aTime;
  });
}

/**
 * Complete search flow: search, filter expired, and rank
 * @param offers - Offers with full relations
 * @param query - Search query
 * @param showExpiredOffers - Whether to include expired
 * @returns ranked search results
 */
export function performSearch(
  offers: (Offer & {
    cards: SearchOfferCard[];
    category: Category;
  })[],
  query: string,
  showExpiredOffers: boolean
): SearchResultItem[] {
  const results = searchOffers(offers, query, showExpiredOffers);
  const filtered = filterExpiredOffers(results, showExpiredOffers);
  return rankResults(filtered);
}
