# T03: Fee engine domain module

Wave: 1 | Model: gemini pro 15 | Size: M | Mode: feature
Branch: `jules/T03-fee-engine` | PR title: `[T03] Fee engine domain module`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U2 (RetakeWaiver math), U5, U6, U7, U8 | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

The fees module becomes deep: behind the frozen contract, one pure function turns a FeeInput into an itemized FeeBreakdown in exact Taka (tuition gross, first-time 50% RetakeWaiver, WaiverTier reduction on non-Retake Credits only, TermFee, LabFee, FirstTerm one-time charges with the refundable CautionMoney separated), a second derives the official PaymentSchedule, and a third computes whole-degree ProgramTotals that reproduce all 12 official published tier-0 totals exactly. Nothing here touches the UI — T04 consumes these functions.

## Context pointers

- Always: `GLOSSARY.md` (FeeBreakdown, FeeLine, PerCreditFee, TermFee, LabFee, AdmissionFee, CautionMoney, FirstTerm, WaiverTier, RetakeWaiver, PaymentSchedule, PreRegistrationPayment, Installment, Taka); `.jules/spec.md` stories U2, U5–U8 and the Fee math / PaymentSchedule / Money decisions.
- Earlier work you build on: `.jules/reports/T01.md`, `src/lib/domain/contracts.ts`, `src/lib/domain/data/programs.ts` (incl. `PUBLISHED_PROGRAM_TOTALS_TIER_0`), `src/lib/domain/data/fee-rules.ts`.

## Owned paths (write)

```
src/lib/domain/fees/**
```
Also yours: `.jules/reports/T03.md`

## Read-only inputs

`src/lib/domain/contracts.ts`, `src/lib/domain/data/**`.

## Forbidden

- Any path outside `src/lib/domain/fees/**`. No UI, no config edits, no new dependencies (AGENTS.md 5.5).
- Editing `contracts.ts` or the data modules: file a request (5.7) instead; code against a local adapter type meanwhile.
- Hardcoding any fee constant that lives in `data/fee-rules.ts` or `data/programs.ts`.

## Steps

Design-heavy: the formulas below are binding (they come from the official pages and were validated against all 12 published totals on 2026-10-23). Structure the module as you see fit (barrel `index.ts`, colocated `<name>.test.ts`). Write each slice test-first, record first-red lines.

Binding formulas (money is exact Taka; halves occur at the 5,525 rate; never round mid-computation):

- `tuitionGross = creditsPlanned × perCreditFee`
- `retakeWaiver = retakeCredits × perCreditFee × 0.5` (first retake only — the flag semantics are the UI's job; the engine trusts the numbers)
- `tierWaiver = (creditsPlanned − retakeCredits) × perCreditFee × waiverTier/100` (official rule: waivers never apply to Retake credits, TermFee, LabFee or one-time charges)
- `tuitionNet = tuitionGross − retakeWaiver − tierWaiver`
- `totalDue = tuitionNet + termFee + labFee + (isFirstTerm ? ADMISSION_FEE + CAUTION_MONEY : 0)` where `termFee` is the Program's TermSystem fee and `labFee` the Program's `labFeePerTerm`
- `refundable = isFirstTerm ? CAUTION_MONEY : 0`
- `PaymentSchedule`: `preRegistration = PRE_REGISTRATION_PAYMENT`; `remaining = max(0, tuitionNet + termFee + labFee − preRegistration)`; split by the TermSystem's fractions (Trimester 40/30/30; Semester 4×25%); each installment amount rounded to 2 decimals with the remainder added to the last installment so the parts sum exactly to `remaining`; `firstTermNote` non-null only when `isFirstTerm`, stating the AdmissionFee counts as that Term's PreRegistrationPayment (no double charge).
- `calculateProgramTotal(programId, tier) = totalCredits × perCreditFee × (1 − tier/100) + termsTotal × (termFee + labFeePerTerm) + ADMISSION_FEE`. At tier 0 this equals `PUBLISHED_PROGRAM_TOTALS_TIER_0` exactly for all 12 Programs. CautionMoney is refundable and NOT part of program totals (matches the official table).
- `FeeBreakdown.lines`: one FeeLine per non-zero component, in order tuition-gross, retake-waiver (negative amount), tier-waiver (negative amount, only when tier > 0), term-fee, lab-fee (only when > 0), admission-fee (FirstTerm, label says non-refundable), caution-money (FirstTerm, `refundable: true`); `isEstimate = waiverTier !== 0 || retakeWaiver > 0`.

Slices:

1. **Slice 1 (U5) at S1 — base breakdown.** BSCSE, 12 Credits, no retake, not FirstTerm, tier 0 → lines tuition-gross 78000 + term-fee 6500; totalDue 84500; refundable 0; isEstimate false. A 5,525-Program golden (BA-ENG, 9.5 Credits → tuition 52,487.5 — halves are exact).
2. **Slice 2 (U6) at S1 — FirstTerm.** Same input with `isFirstTerm: true` → adds admission-fee 20000 and caution-money 2000 (`refundable: true`); totalDue 106500; refundable 2000.
3. **Slice 3 (U2) at S1 — RetakeWaiver.** BSCSE 12 Credits with 3 retakeCredits → retake-waiver line −9750; totalDue 74750 + term fee math consistent with the formulas; isEstimate true.
4. **Slice 4 (U7) at S1 — WaiverTier.** BSCSE 12 Credits, 3 retakeCredits, tier 25 → tierWaiver applies to the 9 non-retake Credits only (−14625); retake credits never discounted twice; isEstimate true. Tier 50 variant.
5. **Slice 5 (U8) at S1 — PaymentSchedule.** (a) Trimester, remaining 64500 → 25800 / 19350 / 19350 (sum exact). (b) A halves case (BA-ENG) proving the remainder lands on the last installment and the sum equals `remaining` exactly. (c) Semester Program (BPHARM) → 4 equal fractions. (d) `remaining = 0` edge (tiny plan) → installments all 0, sum 0. (e) FirstTerm → note present and mentions the AdmissionFee; non-FirstTerm → note null.
6. **Slice 6 (U5) at S1 — Programs API.** `listPrograms()` returns all 12 rows frozen-equal to the data table; `getProgram('BSC-CIVIL')` → 151.5 Credits; unknown id at runtime → `RangeError`.
7. **Slice 7 (U5) at S1 — published-total goldens.** For every one of the 12 ProgramIds: `calculateProgramTotal(id, 0).total === PUBLISHED_PROGRAM_TOTALS_TIER_0[id]` (a `describe.each` over the table). This is the regression anchor for all fee math.
8. **Slice 8 — validation.** `RangeError` (one-line message naming the rule) for: unknown ProgramId; `creditsPlanned` negative or not a multiple of 0.5; `retakeCredits` negative, not a multiple of 0.5, or greater than `creditsPlanned`; a `waiverTier` outside 0/25/50 at runtime.
9. **Self-review pass** (skill `code-review`): Spec then Standards.

## Acceptance criteria

1. `npx vitest run src/lib/domain/fees` exits 0; every slice has at least one named test; slice 7 asserts all 12 published totals.
2. Stories U5–U8 verified by the goldens above at S1; U2's fee half by slice 3.
3. `npm run verify` exits 0 and `python .jules/tools/slop_guard.py --strict` reports no ERROR.
4. `git diff --name-only origin/main...HEAD` lists only `src/lib/domain/fees/**` and `.jules/reports/T03.md`.

## Decision defaults

- Amounts are JS numbers in exact Taka; these magnitudes (≤ ~1.2M, halves) are exactly representable — do not introduce a decimal library or cents-scaling (no new dependencies anyway).
- FeeLine labels: glossary words, English, e.g. `Tuition (12.0 credits × Tk 6,500)`; waiver lines start with a minus sign in `amount` and read `Retake waiver (50%, first time)` / `Waiver (25%) — estimate`.
- `fraction` on an Installment is the official ratio (0.4/0.3/0.3 or 0.25), `index` is 1-based.
- Rounding of installment splits: round each to 2 decimals, compute the last as `remaining − sum(others)`.
- Zero-amount optional lines (lab fee 0, tier 0) are omitted from `lines`; the numeric fields stay authoritative.

## Fallbacks

- If a data-module value seems wrong (e.g. a published total mismatch): do not edit data; write the test against the official value, file `.jules/requests/T03-data-<slug>.md` with the source URL, mark `[PARTIAL]` if it blocks a criterion.
- If T01's contracts lack a field you need: local adapter type inside your paths + request; never edit `contracts.ts`.

## Hand-off

Report at `.jules/reports/T03.md`. Tell T04: exported names, FeeLine ordering and label style, when `isEstimate` is true and what the UI must say (WAIVER_ESTIMATE_NOTE), the `firstTermNote` text; tell T06: where the 12 published-total goldens live.
