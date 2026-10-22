# Plan: Krishi Bazar v2 — sequential Jules build (strict profile)

Architect-owned. Repo `Rhythm2310/krishi-bazar` (empty at planning time, default branch `main`).
Execution: **one agent per task, strictly sequential** (ADR-0003) — 21 waves of exactly one task,
chained by dependency edges. Profile **strict**: kit on, `slop_guard --strict`, a review task after
every integration point, re-review after any fix wave. Jules Pro tier (100 daily tasks — the plan
uses 21 + headroom for fix waves). All models `default`.

## Architecture (summary — full decisions in `.jules/spec.md` + `docs/adr/`)
SvelteKit 3 + Svelte 5 + TypeScript strict on Bun 1.4.3; Vercel Functions on the Bun runtime
(beta, one-line nodejs24.x fallback — ADR-0001), region bom1. Neon Postgres free tier in
production; PGlite for dev/tests behind one Drizzle seam (ADR-0004). Money = integer paisa
(ADR-0002). Pure domain core (`src/lib/domain/**`) behind seam S1; server modules (`src/lib/server/**`)
behind S2; Playwright+axe browser journeys behind S3. Frozen researched data contracts:
`src/lib/data/taxonomy.ts` (9 groups, ~100 Bangladesh-specific categories with real-world
freshness windows, seasons, unit conversions, reference prices sourced from DAM 2026-10 /
documented estimates) and `districts.ts` (64 districts). Hand-written token-driven CSS, bn/en
typed dictionaries with instant cookie toggle, dark mode. WebP-only photos direct-to-Blob with a
local storage adapter for dev/CI. Fair-price advisory with absolute farmer override. Order state
machine নতুন→গৃহীত→পথে→সম্পন্ন + বাতিল with atomic stock reservation and lazy 24h expiry.

## Wave diagram (linear)
```
W0  T01 scaffold+toolchain+CI+tracer ─▶ W1  T02 design system+shell+i18n ─▶ W2  T03 data layer
─▶ W3  T04 domain core+market data ─▶ W4  T05 REVIEW IP-1 ─▶ W5  T06 farmer auth
─▶ W6  T07 photo upload ─▶ W7  T08 fair pricing ─▶ W8  T09 create listing ─▶ W9  T10 REVIEW IP-2
─▶ W10 T11 marketplace browse ─▶ W11 T12 detail ─▶ W12 T13 orders+lifecycle ─▶ W13 T14 REVIEW IP-3
─▶ W14 T15 comments ─▶ W15 T16 listing mgmt ─▶ W16 T17 seed+DX ─▶ W17 T18 REVIEW IP-4
─▶ W18 T19 hardening+budgets ─▶ W19 T20 docs+README ─▶ W20 T21 FINAL REVIEW ─▶ fix wave if needed ─▶ re-review
```
Operating loop per wave: launch one session (`swarm.py launch`) → merge its PR when CI is green →
`swarm.py status` → next. After each review task: `swarm.py replan`, paste `replan.md` to the
architect after the word `REPLAN`; clean report → continue; findings → fix wave + re-review.

## Ownership summary (hot files and contracts — full matrix in `.jules/ownership.csv`)
- T01: package.json, bun.lock, all tool configs, vercel.json, CI workflow, app.html, hooks, static/, scripts/lighthouse/, health route.
- T02: styles/tokens (frozen), i18n core (frozen), ui primitives, layout shell, +page.svelte (until T11), +error.svelte (until T19).
- T03: db schema contract (frozen), drizzle migrations, db scripts, districts.ts.
- T04: domain modules (frozen interfaces), taxonomy.ts, rates.ts (frozen), coverage gates.
- Later single-owner surfaces: auth (T06), upload (T07), pricing (T08), listings components+server (T09, deepened T16), market (T11), detail+orders routes (T12→T13→T15 deepen `p/[id]` across waves), orders server (T13), comments (T15), manage+farmer dashboard page (T16), seed (T17), e2e suite+hooks hardening+global gates (T19), docs+license+.env.example (T20).
- Cross-wave deepenings are safe by construction (one task at a time); guards still enforce per-task `owns` on every PR.

## Models
`default` for every task (owner specified none).

## Dependency summary (exact pins + sources in `.jules/deps.csv`, checked 2026-10-22)
Runtime bun 1.4.3 (Vercel `bunVersion 1.4.x`, beta — VERIFY at deploy). Framework: svelte 5.57.2,
kit 3.0.1, adapter-vercel 7.0.0, vite 8.3.4, typescript 6.0.3 (7.x excluded by peer ranges),
svelte-check 4.7.6. Data: drizzle-orm 0.45.4, drizzle-kit 0.31.11, @neondatabase/serverless 1.2.0,
@electric-sql/pglite 0.5.8, zod 4.6.5. Storage: @vercel/blob 2.8.1. UI: @lucide/svelte 1.53.0
(replaces deprecated lucide-svelte), @fontsource/hind-siliguri 5.3.0, @fontsource-variable/inter
5.3.0 — no CSS framework (owner decision). Tests: vitest 5.0.3, @vitest/coverage-v8 5.0.3,
fast-check 4.10.2, @playwright/test 1.64.0, @axe-core/playwright 4.13.0. Lint/format/commits:
eslint 10.12.0, eslint-plugin-svelte 3.23.0, typescript-eslint 8.71.1, @eslint/js 10.0.1,
eslint-config-prettier 10.1.8, globals 17.13.0, prettier 3.9.9, prettier-plugin-svelte 4.1.1,
@commitlint/cli 21.2.3, @commitlint/config-conventional 21.2.3. Perf: lighthouse 13.5.0 (replaces
stale @lhci/cli). Actions: checkout v7.0.1, setup-bun v2.2.0, upload-artifact v7.0.2.

## Story → task traceability
| Story | Delivered by (acceptance evidence) |
|---|---|
| U1 browse cards/badges | T11 (market.test, browse.spec) |
| U2 search/filter/sort/page | T11 (market.test matrix, browse.spec) |
| U3 detail complete | T12 (visibility-matrix tests, detail.spec) |
| U4 guest order + honest total | T13 (pricing golden cases, orders.spec) |
| U5 buyer cancel while নতুন | T13 (cancelByToken tests, orders.spec) |
| U6 comments + verified + anti-spam | T15 (windows/honeypot/badge tests, comments.spec) |
| U7 farmer auth | T06 (password/session/action tests, auth.spec) |
| U8 create listing + fair-price override | T08 (factors/properties) + T09 (create tests, listing-create.spec) + T07 (pipeline tests) |
| U9 manage listings | T16 (ownership matrix, manage.spec) |
| U10 lifecycle + expiry + privacy | T13 (machine table, expiry idempotence, race invariant) |
| U11 farmer replies | T15 (reply uniqueness tests, comments.spec) |
| U12 bn/en instant toggle | T02 (parity test, shell.spec) + T19 (journey flow 10) |
| U13 dark mode | T02 (shell.spec) + T19 (flow 11) |
| U14 polish/a11y/perf | T02 (shell, axe) + T19 (budgets enforced, mobile project, CSP) |
| U15 zero-service local dev + seed | T03 (adapter tests) + T17 (idempotent season-aware seed) |
| U16 Vercel+Neon+Blob deploy | T01 (build output, vercel.json) + T19 (budgets) + T20 (deploy guide) |
Infrastructure tasks serving all stories: T01, T03, T04 (+ reviews T05/T10/T14/T18/T21).

## Risks carried into the build (also in the pack's Assumptions)
Bun runtime beta on Vercel (fallback documented); Neon free-tier cold starts (accepted); Vercel
Blob Hobby quota (check dashboard pre-demo); reference prices partially estimated (owner-editable
data module); no password reset in v1 (accepted, seam documented); মণ = 40 kg bazaar convention
(documented, one-cell change).
