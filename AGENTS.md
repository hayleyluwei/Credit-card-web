# Codex Project Instructions

## Project Context

This project is the Credit Card MVP website.

Primary project folder:

`C:\Users\user\Documents\Credit card web project`

The project contains product specs, schema specs, acceptance rules, and implementation task planning documents. Keep work scoped to this project unless the user explicitly says otherwise.

## Rule Scope And Precedence

This project has separate rules for product-spec editing, schema editing, and code implementation.

Use this priority when rules overlap:

1. User's latest explicit instruction
2. Product-spec or schema modification flow, if the task edits those files
3. Implementation task continuity rule, for normal coding work
4. General coding conventions

## Implementation Task Continuity Rule

For normal code implementation tasks, do not reread the full product spec, schema spec, acceptance rules, or all task files by default.

At the start of each implementation session, read only:

1. `docs/implementation/00-master-task-index.md`
2. The current task file or current task section
3. The previous one or two relevant summary files from `docs/implementation/summaries/`
4. Source specs only when the current task explicitly requires deeper detail

Each completed task must create or update its own summary file under:

`docs/implementation/summaries/`

A task is not done until its summary includes:

- completed work
- main files changed
- route / API / model changes
- verification result
- what the next task needs to know
- open questions

## Product Spec Editing Rule

If the task modifies the product spec, Word files, PDFs, product-spec images, or related spec documents, follow these files first:

- `規格書文件修正原則.md`
- `規格書修改流程.md`

When following the product spec flow:

- read the required rule files first
- list the planned changes before editing
- wait for user confirmation before changing spec files
- only modify confirmed items
- do not overwrite already exported Word versions
- keep Word and PDF content versions aligned when both are produced
- ensure Traditional Chinese text renders correctly and contains no mojibake, `??`, or replacement characters

## Schema Editing Rule

If the task modifies `schema.prisma`, schema backup files, schema checklists, or schema spec documents, follow these files first:

- `engineering-data-model-spec/schema修正原則.md`
- `engineering-data-model-spec/schema修改流程.md`

When following the schema flow:

- read the required rule files first
- read the current formal schema file
- read the latest schema spec and checklist files
- list the planned changes before editing
- wait for user confirmation before changing schema files
- keep `schema.prisma`, the same-version schema spec, and the same-version schema backup aligned
- do not add models, fields, indexes, or relations outside MVP scope unless the user explicitly confirms
- run Prisma format or validate only if the project already has the needed environment; do not install packages without asking first


## Verification Gates And Manual Test Scripts

Implementation work must include both automated verification and user-runnable manual verification.

For every implementation task:

1. Codex must run the relevant automated checks before claiming the task is done.
2. Codex must create or update a manual test script before asking the user to test.
3. The manual test script must be written so the user can follow it step by step without rereading specs.
4. The task summary must include both automated verification results and the manual test script path, including the script version and date.

Manual test scripts live under:

`docs/implementation/manual-test-scripts/`

Use this naming pattern:

`Txx-測試腳本-v版本號-YYYY-MM-DD.md`

Example:

`T01-測試腳本-v1-2026-06-15.md`

The filename must use Traditional Chinese `測試腳本`, include a version number, and include the date the script was created or updated.

Each manual test script must include:

- prerequisite setup
- local URL to open
- test account or seed data needed, if applicable
- step-by-step actions
- expected result for each step
- what to screenshot or report if the result is wrong
- pass/fail checklist
- script version and date

Do not ask the user to manually test a task until the manual test script exists.

### Required Verification Gates

Use these project-level gates during implementation:

| Gate | Timing | Codex Verification | User Manual Testing |
|---|---|---|---|
| Gate 1 | After T01 | App starts, routes render, lint/build baseline checked when available | Open public/admin shell pages |
| Gate 2 | After T03 | Prisma database and seed script verified | Inspect seeded public data if UI exists, otherwise confirm seed command output |
| Gate 3 | After T04 | Domain validation tests or scripted checks pass | Review validation examples and expected errors |
| Gate 4 | After T08 | Public pages, search, SEO, sitemap, robots, JSON-LD checked | Browse public flows and SEO outputs using a script |
| Gate 5 | After T12 | Admin auth and CRUD workflows checked | Run admin login, CRUD, offer publish/unpublish script |
| Gate 6 | After T14 | Full MVP acceptance pass completed | Run final acceptance script before considering MVP complete |

If a task is partially complete or blocked, still write a summary and include which verification steps were not run and why.
## Implementation Source Documents

Use these as authoritative references when a task explicitly needs deeper detail:

| Type | Path | Purpose |
|---|---|---|
| Product spec | `outputs/product-spec/credit-card-mvp-spec-v11-2026-06-08.docx` | Product scope, frontend/admin pages, RWD, SEO, field usability |
| Product spec inspection | `outputs/product-spec/credit-card-mvp-spec-v11-2026-06-08-inspection.txt` | Faster text reference for the v11 product spec |
| Prisma schema | `engineering-data-model-spec/schema.prisma` | Actual MVP data model to implement |
| Schema spec | `engineering-data-model-spec/prisma-schema-spec-v2-2026-06-08.md` | Explanation of schema decisions and non-goals |
| Acceptance rules | `docs/acceptance/credit-card-mvp-development-acceptance-rules-v1-2026-06-15.md` | Development acceptance criteria |
| Task index | `docs/implementation/00-master-task-index.md` | Implementation task order and handoff rules |

## MVP Boundaries

For MVP implementation:

- Use Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite unless the user changes the decision.
- Use Prisma schema v2 as the data model source of truth.
- Use camelCase field names in implementation, matching Prisma.
- Treat product-spec snake_case names as conceptual equivalents only.
- Do not add MVP-excluded models unless explicitly approved: `AuditLog`, `FaqItem`, `Tag`, `OfferTag`, `Redirect`, `CrawlSource`, `ImportJob`.
- Do not add `canonicalUrl` fields in MVP. Canonical URLs are generated from site base URL and slug.
- Do not add `SiteSetting.homepageFaqJson` in MVP. Homepage FAQ remains static frontend content for now.
- Store image URLs or paths only. Do not store image binary data in the database.
- Frontend public pages must show only `isPublished = true` offers by default.
- Expired offer visibility follows `SiteSetting.showExpiredOffers`.



