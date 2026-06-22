# T12 Summary - Admin Offer Editor

## Status
Done

## Completed

- Added protected offer list at `/admin/offers` with keyword, published/draft, and category filters.
- Added offer creation page at `/admin/offers/new`.
- Added offer edit page at `/admin/offers/[id]`.
- Added shared `AdminOfferForm` for content, rewards, dates, cards, SEO, FAQ, draft save, publish, and unpublish actions.
- Added offer create/update server actions with slug uniqueness, FAQ validation, publish validation, and `OfferCard` relation editing.
- Added T12 smoke test and package script.
- Added user-runnable manual test script.

## Main Files

- `src/app/admin/offers/page.tsx`
- `src/app/admin/offers/new/page.tsx`
- `src/app/admin/offers/[id]/page.tsx`
- `src/components/AdminOfferForm.tsx`
- `src/lib/admin-actions.ts`
- `scripts/verify-t12-offer-editor.mjs`
- `package.json`
- `docs/implementation/manual-test-scripts/T12-測試腳本-v1-2026-06-15.md`
- `docs/implementation/summaries/T12-summary.md`

## Route / API / Model Changes

- Added `/admin/offers`
- Added `/admin/offers/new`
- Added `/admin/offers/[id]`
- No API routes added.
- No Prisma model changes.

## Automated Verification

- Command: `npm.cmd run smoke:t12`
- Result: Passed.
- Command: `npm.cmd run build`
- Result: Passed.
- Note: build still reports existing `<img>` warnings in `src/app/banks/[slug]/page.tsx` and `src/app/cards/[slug]/page.tsx`; these warnings predate T12.

## Manual Test Script

- Path: `docs/implementation/manual-test-scripts/T12-測試腳本-v1-2026-06-15.md`
- User-facing flows covered: offer list filtering, draft creation, publish validation, offer editing, card relation editing, SEO/FAQ editing, and unpublish behavior.

## Next Task Only Needs To Know

- T13 should focus on responsive polish across public and admin pages, including admin tables/forms and existing `<img>` lint warnings if image handling is part of the polish.
- Offer editor fields are intentionally broad but simple: no rich text editor, no separate preview route, and no audit trail in MVP.
- Publishing is controlled by submit intent: `draft`, `publish`, and `unpublish`.

## Open Questions

- None for T12.
