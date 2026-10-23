# T02: Grading and Cgpa domain engine

Wave: 1 | Model: gemini pro 15 | Size: M | Mode: feature
Branch: `jules/T02-cgpa-engine` | PR title: `[T02] Grading and Cgpa domain engine`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U1, U2 (Cgpa rule), U4 | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

The grading and cgpa modules become deep: behind the frozen contract, a Student's Courses produce exactly correct TermGpa and Cgpa numbers with hardened validation, and a Retake visibly replaces the earlier attempt of the same CourseCode in the Cgpa (latest Term wins) with the replaced CourseCodes reported. T01 landed a thin tracer in `grading/`; you own and deepen it. Nothing here touches the UI — T04 consumes these functions.

## Context pointers

- Always: `GLOSSARY.md` (TermGpa, Cgpa, EarnedCredits, Retake, SavedTerm, Planner); `.jules/spec.md` stories U1, U2, U4 and the Grade math + Retake rule decisions.
- When implementing replacement: `docs/adr/0002-retake-latest-wins.md` — it is the authority on ordering and normalization.
- Earlier work you build on: `.jules/reports/T01.md` (exported symbols, tracer behaviour you must keep green), `src/lib/domain/contracts.ts`, `src/lib/domain/data/grading-scale.ts`.

## Owned paths (write)

```
src/lib/domain/grading/**
src/lib/domain/cgpa/**
```
Also yours: `.jules/reports/T02.md`

## Read-only inputs

`src/lib/domain/contracts.ts`, `src/lib/domain/data/**`, T01's tracer tests in `grading/` (extend them; the existing golden assertions stay green).

## Forbidden

- Any path outside the two owned directories. No UI, no stores, no config edits, no new dependencies (AGENTS.md 5.5).
- Editing `contracts.ts` or the data modules: if a shape is wrong, file a request (5.7) and code against a local adapter type inside your paths meanwhile.
- Weakening or deleting T01's tracer tests.

## Steps

Design-heavy: the rules below are binding; structure the modules as you see fit (one barrel `index.ts` per module, colocated `<name>.test.ts` files). Write each slice test-first (red → green), one behaviour per slice, and record the first-red line of every slice in the report.

1. **Slice 1 (U1) at S1 — gradePoint completeness.** `gradePoint` returns the exact published value for all 11 LetterGrades (golden table from `data/grading-scale.ts`), and throws `RangeError` with a one-line message for any other runtime input.
2. **Slice 2 (U1) at S1 — TermGpa hardening.** Keep T01's goldens green; add: Credits validation (`RangeError` unless a positive multiple of 0.5 and ≤ 12 per Course), duplicate-id Courses are allowed (no opinion), full precision (no rounding anywhere in the domain), empty-input zeros. EarnedCredits count only Grades D or higher.
3. **Slice 3 (U4) at S1 — Cgpa aggregation.** `calculateCgpa(savedTerms, planner)` is the credit-weighted average over all attempts of all SavedTerms (in stored order) followed by the Planner's Courses (the Planner always counts as the latest Term), after replacement (slice 4). Returns cgpa, earnedCredits, totalCredits, replacedCodes, and `meetsDegreeRequirement = cgpa >= DEGREE_REQUIREMENT_CGPA`. Empty everything → zeros, `meetsDegreeRequirement: false`, never NaN.
4. **Slice 4 (U2) at S1 — Retake replacement (ADR 0002).** `normalizeCourseCode`: trim, collapse inner whitespace runs to one space, uppercase. Deduplicate by normalized code across the flattened attempt order; the latest attempt wins; every displaced code appears once in `replacedCodes` (normalized form, in displacement order). A Course whose code appears only once is never "replaced". Case/spacing variants of one code (`cse 1101`, `CSE  1101`) are one Course. Golden example: SavedTerm 1 has CSE 1101 (3cr, F), SavedTerm 2 has CSE 1101 (3cr, B+) and CSE 1102 (3cr, A) → cgpa = (3×3.33 + 3×4.00)/6 = 3.665, replacedCodes `['CSE 1101']`, earnedCredits 6.
5. **Slice 5 (U4) at S1 — the `isRetake` flag is irrelevant to Cgpa.** Replacement keys off the CourseCode alone; a flagged Retake of a code never seen before replaces nothing. Pin this with a test so nobody "fixes" it later.
6. **Self-review pass** (skill `code-review`): Spec axis against Objective + slices + stories, then Standards axis (AGENTS.md conventions, glossary naming, no `any`).

## Acceptance criteria

1. `npx vitest run src/lib/domain/grading src/lib/domain/cgpa` exits 0; every slice above has at least one named test.
2. T01's original tracer assertions still pass unchanged (`npx vitest run src/lib/domain/grading/term-gpa.test.ts`).
3. Story U2 verified by the replacement goldens at S1; U4 by the aggregation + degree-requirement tests; U1 by gradePoint/TermGpa hardening.
4. `npm run verify` exits 0 and `python .jules/tools/slop_guard.py --strict` reports no ERROR.
5. `git diff --name-only origin/main...HEAD` lists only `src/lib/domain/grading/**`, `src/lib/domain/cgpa/**`, `.jules/reports/T02.md`.

## Decision defaults

- `RangeError` messages: one line, name the broken rule and the offending value, e.g. `Credits must be a positive multiple of 0.5 up to 12 (got 3.3)`.
- Rounding: none in the domain. Full precision out; display rounding is T04's format module.
- `replacedCodes` contains normalized codes, deduplicated, in displacement order.
- Test data uses real UIU-shaped codes (`CSE 1101`) and glossary words in test names.
- Do not export helpers beyond the contract unless a test needs them; keep the barrel surface minimal (deletion test).

## Fallbacks

- If T01's report or code is missing something you need (e.g. the grading barrel shape): stub the minimal piece behind the contract interface inside your paths, note it in the report, continue.
- If a contract shape genuinely blocks a behaviour above: file `.jules/requests/T02-contract-<slug>.md`, implement the closest conforming behaviour, mark the criterion `[PARTIAL]` if it stays unmet.

## Hand-off

Report at `.jules/reports/T02.md`. Tell T04: the exact exported function names and result shapes (including `replacedCodes` semantics and ordering), which errors can reach the UI and their message style; tell T06: where the ADR-0002 goldens live.
