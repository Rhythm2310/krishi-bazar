# T04: Planner UI with page-flow tests

Wave: 2 | Model: gemini pro 15 | Size: L | Mode: integrate
Branch: `jules/T04-planner-ui` | PR title: `[T04] Planner UI with page flow tests`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U1, U2, U3, U4, U5, U6, U7, U8, U9 | Seams under test: S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

When this is merged, a Student opens the app and does the whole job: pick a Program, enter Courses in the Planner (code, title, Credits, LetterGrade, Retake flag), watch the TermGpa and EarnedCredits update live, save the Term with a label, rename or delete SavedTerms, see the Cgpa across everything with the degree-requirement 2.00 indicator, see the itemized FeeBreakdown in Taka with FirstTerm and WaiverTier controls, see the PaymentSchedule with its Installments, and find all of it still there after a reload. The tracer page and smoke spec from T01 are replaced by the real Planner. Every flow is proven at S2 with golden Taka values.

## Context pointers

Read these when the condition holds; each is a path, not a copy.
- Always: `GLOSSARY.md`; `.jules/spec.md` stories U1–U9, seam S2, and the Implementation Decisions (money formatting, validation, state shape).
- When touching state or persistence: `docs/adr/0001-localstorage-only-state.md` and AGENTS.md section 6 defaults (storage key `uiu-calculator.state.v1`, SSR safety, backup-on-corrupt).
- Earlier work you build on: `.jules/reports/T01.md` (tokens in `src/app.css`, frozen layout, tracer page and smoke spec you will replace, `data-testid` convention), `.jules/reports/T02.md` (grading/cgpa barrels, `replacedCodes` to surface), `.jules/reports/T03.md` (fees barrel, FeeLine labels to display verbatim, WaiverTier estimate caveat to surface).

## Owned paths (write)

```
src/routes/+page.svelte
src/lib/components/**
src/lib/stores/**
src/lib/format/**
tests/e2e/**
```

Also yours: `.jules/reports/T04.md`

## Read-only inputs

`src/lib/domain/**` (call the barrels: `$lib/domain/grading`, `$lib/domain/cgpa`, `$lib/domain/fees`, plus `contracts.ts` types and `data/programs.ts` for the Program selector — via `listPrograms()`), `src/app.css` (tokens), `src/routes/+layout.svelte` (frozen shell; the footer already carries the U9 disclaimer), configs.

## Forbidden

- Any path not listed under Owned paths. Hot files: `package.json`, `package-lock.json`, `.github/workflows/**`, `static/**`. Contracts (AGENTS.md 5.3): `src/app.css`, `src/app.html`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/lib/domain/contracts.ts`, `src/lib/domain/data/**`, all configs. Need a token or contract change? File a request (5.7) and work with what exists.
- New dependencies or version changes (Playwright 1.64.0, Svelte 5.57.2 runes — pinned in `.jules/deps.csv`; use the pinned versions' APIs).
- Recomputing domain math in the UI: panels call domain functions; the UI never multiplies a fee or averages a grade itself.

## Steps

Design-heavy task: the flows, golden values and constraints are fixed; component decomposition is your judgment (skill `codebase-design`). Constraints: one component per file under `src/lib/components/`; state in one `.svelte.ts` module under `src/lib/stores/` using runes (`$state`, exported functions; no legacy `svelte:store`); formatting only in `src/lib/format/` (`formatTaka` with en-IN grouping and up to 2 decimals — `Tk 1,26,000`; `formatGpa` with exactly 2 decimals); localStorage touched only behind a `browser` guard (`$app/environment`) or in `onMount`; every input has a `<label>`; result panels use `aria-live="polite"` and `data-testid` hooks.

Write each e2e spec FIRST (red at S2 against the tracer page), then build the UI to green. Golden values come from T03's tested formulas — assert them verbatim.

1. Slice 1 (U1) at S2 — red first: spec `tests/e2e/planner.spec.ts`: goto `/`, Program selector shows 12 Programs (default BSCSE), add two Courses (`CSE 1101`, 3 cr, `A`; `MAT 1109`, 2 cr, `B+`), expect the TermGpa panel to show `3.73` (golden: (3×4.00 + 2×3.33)/5 = 18.66/5 = 3.732, displayed with 2 decimals) and EarnedCredits `5`; edit a grade and see the panel update; remove a row and see it update. Green when the Planner page implements it.
2. Slice 2 (U3, U4) at S2 — red first: save the Planner as a SavedTerm labelled `Fall 2026`, add a new Course to the fresh Planner, see the Cgpa panel combine both; reload the page — SavedTerm and Cgpa persist; rename and delete a SavedTerm — Cgpa updates. Golden: assert the Cgpa string against the domain-computed value for the entered data (derive it in-test via an import of `calculateCgpa` — Playwright specs may import from `src/lib/domain` for expectations only). Below-2.00 data must show the degree-requirement warning; at-or-above shows the ok state.
3. Slice 3 (U2) at S2 — red first: Retake flow: SavedTerm contains `CSE 1101` (3 cr, `F`); in the Planner add `CSE 1101` (3 cr, `B`, Retake checked) — the Cgpa panel shows the replacement (report T02's `replacedCodes` surfaced, e.g. a `Retake replaced: CSE 1101` note) and the fee panel shows the RetakeWaiver line `−Tk 9,750`.
4. Slice 4 (U5, U6, U9) at S2 — red first: fee panel goldens: BSCSE, 15 planned credits entered as three 5-credit rows (the fee panel derives Credits and Retake Credits from the Planner's Courses — there is no separate credits input), FirstTerm ON, tier 0 → lines `Tk 97,500` tuition, `Tk 6,500` TermFee, `Tk 20,000` AdmissionFee, `Tk 2,000` CautionMoney, total `Tk 1,26,000`, refundable note `Tk 2,000`; the panel shows the EffectiveDate and the estimate disclaimer (U9).
5. Slice 5 (U7) at S2 — red first: FirstTerm OFF, WaiverTier 50% → tierWaiver line `−Tk 48,750`, total `Tk 55,250`, and a visible `conditions apply` note beside the selector.
6. Slice 6 (U8) at S2 — red first: PaymentSchedule panel for the slice-4 state: PreRegistrationPayment `Tk 20,000`, Installments `Tk 33,600 / Tk 25,200 / Tk 25,200`, and the FirstTerm note that the AdmissionFee counts as the PreRegistrationPayment.
7. Absorb the tracer: replace `src/routes/+page.svelte` fully; delete or rewrite `tests/e2e/smoke.spec.ts` so the suite has no dead references to tracer markup (the U9 footer assertions move into `planner.spec.ts`).
8. Robustness pass: invalid Credits input (e.g. cleared field) shows an inline validation message and never crashes the panels (domain RangeError caught at the boundary); empty Planner renders `0.00` zeros, no NaN anywhere (`expect(page.content()).not.toContain('NaN')`).
9. Self-review pass (skill `code-review`): Spec against U1–U9; Standards against AGENTS.md (runes-only, tokens-only, glossary words in every label and testid) and GLOSSARY.md. Fix hard findings; list leftovers.

## Acceptance criteria

Each line is checkable by a command.
1. `npx playwright test` exits 0 with every slice above as a named test; goldens asserted verbatim: `Tk 1,26,000`, `Tk 55,250`, `Tk 9,750` (RetakeWaiver), `Tk 33,600`, `Tk 25,200`, `Tk 20,000`, `Tk 2,000`, `Tk 97,500`, `Tk 6,500`, `Tk 48,750` (S2).
2. Persistence: a test reloads the page and asserts a SavedTerm survives; corrupt-storage handling (seed `uiu-calculator.state.v1` with garbage via `page.addInitScript`) starts empty without crashing.
3. Accessibility: every control is reachable by `getByLabel` in the specs (no bare CSS-only locators for form fields).
4. `npm run verify` passes and `python .jules/tools/slop_guard.py --strict` reports no ERROR and no WARN.
5. `git diff --name-only origin/integration/uiu-calculator...HEAD` shows only your owned paths plus `.jules/reports/T04.md`.

## Decision defaults

- Component split suggestion (adjust as you see fit): `ProgramControls.svelte` (Program select, FirstTerm toggle, WaiverTier select), `CourseTable.svelte` + `CourseRow.svelte`, `GpaPanel.svelte` (TermGpa), `CgpaPanel.svelte` (Cgpa + 2.00 indicator + replacedCodes note), `FeesPanel.svelte` (FeeBreakdown lines + total + refundable + disclaimer), `PaymentSchedulePanel.svelte`, `SavedTermsList.svelte`.
- Credits for fees come from the Planner's Courses (sum of Credits; sum of Retake-flagged Credits) — no separate credits input.
- Program select lists `listPrograms()` names; value is the ProgramId.
- `data-testid` values: `program-select`, `first-term-toggle`, `waiver-tier-select`, `add-course`, `course-row-<n>`, `save-term`, `saved-terms`, `term-gpa`, `cgpa`, `fee-total`, `fee-lines`, `payment-schedule`.
- Delete the T01 tracer page content entirely; keep the page's `<h2>` as `Trimester Planner` only when the Program is trimester-based — otherwise `Semester Planner` (derive from the selected Program's TermSystem via `getProgram`).
- Never render raw floats: all money through `formatTaka`, all GPAs through `formatGpa`.

## Fallbacks

- If a T02/T03 barrel export is missing or misbehaves: do not edit their modules — file a request, stub the value in the UI layer behind a clearly named adapter inside your paths, mark `[PARTIAL]`, and note it in the report.
- If Playwright cannot install browsers in the VM: commit the specs, verify the rest (`npm run lint && npm run check && npm run test:unit && npm run build`), mark acceptance 1 as the gap with `[PARTIAL]` in the PR title — CI runs S2 on the PR.
- If a golden string disagrees with the domain output: the domain (S1-tested) is authoritative — fix the spec's expectation to the domain-verified value and note it in the report; never edit domain modules.

## Hand-off

Report at `.jules/reports/T04.md` (format in AGENTS.md section 10). Tell dependent tasks: final component inventory, testid map, storage key and shape as shipped, and anything T06 (review) should look at closely (e.g. where you caught RangeErrors, how replacedCodes surfaced).
