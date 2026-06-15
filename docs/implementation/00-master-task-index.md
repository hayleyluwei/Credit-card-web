# Credit Card MVP Implementation Task Index

Version: 2026-06-15 / v1  
Project: 信用卡優惠查詢網站 MVP  
Task size: 14 medium tasks  
Purpose: Provide an execution-oriented task map so each future coding session can continue from a small set of files instead of rereading the full product spec, schema, and acceptance rules.

## Source Documents

Use these as the authoritative references when a task needs deeper detail:

| Type | Path | Purpose |
|---|---|---|
| Product spec | `outputs/product-spec/credit-card-mvp-spec-v11-2026-06-08.docx` | Product scope, frontend/admin pages, RWD, SEO, field usability |
| Product spec inspection | `outputs/product-spec/credit-card-mvp-spec-v11-2026-06-08-inspection.txt` | Faster text reference for the v11 product spec |
| Prisma schema | `engineering-data-model-spec/schema.prisma` | Actual MVP data model to implement |
| Schema spec | `engineering-data-model-spec/prisma-schema-spec-v2-2026-06-08.md` | Explanation of schema decisions and non-goals |
| Acceptance rules | `docs/acceptance/credit-card-mvp-development-acceptance-rules-v1-2026-06-15.md` | Development acceptance criteria |
| Existing bridge doc | `task-breakdown-v1-2026-06-09.md` | Technical choices, route table, deployment direction |

## How To Resume Work

When starting a future task, read only:

1. This file: `docs/implementation/00-master-task-index.md`
2. The current task section below
3. The summary for the directly previous task, if it exists
4. Any specific source document referenced by the current task

Do not reread every task file or every historical spec unless the current task explicitly needs it.

## Global Decisions

- Use Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite for MVP development.
- Use Prisma schema v2 as the data model source of truth.
- Use camelCase field names in implementation, matching Prisma.
- Treat product-spec snake_case names as conceptual equivalents only.
- Do not add MVP-excluded models unless explicitly approved: `AuditLog`, `FaqItem`, `Tag`, `OfferTag`, `Redirect`, `CrawlSource`, `ImportJob`.
- Do not add `canonicalUrl` fields in MVP. Canonical URLs are generated from site base URL and slug.
- Do not add `SiteSetting.homepageFaqJson` in MVP. Homepage FAQ remains static frontend content for now.
- Store image URLs or paths only. Do not store image binary data in the database.
- Frontend public pages must show only `isPublished = true` offers by default.
- Expired offer visibility follows `SiteSetting.showExpiredOffers`.


## Verification Gates

Every implementation task requires automated verification by Codex and a user-runnable manual test script.

Manual test scripts live in:

`docs/implementation/manual-test-scripts/`

Use this naming pattern:

`Txx-manual-test.md`

Do not ask the user to manually test a task until the script exists.

| Gate | Timing | Purpose | Manual Test Script |
|---|---|---|---|
| Gate 1 | After T01 | Confirm app bootstrap, local server, route shells, and baseline commands | `docs/implementation/manual-test-scripts/T01-測試腳本-v1-2026-06-15.md` |
| Gate 2 | After T03 | Confirm database, Prisma setup, and seed data are usable | `docs/implementation/manual-test-scripts/T03-測試腳本-v1-2026-06-15.md` |
| Gate 3 | After T04 | Confirm validation rules with success and failure examples | `docs/implementation/manual-test-scripts/T04-測試腳本-v1-2026-06-15.md` |
| Gate 4 | After T08 | Confirm public frontend, search, SEO, sitemap, robots, and JSON-LD | `docs/implementation/manual-test-scripts/T08-測試腳本-v1-2026-06-15.md` |
| Gate 5 | After T12 | Confirm admin login, CRUD, offer editing, and publish/unpublish flows | `docs/implementation/manual-test-scripts/T12-測試腳本-v1-2026-06-15.md` |
| Gate 6 | After T14 | Confirm final MVP acceptance flow | `docs/implementation/manual-test-scripts/T14-測試腳本-v1-2026-06-15.md` |

Tasks not listed as project-level gates still require a task-level manual test script when they introduce user-visible or admin-visible behavior.
## Task Status Legend

| Status | Meaning |
|---|---|
| Not started | No implementation has begun |
| In progress | Work started but not accepted |
| Done | Task implemented, verified, and summarized |
| Blocked | Cannot continue without a decision or external action |

## Task Overview

| Task | Name | Depends On | Status | Summary File |
|---|---|---|---|---|
| T01 | Project Bootstrap | None | Not started | `docs/implementation/summaries/T01-summary.md` |
| T02 | Prisma Database | T01 | Not started | `docs/implementation/summaries/T02-summary.md` |
| T03 | Seed Data | T02 | Not started | `docs/implementation/summaries/T03-summary.md` |
| T04 | Domain Rules And Validation | T02, T03 | Not started | `docs/implementation/summaries/T04-summary.md` |
| T05 | Public Frontend Foundation | T03, T04 | Not started | `docs/implementation/summaries/T05-summary.md` |
| T06 | Public Detail Pages | T05 | Not started | `docs/implementation/summaries/T06-summary.md` |
| T07 | Search Listing Sorting | T05, T06 | Not started | `docs/implementation/summaries/T07-summary.md` |
| T08 | SEO Sitemap JSON-LD | T05, T06, T07 | Not started | `docs/implementation/summaries/T08-summary.md` |
| T09 | Admin Auth | T02, T03 | Not started | `docs/implementation/summaries/T09-summary.md` |
| T10 | Admin Layout Dashboard | T09 | Not started | `docs/implementation/summaries/T10-summary.md` |
| T11 | Admin Basic CRUD | T09, T10, T04 | Not started | `docs/implementation/summaries/T11-summary.md` |
| T12 | Admin Offer Editor | T11, T04 | Not started | `docs/implementation/summaries/T12-summary.md` |
| T13 | RWD Polish | T05, T06, T10, T11, T12 | Not started | `docs/implementation/summaries/T13-summary.md` |
| T14 | MVP Acceptance Pass | T01-T13 | Not started | `docs/implementation/summaries/T14-summary.md` |

---

## T01 - Project Bootstrap

### Goal

Create the runnable application foundation for the MVP.

### Scope

- Create or initialize a Next.js application.
- Configure TypeScript and Tailwind CSS.
- Add base app structure for public pages and admin pages.
- Add development scripts for linting, building, and running locally.
- Add initial `.env.example` with required environment variables.
- Confirm the app can start locally.

### Key Deliverables

- Next.js app files.
- Tailwind configuration.
- Basic route shells for `/`, `/search`, `/admin/login`, and `/admin`.
- `.env.example` with `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

### Acceptance Focus

- App starts without runtime errors.
- Public and admin route shells render.
- Project structure is clear enough for future tasks.

### Completion Summary Required

Write `docs/implementation/summaries/T01-summary.md`.

---

## T02 - Prisma Database

### Goal

Connect Prisma schema v2 to the app and create the local SQLite database foundation.

### Scope

- Add Prisma to the app.
- Copy or adapt `engineering-data-model-spec/schema.prisma` into the app Prisma location.
- Configure SQLite through `DATABASE_URL`.
- Generate Prisma Client.
- Create the first local migration or use an agreed local development database setup.
- Add a shared Prisma client helper.

### Key Deliverables

- `prisma/schema.prisma` matching schema v2.
- Local SQLite database setup.
- Generated Prisma Client.
- Shared database client module.

### Acceptance Focus

- Prisma validates the schema.
- Database can be created locally.
- Prisma Client can query at least one model.
- No MVP-excluded models are added.

### Completion Summary Required

Write `docs/implementation/summaries/T02-summary.md`.

---

## T03 - Seed Data

### Goal

Create realistic MVP seed data so frontend and admin features can be verified with actual relational data.

### Scope

- Seed one `SiteSetting`.
- Seed one active `AdminUser` with hashed password.
- Seed 3 to 5 banks.
- Seed 8 to 12 cards.
- Seed 6 categories.
- Seed at least 20 offers.
- Seed `OfferCard` relations so offers and cards can be tested from both directions.
- Include examples for published, draft, active, inactive, expired, featured, and non-featured content.

### Key Deliverables

- Seed script.
- Seed command in package scripts.
- Documented local admin credentials source.

### Acceptance Focus

- Seed can be rerun predictably.
- Homepage, category page, bank page, card page, offer page, and search page have enough data to test.
- Admin login has one usable account.

### Completion Summary Required

Write `docs/implementation/summaries/T03-summary.md`.

---

## T04 - Domain Rules And Validation

### Goal

Centralize MVP business rules so frontend, admin, seed, and future APIs use consistent behavior.

### Scope

- Slug generation and uniqueness checks.
- `faqJson` validation as a JSON array of objects with `question` and `answer`.
- Tags parsing from comma-separated string.
- Offer publish validation for required published-offer fields.
- Summary preview resolution: manual summary first, otherwise system-derived content.
- Expired offer logic using `endDate` and `SiteSetting.showExpiredOffers`.
- Shared offer sorting: `isFeatured`, `recommendScore`, `sortOrder`, `updatedAt`.

### Key Deliverables

- Shared domain helper modules.
- Validation helpers with clear error messages.
- Tests for core rules if a test framework is available after T01.

### Acceptance Focus

- Admin and frontend can use the same parsing and validation rules.
- Published offers cannot miss fields required by acceptance rules.
- Search and listing tasks do not create duplicate sorting logic later.

### Completion Summary Required

Write `docs/implementation/summaries/T04-summary.md`.

---

## T05 - Public Frontend Foundation

### Goal

Build the main public browsing experience and reusable public UI patterns.

### Scope

- Homepage `/`.
- Category page `/categories/[slug]`.
- Shared offer card component.
- Shared category entry component.
- Placeholder behavior for missing card images or bank logos.
- Featured offers and latest offers sections.
- Category listing with published-offer filtering.

### Key Deliverables

- Public layout.
- Homepage.
- Category page.
- Shared offer card and related display helpers.

### Acceptance Focus

- Homepage shows search entry, category entry, featured offers, latest offers, and static homepage FAQ/SEO content area.
- Category page uses fixed URL slug.
- Offer cards use consistent height and two-line summary behavior.
- Only published offers appear by default.

### Completion Summary Required

Write `docs/implementation/summaries/T05-summary.md`.

---

## T06 - Public Detail Pages

### Goal

Build the public detail pages that expose bank, card, and offer relationships.

### Scope

- Bank page `/banks/[slug]`.
- Card page `/cards/[slug]`.
- Offer detail page `/offers/[slug]`.
- Bank page shows bank information, cards, and related published offers.
- Card page shows card information, target audience, and related offers.
- Offer detail page shows full conditions, source URL, last verified date, related cards, and expired status.

### Key Deliverables

- Bank detail route.
- Card detail route.
- Offer detail route.
- Shared detail display helpers where useful.

### Acceptance Focus

- Each detail page has a stable slug URL.
- Related data is loaded through Prisma relations.
- Missing images use placeholders.
- Expired offers are clearly marked when shown.

### Completion Summary Required

Write `docs/implementation/summaries/T06-summary.md`.

---

## T07 - Search Listing Sorting

### Goal

Implement search and list behavior using the same card and sorting rules as category pages.

### Scope

- Search page `/search`.
- Keyword search across `Offer.title`, `Offer.summaryPreview`, `Offer.description`, `Offer.tags`, `Card.name`, `Bank.name`, and `Category.name`.
- Search results reuse the same offer card display as category pages.
- Support tag matching through the shared tags parser.
- Add empty result state and clear-search navigation.

### Key Deliverables

- Search route.
- Search query helper.
- Shared listing sort helper used by category and search pages.

### Acceptance Focus

- Search does not create a second card display system.
- Published-offer and expired-offer rules are respected.
- Search results are sorted consistently.

### Completion Summary Required

Write `docs/implementation/summaries/T07-summary.md`.

---

## T08 - SEO Sitemap JSON-LD

### Goal

Add MVP SEO output for fixed public URLs.

### Scope

- Metadata fallback for homepage, category, bank, card, offer, and search pages.
- Canonical URL generation from site base URL and slug.
- `sitemap.xml` including homepage, categories, banks, cards, and published offers.
- `robots.txt` that does not block important public pages.
- FAQPage JSON-LD for pages with valid `faqJson`.
- Basic WebSite, Organization, BreadcrumbList, WebPage, or Article JSON-LD where appropriate.

### Key Deliverables

- SEO helper module.
- Metadata implementations.
- Sitemap route/file.
- Robots route/file.
- JSON-LD rendering helpers.

### Acceptance Focus

- No `canonicalUrl` database field is introduced.
- SEO fields fall back when admin fields are empty.
- FAQ JSON-LD appears only when FAQ data is valid and visible.

### Completion Summary Required

Write `docs/implementation/summaries/T08-summary.md`.

---

## T09 - Admin Auth

### Goal

Protect the admin area with a single-admin MVP login flow.

### Scope

- Configure NextAuth Credentials provider.
- Authenticate against `AdminUser.email`, `passwordHash`, and `isActive`.
- Hash and compare passwords securely.
- Update `lastLoginAt` on successful login.
- Add login and logout flows.
- Protect admin routes.

### Key Deliverables

- Auth configuration.
- Admin login page.
- Session protection for admin routes.
- Logout action or route.

### Acceptance Focus

- Active admin can log in.
- Inactive admin cannot log in.
- Wrong password is rejected.
- Admin pages are not accessible when logged out.

### Completion Summary Required

Write `docs/implementation/summaries/T09-summary.md`.

---

## T10 - Admin Layout Dashboard

### Goal

Create the admin work surface before individual CRUD modules are added.

### Scope

- Admin layout with navigation.
- Mobile or narrow-screen navigation behavior.
- Dashboard `/admin`.
- Stats for published offers, drafts, expired offers, cards, and banks.
- Reminders for soon-expiring offers, missing source URL, missing images, or stale verification.
- Quick actions for adding offers and cards.

### Key Deliverables

- Admin layout.
- Admin dashboard.
- Shared admin UI components.

### Acceptance Focus

- Dashboard gives useful maintenance context.
- Navigation supports all MVP admin modules.
- Layout can support later CRUD screens without redesign.

### Completion Summary Required

Write `docs/implementation/summaries/T10-summary.md`.

---

## T11 - Admin Basic CRUD

### Goal

Build admin CRUD for the lower-risk models before the complex offer editor.

### Scope

- `SiteSetting` edit screen.
- `Bank` list, create, edit, activate/deactivate.
- `Card` list, create, edit, activate/deactivate.
- `Category` list, create, edit, activate/deactivate.
- Basic search or filtering in admin lists.
- Field help text for fields with frontend or SEO impact.
- Validation using shared rules from T04.

### Key Deliverables

- Admin settings screen.
- Admin bank screens.
- Admin card screens.
- Admin category screens.
- Shared admin form patterns.

### Acceptance Focus

- CRUD changes are reflected on public pages.
- Slug uniqueness is enforced.
- FAQ validation applies to category FAQ.
- SEO fields can be empty and still produce frontend metadata fallback.

### Completion Summary Required

Write `docs/implementation/summaries/T11-summary.md`.

---

## T12 - Admin Offer Editor

### Goal

Build the main content-management workflow for offers and offer-card relationships.

### Scope

- Offer list with filters for published, draft, expired, featured, category, and bank/card relation where feasible.
- Offer create and edit screen.
- Category selection.
- Multi-card relation editing through `OfferCard`.
- Summary mode, target audience, highlights, manual summary, and summary preview.
- Reward fields, conditions, source URL, last verified date, tags, SEO fields, and FAQ.
- Publish and unpublish behavior.
- Publish validation from T04.

### Key Deliverables

- Admin offer list.
- Admin offer editor.
- Offer-card relation management.
- Publish validation UI feedback.

### Acceptance Focus

- Draft offers can be incomplete.
- Published offers must satisfy acceptance rules.
- Offer cards are correctly linked to one or more cards.
- Changes affect homepage, category page, search, card page, bank page, and offer detail page as expected.

### Completion Summary Required

Write `docs/implementation/summaries/T12-summary.md`.

---

## T13 - RWD Polish

### Goal

Make public and admin screens usable across mobile, tablet, and desktop.

### Scope

- Public homepage mobile layout.
- Category and search listing responsive behavior.
- Detail page responsive content order.
- Admin sidebar drawer or top navigation for narrow screens.
- Admin tables transform or degrade into readable card summaries.
- Forms become single-column on narrow screens.
- Main actions remain easy to access.

### Key Deliverables

- Responsive styling updates.
- RWD verification notes.
- Any layout helper components needed to keep screens consistent.

### Acceptance Focus

- Mobile can still search, filter, compare, edit, preview, save, publish, and unpublish.
- Text does not overflow controls.
- Cards keep stable dimensions and two-line summaries.
- No incoherent overlap between UI elements.

### Completion Summary Required

Write `docs/implementation/summaries/T13-summary.md`.

---

## T14 - MVP Acceptance Pass

### Goal

Run the final MVP acceptance pass and produce a concise handoff report.

### Scope

- Compare implementation against `docs/acceptance/credit-card-mvp-development-acceptance-rules-v1-2026-06-15.md`.
- Verify frontend route coverage.
- Verify admin route coverage.
- Verify seed data coverage.
- Verify SEO, sitemap, robots, canonical, and FAQ JSON-LD.
- Verify schema did not add second-stage models.
- Verify non-MVP items are explicitly deferred.
- Fix small acceptance gaps found during the pass.

### Key Deliverables

- MVP acceptance report.
- Final fixes for small gaps.
- Updated task summaries if any task outcome changed.

### Acceptance Focus

- The app can be run locally with seeded data.
- Frontend, admin, auth, CRUD, search, SEO, and RWD basics meet MVP criteria.
- Remaining work is clearly marked as second-stage, not accidental omission.

### Completion Summary Required

Write `docs/implementation/summaries/T14-summary.md`.

---

## Required Summary Template

Each task must create its own summary file using this template:

```md
# Txx Summary - Task Name

## Status
Done / Partial / Blocked

## Completed
-

## Main Files
-

## Route / API / Model Changes
-

## Automated Verification
- Command:
- Result:

## Manual Test Script
- Path:
- User-facing flows covered:

## Next Task Only Needs To Know
-

## Open Questions
-
```

## Execution Rule

A task is not considered done until:

1. The requested implementation is complete.
2. The relevant automated verification command has been run by Codex, or the summary states why it could not be run.
3. A user-runnable manual test script exists under `docs/implementation/manual-test-scripts/` when the task changes user-visible or admin-visible behavior. The filename must follow `Txx-測試腳本-v版本號-YYYY-MM-DD.md`.
4. The task summary file exists.
5. The summary links the manual test script and clearly states what the next task needs to know.

## Recommended Next Step

Start with T01. Do not implement T02 until T01 is runnable and summarized.


