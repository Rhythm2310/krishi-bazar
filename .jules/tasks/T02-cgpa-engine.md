# T02: Grading and Cgpa domain engine

Wave: 1 | Model: gemini pro 15 | Size: M | Mode: feature
Branch: `jules/T02-cgpa-engine` | PR title: `[T02] Grading and Cgpa domain engine`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U1, U2, U4 | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

When this is merged, the domain answers every grading question the Planner UI (T04) will ask: the TermGpa of any Course list with deduplication by CourseCode, and the Cgpa across SavedTerms plus the Planner — credit-weighted, F-aware (F counts in the average, earns no Credits), with Retake replacement (the latest Term's attempt for a CourseCode wins and the replaced codes are reported). All of it is pure TypeScript behind the frozen contract, tested at S1.

## Context pointers

Read these when the condition holds; each is a path, not a copy.
- Always: `GLOSSARY.md`; `.jules/spec.md` stories U1, U2, U4, seam S1, and the Implementation Decisions on grade math and the Retake rule.
- When touching the shared surface: `src/lib/domain/contracts.ts` and `src/lib/domain/data/grading-scale.ts` (read-only).
- Earlier work you build on: `.jules/reports/T01.md` — the grading tracer (`gradePoint`, `calculateTermGpa`, `assertCredits`) and its tests in `src/lib/domain/grading/grading.test.ts`. Extend them; never delete or weaken an existing test.

## Owned paths (write)

```
src/lib/domain/grading/**
src/lib/domain/cgpa/**
```

Also yours: `.jules/reports/T02.md`

## Read-only inputs

`src/lib/domain/contracts.ts`, `src/lib/domain/data/**`, everything else in the repo.

## Forbidden

- Any path not listed under Owned paths. Hot files: `package.json`, `package-lock.json`, `.github/workflows/**`, `static/**`. Contracts: everything listed in AGENTS.md 5.3 — including `contracts.ts` and `data/**`. If the contract cannot express something you need, file a request (AGENTS.md 5.7) and build behind it with what exists.
- New dependencies or version changes. Pre-installed set pinned in `.jules/deps.csv` (Vitest 5.0.3, TypeScript 6.0.3). No library beyond the Node standard library and what T01 installed.
- Editing `tests/e2e/**` (T04 owns it) or the frozen tracer page.

## Steps

Design-heavy task: the goals, rules and golden values are fixed; the internal file layout of your two modules is your judgment (skill `codebase-design`: deep modules, small surface — the barrels export exactly the contract functions, helpers stay internal unless a sibling module needs them).

Rules that must hold (from the spec):
- TermGpa and Cgpa = Σ(Credits × GradePoint) / Σ(Credits) at full precision; empty input → 0 with zero credits.
- EarnedCredits: only Courses graded D or higher (GradePoint > 0). F stays in the denominator.
- Retake replacement: normalize CourseCode (trim, collapse internal whitespace, case-insensitive); when a code appears more than once across the flattened Terms (in Term order, and within a Term in array order), only the LAST attempt counts; every replaced code is reported once in `replacedCodes` (normalized display form as entered by the last attempt).
- `calculateCgpa` may import from `$lib/domain/grading`; nothing else outside your modules.

1. Slice 1 (U2) at S1 — red first: add tests to `src/lib/domain/grading/grading.test.ts` for same-Term dedup: two entries with codes `cse 1101` and `CSE  1101` (whitespace/case variants) keep only the last attempt's grade. Capture the first-red line, then implement normalization + last-wins inside grading (export a small internal helper for cgpa reuse). Done when the new tests pass and all T01 tests still pass.
2. Slice 2 (U4) at S1 — red first: create `src/lib/domain/cgpa/` with `calculateCgpa` and its barrel; test the credit-weighted average across two Terms. Golden: Term1 [(3 cr, A), (3 cr, B+)] + Term2 [(2 cr, C), (3 cr, A-)] → cgpa = 37.00/11 ≈ 3.363636…, earnedCredits 11, totalCredits 11, replacedCodes []. Done when green.
3. Slice 3 (U2, U4) at S1 — red first: Retake replacement across Terms. Golden: Term1 has `CSE 1101` (3 cr, A) and `MAT 1109` (3 cr, B+); Term2 has `CSE 1101` (3 cr, B, isRetake) and `ENG 1103` (2 cr, A-). After replacement the surviving entries are MAT 1109 (3×3.33 = 9.99), CSE 1101 (3×3.00 = 9.00) and ENG 1103 (2×3.67 = 7.34): cgpa = 26.33/8 = 3.29125 (assert with `toBeCloseTo(3.29125, 10)`), earnedCredits 8, totalCredits 8, replacedCodes contains `CSE 1101`, and the earlier A attempt is gone from both numerator and denominator. Done when green.
4. Slice 4 (U1) at S1 — red first: F handling in Cgpa: an F Course counts in totalCredits and the denominator, earns nothing; EarnedCredits excludes it. Empty terms array → `{ cgpa: 0, earnedCredits: 0, totalCredits: 0, replacedCodes: [] }`. Done when green.
5. Slice 5 (robustness) at S1 — red first: validation propagates: invalid Credits inside any Term throw RangeError (reuse `assertCredits` from grading); a Course with an unknown LetterGrade (cast through a typed test helper, never by loosening types) throws RangeError from `gradePoint`. Done when green.
6. Refactor pass: both modules keep their barrels exporting exactly `gradePoint`, `calculateTermGpa` (grading) and `calculateCgpa` (cgpa), typed with the contract function types. `npm run check` and `npx vitest run src/lib/domain` exit 0.
7. Self-review pass (skill `code-review`): Spec against U1/U2/U4 and the spec's Retake rule; Standards against AGENTS.md and GLOSSARY.md (names like `replacedCodes`, `earnedCredits` — glossary words only). Fix hard findings; list leftovers.

## Acceptance criteria

Each line is checkable by a command.
1. `npx vitest run src/lib/domain/grading src/lib/domain/cgpa` exits 0 with at least 12 passing tests, including every golden value above (S1).
2. `npx vitest run src/lib/domain/grading/grading.test.ts -t "credit-weighted"` exits 0 — T01's original tests all still pass unmodified in intent (no deleted or weakened assertion; `git diff src/lib/domain/grading/grading.test.ts` shows only additions or clarifying renames of your own new tests).
3. Story U2 verified by the replacement tests at S1; U4 by the cross-Term cgpa tests; U1 by the F-handling and validation tests.
4. `npm run verify` passes and `python .jules/tools/slop_guard.py --strict` reports no ERROR and no WARN.
5. `git diff --name-only origin/integration/uiu-calculator...HEAD` shows only your owned paths plus `.jules/reports/T02.md`.

## Decision defaults

- Test file placement: colocated `<name>.test.ts` inside your module directories (Vitest include pattern is `src/**/*.test.ts`).
- Normalized code key: `code.trim().replace(/\s+/g, ' ').toUpperCase()`; report `replacedCodes` using the last attempt's raw (trimmed) code.
- Rounding stays out of the domain: return full-precision numbers; T04 formats.
- `readonly` input arrays in signatures (contract already declares them); never mutate inputs — build new arrays.
- Keep helper functions internal to your modules unless T03/T04 demonstrably need them; the barrels stay minimal.

## Fallbacks

- If a T01 test blocks a legitimate behaviour change: do not edit its assertions; extend with new tests and note the tension in your report and a request if the contract itself is at fault.
- If the contract lacks a type you believe you need: build with the existing types (they are sufficient for every rule above), file a request describing the gap, continue.
- If Vitest reports an environment problem: the config pins `environment: 'node'`; your tests must not need a DOM — keep the domain pure.

## Hand-off

Report at `.jules/reports/T02.md` (format in AGENTS.md section 10). Tell dependent tasks: the exact barrel exports of grading and cgpa, the normalization rule implemented, and any edge-case behaviour T04 must surface in the UI (e.g. replacedCodes display).
