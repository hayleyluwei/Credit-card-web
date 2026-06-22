---
name: credit-card-offer-extractor
description: Use only inside the Credit card web project when Codex needs to turn official bank or credit-card offer pages into actionable website/admin content, including seed data, Offer/Card field text, frontend offer detail copy, smoke-test expectations, or QA notes. Trigger for this project when working with official credit-card promotions, bank benefit pages, reward rules, dining/travel/cashback offers, or complaints that an offer page is vague, empty, or only lists database fields.
---

# Credit Card Offer Extractor

## Purpose

Use this skill only for the Credit card web project. Convert official credit-card offer content into website content that a user can act on.

The result must explain how to get the offer, not merely mirror database fields.

## Core Workflow

1. Read the official source page or user-provided excerpt. If the source is current and not fully pasted by the user, verify the official page.
2. Extract operational facts before writing:
   - offer name
   - activity period
   - eligible card or card family
   - eligible store, channel, country, or category
   - required action at checkout or before purchase
   - spend threshold or item requirement
   - reward, discount, price, points, miles, or benefit
   - cap, quota, limit, fee, or non-stackable rule
   - registration, coupon, or app-switching requirement
   - source URL and last verified date
3. Map facts into existing MVP fields:
   - `summary`: one sentence with the main value and action.
   - `description`: practical rule in human language. Include exact time, card, place, action, amount, reward, and cap.
   - `minSpend`: threshold or required item/action.
   - `rewardValue`: actual reward, price, discount, points, or benefit.
   - `rewardCap`: caps, quotas, service fees, or amount limits.
   - `conditions`: registration, coupon, checkout, eligibility, non-stackable, and official-rule caveats.
   - `tags`: short search terms users would type.
4. Make the frontend page answer:
   - When does it run?
   - Which card do I use?
   - Where or through which channel does it apply?
   - What exactly must I do?
   - How much must I spend, or what item must I buy?
   - What do I get?
   - What is the cap, fee, or limit?
   - What can make me ineligible?
5. Add or update smoke/manual checks for exact operational phrases. Tests should fail if the page falls back to generic filler such as `測試優惠`, `依官方活動`, or raw codes like `points`.
6. Record whether the existing schema was enough. Do not add schema fields unless the user explicitly asks for schema work.

## Maintenance Rules

When the user asks to update credit-card offers, update only the changing offer data by default:

- `Offer` content, dates, reward fields, conditions, source URL, publish state, and sorting.
- `OfferCard` relationships when eligible cards change.

Do not change these stable fields unless the user explicitly asks:

- `Bank.slug`
- `Bank.seoTitle`
- `Bank.seoDescription`
- `Card.slug`
- `Card.seoTitle`
- `Card.seoDescription`
- card/bank names, except when the official name has clearly changed.

When editing admin forms, make publish validation errors visible inside the form. Do not throw raw validation errors that produce a Next.js runtime overlay.

## Quality Bar

A good offer page lets a user decide and act without opening the official page first. The official page remains the source of truth, but this website must summarize the usable rule.

Do not write content that only says:

- `用於測試...`
- `依官方活動...`
- `指定活動...`
- `相關優惠...`
- raw backend codes such as `points`, `cashback`, `discount`

Accept vague wording only when the official source itself lacks details, and say what is unknown.

## Source Handling

Prefer official bank/card sources. Keep source URLs in `sourceUrl` for `Offer` data.

If the user pastes official text, preserve exact numbers, dates, item names, and quoted names. Do not invent caps, dates, requirements, or card eligibility.

If a benefit has tiered rules, either write the tiered rules clearly in `description` / `conditions`, or flag that the schema/UI may need future refinement.

## Project Field Mapping

For the current MVP schema:

- `Bank`: issuer identity.
- `Card`: stable card identity, target audience, card summary, card image URL.
- `Offer`: campaign, benefit, and rule details.
- `OfferCard`: exact relationship between an offer and eligible cards.

Do not infer eligibility by bank alone. Link offers to the actual eligible card records.

## References

Read `references/content-patterns.md` when working on real offer content or updating seed/smoke/manual checks.
