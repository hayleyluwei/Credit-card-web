/**
 * SEO Module
 * Handles URL generation, metadata fallback, and JSON-LD schema generation
 */

import type { Category, Bank, Card, Offer } from "@prisma/client";

const SITE_BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * Generate canonical URL from slug
 * @param path - URL path without base
 * @returns full canonical URL
 */
export function getCanonicalUrl(path: string): string {
  if (path.startsWith("/")) {
    return `${SITE_BASE_URL}${path}`;
  }
  return `${SITE_BASE_URL}/${path}`;
}

/**
 * Generate SEO title with fallback
 * @param primary - Primary title (admin-set or page-specific)
 * @param fallback - Fallback title
 * @param siteName - Site name
 * @returns final SEO title
 */
export function generateSeoTitle(primary: string | null | undefined, fallback: string, siteName: string): string {
  if (primary) return primary;
  return `${fallback}｜${siteName}`;
}

/**
 * Generate SEO description with fallback
 * @param primary - Primary description (admin-set)
 * @param fallback - Fallback description
 * @returns final SEO description
 */
export function generateSeoDescription(primary: string | null | undefined, fallback: string): string {
  if (primary) return primary;
  return fallback;
}

/**
 * Generate FAQPage JSON-LD from faqJson
 * @param faqJson - FAQ JSON string or null
 * @param pageUrl - Page URL for canonical
 * @returns JSON-LD object or null
 */
export function generateFaqJsonLd(faqJson: string | null | undefined, pageUrl: string): object | null {
  if (!faqJson) return null;

  try {
    const faqs = JSON.parse(faqJson);
    if (!Array.isArray(faqs) || faqs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq: { question?: string; answer?: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    };
  } catch {
    return null;
  }
}

/**
 * Generate BreadcrumbList JSON-LD
 * @param items - Array of {name, url} items
 * @returns JSON-LD object
 */
export function generateBreadcrumbListJsonLd(
  items: {
    name: string;
    url: string;
  }[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate Organization JSON-LD
 * @param siteName - Site name
 * @param siteUrl - Site base URL
 * @param seoDescription - Site description
 * @returns JSON-LD object
 */
export function generateOrganizationJsonLd(
  siteName: string,
  siteUrl: string,
  seoDescription: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    description: seoDescription,
    knowsAbout: ["Credit Cards", "Financial Offers", "Banking"]
  };
}

/**
 * Generate WebPage JSON-LD for generic pages
 * @param title - Page title
 * @param description - Page description
 * @param canonicalUrl - Canonical URL
 * @returns JSON-LD object
 */
export function generateWebPageJsonLd(title: string, description: string, canonicalUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
    url: canonicalUrl
  };
}

/**
 * Generate Article JSON-LD for offers
 * @param title - Article title
 * @param description - Article description
 * @param canonicalUrl - Article URL
 * @param datePublished - ISO date string
 * @param dateModified - ISO date string
 * @returns JSON-LD object
 */
export function generateArticleJsonLd(
  title: string,
  description: string,
  canonicalUrl: string,
  datePublished: string,
  dateModified: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: new Date(datePublished).toISOString(),
    dateModified: new Date(dateModified).toISOString()
  };
}

/**
 * Generate sitemap entries for all public routes
 * @param categories - All active categories
 * @param banks - All active banks
 * @param cards - All active cards
 * @param offers - All published offers
 * @returns array of sitemap entries
 */
export function generateSitemapEntries(
  categories: Pick<Category, "slug" | "updatedAt">[],
  banks: Pick<Bank, "slug" | "updatedAt">[],
  cards: Pick<Card, "slug" | "updatedAt">[],
  offers: Pick<Offer, "slug" | "updatedAt">[]
): {
  loc: string;
  lastmod: string;
  priority: number;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}[] {
  const entries = [
    {
      loc: getCanonicalUrl("/"),
      lastmod: new Date().toISOString().split("T")[0],
      priority: 1.0,
      changefreq: "daily" as const
    },
    {
      loc: getCanonicalUrl("/search"),
      lastmod: new Date().toISOString().split("T")[0],
      priority: 0.8,
      changefreq: "daily" as const
    },
    {
      loc: getCanonicalUrl("/categories"),
      lastmod: new Date().toISOString().split("T")[0],
      priority: 0.9,
      changefreq: "weekly" as const
    },
    {
      loc: getCanonicalUrl("/cards"),
      lastmod: new Date().toISOString().split("T")[0],
      priority: 0.9,
      changefreq: "weekly" as const
    }
  ];

  categories.forEach((cat) => {
    entries.push({
      loc: getCanonicalUrl(`/categories/${cat.slug}`),
      lastmod: new Date(cat.updatedAt).toISOString().split("T")[0],
      priority: 0.8,
      changefreq: "weekly" as const
    });
  });

  banks.forEach((bank) => {
    entries.push({
      loc: getCanonicalUrl(`/banks/${bank.slug}`),
      lastmod: new Date(bank.updatedAt).toISOString().split("T")[0],
      priority: 0.7,
      changefreq: "weekly" as const
    });
  });

  cards.forEach((card) => {
    entries.push({
      loc: getCanonicalUrl(`/cards/${card.slug}`),
      lastmod: new Date(card.updatedAt).toISOString().split("T")[0],
      priority: 0.7,
      changefreq: "weekly" as const
    });
  });

  offers.forEach((offer) => {
    entries.push({
      loc: getCanonicalUrl(`/offers/${offer.slug}`),
      lastmod: new Date(offer.updatedAt).toISOString().split("T")[0],
      priority: 0.6,
      changefreq: "weekly" as const
    });
  });

  return entries;
}
