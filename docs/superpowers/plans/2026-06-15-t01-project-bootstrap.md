# T01 Project Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the runnable Next.js foundation for the Credit Card MVP.

**Architecture:** Use the Next.js App Router with route groups for public and admin screens. Keep T01 limited to route shells, shared styling, scripts, environment documentation, and verification docs so Prisma and authentication can start cleanly in later tasks.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, ESLint.

---

### Task 1: Scaffold App Files

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/search/page.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.example`

- [ ] Create the project configuration files.
- [ ] Create route shell pages for `/`, `/search`, `/admin/login`, and `/admin`.
- [ ] Add baseline responsive styling with Tailwind utilities.
- [ ] Add `.env.example` with the required T01 variables.

### Task 2: Add Verification Docs

**Files:**
- Create: `docs/implementation/manual-test-scripts/T01-測試腳本-v1-2026-06-15.md`
- Historical summary: consolidated into `docs/implementation/summaries/2026-06-15至2026-06-21-信用卡MVP實作長期記憶總結-v1-2026-06-21.md`

- [ ] Write a user-runnable manual test script for Gate 1.
- [ ] Write the T01 summary with files changed, routes, verification results, and next-task notes.

### Task 3: Verify

- [ ] Run `npm install` if dependencies are not installed.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the app with `npm run dev` and confirm the expected routes render.
