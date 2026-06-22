/**
 * Domain Offers Module
 * Centralized business logic for offer sorting, filtering, and visibility.
 */

import { Offer } from "@prisma/client";

/**
 * Offer sort comparator function
 * Sorts by: isFeatured → recommendScore → sortOrder → updatedAt
 * @param a - First offer
 * @param b - Second offer
 * @returns comparison result
 */
export function compareOffers<T extends Offer>(a: T, b: T): number {
  // 1. Sort by isFeatured (true first)
  if (a.isFeatured !== b.isFeatured) {
    return b.isFeatured ? 1 : -1;
  }

  // 2. Sort by recommendScore (higher first)
  if (a.recommendScore !== b.recommendScore) {
    return b.recommendScore - a.recommendScore;
  }

  // 3. Sort by sortOrder (lower first)
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  // 4. Sort by updatedAt (newer first)
  const aTime = new Date(a.updatedAt).getTime();
  const bTime = new Date(b.updatedAt).getTime();
  return bTime - aTime;
}

/**
 * Sorts an array of offers using the standard MVP sort order
 * @param offers - Array of offers to sort
 * @returns sorted array
 */
export function sortOffers<T extends Offer>(offers: T[]): T[] {
  return [...offers].sort(compareOffers);
}

/**
 * Filters and sorts offers for public display
 * Respects published status and expired visibility setting
 * @param offers - Array of offers to filter
 * @param showExpiredOffers - Whether to show expired offers
 * @returns filtered and sorted array
 */
export function getPublicOffers<T extends Offer>(offers: T[], showExpiredOffers: boolean): T[] {
  const published = offers.filter((offer) => offer.isPublished);

  if (!showExpiredOffers) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return published.filter((offer) => {
      if (!offer.endDate) {
        return true; // No end date = not expired
      }

      const endDate = new Date(offer.endDate);
      endDate.setHours(0, 0, 0, 0);

      return endDate >= now;
    });
  }

  return published;
}

/**
 * Gets featured offers for homepage
 * @param offers - Array of offers
 * @param count - Number of featured offers to return
 * @param showExpiredOffers - Whether to include expired offers
 * @returns array of featured offers (up to count)
 */
export function getFeaturedOffers<T extends Offer>(offers: T[], count: number, showExpiredOffers: boolean): T[] {
  const publicOffers = getPublicOffers(offers, showExpiredOffers);
  const featured = publicOffers.filter((offer) => offer.isFeatured);
  return sortOffers(featured).slice(0, count);
}

/**
 * Gets latest offers for homepage
 * @param offers - Array of offers
 * @param count - Number of latest offers to return
 * @param showExpiredOffers - Whether to include expired offers
 * @returns array of latest offers (up to count)
 */
export function getLatestOffers<T extends Offer>(offers: T[], count: number, showExpiredOffers: boolean): T[] {
  const publicOffers = getPublicOffers(offers, showExpiredOffers);

  // Sort by updatedAt descending (newest first), then apply standard sort
  return sortOffers(publicOffers)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, count);
}

/**
 * Checks if an offer should be marked as expired visually
 * Uses offer endDate and current date
 * @param offer - Offer to check
 * @returns true if offer is expired
 */
export function isOfferExpired(offer: Offer | { endDate: Date | null }): boolean {
  if (!offer.endDate) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const endDate = new Date(offer.endDate);
  endDate.setHours(0, 0, 0, 0);

  return endDate < now;
}

/**
 * Calculates days until offer expires
 * Returns negative number if already expired
 * @param offer - Offer to check
 * @returns number of days
 */
export function daysUntilExpiry(offer: Offer | { endDate: Date | null }): number | null {
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

/**
 * Gets offers grouped by category
 * Useful for category pages
 * @param offers - Array of offers
 * @param categoryId - Category ID to filter by
 * @param showExpiredOffers - Whether to include expired offers
 * @returns array of offers for the category
 */
export function getOffersByCategory<T extends Offer>(offers: T[], categoryId: number, showExpiredOffers: boolean): T[] {
  const filtered = offers.filter((offer) => offer.categoryId === categoryId);
  return getPublicOffers(filtered, showExpiredOffers);
}
