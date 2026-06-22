# Admin Offer Maintenance UX Fixes Summary - v1

## Status

Done

## Completed

- Fixed admin offer list public-page links so published offers open in a new browser tab.
- Added explicit admin text explaining that public-page links open in a new tab.
- Added stable-field reminders to bank and card management:
  - Slug is a public URL identifier and should not be changed casually.
  - SEO fields are not automatically overwritten by offer updates.
- Reworked the admin offer form with readable Traditional Chinese labels, placeholders, and help text.
- Added a frontend field mapping guide inside the offer form:
  - Offer card / search result
  - Offer detail page
  - SEO / maintenance
- Changed offer publish validation from raw thrown runtime error to form-level Chinese validation messages.
- Kept draft saving permissive while publish requires source URL, reward info, and at least one linked card.
- Updated smoke tests for the new admin UX.
- Updated the project-scoped `credit-card-offer-extractor` skill with maintenance rules.
- Added T14 manual test script v3.

## Main Files

- `src/app/admin/offers/page.tsx`
- `src/app/admin/offers/new/page.tsx`
- `src/app/admin/offers/[id]/page.tsx`
- `src/app/admin/cards/page.tsx`
- `src/app/admin/banks/page.tsx`
- `src/components/AdminOfferForm.tsx`
- `src/lib/admin-actions.ts`
- `scripts/verify-admin-ux-fixes-v2.mjs`
- `scripts/verify-t12-offer-editor.mjs`
- `scripts/verify-ux-followup.mjs`
- `.codex/skills/credit-card-offer-extractor/SKILL.md`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v3-2026-06-21.md`
- `docs/implementation/summaries/admin-offer-maintenance-ux-fixes-summary-v1-2026-06-21.md`

## Route / API / Model Changes

- Route behavior changed only in admin UI:
  - `/admin/offers` public-page links now use a new tab.
  - `/admin/offers/new` and `/admin/offers/[id]` now show form-level validation messages.
- No API changes.
- No Prisma schema/model changes.
- No product SPEC changes.

## Automated Verification

- Command: `npm.cmd run smoke:admin-ux-v2`
  - Result: Passed
- Command: `npm.cmd run smoke:t12`
  - Result: Passed
- Command: `npm.cmd run smoke:ux-followup`
  - Result: Passed
- Command: `npm.cmd run smoke:real-data`
  - Result: Passed
- Command: `npm.cmd run lint`
  - Result: Passed
- Command: `npm.cmd run build`
  - Result: Passed
- Dev server reset:
  - Cleared `.next`
  - Restarted `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000`
  - Confirmed `/` returned 200 before smoke tests

## Manual Test Script

- Path: `docs/implementation/manual-test-scripts/T14-測試腳本-v3-2026-06-21.md`
- User-facing flows covered:
  - Admin public-page new-tab behavior
  - Bank/card stable-field reminders
  - Offer form placeholders and frontend mapping guide
  - Publish validation errors without runtime overlay
  - Draft save behavior
  - Key public T14 links

## Next Task Only Needs To Know

- Use `npm.cmd run smoke:admin-ux-v2` for this admin UX follow-up.
- Use T14 manual test script v3 for user manual verification.
- Updating offers should not mutate bank/card slug or SEO fields unless explicitly requested.

## Open Questions

- The edit pages for individual bank/card records still allow slug editing. The current fix adds warnings; a future stricter fix could add a confirmation step or lock slug fields after creation.
