# Plan: UIU Calculator

Architect-owned. Human and REPLAN reference. Data: 2026-10-23. Profile: **strict**. Repo: `Rhythm2310/uiu-calculator`, default branch `main`, base branch `integration/uiu-calculator`.

## Architecture

SvelteKit 3 app, prerendered static output, deployed to Vercel (Node 24 LTS runtime; Node.js requirement met by Vercel's Node functions and by Node 24 in CI/Jules/local). Zero production dependencies. Three pure domain modules behind one frozen contract; one Planner page composes panels; Student state persists in localStorage behind a versioned key (ADR 0001).

Target tree (after all waves):

```
├── AGENTS.md / GLOSSARY.md / README.md (T05)
├── docs/adr/0001-...md   docs/deployment.md (T05)
├── package.json + lock   configs (T01, frozen)
├── .github/workflows/ci.yml (pack; T01 guards)
├── src/
│   ├── app.html  app.css (tokens)  app.d.ts          (T01, frozen)
│   ├── routes/+layout.svelte|ts (frozen)  +page.svelte (T01 tracer → T04 Planner)
│   └── lib/
│       ├── domain/
│       │   ├── contracts.ts            (T01, frozen contract)
│       │   ├── data/ grading-scale.ts programs.ts fee-rules.ts (T01, frozen data)
│       │   ├── grading/  (T01 tracer → T02 deep)     S1
│       │   ├── cgpa/     (T02)                        S1
│       │   └── fees/     (T03)                        S1
│       ├── components/  (T04: panels, course table, controls)
│       ├── stores/      (T04: planner state + localStorage, SSR-safe)
│       └── format/      (T04: Taka / GPA display formatting)
└── tests/e2e/ (T01 smoke → T04 flows)                 S2
```

Dependency direction (never reverse): routes → components → stores → domain → contracts/data. Domain imports nothing from Svelte, routes, stores or components.

## Waves

```
W0: T01 foundation (scaffold, frozen contracts+data, CI-verified toolchain, tracer: 1 Course → TermGpa green at S1+S2)
W1: T02 grading+cgpa engine (S1)   ∥   T03 fee engine (S1)          [disjoint directories]
W2: T04 Planner UI + S2 flows      ∥   T05 README + deployment guide [the integration point]
W3: T06 strict review (owns only its report)
```

All tasks launch from and PR into `integration/uiu-calculator`. After T06's report → REPLAN → fix wave(s) if findings; a re-review task follows every fix wave (strict profile); stop after two review rounds. Human merges `integration/uiu-calculator` → `main` once at the end; Vercel production deploy follows that merge.

## Ownership summary (hot files and contracts — identical to ownership.csv)

- Hot: `package.json`, `package-lock.json`, `.github/workflows/**`, `static/**` — owner T01.
- Contracts (frozen after W0): `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `playwright.config.ts`, `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/lib/domain/contracts.ts`, `src/lib/domain/data/**` — owner T01.
- Modules: grading+cgpa → T02; fees → T03; page/components/stores/format/e2e → T04; README+docs/deployment.md → T05; review report → T06.
- Cross-wave overlap (allowed): T02 deepens T01's grading tracer; T04 replaces T01's tracer page and smoke spec.

## Models

Every task: `gemini pro 15` — recorded exactly as the user stated it. The human picks the matching entry in the Jules model picker per session; if Jules offers no such name, use the UI's default and note it.

## Dependencies (ledger: `.jules/deps.csv`, researched live 2026-10-23)

Node 24 (CI pins 24.22.1) · Python 3.12 (CI guards) · npm: @sveltejs/kit 3.0.1, svelte 5.57.2, @sveltejs/adapter-vercel 7.0.0, @sveltejs/vite-plugin-svelte 7.3.1, vite 8.3.4, typescript 6.0.3, svelte-check 4.7.6, vitest 5.0.3, @playwright/test 1.64.0, eslint 10.12.0, @eslint/js 10.0.1, typescript-eslint 8.71.1, eslint-plugin-svelte 3.23.1, eslint-config-prettier 10.1.8, prettier 3.9.9, prettier-plugin-svelte 4.1.1, globals 17.13.0, tslib 2.8.1, @types/node 24.19.2 · actions: checkout v7, setup-node v7, setup-python v7. All stable, exactly pinned, peer-resolved as a set; versions <14 days old were skipped per the 2-week rule.

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

Infrastructure: T01 (scaffold/CI/contracts), T06 (review). Every U is covered; every task serves a U or is infrastructure.

## Quality gates (strict)

TDD at S1/S2 (first-red lines in reports) → two-axis self-review per task → `slop_guard.py --strict` in CI (warnings fail) → ownership guard → verify job (lint, types, unit, e2e, build) → T06 review task → REPLAN fix wave + re-review (max two review rounds). Kit: domain-language, tdd, code-review, codebase-design, pr enabled; diagnosing-bugs enabled at the first fix wave.

## VERIFY items and planning assumptions

1. Retake replaces the earlier attempt in Cgpa (official page silent) — implemented as latest-wins by CourseCode; confirm against UIU regulations.
2. FirstTerm AdmissionFee (Tk 20,000) counted as that Term's PreRegistrationPayment, never doubled — payment-policies page unreachable during planning; labelled in the PaymentSchedule note.
3. WaiverTier results are estimates: official 25%/50% program totals do not reproduce exactly from the public formula; UI carries "conditions apply" and links the waiver policy.
4. Vercel Node 24 function runtime label — confirm in the Vercel dashboard (human checklist).
5. Jules plan tier not stated: waves capped at 2 concurrent tasks and 6 total tasks, safe on the Free tier (3 concurrent / 15 daily); nothing changes on higher tiers.
6. Model name "gemini pro 15" is the user's exact wording; match it in the Jules picker or fall back to the session default.
7. Jules UI labels (plan auto-approval, CI Auto-Fixer Beta, Run and Snapshot) — confirm in the UI at setup time.
8. Upstream drift check done 2026-10-23 against mattpocock/skills: all kit sources still exist; no renames affecting this plan.

## Operating loop (human)

After each wave: merge all its PRs (CI green) → `git pull` → `python .jules/tools/swarm.py status` → `python .jules/tools/swarm.py launch`. After T06: `python .jules/tools/swarm.py replan` → paste `replan.md` after the word REPLAN.
