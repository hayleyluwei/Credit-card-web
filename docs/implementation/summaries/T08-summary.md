# T08 Summary: SEO Sitemap JSON-LD

**Date:** 2026-06-15  
**Status:** ✅ Completed  
**Gate:** Gate 4 (Public pages, SEO, sitemap, robots, JSON-LD)

---

## Completed Work

### 1. SEO Helper Module (`src/lib/domain-seo.ts`)

Created comprehensive SEO utilities module with the following exports:

- **`getCanonicalUrl(path: string): string`** - Generates canonical URL from base URL + path
- **`generateSeoTitle(primary: string, fallback: string, siteName: string): string`** - Fallback title generation
- **`generateSeoDescription(primary: string, fallback: string): string`** - Fallback description generation
- **`generateFaqJsonLd(faqJson: string, pageUrl: string): object`** - FAQPage JSON-LD from stored faqJson
- **`generateBreadcrumbListJsonLd(items: Array): object`** - BreadcrumbList JSON-LD structure
- **`generateOrganizationJsonLd(siteName, siteUrl, description): object`** - Organization JSON-LD for homepage
- **`generateWebPageJsonLd(title, description, canonicalUrl): object`** - Generic WebPage JSON-LD
- **`generateArticleJsonLd(title, description, canonicalUrl, datePublished, dateModified): object`** - Article JSON-LD for offer pages
- **`generateSitemapEntries(categories, banks, cards, offers): Array`** - Sitemap entry array

### 2. Sitemap Route (`src/app/sitemap.ts`)

Implemented dynamic XML sitemap generation:

- Queries all **active categories** from database
- Queries all **active banks** from database
- Queries all **active cards** from database
- Queries all **published offers** (`isPublished = true`) from database
- Generates URL entries with correct priority levels:
  - Homepage: 1.0 / daily
  - Categories: 0.8 / weekly
  - Banks: 0.7 / weekly
  - Cards: 0.7 / weekly
  - Offers: 0.6 / weekly
- **Excludes unpublished offers** from sitemap
- Returns Next.js-native `MetadataRoute.Sitemap` format

### 3. Robots.txt Route (`src/app/robots.ts`)

Implemented robots.txt generation:

- Allows all paths: `Allow: /`
- Disallows admin: `Disallow: /admin`
- Disallows API: `Disallow: /api`
- References sitemap.xml with full URL

### 4. Homepage Metadata & JSON-LD (`src/app/page.tsx`)

Updated homepage with:

- Imports `domain-seo` helpers
- Generates native `<script type="application/ld+json">` with Organization JSON-LD using `generateOrganizationJsonLd()`
- JSON-LD embedded as `type="application/ld+json"` with `dangerouslySetInnerHTML`
- Uses Next.js `alternates.canonical` metadata for canonical URL output

### 5. Category Detail Page (`src/app/categories/[slug]/page.tsx`)

Updated with:

- Import `domain-seo` helpers and `Script` component
- Enhanced `generateMetadata()` to include canonical URL via `alternates.canonical`
- Added native JSON-LD script tags for:
  - **WebPage JSON-LD** using `generateWebPageJsonLd()`
  - **FAQPage JSON-LD** (conditional) using `generateFaqJsonLd()` if `category.faqJson` exists

### 6. Bank Detail Page (`src/app/banks/[slug]/page.tsx`)

Updated with:

- Import `domain-seo` helpers and `Script` component
- Enhanced `generateMetadata()` to include canonical URL via `alternates.canonical`
- Added native JSON-LD script tag for **WebPage JSON-LD**

### 7. Card Detail Page (`src/app/cards/[slug]/page.tsx`)

Updated with:

- Import `domain-seo` helpers and `Script` component
- Enhanced `generateMetadata()` to include canonical URL via `alternates.canonical`
- Added native JSON-LD script tag for **WebPage JSON-LD**

### 8. Offer Detail Page (`src/app/offers/[slug]/page.tsx`)

Updated with:

- Import `domain-seo` helpers and `Script` component
- Enhanced `generateMetadata()` to include canonical URL via `alternates.canonical`
- Added native JSON-LD script tags for:
  - **Article JSON-LD** using `generateArticleJsonLd()` with `createdAt` and `updatedAt`
  - **FAQPage JSON-LD** (conditional) if `offer.faqJson` exists

---

## Main Files Changed

| File | Change | Reason |
|---|---|---|
| `src/lib/domain-seo.ts` | Created | Centralize SEO metadata and JSON-LD generation |
| `src/app/sitemap.ts` | Created | Dynamic XML sitemap for search engines |
| `src/app/robots.ts` | Created | Control crawler access to admin/API |
| `src/app/page.tsx` | Updated | Add Organization JSON-LD to homepage |
| `src/app/categories/[slug]/page.tsx` | Updated | Add canonical URL and JSON-LD |
| `src/app/banks/[slug]/page.tsx` | Updated | Add canonical URL and JSON-LD |
| `src/app/cards/[slug]/page.tsx` | Updated | Add canonical URL and JSON-LD |
| `src/app/offers/[slug]/page.tsx` | Updated | Add canonical URL and Article JSON-LD |
| `src/app/search/layout.tsx` | Created | Add search page metadata and canonical URL |
| `scripts/verify-t08-seo.mjs` | Created | Automated SEO, sitemap, robots, JSON-LD, and canonical smoke test |
| `package.json` | Updated | Add `smoke:t08` script |

---

## Route / API / Model Changes

**No new API routes created**  
**No database model changes**  
**New routes:**
- `GET /sitemap.xml` - Dynamic sitemap.xml generation
- `GET /robots.txt` - Dynamic robots.txt generation

---

## Verification Results

### Automated Verification

✅ **Build Passes**: `npm run build` completed successfully without errors  
✅ **No TypeScript Errors**: All JSON-LD type definitions match MetadataRoute API  
✅ **Sitemap Format**: Uses Next.js native `MetadataRoute.Sitemap` return type  
✅ **Conditional JSON-LD**: FAQPage JSON-LD only renders when `faqJson` data exists  
✅ **Canonical URLs**: All detail pages include canonical metadata
✅ **T08 Smoke Test**: `npm run smoke:t08` passed, verifying sitemap, robots.txt, homepage/search metadata, canonical URLs, JSON-LD, and unpublished offer sitemap exclusion

### Final Verification Run

```text
npm.cmd run smoke:t08
T08 SEO smoke test passed.

npm.cmd run build
Compiled successfully.
```

Build note: Next.js reported existing `<img>` LCP warnings in bank/card detail pages. They do not block T08 SEO completion and can be addressed during UI polish.

### Manual Test Script

Created: `docs/implementation/manual-test-scripts/T08-測試腳本-v1-2026-06-15.md`

Test coverage:
1. Sitemap XML generation and format
2. Robots.txt generation and correctness
3. Homepage Organization JSON-LD
4. Category page metadata and canonical URL
5. Offer page Article JSON-LD
6. Bank and card page metadata
7. Search page metadata
8. Unpublished offers excluded from sitemap
9. Canonical URL consistency across pages
10. Dev server rebuild verification

---

## What the Next Task Needs to Know

**T09 (Admin Auth) depends on:**
- Database Prisma client (established in T02)
- Seed data including admin user (from T03)
- No changes to offer/category/bank/card models
- Admin password hashing and session management will be new concerns

**T09 can now:**
- Use established public routes as reference for admin route structure
- Reuse domain validation helpers from T04
- Assume SEO infrastructure is complete and does not need further modification

---

## Open Questions

None at this time. T08 is complete and ready for Gate 4 manual testing.

---

## Gate 4 Acceptance Status

Gate 4 verifies:
- ✅ Public pages, search, SEO, sitemap, robots, JSON-LD checked

**Next Gate**: Gate 5 (Admin Auth and CRUD - T09-T12)
