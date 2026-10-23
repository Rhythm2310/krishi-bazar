# Plan: UIU Calculator

Architect-owned. Human and REPLAN reference. Data researched live 2026-10-23. Profile: **strict**. Repo: `Rhythm2310/uiu-calculator`, default branch `main`, base branch `main` (straight-to-main, user decision). This is a fresh full rebuild: it replaces the previous pack of 2026-10-22/23 (old paste-pack format, no Task-prompt.md); none of its tasks had run (no reports, no PRs, no merged code).

## Architecture

SvelteKit 3 app (Svelte 5 runes, TypeScript 6 strict, Vite 8), prerendered static output, deployed to Vercel (adapter-vercel). Node 24 LTS runtime (CI pins 24.22.1). Zero production dependencies; zero secrets. Three pure domain modules (grading, cgpa, fees) behind one frozen contract; frozen data modules carry the official UIU grading scale and 12-Program fee table with EffectiveDate and source URLs. One Planner page composes panels; Student state persists in localStorage behind a versioned key (ADR 0001); Retake replacement is latest-wins by normalized CourseCode (ADR 0002).

Target tree (after all waves):

```
├── AGENTS.md / GLOSSARY.md / README.md (T05) / Task-prompt.md (pack)
├── docs/adr/0001-…md, 0002-…md (architect)   docs/deployment.md (T05)
├── package.json + lock   configs   .gitignore          (T01, frozen)
├── .github/workflows/ci.yml (pack; T01 owns fixes)
├── src/
│   ├── app.html  app.css (tokens)  app.d.ts            (T01, frozen)
│   ├── routes/+layout.svelte|ts (frozen)  +page.svelte (T01 tracer → T04 Planner)
│   └── lib/
│       ├── domain/
│       │   ├── contracts.ts            (T01, frozen contract)
│       │   ├── data/ grading-scale.ts programs.ts fee-rules.ts (T01, frozen data)
│       │   ├── grading/  (T01 tracer → T02 deep)        S1
│       │   ├── cgpa/     (T02)                          S1
│       │   └── fees/     (T03)                          S1
│       ├── components/  (T04: panels, course table, controls)
│       ├── stores/      (T04: planner state + localStorage, SSR-safe)
│       └── format/      (T04: Taka / GPA display formatting)
└── tests/e2e/ (T01 smoke → T04 flows)                   S2
```

Dependency direction (never reverse): routes → components → stores → domain → contracts/data. Domain imports nothing from Svelte, routes, stores or components.

## Waves

```
W0: T01 foundation (scaffold, frozen contracts+data, CI, tracer: 1 Course → TermGpa green at S1+S2)
W1: T02 grading+cgpa engine (S1)  ∥  T03 fee engine (S1)  ∥  T05 README+deployment guide   [disjoint paths]
W2: T04 Planner UI + S2 flows                                        [the integration point]
W3: T06 strict review (owns only its report)
```

All task PRs target `main` (straight-to-main): merge one PR at a time, wait for green checks between merges, and merge every wave before starting the next. After T06's report → REPLAN → fix wave(s) if findings; a re-review task follows every fix wave (strict profile); stop after two review rounds. Vercel production deploy follows each merge to `main`; the app is only fully usable after W2.

## Ownership summary (hot files and contracts — identical to ownership.csv)

- Hot: `package.json`, `package-lock.json`, `.gitignore`, `.github/workflows/**`, `static/**` — owner T01.
- Contracts (frozen after W0): `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `playwright.config.ts`, `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/lib/domain/contracts.ts`, `src/lib/domain/data/**` — owner T01.
- Modules (deliberately absent from ownership.csv, which lists hot files and contracts only): grading+cgpa → T02; fees → T03; page/components/stores/format/e2e → T04; README+docs/deployment.md → T05; review report → T06.
- Cross-wave overlap (allowed by design): T02 deepens T01's grading tracer; T04 replaces T01's tracer page and smoke spec.
- Size L justifications (doctor WARN): T01 is one indivisible foundation — scaffold, configs, contracts and frozen data must land atomically or the freeze point does not exist; splitting it would put two owners on the same configs in one wave. T04 is the single integration point — one page, one state module; splitting it would put two owners on `+page.svelte` and the store.

## Models

Every task: `gemini pro 15` — recorded exactly as the user stated it. The human picks the matching entry in the Jules model picker per session; if Jules offers no such name, use the UI's default and note it.

## Dependencies (ledger: `.jules/deps.csv`, researched live 2026-10-23)

Node 24.22.1 (Active LTS Krypton; CI-pinned) · Python 3.12 (CI guards) · npm: @sveltejs/kit 3.0.1, svelte 5.57.2, @sveltejs/adapter-vercel 7.0.0, @sveltejs/vite-plugin-svelte 7.3.1, vite 8.3.4, typescript 6.0.3, svelte-check 4.7.6, vitest 5.0.3, @playwright/test 1.64.0, eslint 10.12.0, @eslint/js 10.0.1, typescript-eslint 8.71.1, eslint-plugin-svelte 3.23.1, eslint-config-prettier 10.1.8, prettier 3.9.9, prettier-plugin-svelte 4.1.1, globals 17.13.0, tslib 2.8.1, @types/node 24.19.2 · actions: checkout v7, setup-node v7, setup-python v7. All stable, exactly pinned, peer-resolved as a set straight from registry.npmjs.org and the actions' release pages; versions younger than 14 days were skipped per the 2-week rule (kit 3.1.0, adapter-vercel 7.0.1, vite 8.3.5, svelte-check 4.7.7, vitest 5.0.4/5.0.5, playwright 1.64.1, eslint 10.13.0, typescript-eslint 8.71.2/8.72.0, prettier 3.9.10). TypeScript stays on 6.0.3: 7.0.2 is latest but breaks the kit and typescript-eslint peer ranges. Node 24.22.1 is a documented 2-week-rule exception (core patch lines ship security fixes).

## Story-to-task traceability

| Story | Delivered by |
|---|---|
| U1 term planning + TermGpa | T01 (tracer), T02 (engine), T04 (UI) |
| U2 Retake replacement + RetakeWaiver | T02 (Cgpa rule), T03 (waiver math), T04 (toggle + labels) |
| U3 SavedTerms in browser | T04 |
| U4 Cgpa + 2.00 indicator | T02 (math), T04 (panel) |
| U5 FeeBreakdown per Program | T03 (engine), T04 (panel) |
| U6 FirstTerm one-time charges | T03 (math), T04 (toggle + refundable label) |
| U7 WaiverTier estimates | T03 (math), T04 (selector + conditions note) |
| U8 PaymentSchedule | T03 (engine), T04 (panel) |
| U9 EffectiveDate + disclaimer | T01 (footer), T04 (panel notes), T05 (README) |

Infrastructure: T01 (scaffold/CI/contracts/data), T06 (review). Every U is covered; every task serves a U or is infrastructure.

## Quality gates (strict)

TDD at S1/S2 (first-red lines in reports) → two-axis self-review per task → `slop_guard.py --strict` in CI (warnings fail) → ownership guard → verify job (lint, format check, types, unit, e2e, build) → T06 review task → REPLAN fix wave + re-review (max two review rounds). Kit: domain-language, tdd, code-review, codebase-design, pr enabled; diagnosing-bugs is enabled by the first fix wave (REPLAN). CI on `main` skips the verify steps until `package.json` exists (pre-foundation commits stay green by design).

## VERIFY items and planning assumptions

1. Retake replaces the earlier attempt in Cgpa (official grading page silent) — implemented as latest-wins by CourseCode (ADR 0002); confirm against UIU regulations.
2. FirstTerm AdmissionFee (Tk 20,000) counted as that Term's PreRegistrationPayment, never doubled — the payment-policies detail page was not fetched during planning; the conservative no-double-charge interpretation is implemented and labelled in the PaymentSchedule note.
3. WaiverTier results are estimates: the official 25%/50% program totals do not reproduce from the public formula (verified against all 12 rows on 2026-10-23); tier-0 totals DO reproduce exactly and are the golden tests. UI carries "conditions apply" and links the waiver policy.
4. Vercel Node 24 function runtime label — confirm in the Vercel dashboard (human checklist).
5. Jules plan tier: Google AI Pro (user-stated; 15 concurrent / 100 daily). Waves cap at 3 concurrent tasks; 6 total tasks leave ample headroom.
6. Model name "gemini pro 15" is the user's exact wording; match it in the Jules picker or fall back to the session default.
7. Jules UI labels (plan auto-approval, CI Auto-Fixer Beta, Run and Snapshot) — confirm in the UI at setup time.
8. Upstream drift check 2026-10-23: mattpocock/skills active (pushed 2026-10-22), MIT, not archived; the kit ships vendored from this skill's assets with NOTICE.md attribution and the upstream licence text.
9. Fresh rebuild: the previous pack (paste-pack format) is fully replaced. After applying this pack, delete the stale root files `jules-pack.txt` and `unpack_pack.py` in the same commit — nothing references them.
10. Node 26 becomes LTS on 2026-10-28: revisit the runtime pin at the next REPLAN.

## Operating loop (human)

Follow `Task-prompt.md` — it carries every step and prompt; no scripts to run. In short: push the pack → Jules setup (CI Auto-Fixer ON, plan auto-approval ON, setup script snapshot) → protect `main` → run wave by wave (start sessions together, merge PRs one at a time, green between merges) → after T06, send its report back with `REPLAN` if it lists findings you care about → ship via Vercel.
