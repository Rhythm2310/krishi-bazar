# T04: Planner UI with page flow tests

Wave: 2 | Model: gemini pro 15 | Size: L | Mode: integrate
Branch: `jules/T04-planner-ui` | PR title: `[T04] Planner UI with page flow tests`
Skills: domain-language; tdd; code-review; pr
Serves: U1, U2, U3, U4, U5, U6, U7, U8, U9 (panel notes) | Seams under test: S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

The app becomes the product: one Planner page where a Student picks a Program, adds/edits/removes Courses (CourseCode, optional title, Credits, expected LetterGrade, Retake flag), and immediately sees the TermGpa, the Cgpa across SavedTerms plus Planner (with the 2.00 degree indicator and replaced Courses named), the itemized FeeBreakdown with WaiverTier selector and FirstTerm toggle, and the PaymentSchedule. SavedTerms persist in the browser across reloads. Money and GPA render through a display-only format module. You replace T01's tracer page and smoke spec with the real flows.

## Context pointers

- Always: `GLOSSARY.md`; `.jules/spec.md` stories U1–U9 and the Money/Validation/UI decisions.
- When building the store: `docs/adr/0001-localstorage-only-state.md` — key name, versioning and `.bak` fallback are decided there and in AGENTS.md section 6.
- When showing replacement: `docs/adr/0002-retake-latest-wins.md`.
- Earlier work you build on: `.jules/reports/T01.md` (tokens in `src/app.css`, layout shell, contract exports), `.jules/reports/T02.md` and `.jules/reports/T03.md` (exact engine exports, error messages, FeeLine labels, isEstimate and firstTermNote semantics).

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

`src/lib/domain/**` (all three engines + contracts + data), `src/app.css` (consume tokens; never edit), `src/routes/+layout.svelte`, `src/routes/+layout.ts`.

## Forbidden

- Any path outside the owned list. Domain modules, data, contracts, configs, layout and hot files are read-only (AGENTS.md 5.2/5.3) — needs a change? File a request (5.7) and adapt inside your paths.
- New dependencies (AGENTS.md 5.5). No UI library: native form controls + tokens.
- `alert`/`confirm`/`prompt` dialogs; inline messages only. No `any` (strict lint + slop guard).
- Business math in components: every number on screen comes from a domain function; components only render and collect input.

## Steps

Integration work: the engines are merged and frozen — your judgment goes into composition, state and accessibility, not into math. Test-first at S2 where listed: write the failing page-flow spec, then the UI that greens it. One component per file under `src/lib/components/`; the store is one `.svelte.ts` module under `src/lib/stores/`.

1. **Slice 1 (U3) at S2 — persistence store, flow-first.** Spec: add nothing → save is disabled; plan one Course → save with label "Fall 2026" → list shows it → reload the page → the SavedTerm is still listed and Cgpa reflects it. Then build `stores/planner-state.svelte.ts`: `$state` for programId (default `'BSCSE'`), isFirstTerm (false), waiverTier (0), planner Courses, savedTerms; load from `uiu-calculator.state.v1` only when `browser` (from `$app/environment`); save on every mutation (debounce not needed); unparseable/wrong-version data → start empty and stash the raw string under `uiu-calculator.state.v1.bak`; ids via `crypto.randomUUID()`.
2. **Slice 2 (U1) at S2 — Course table + TermGpa.** Spec: add a Course `CSE 1101`, 3 Credits, grade A → the TermGpa panel reads `4.00`; add `CSE 1102`, 3 Credits, B → `3.50`; edit the second to A → `4.00`; remove it → back to `4.00` with one row. Build `CourseTable` (rows: code text input, optional title text, credits number input `step="0.5" min="0.5" max="12"`, grade `<select>` with all 11 LetterGrades, Retake checkbox, remove button; an "Add Course" button appends a row with defaults 3 Credits / grade A) and `TermGpaPanel` (calls `calculateTermGpa`; shows TermGpa 2-decimals, EarnedCredits, total Credits). Invalid credits (typed 3.3): block the action, show an inline message; the domain `RangeError` is caught at the boundary and shown inline — never a dialog, never a crash.
3. **Slice 3 (U4, U2) at S2 — Cgpa panel with replacement.** Spec: with a saved Term containing `CSE 1101` F (3 Credits) and a Planner containing `cse 1101` B+ (3 Credits, Retake checked) + `CSE 1102` A (3 Credits) → Cgpa reads `3.67` (3.665 displays 3.665.toFixed(2) — use `3.67` only if the format module's rounding yields it; otherwise assert the exact rendered string from your formatGpa implementation and say so in the report), the replaced code `CSE 1101` is named in the panel, and the degree indicator shows at-or-above 2.00. Build `CgpaPanel` (calls `calculateCgpa(savedTerms, plannerCourses)`; shows Cgpa 2-decimals, EarnedCredits, a clear below / at-or-above `DEGREE_REQUIREMENT_CGPA` indicator, and `replacedCodes` as "Replaced by retake: …" when non-empty).
4. **Slice 4 (U5, U6, U7) at S2 — FeeBreakdown panel.** Spec: Program BSCSE, 12 planned Credits (derive `creditsPlanned` from the Planner's Courses; `retakeCredits` from the Retake-checked ones), not FirstTerm, tier 0 → a line reading `84,500` total; toggle FirstTerm → `1,06,500` total with the CautionMoney line labelled refundable; check a 3-Credit Retake → a waiver line containing `9,750`; select WaiverTier 25 → the note `WAIVER_ESTIMATE_NOTE` text is visible. Build `ProgramSelect` (all 12 Programs by name), `FirstTermToggle`, `WaiverTierSelect` (0/25/50), `FeePanel` (calls `calculateFees`; renders every FeeLine label + amount, negatives with a leading minus, refundable badge, `isEstimate` note, total emphasized).
5. **Slice 5 (U8) at S2 — PaymentSchedule panel.** Spec: same BSCSE 12-Credit state → pre-registration `20,000` and installments `25,800`, `19,350`, `19,350`; switch Program to B.Pharm → four installments; toggle FirstTerm → the firstTermNote text appears. Build `PaymentSchedulePanel` (calls `calculatePaymentSchedule`).
6. **Slice 6 (U9) — result-area notes.** Each result panel carries a one-line pointer: EffectiveDate + "verify with UIU before paying" (import both from the data module; the footer already renders them). Assert in one of the specs that the fee panel area contains `2026-10-23`.
7. **Format module** `src/lib/format/`: `formatTaka(n)` → `Tk ` + `Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })`; `formatGpa(n)` → `n.toFixed(2)`. Unit-testable through the S2 flows; add a colocated vitest only if a rule needs pinning (then note it: vitest in `src/lib/format/` is inside your owned paths and allowed as a secondary seam under AGENTS.md 6).
8. **Replace the tracer.** Delete T01's hardcoded page content (you own `+page.svelte`) and replace `tests/e2e/smoke.spec.ts` with a spec that boots the real Planner (heading, empty-state TermGpa `0.00`, footer EffectiveDate). Keep the file name or rename within `tests/e2e/` — your call, CI runs the whole folder.
9. **Accessibility + error pass.** Every input has a bound `<label>`; result panels sit in `aria-live="polite"` regions; keyboard-only flow works through slices 2–5 (Playwright's default interactions already prove clickability; add one `keyboard`-driven assertion). Domain RangeErrors surface as inline text next to the offending control.
10. **Self-review pass** (skill `code-review`): Spec axis against Objective + U1–U9, then Standards (tokens only — no hardcoded colors/spacings; runes only; glossary words in every label and test name).

## Acceptance criteria

1. `npx playwright test tests/e2e` exits 0 with at least six spec files or six clearly named tests covering slices 1–6.
2. `npm run verify` exits 0 (unit suites of T01–T03 stay green; production build succeeds).
3. Golden display values pinned in specs: total `84,500` (BSCSE 12cr tier 0), FirstTerm total `1,06,500`, retake waiver `9,750`, schedule `20,000` / `25,800` / `19,350` / `19,350` — assert on the digit-grouping substrings, not on sign glyphs.
4. Reload persistence proven by a spec that saves a Term, calls `page.reload()`, and finds the label and Cgpa contribution.
5. `python .jules/tools/slop_guard.py --strict` reports no ERROR.
6. `git diff --name-only origin/main...HEAD` lists only owned paths plus `.jules/reports/T04.md`.

## Decision defaults

- Component list is a default, not a mandate: merge or split components as the deletion test suggests; keep one component per file.
- Display rounding: `formatGpa` is `toFixed(2)` — choose spec grade combinations with exactly representable results (e.g. 3cr A + 3cr B → `3.50`) so specs never depend on float-rounding edge cases; for Cgpa `3.665` assert the exact string your `formatGpa` produces.
- `creditsPlanned` = sum of Planner Credits; `retakeCredits` = sum of Credits of Retake-checked Courses. Empty Planner → fee panel shows TermFee/LabFee (+FirstTerm charges) with 0 tuition — no crash.
- Save action: inline text input for the label (prefilled `Term <n>`), not `prompt()`.
- Empty states: TermGpa `0.00`, Cgpa = Planner-only value, fee panel renders fixed charges; SavedTerms list shows "No saved terms yet".
- Styling: tokens from `src/app.css` only; simple two-column layout on wide screens, single column on narrow (CSS grid/flex, no framework).

## Fallbacks

- If a domain engine behaves contrary to its report/spec golden: do not patch the engine — file `.jules/requests/T04-<slug>.md`, adapt at the boundary if safe, mark the affected criterion `[PARTIAL]`.
- If Chromium cannot install in your VM: retry `npx playwright install --with-deps chromium`; if still failing, ship unit-green code with specs written but unrun, mark `[PARTIAL]`, record the error (CI runs them for real).

## Hand-off

Report at `.jules/reports/T04.md`. Tell T06: which specs cover which U ids, the component inventory, where the store's version key and `.bak` fallback live, and any boundary adaptations you made.
