# Admin Card / Offer UX Fixes 1-10 Summary - v1

## Status

Done

## Completed

- Added a client-side card edit form for `/admin/cards/[id]`.
- Card edit now shows save pending state, success message, error message, public-page link, and links back to `/admin/cards` and `/admin`.
- Added `還原本次修改` reset control for card and offer edit forms.
- Added `StableSlugInput` so existing Slug fields warn when the user actually changes the value.
- Applied Slug change warning to card, offer, bank, and category edit pages.
- Rebuilt admin offer form text with readable Traditional Chinese labels, placeholders, help text, and frontend field mapping.
- Offer edit/new forms now show links back to `/admin/offers` and `/admin`.
- Offer cards now prioritize `summaryPreview` as the visible list-card summary.
- Category frontend detail pages no longer show backend-only `分類 Slug` or `SEO 標題`.
- Offer detail pages now show a public `優惠亮點` section when highlight fields have values.
- Added smoke test `scripts/verify-admin-ux-fixes-v3.mjs`.
- Added manual test script `docs/implementation/manual-test-scripts/T14-測試腳本-v4-2026-06-22.md`.

## Main Files

- `src/components/AdminCardForm.tsx`
- `src/components/AdminOfferForm.tsx`
- `src/components/StableSlugInput.tsx`
- `src/components/OfferCard.tsx`
- `src/app/admin/cards/[id]/page.tsx`
- `src/app/admin/banks/[id]/page.tsx`
- `src/app/admin/categories/[id]/page.tsx`
- `src/app/categories/[slug]/page.tsx`
- `src/app/offers/[slug]/page.tsx`
- `src/lib/admin-actions.ts`
- `scripts/verify-admin-ux-fixes-v3.mjs`
- `package.json`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v4-2026-06-22.md`

## Route / API / Model Changes

- Route behavior changed in admin UI and frontend rendering only.
- No API route changes.
- No Prisma schema/model changes.
- No product SPEC changes for these 1-10 fixes.
- The homepage `依信用卡查優惠` entrance is intentionally not included here; that remains a later SPEC-impacting task.

## Automated Verification

- Command: `npm.cmd run smoke:admin-ux-v3`
  - First run before implementation: failed on missing UX text and category technical fields.
  - After implementation: passed.

## Manual Test Script

- Path: `docs/implementation/manual-test-scripts/T14-測試腳本-v4-2026-06-22.md`

## Notes

- `還原本次修改` is the MVP-safe reset behavior: it restores the values from when the edit page was loaded. It is not a cross-save version history feature.
- Slug warnings are client-side confirmation prompts. They reduce accidental changes without adding redirect/version tables.
