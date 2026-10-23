# T01: Foundation — scaffold, frozen contracts and data, CI, tracer

Wave: 0 | Model: gemini pro 15 | Size: L | Mode: foundation
Branch: `jules/T01-foundation` | PR title: `[T01] Foundation scaffold contracts data and tracer`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: infrastructure + U1 (tracer), U9 (footer) | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

After this task merges, `npm run verify` is green end-to-end on a thin tracer path, and everything later waves attach to exists and is frozen: the npm scaffold with every dependency at its pinned version, all tool configs, the app shell with the EffectiveDate footer, `contracts.ts` (every shared type), the frozen UIU data modules (grading scale, 12-Program fee table, fee rules), a first real slice of the grading module (gradePoint + calculateTermGpa), and one green path through both seams: 1 Course → TermGpa in Vitest (S1) and a smoke page flow in Chromium (S2).

## Context pointers

- Always: `GLOSSARY.md`; `.jules/spec.md` stories U1, U9, seams S1/S2, Implementation Decisions (stack, architecture, money rules).
- Read `docs/adr/0001-localstorage-only-state.md` (no backend, no secrets) and `docs/adr/0002-retake-latest-wins.md` (why the contract reports replacedCodes).
- `.jules/deps.csv` is the only source of versions. Do not use memory for any version or peer range.

## Owned paths (write)

```
package.json
package-lock.json
.gitignore
svelte.config.js
vite.config.ts
tsconfig.json
eslint.config.js
.prettierrc
.prettierignore
playwright.config.ts
src/app.html
src/app.css
src/app.d.ts
src/routes/+layout.svelte
src/routes/+layout.ts
src/routes/+page.svelte
src/lib/domain/contracts.ts
src/lib/domain/data/**
src/lib/domain/grading/**
static/**
tests/e2e/smoke.spec.ts
.github/workflows/**
```
Also yours: `.jules/reports/T01.md`

## Read-only inputs

`AGENTS.md`, `GLOSSARY.md`, `.jules/spec.md`, `.jules/deps.csv`, `docs/adr/**`, `.jules/tools/**` (run them, never edit).

## Forbidden

- Any path not listed under Owned paths. Do not create anything under `src/lib/domain/cgpa/`, `src/lib/domain/fees/`, `src/lib/components/`, `src/lib/stores/`, `src/lib/format/` or `README.md` — T02, T03, T04 and T05 own those.
- Any dependency or version not in `.jules/deps.csv`. You are the only task allowed to install; install exactly the ledger.
- Server logic, API routes, environment variables, secrets, network calls at runtime: the app is static (ADR 0001).

## Steps

This task is design-heavy: the goals and exact data below are binding; the file-level how is your judgment inside the owned paths. Every library API you write must be the API of the pinned version (read the installed package's docs/types when unsure — `node_modules/<pkg>` is available after install).

1. **Manifest and lockfile.** `package.json`: name `uiu-calculator`, private, `type: module`, and exactly these devDependencies (no dependencies section): `@eslint/js 10.0.1`, `@playwright/test 1.64.0`, `@sveltejs/adapter-vercel 7.0.0`, `@sveltejs/kit 3.0.1`, `@sveltejs/vite-plugin-svelte 7.3.1`, `@types/node 24.19.2`, `eslint 10.12.0`, `eslint-config-prettier 10.1.8`, `eslint-plugin-svelte 3.23.1`, `globals 17.13.0`, `prettier 3.9.9`, `prettier-plugin-svelte 4.1.1`, `svelte 5.57.2`, `svelte-check 4.7.6`, `tslib 2.8.1`, `typescript 6.0.3`, `typescript-eslint 8.71.1`, `vite 8.3.4`, `vitest 5.0.3` — every version exact (no `^`/`~`). Scripts:
   - `dev`: `vite dev`
   - `build`: `vite build`
   - `preview`: `vite preview`
   - `lint`: `eslint .`
   - `format`: `prettier --write .`
   - `format:check`: `prettier --check .`
   - `check`: `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`
   - `test:unit`: `vitest run`
   - `test:e2e`: `playwright test`
   - `verify`: `npm run lint && npm run format:check && npm run check && npm run test:unit && npm run test:e2e && npm run build`
   Install with npm (registry exact pins), commit `package-lock.json`. `.gitignore` ships with the pack — extend it only for tool outputs if needed. Done when: `npm ci` exits 0 from a clean checkout of your branch.
2. **Configs (all frozen after this task).** `svelte.config.js`: `vitePreprocess` from `@sveltejs/vite-plugin-svelte`, kit adapter `@sveltejs/adapter-vercel`. `vite.config.ts`: `defineConfig` from `vitest/config` with the `sveltekit()` plugin and `test: { include: ['src/**/*.test.ts'], environment: 'node' }`. `tsconfig.json`: extends `./.svelte-kit/tsconfig.json`, `strict: true`. `eslint.config.js`: flat config — ignores for generated dirs (`.svelte-kit`, `build`, `.vercel`, `node_modules`, `playwright-report`, `test-results`), `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-svelte` flat recommended, browser+node globals from `globals`, rule `@typescript-eslint/no-explicit-any: error`, `eslint-config-prettier` last. `.prettierrc`: plugin `prettier-plugin-svelte`, svelte parser override, `singleQuote: true`, `printWidth: 100`; `.prettierignore` covers generated dirs, `package-lock.json`, `.jules/tools`, `static`. `playwright.config.ts`: `testDir: 'tests/e2e'`, one `chromium` project, `webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: true }`. Done when: `npm run lint`, `npm run check` exit 0 on the scaffold.
3. **App shell.** `src/app.html` (lang `en`, title `UIU Calculator`, viewport meta). `src/app.css`: design tokens as CSS custom properties on `:root` — color palette (background, surface, text, muted, accent, positive, negative, warning), spacing scale, radii, font stack (system fonts only — no external fonts or CDNs); plus minimal base element styles. `src/app.d.ts` per the SvelteKit default. `src/routes/+layout.ts`: `export const prerender = true`. `src/routes/+layout.svelte`: shell that renders the page in a `<main>` plus a `<footer>` showing: `Data effective: {EFFECTIVE_DATE}` (from the data module — import, never hardcode), the DISCLAIMER text, and links to both official source URLs (from the data module). Done when: `npm run dev` shows the footer with `2026-10-23`.
4. **Frozen contract** `src/lib/domain/contracts.ts` — types and signatures only, zero runtime logic, zero imports outside itself:

   ```ts
   export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
   export type TermSystem = 'Trimester' | 'Semester';
   export type ProgramId =
     | 'BBA' | 'BBA-AIS' | 'BSECO' | 'BSSEDS' | 'BSCSE' | 'BSDS'
     | 'BSEEE' | 'BSC-CIVIL' | 'BPHARM' | 'BA-ENG' | 'BSSMSJ' | 'BSBGE';
   export type WaiverTier = 0 | 25 | 50;
   export type FeeLineKind =
     | 'tuition-gross' | 'retake-waiver' | 'tier-waiver'
     | 'term-fee' | 'lab-fee' | 'admission-fee' | 'caution-money';

   export interface Program {
     id: ProgramId; name: string; totalCredits: number;
     termSystem: TermSystem; termsTotal: number;
     perCreditFee: number; labFeePerTerm: number;
   }
   export interface CourseEntry {
     id: string; code: string; title: string;
     credits: number; grade: LetterGrade; isRetake: boolean;
   }
   export interface TermRecord { id: string; label: string; courses: CourseEntry[] }
   export interface GpaResult { termGpa: number; earnedCredits: number; totalCredits: number }
   export interface CgpaResult {
     cgpa: number; earnedCredits: number; totalCredits: number;
     replacedCodes: string[]; meetsDegreeRequirement: boolean;
   }
   export interface FeeLine { kind: FeeLineKind; label: string; amount: number; refundable?: boolean }
   export interface FeeInput {
     programId: ProgramId; creditsPlanned: number; retakeCredits: number;
     isFirstTerm: boolean; waiverTier: WaiverTier;
   }
   export interface FeeBreakdown {
     lines: FeeLine[]; tuitionGross: number; tuitionNet: number;
     refundable: number; totalDue: number; isEstimate: boolean;
   }
   export interface Installment { index: number; fraction: number; amount: number }
   export interface PaymentSchedule {
     preRegistration: number; installments: Installment[]; firstTermNote: string | null;
   }
   export interface ProgramTotal { programId: ProgramId; waiverTier: WaiverTier; total: number }

   // Function contracts. Each named module exports exactly this function under this name:
   // grading:  gradePoint(grade: LetterGrade): number
   // grading:  calculateTermGpa(courses: CourseEntry[]): GpaResult
   // cgpa:     calculateCgpa(savedTerms: TermRecord[], planner: CourseEntry[]): CgpaResult
   // cgpa:     normalizeCourseCode(code: string): string
   // fees:     calculateFees(input: FeeInput): FeeBreakdown
   // fees:     calculatePaymentSchedule(input: FeeInput): PaymentSchedule
   // fees:     calculateProgramTotal(programId: ProgramId, waiverTier: WaiverTier): ProgramTotal
   // fees:     listPrograms(): Program[]
   // fees:     getProgram(id: ProgramId): Program
   export type GradePointFn = (grade: LetterGrade) => number;
   export type CalculateTermGpaFn = (courses: CourseEntry[]) => GpaResult;
   export type CalculateCgpaFn = (savedTerms: TermRecord[], planner: CourseEntry[]) => CgpaResult;
   export type NormalizeCourseCodeFn = (code: string) => string;
   export type CalculateFeesFn = (input: FeeInput) => FeeBreakdown;
   export type CalculatePaymentScheduleFn = (input: FeeInput) => PaymentSchedule;
   export type CalculateProgramTotalFn = (programId: ProgramId, waiverTier: WaiverTier) => ProgramTotal;
   export type ListProgramsFn = () => Program[];
   export type GetProgramFn = (id: ProgramId) => Program;
   ```

5. **Frozen data** under `src/lib/domain/data/` (three modules, each with its own barrel export; values below are binding, researched live from uiu.ac.bd on 2026-10-23):
   - `grading-scale.ts`: `GRADE_POINTS: Record<LetterGrade, number>` = A 4.00, A- 3.67, B+ 3.33, B 3.00, B- 2.67, C+ 2.33, C 2.00, C- 1.67, D+ 1.33, D 1.00, F 0.00; `DEGREE_REQUIREMENT_CGPA = 2.00`; `GRADE_MARKS`: the official marks bands (A 90–100 … D 55–57, F 0–54) for a read-only reference table.
   - `programs.ts`: `PROGRAMS: readonly Program[]`, all 12 rows:
     | id | name | totalCredits | termSystem | termsTotal | perCreditFee | labFeePerTerm |
     |---|---|---|---|---|---|---|
     | BBA | BBA | 125 | Trimester | 12 | 6500 | 0 |
     | BBA-AIS | BBA in AIS | 125 | Trimester | 12 | 6500 | 0 |
     | BSECO | BSECO | 122 | Trimester | 12 | 6500 | 0 |
     | BSSEDS | BSSEDS | 123 | Trimester | 12 | 6500 | 0 |
     | BSCSE | BSCSE | 141 | Trimester | 12 | 6500 | 0 |
     | BSDS | BSDS | 138 | Trimester | 12 | 6500 | 0 |
     | BSEEE | BSEEE | 140 | Trimester | 12 | 6500 | 0 |
     | BSC-CIVIL | BSc Civil | 151.5 | Trimester | 12 | 6500 | 0 |
     | BPHARM | B.Pharm | 160 | Semester | 8 | 6500 | 5000 |
     | BA-ENG | BA English | 123 | Trimester | 12 | 5525 | 0 |
     | BSSMSJ | BSSMSJ | 130 | Trimester | 12 | 5525 | 0 |
     | BSBGE | BSBGE (BSc in Biotechnology & Genetic Engineering) | 140 | Trimester | 12 | 6500 | 2000 |
     Also `PUBLISHED_PROGRAM_TOTALS_TIER_0: Record<ProgramId, number>` (official "without any tuition fee waiver" totals, Taka): BBA 910500, BBA-AIS 910500, BSECO 891000, BSSEDS 897500, BSCSE 1014500, BSDS 995000, BSEEE 1008000, BSC-CIVIL 1082750, BPHARM 1178000, BA-ENG 777575, BSSMSJ 816250, BSBGE 1032000.
   - `fee-rules.ts`: `TERM_FEE_TRIMESTER = 6500`; `TERM_FEE_SEMESTER = 9750`; `ADMISSION_FEE = 20000` (non-refundable); `CAUTION_MONEY = 2000` (refundable); `RETAKE_WAIVER_RATE = 0.5` (first retake only); `WAIVER_TIERS = [0, 25, 50] as const`; `PRE_REGISTRATION_PAYMENT = 20000`; `TRIMESTER_INSTALLMENT_FRACTIONS = [0.4, 0.3, 0.3]`; `SEMESTER_INSTALLMENT_FRACTIONS = [0.25, 0.25, 0.25, 0.25]`; `EFFECTIVE_DATE = '2026-10-23'`; `SOURCES = { grading: 'https://www.uiu.ac.bd/academics/grading-performance-evaluation/', fees: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/' }`; `DISCLAIMER = 'UIU may change fees without notice — verify with UIU before paying.'`; `WAIVER_ESTIMATE_NOTE = 'Estimate: conditions apply — official totals may differ.'`.
   Done when: a unit test asserts the 12-row table length, both 5525 Programs, and the 11 grade points against these values.
6. **Grading tracer (S1, test-first).** In `src/lib/domain/grading/` (barrel `index.ts`): `gradePoint` and `calculateTermGpa` per the contract — credit-weighted `Σ(credits × gradePoint) / Σ(credits)` at full precision; F counts in the denominator and earns no Credits; empty input → `{ termGpa: 0, earnedCredits: 0, totalCredits: 0 }` (never NaN). Write `src/lib/domain/grading/term-gpa.test.ts` FIRST (red), then implement. Golden slices: single Course 3 Credits A → 4.00; [3cr A, 3cr C+] → 3.165 (assert with `toBeCloseTo(3.165, 10)` — full precision, not rounded); [3cr A, 2cr F] → termGpa 2.4, earnedCredits 3, totalCredits 5; [] → zeros. Keep validation minimal here (unknown grade → the TS type already forbids it; runtime `RangeError` hardening is T02's slice — do not pre-empt it).
7. **Tracer page + smoke flow (S2, test-first).** `tests/e2e/smoke.spec.ts` FIRST (red against the current empty app), then `src/routes/+page.svelte`: an `h1` "UIU Calculator", one hardcoded CourseEntry (`CSE 1101`, 3 Credits, grade A) rendered through `calculateTermGpa`, showing `Tracer TermGpa: 4.00` (2-decimal display inline — the real format module arrives with T04). No interactivity beyond that; T04 replaces this page. `static/favicon.svg`: a simple inline SVG monogram. Done when: `npx playwright test tests/e2e/smoke.spec.ts` is green, asserting the h1, the text `4.00`, and a footer containing `2026-10-23` and `verify with UIU`.
8. **CI check.** `.github/workflows/ci.yml` ships with the pack (manifest-guarded verify + ownership-guard + slop-guard jobs). Confirm every `npm run …` it calls exists verbatim in your `package.json`; you own the workflow — fix the workflow only if a name differs, and say so in the report.
9. **Gates.** `npx playwright install --with-deps chromium` (once per session), then `npm run verify` green; `python .jules/tools/slop_guard.py --strict` clean; `git diff --name-only` shows only owned paths.
10. Finish with the self-review pass (skill `code-review`): Spec against this file's Objective and Acceptance criteria and stories U1/U9, then Standards.

## Acceptance criteria

Each line is checkable by a command.
1. `npm ci` exits 0 (lockfile committed, every version exactly as in `.jules/deps.csv`; `npm ls --all | grep -E "svelte|vite|kit"` shows no version ranges).
2. `npm run verify` exits 0.
3. `npx vitest run src/lib/domain` exits 0 with the grade-point, TermGpa golden and data-table tests present.
4. `npx playwright test tests/e2e/smoke.spec.ts` exits 0.
5. Story U1 (tracer) verified by `src/lib/domain/grading/term-gpa.test.ts` at S1 and by `tests/e2e/smoke.spec.ts` at S2; U9 (footer) verified by the smoke spec's footer assertions.
6. `python .jules/tools/slop_guard.py --strict` reports no ERROR.
7. `git diff --name-only origin/main...HEAD` lists only owned paths (plus `.jules/reports/T01.md`).

## Decision defaults

- Registry exact-pins only; if `npm install` wants to resolve a range, the pin is wrong — recheck against `.jules/deps.csv`, never against memory.
- ESM everywhere (`type: module`); `import type` for type-only imports.
- Vitest config lives inside `vite.config.ts` (via `vitest/config`) — no separate vitest config file.
- Design tokens: system font stack; a light theme only; no CSS framework.
- Footer links open in a new tab with `rel="noopener noreferrer"`.
- Commit granularity: several small commits (`chore(scaffold) …`, `feat(data) …`, `test(grading) …`), each ending `[T01]`.
- If svelte-check or eslint complain about SvelteKit generated types, run `npx svelte-kit sync` first.

## Fallbacks

- If the npm registry is unreachable: retry with backoff twice; then commit `package.json` alone, mark the PR `[PARTIAL]`, and list the missing lockfile in the report.
- If the Playwright browser install fails in your VM: retry `npx playwright install --with-deps chromium`; if it still fails, ship everything else green, mark `[PARTIAL]`, and record the exact error in the report (CI installs its own Chromium).
- If a pinned package's real API contradicts this file (e.g. an export name): follow the installed package, and file `.jules/requests/T01-<slug>.md` describing the divergence.

## Hand-off

Report at `.jules/reports/T01.md` (format in AGENTS.md section 10). Tell dependent tasks: the exact export names of `contracts.ts` and the three data modules; the npm script names; the CSS custom-property names in `src/app.css`; anything about the tracer that T04 must replace (page markup, smoke spec) and T02 must deepen (grading module internals).
