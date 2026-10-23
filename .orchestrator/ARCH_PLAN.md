# Architecture Plan — UIU Calculator (CGPA & Tuition Fee Breakdown)

Status: v1 | Updated after wave: — (pre-W00, awaiting human approval)

## 1. Goal and non-goals

**Goal:** A public, client-side web app for students of United International University (UIU), Bangladesh, that (a) computes semester GPA from a course list, (b) projects CGPA from the completed record plus planned courses (including "GPA needed to reach target CGPA"), (c) produces an exact per-term tuition fee breakdown (program rates, waivers, retake discount, installment schedule) and a whole-degree cost estimate, and (d) shows the seed data transparently — sourced, dated, and user-editable. No auth, no database, no server: all logic runs in the browser; state persists in localStorage.

**Non-goals (prototype):**
- No accounts, no backend, no DB, no analytics.
- No official course catalog: students type their own course names/credits.
- No guarantee of official figures: every money output carries a disclaimer + link to uiu.ac.bd source pages.
- No Bangla localization (English UI only), no PWA/offline packaging, no mobile app.
- No payment integration of any kind.
- No reverse-engineering of the anomalous published waiver totals (see §9): we display the official published numbers verbatim beside our formula-computed numbers.

## 2. Stack and rationale

| Choice | Why |
|---|---|
| TypeScript 5.x (strict) | User's choice; typed domain logic catches unit/fee modelling errors at compile time. |
| Bun (runtime, package manager, test runner) | User's choice; `bun test`, `bun run build` — one toolchain, fast, no extra deps for tests. |
| Vite + React 18/19 (SPA) | Static client-side app is the natural fit for "no DB, no auth"; Vite is first-class on Vercel; React keeps UI state simple. Scaffold via `bun create vite` (react-ts) or manual equivalent. |
| Plain CSS (one design-system stylesheet) | Zero UI-framework dependencies keeps the review surface small; calculator UIs need few components. |
| localStorage (via one storage module) | Only persistence needed: course lists, student record, fee overrides. No DB by user decision. |
| Vercel static deploy | User's delivery target. Static `dist/` output; no Functions needed. Bun builds are supported on Vercel; Bun runtime for Functions exists (vercel.com/docs/functions/runtimes/bun) but is not required for this app. |

## 3. Module map

| Module | Responsibility | Lens | Depends on |
|---|---|---|---|
| `src/domain/` (`gpa.ts`, `fees.ts`, `format.ts`, `types.ts`) | Pure calculation logic. No React, no DOM, no storage imports. All money/GPA math lives here and nowhere else. | backend | data |
| `src/data/` (`gradingScale.ts`, `programs.ts`, `policyNotes.ts`) | Seed datasets transcribed from official uiu.ac.bd pages, each with source URL + access date. Types enforced by `domain/types.ts`. | data | domain/types |
| `src/state/storage.ts` | Load/save/reset of course lists, student record, fee overrides in localStorage. Single choke point; versioned storage key. | data | domain/types |
| `src/ui/` (App shell + `GpaCalculator`, `CgpaPlanner`, `FeeBreakdown`, `DataPage` components) | Rendering, input handling, tab navigation, result display. Calls domain functions; contains no formulas. | frontend-UI / UX | domain, data, state |
| `src/domain/__tests__/` (`gpa.test.ts`, `fees.test.ts`, `format.test.ts`) | Unit tests for all pure logic, incl. the official-totals parity suite (§6 slice 3). | tests | domain, data |
| root: `Makefile`, `scripts/smoke.sh`, `vercel.json`, `README.md`, CI workflow (Release wave) | Heartbeat, build config, deploy config, docs. | DevOps/release, docs | everything |

Rule: UI never computes; domain never renders. A reviewer should be able to verify every number from `src/domain` tests alone.

## 4. Data model and interfaces

### Entities (all in `src/domain/types.ts`)

```ts
type GradeLetter = 'A'|'A-'|'B+'|'B'|'B-'|'C+'|'C'|'C-'|'D+'|'D'|'F';
interface Grade { letter: GradeLetter; point: number; minMark: number; maxMark: number; assessment: string; }

interface Program {
  code: string;                 // e.g. 'BSCSE'
  name: string;                 // e.g. 'BSc in Computer Science & Engineering'
  level: 'UG' | 'PG';
  totalCredits: number;         // supports .5 (Civil = 151.5)
  perCreditFee: number;         // BDT, e.g. 6500; English/MSJ = 5525
  termType: 'Trimester' | 'Semester';
  terms: number;                // e.g. 12 trimesters; B.Pharm = 8 semesters
  termFee: number;              // 6500 trimester / 9750 semester (B.Pharm)
  labFeePerTerm?: number;       // BSBGE 2000/trimester; B.Pharm 5000/semester
  publishedTotals: { full: number; waiver25?: number; waiver50?: number }; // verbatim from official table, display-only
}

interface CourseEntry {
  id: string; name: string; credits: number;      // 0.5–6, step 0.5
  grade?: GradeLetter;                             // omit for projection
  isRetake?: boolean; retakeFirstTime?: boolean;   // retake discount flags
  waiverIneligible?: boolean;                      // thesis/project/internship/retake: excluded from scholarship base
}

interface StudentRecord { completedCredits: number; currentCgpa: number; }
interface FeeLine { label: string; amount: number; note?: string; }
```

### Seed data (transcribed 2026-10-23 from uiu.ac.bd — sources in §9)

Grading scale (official; note: UIU has **no A+**; F spans 0–54):

| Letter | Point | Marks % | Assessment |
|---|---|---|---|
| A | 4.00 | 90–100 | Outstanding |
| A- | 3.67 | 86–89 | Excellent |
| B+ | 3.33 | 82–85 | Very Good |
| B | 3.00 | 78–81 | Good |
| B- | 2.67 | 74–77 | Above Average |
| C+ | 2.33 | 70–73 | Average |
| C | 2.00 | 66–69 | Below Average |
| C- | 1.67 | 62–65 | Poor |
| D+ | 1.33 | 58–61 | Very poor |
| D | 1.00 | 55–57 | Pass |
| F | 0.00 | 0–54 | Fail |

Programs (UG — per-credit 6,500 except BA English & BSSMSJ 5,525 "15% discount"; admission fee 20,000 one-time; trimester fee 6,500; semester fee 9,750 B.Pharm only):

| Code | Credits | Terms | Per-credit | Published full total | Published 50% wv | Published 25% wv |
|---|---|---|---|---|---|---|
| BBA | 125 | 12 tri | 6500 | 910,500 | 514,000 | 712,250 |
| BBA-AIS | 125 | 12 tri | 6500 | 910,500 | 514,000 | 712,250 |
| BSECO | 122 | 12 tri | 6500 | 891,000 | 504,250 | 697,625 |
| BSSEDS | 123 | 12 tri | 6500 | 897,500 | 517,250 | 707,375 |
| BSCSE | 141 | 12 tri | 6500 | 1,014,500 | 575,750 | 795,125 |
| BSDS | 138 | 12 tri | 6500 | 995,000 | 566,000 | 780,500 |
| BSEEE | 140 | 12 tri | 6500 | 1,008,000 | 572,500 | 790,250 |
| BSCE (Civil) | 151.5 | 12 tri | 6500 | 1,082,750 | 609,875 | 846,312.50 |
| BPHARM | 160 | 8 sem | 6500 (+5000/sem lab) | 1,178,000 | 671,000 | 924,500 |
| BAENG | 123 | 12 tri | 5525 | 777,575 | 446,075 | 611,825 |
| BSSMSJ | 130 | 12 tri | 5525 | 816,250 | 465,412.5 | 640,831.3 |
| BSBGE | 140 | 12 tri | 6500 (+2000/tri lab) | 1,032,000 | 583,500 | 807,750 |

Programs (PG — per-credit 6,500; MBA/EMBA seeded as 30-cr (4-term) and 60/45-cr (6/5-term) variants to match published totals):

| Code | Credits | Terms | Published full total | Published 25% wv |
|---|---|---|---|---|
| MBA-30 | 30 | 4 tri | 241,000 | 192,250 |
| MBA-60 | 60 | 6 tri | 449,000 | 351,500 |
| EMBA-30 | 30 | 4 tri | 241,000 | 192,250 |
| EMBA-45 | 45 | 5 tri | 345,000 | 271,875 |
| MSECO | 30 | 4 tri | 241,000 | 197,125 (research) / 202,000 (thesis) |
| MDS | 39 | 4 tri | 299,500 | 236,125 (course) / 245,875 (thesis) |
| MSCSE | 36 | 4 tri | 280,000 | 221,500 (theory) / 231,250 (project) / 250,750 (thesis) |

Scholarship/waiver policy facts for the DataPage info panel (from official policy page, "effective Spring 2025, for Spring 2025+ admittees", scholarship applies **tuition fee only**): admission-based 25%/50% (SSC/HSC or O/A-level criteria); merit-based top 2%/4%/4% → 100/50/25% with min GPA 3.50; min registration 9 credits (B.Pharm 14, PG 6); continuation requires GPA ≥ 3.50; not applicable to Thesis/Project/Internship/Retake/Repeat; retake course fee waived 50% first time only; each term requires Tk 20,000 advance before registration, remainder in 3 installments (40/30/30, trimester) or 4 (25% each, semester).

### Domain function contracts (exact signatures — UI must not re-derive these)

```ts
// gpa.ts
computeGpa(courses: CourseEntry[]): { gpa: number; earnedCredits: number; totalCredits: number; hasF: boolean }
computeCgpa(record: StudentRecord, planned: CourseEntry[]): { newCgpa: number; totalCredits: number }
requiredTermGpa(record: StudentRecord, plannedCredits: number, targetCgpa: number):
  { required: number | null }   // null = unreachable (>4.00 or plannedCredits<=0)

// fees.ts
computeTermFee(program: Program, courses: CourseEntry[], waiverPct: number):
  { lines: FeeLine[]; tuitionGross: number; waiverDiscount: number; total: number; installments: number[] }
computeDegreeTotal(program: Program): { computed: number; published: number | null; matches: boolean }

// format.ts
formatBdt(n: number): string    // lakh grouping: 910500 -> '৳9,10,500'; 8287.5 -> '৳8,287.50'
round2(x: number): number       // half-up at 2dp with 1e-9 epsilon guard
```

Math rules (binding):
- GPA/CGPA = credit-weighted mean, `round2`. F counts in the GPA denominator with point 0; F credits are NOT earned credits. Earned = grade point ≥ 1.00 (D or above).
- Term fee: per-course tuition = `credits × perCreditFee × (isRetake && retakeFirstTime ? 0.5 : 1)`. Waiver discount = `waiverPct/100 ×` sum of tuition of courses NOT flagged `waiverIneligible` (retakes count as ineligible per policy). Total = tuitionGross − waiverDiscount + termFee + (labFeePerTerm ?? 0).
- Installments: advance 20,000; remainder split 40/30/30 (Trimester) or 25×4 (Semester); each rounded to whole BDT, residual ± added to the final installment so parts sum exactly to the remainder.
- Degree total (no-waiver): `totalCredits×perCreditFee + terms×termFee + 20000 + terms×(labFeePerTerm??0)`. **Must equal `publishedTotals.full` for every seeded program** (parity test suite).
- Waiver-adjusted degree totals are estimates only; UI shows computed value beside published value with a note when they differ (see §9 R1).

There are no API routes, events, or servers. The only external "interface" is the localStorage schema (versioned key `uiu-calc:v1:*`), owned by `src/state/storage.ts`.

## 5. Heartbeat definition

Command: `make smoke` (fallback without make: `bun run smoke` — both execute `scripts/smoke.sh`).

`scripts/smoke.sh` (bash, `set -euo pipefail`), in order:
1. `bun install --frozen-lockfile`
2. `bun run typecheck` (`tsc --noEmit`)
3. `bun test`
4. `bun run build`
5. Serve `dist/` on port 4173 (`bun run preview -- --port 4173 --strictPort &`), poll up to 15 s, then `curl -fsS http://localhost:4173/` must return 200 and contain `id="root"`; kill the server afterwards.
6. Print `SMOKE OK`.

Alive means: all six steps pass and the script exits 0. Any wave whose report shows a failing heartbeat is a failed wave.

## 6. Tracer-bullet slices (prototype)

| # | Slice (thin end-to-end path) | AFK/HITL | Acceptance check (command) |
|---|---|---|---|
| 1 | **GPA calculator**: add/remove courses (name, credits 0.5–6 step 0.5, grade A…F); live GPA, earned credits, F warning; persists to localStorage; official grading scale shown inline. | AFK | `bun test src/domain/__tests__/gpa.test.ts` exits 0 (cases incl. all-F, empty list, 0.5-credit course, D earned-credit rule) |
| 2 | **CGPA planner**: inputs completedCredits + currentCgpa + planned courses w/ expected grades → projected CGPA; target-CGPA mode → required term GPA or "unreachable". | AFK | `bun test src/domain/__tests__/gpa.test.ts` exits 0 (hand-computed projection cases, unreachable >4.00 case, zero-credit guard) |
| 3 | **Fee breakdown**: program picker (all 17 seeded entries); enter term courses; toggles retake/waiver-ineligible; waiver % selector (0/25/50/custom); line-item breakdown + installments + degree-total panel (computed vs published side-by-side) + disclaimer. | AFK | `bun test src/domain/__tests__/fees.test.ts` exits 0 — **incl. parity: computed degree total === published full total for every seeded program**, retake-50% case, B.Pharm semester/lab case, installment-sums-exactly case |
| 4 | **Data & overrides page**: view grading scale, programs, policy notes with source URLs + access date; edit per-credit/term/lab fee per program (override → localStorage, "custom fees active" banner + Reset); "Reset all data" clears everything. | AFK | `make smoke` exits 0 and `git grep -n "uiu.ac.bd" src/data` shows source URLs for all three datasets |

Builder implements slices in order 1→4; the app must run and pass the heartbeat after each.

## 7. Wave ledger

| Wave | Role | Lens | Status | Report | Notes |
|---|---|---|---|---|---|
| W00 | Scaffolder | docs | prompt ready | `.orchestrator/reports/W00-scaffolder-docs.md` | Commits this plan, AGENTS.md, report template |
| W01 | Builder | full-stack prototype | planned | `.orchestrator/reports/W01-builder-prototype.md` | Slices 1–4 + heartbeat + README |
| W02 | Strict Reviewer | full-stack (read-only) | planned | `.orchestrator/reports/W02-reviewer-fullstack.md` | Attack checklist + math-parity re-verification |
| W03+ | Fixers | per triage | — | — | One lens per task, ordered data→backend→UI→UX→tests |
| W(n) | Re-reviewer | read-only | — | — | Verify fixed IDs, regression hunt, exit-criteria check |
| W(last) | Release engineer | DevOps/release | — | — | Vercel static deploy config + CI + clean-clone proof |

## 8. Exit criteria (before Release wave)

- [ ] `make smoke` passes from a clean clone (fresh `bun install`, no cache).
- [ ] Official-totals parity suite green: computed no-waiver degree total equals published total for **all 17 seeded programs** (raw test output in a report).
- [ ] All 4 slices WORKING with evidence (Builder 5B + Re-reviewer verification).
- [ ] Zero open Blocker or Critical findings.
- [ ] Zero open Major findings, or each explicitly deferred with a reason accepted by the human.
- [ ] Every money/GPA figure in the UI carries the disclaimer + official source link; seed data shows access date.
- [ ] README run/build/deploy commands verified by a reviewer running them verbatim.
- [ ] Re-review confirms all FIX-NOW items VERIFIED with fresh evidence.

## 9. Risks and open questions

**R1 — Published waiver-column anomaly (verified fact, not a bug in our math).** The official totals page's 50%/25% waiver columns do NOT equal the straightforward formula `(1−w)×credits×perCreditFee + terms×termFee + admission` for most UG programs (e.g. BBA 50%: formula 504,250 vs published 514,000; deltas of +1.5 or +3 credits' worth of fee depending on program; PG MSCSE matches, MSECO does not). The per-term formula IS officially documented ("Number of Credits Taken × Per Credit Fee + Trimester Fee", scholarship "Tuition fee only"). **Decision: compute per the documented formula; display published totals verbatim beside computed ones with a "may differ — see official policy" note. Do not reverse-engineer the delta.** A reviewer may investigate and report, but no wave may silently "fix" numbers to match.
- R2 — Fees vary by admission batch/year and "UIU reserves the right to change policies/fees without prior notice". Mitigation: seed data carries access date (2026-10-23) + source URLs; slice 4 fee overrides let any student match their own batch rates.
- R3 — Rounding policy (half-up, 2dp) may differ ±0.01 from the university's own system. Mitigation: disclaimer; tests pin our behaviour.
- R4 — Grading scale transcription error would poison everything. Mitigation: parity tests + reviewer re-checks `src/data` against the source URLs character-by-character.
- R5 — Vercel deploy is static-only; if any future feature needs a server, Bun-runtime Functions exist as an upgrade path (verified available), out of scope now.

**Open questions for the human (answer with plan approval):**
1. Repo name `uiu-calculator` (new, empty, GitHub) — OK?
2. Graduate programs included in the prototype (default: yes, already seeded above) — OK?
3. English-only UI (default: yes) — OK?

**Sources (accessed 2026-10-23):**
- Grading: https://www.uiu.ac.bd/academics/grading-performance-evaluation/
- Tuition & waivers table: https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/
- Scholarship/waiver policy: https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/
