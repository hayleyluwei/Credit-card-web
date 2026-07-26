# Homepage Card Entry Summary - v1

## Status

Done

## Completed

- Added a homepage section: `依信用卡查優惠`.
- The homepage now shows active credit cards from active banks.
- Each homepage card entry displays:
  - card image or fallback letter
  - bank name
  - card name
  - short summary or fallback text
  - current public offer count
  - link to `/cards/[slug]`
- Offer counts respect the existing public offer visibility helper and `SiteSetting.showExpiredOffers`.
- Added smoke test `scripts/verify-homepage-card-entry.mjs`.
- Added npm script `smoke:homepage-card-entry`.
- Added manual test script `docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`.

## Main Files

- `src/app/page.tsx`
- `scripts/verify-homepage-card-entry.mjs`
- `package.json`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`
- `docs/implementation/summaries/homepage-card-entry-summary-v1-2026-06-22.md`

## Route / API / Model Changes

- Route behavior changed only on `/`.
- No API changes.
- No Prisma schema/model changes.
- No formal product spec file was edited in this implementation step.

## Automated Verification

- Command: `npm.cmd run smoke:homepage-card-entry`
  - Result: Passed
- Command: `npm.cmd run smoke:real-data`
  - Result: Passed
- Command: `npm.cmd run lint`
  - Result: Passed
- Command: `npm.cmd run build`
  - Result: Passed

Note: Smoke tests were rerun after restarting the local dev server and clearing `.next`, because running build and smoke concurrently can leave Next dev with stale chunk output.

## Manual Test Script

- Path: `docs/implementation/manual-test-scripts/T14-測試腳本-v5-2026-06-22.md`

## Rollback Point

- Checkpoint before this task: `43b724f checkpoint before homepage card entry`

## Next Task Needs To Know

- The homepage card entry uses existing `Card`, `Bank`, `OfferCard`, and `Offer` data.
- There is still no standalone `/cards` list page; homepage entries link directly to `/cards/[slug]`.
- A future formal product spec update should include this homepage card-entry behavior if the user accepts the manual test result.
