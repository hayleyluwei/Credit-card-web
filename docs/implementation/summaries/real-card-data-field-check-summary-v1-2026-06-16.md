# Real Card Data Field Check Summary - v1

## Status

Done

## Completed

- Replaced mojibake-heavy seed content with readable Traditional Chinese test data.
- Added real-card seed coverage for:
  - 國泰世華 CUBE 卡
  - HSBC Traveller's Infinite Card
  - HSBC TravelOne Signature Credit Card
  - 永豐 DAWHO現金回饋信用卡
- Added real-offer examples for CUBE dining, CUBE 台塑家, HSBC travel points / airport benefits, DAWHO cashback / EasyCard autoload / mobile pay / dining discount.
- Preserved T03 coverage requirements:
  - 5 banks total, including one inactive bank
  - 9 cards total, including one inactive card
  - 6 categories
  - 23 offers
  - published, draft, featured, non-featured, expired, active, inactive examples
- Added a real-data smoke test that checks database records and frontend pages.
- Updated UX follow-up smoke expected text to match readable seed data.
- Added T14 manual test script v2 with direct localhost links.
- Updated offer detail page copy and layout so it shows actionable sections: "怎麼拿到優惠", "回饋與限制", "注意事項", and "適用信用卡".
- Replaced raw reward type codes such as `points` with readable labels such as "點數回饋".
- Expanded the CUBE dining seed content with the real operational rule: Thursday domestic restaurant spend, CUBE card, single transaction threshold, 5% coupon, and 100-point coupon cap.
- Expanded the DAWHO 大戶屋 seed content with the real operational rule: activity period, store, named set meal, card shown at checkout, special price, original price, service charge, non-stackable limitation, and meal content.

## Main Files

- `prisma/seed.mjs`
- `package.json`
- `scripts/verify-real-card-data.mjs`
- `scripts/verify-ux-followup.mjs`
- `src/app/offers/[slug]/page.tsx`
- `docs/implementation/manual-test-scripts/T14-測試腳本-v2-2026-06-16.md`
- `docs/implementation/summaries/real-card-data-field-check-summary-v1-2026-06-16.md`

## Route / API / Model Changes

- No route changes.
- No API changes.
- No Prisma schema/model changes.
- No product SPEC changes.
- Data uses existing fields only:
  - `Bank`: issuer identity and website
  - `Card`: stable card identity, image URL, summary, description, target audience
  - `Offer`: campaign or benefit details, reward fields, dates, conditions, source URL, tags
  - `OfferCard`: exact card-offer relation

## Automated Verification

- Command: `npm.cmd run smoke:real-data`
  - Result: Passed
- Command: `npm.cmd run smoke:ux-followup`
  - Result: Passed
- Command: `npm.cmd run smoke:t03`
  - Result: Passed
- Command: `npm.cmd run lint`
  - Result: Passed
- Command: `npm.cmd run build`
  - Result: Passed
- Dev server reset:
  - Cleared `.next`
  - Restarted `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000`
  - Confirmed `http://127.0.0.1:3000/` returned 200
- Re-ran after dev restart:
  - `npm.cmd run smoke:real-data`: Passed
  - `npm.cmd run smoke:ux-followup`: Passed
  - `npm.cmd run smoke:t03`: Passed
- Follow-up after CUBE dining detail fix:
  - `npm.cmd run db:seed`: Passed
  - `npm.cmd run smoke:real-data`: Passed
  - `npm.cmd run smoke:ux-followup`: Passed
  - `npm.cmd run smoke:t03`: Passed
  - `npm.cmd run lint`: Passed
  - `npm.cmd run build`: Passed
  - Dev server restarted and `/offers/cube-dining-2026` returned 200
- Follow-up after DAWHO 大戶屋 detail fix:
  - `npm.cmd run db:seed`: Passed
  - `npm.cmd run smoke:real-data`: Passed
  - `npm.cmd run smoke:t03`: Passed
  - `npm.cmd run lint`: Passed

## Manual Test Script

- Path: `docs/implementation/manual-test-scripts/T14-測試腳本-v2-2026-06-16.md`
- User-facing flows covered:
  - Homepage
  - Search for 永豐
  - Search for HSBC
  - Bank pages
  - Card pages
  - Offer pages
  - Admin login
  - Admin card, offer, and bank management

## Field Observations For Next UX Review

- Current schema can represent real cards without immediate schema changes.
- `conditions` is the most likely field to become too long for real activities because it combines eligibility, tasks, caps, exclusions, and timing.
- `rewardCap` works for simple caps but can become dense when an offer has multiple caps by tier or statement cycle.
- `Offer` works for both campaigns and standing benefits, but the UI may later need clearer labels for "activity" versus "card benefit".
- `Card.sourceUrl` is not a schema field; official card source URLs currently live in seed source comments/offer sources only when represented as offers. If source traceability for cards becomes important, that is a future schema discussion, not part of this change.
- A real offer page must answer practical questions, not just list stored fields: when to spend, which card to use, where it applies, minimum spend, reward form, cap, and official caveats.
- Single-store dining offers need concrete checkout instructions: store name, item name, what card to show, actual offer price, original price, extra fees, whether it can stack with other discounts, and included items.

## Next Task Only Needs To Know

- The app now has readable real-card seed data for CUBE, HSBC Traveller, HSBC TravelOne, and DAWHO.
- Use `npm.cmd run db:seed` to reset the local database to this dataset.
- Use `npm.cmd run smoke:real-data` to verify the real-data field check.
- Continue T14 manual testing from `T14-測試腳本-v2-2026-06-16.md`.

## Open Questions

- After manual testing, decide whether long real offer conditions should remain in one textarea or be split into structured admin fields in a future schema/spec revision.
- Decide whether card-level official source URLs are needed in a later schema version.
