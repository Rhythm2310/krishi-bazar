# T03: Fee engine domain module

Wave: 1 | Model: gemini pro 15 | Size: M | Mode: feature
Branch: `jules/T03-fee-engine` | PR title: `[T03] Fee engine domain module`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U2, U5, U6, U7, U8 | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

When this is merged, the domain answers every money question the Planner UI (T04) will ask, in exact Taka: the itemized FeeBreakdown for a (Program, planned Credits, Retake Credits, FirstTerm, WaiverTier) combination; the PaymentSchedule with the official Tk 20,000 PreRegistrationPayment and 40/30/30 (Trimester) or 4×25% (Semester) Installments; the whole-degree ProgramTotal whose tier-0 values equal UIU's officially published totals; and Program lookup. All pure TypeScript behind the frozen contract, tested at S1 against golden values.

## Context pointers

Read these when the condition holds; each is a path, not a copy.
- Always: `GLOSSARY.md`; `.jules/spec.md` stories U2, U5–U8, seam S1, and the Implementation Decisions on fee math, the PaymentSchedule and the whole-degree total.
- When touching the shared surface: `src/lib/domain/contracts.ts`, `src/lib/domain/data/programs.ts`, `src/lib/domain/data/fee-rules.ts` (read-only — every constant you need is in `FEE_RULES` and `PROGRAMS`; never hardcode a number that lives there).
- Earlier work you build on: `.jules/reports/T01.md` — validation style (RangeError one-liners) from the grading tracer.

## Owned paths (write)

```
src/lib/domain/fees/**
```

Also yours: `.jules/reports/T03.md`

## Read-only inputs

`src/lib/domain/contracts.ts`, `src/lib/domain/data/**`, everything else in the repo.

## Forbidden

- Any path not listed under Owned paths. Hot files: `package.json`, `package-lock.json`, `.github/workflows/**`, `static/**`. Contracts: everything in AGENTS.md 5.3, including `contracts.ts` and `data/**`. Contract insufficient? File a request (5.7) and build with what exists.
- New dependencies or version changes. Pre-installed set pinned in `.jules/deps.csv` (Vitest 5.0.3, TypeScript 6.0.3). Node standard library only.
- Editing `src/lib/domain/grading/**` or `src/lib/domain/cgpa/**` (T02 owns them this wave — you run concurrently; touching them guarantees a collision).

## Steps

Design-heavy task: formulas, golden values and error messages are fixed; internal file layout is your judgment (deep module, barrel exports exactly the five contract functions).

Formulas that must hold (spec Implementation Decisions; constants from `FEE_RULES`):

- `calculateFees(input)`:
  - tuitionGross = creditsPlanned × perCreditFee
  - retakeWaiver = retakeCredits × perCreditFee × retakeWaiverFraction
  - tierWaiver = (creditsPlanned − retakeCredits) × perCreditFee × (waiverTier / 100)
  - tuitionNet = tuitionGross − retakeWaiver − tierWaiver
  - termFee = trimesterFee or semesterFee by the Program's TermSystem; labFee = the Program's labFeePerTerm
  - admissionFee = isFirstTerm ? FEE_RULES.admissionFee : 0; caution = isFirstTerm ? FEE_RULES.cautionMoney : 0
  - totalDue = tuitionNet + termFee + labFee + admissionFee + caution; refundable = caution
  - lines: one FeeLine per non-zero component, waivers as negative amounts, kinds from the contract union, labels in glossary words (e.g. `Tuition (15 credits × Tk 6,500)`, `RetakeWaiver (first retake, 50% of 3 credits)`, `WaiverTier 50% (estimate — conditions apply)`, `TermFee (Trimester)`, `LabFee`, `AdmissionFee (one-time)`, `CautionMoney (refundable)`).
  - validation (RangeError, one-line messages): creditsPlanned ≥ 0 and a multiple of 0.5; 0 ≤ retakeCredits ≤ creditsPlanned and a multiple of 0.5; waiverTier ∈ {0, 25, 50}; programId known.
- `calculatePaymentSchedule(programId, recurringDue, isFirstTerm)`:
  - preRegistration = FEE_RULES.preRegistrationPayment; remaining = max(0, recurringDue − preRegistration)
  - plan = installmentPlanTrimester or installmentPlanSemester by TermSystem; each Installment = remaining × percent/100 rounded to 2 decimals; the LAST Installment absorbs the rounding remainder so the sum equals remaining exactly; remaining = 0 → empty installments and note `PreRegistrationPayment covers this Term's dues.`
  - labels: `Installment 1 (40%)` etc.; note for isFirstTerm: `The AdmissionFee (Tk 20,000) paid at admission counts as this Term's PreRegistrationPayment.` else `Pay Tk 20,000 before course registration; the rest in Installments.`
- `calculateProgramTotal(programId, waiverTier)`: tuitionTotal = totalCredits × perCreditFee × (1 − tier/100); termFeesTotal = termsTotal × termFee; labFeesTotal = termsTotal × labFeePerTerm; admissionFee = FEE_RULES.admissionFee; total = the sum. Tier 0 must equal the official published totals.
- `listPrograms()` returns the frozen table; `getProgram(id)` throws RangeError on an unknown id.

1. Slice 1 (U5) at S1 — red first: create `src/lib/domain/fees/` with barrel; test the plain trimester breakdown. Golden: BSCSE, 15 credits, no retake, not FirstTerm, tier 0 → tuitionGross 97500, termFee 6500, labFee 0, totalDue 104000, refundable 0, lines contain kinds tuition-gross and term-fee. Capture the first-red line. Done when green.
2. Slice 2 (U6) at S1 — red first: FirstTerm adds AdmissionFee 20000 and CautionMoney 2000. Golden: BSCSE 15 credits FirstTerm tier 0 → totalDue 126000, refundable 2000, lines include admission-fee and caution-money. Done when green.
3. Slice 3 (U5) at S1 — red first: TermSystem and LabFee variants. Goldens: B.Pharm 18 credits not-first tier 0 → termFee 9750, labFee 5000, totalDue 18×6500 + 14750 = 131750; BSBGE 12 credits → labFee 2000 line present; BA English 10 credits → tuitionGross 55250 (PerCreditFee 5525, produces halves: e.g. 5525 × 9.5 = 52487.5 — assert the exact decimal). Done when green.
4. Slice 4 (U7) at S1 — red first: WaiverTier. Golden: BSCSE 15 credits not-first tier 50 → tierWaiver 48750 (negative line), tuitionNet 48750, totalDue 55250. Tier 25 → tierWaiver 24375. Done when green.
5. Slice 5 (U2) at S1 — red first: RetakeWaiver and the tier interaction. Golden: BSCSE 15 credits with 3 retake credits, not-first, tier 0 → retakeWaiver 9750, totalDue 94250. Same with tier 50 → tierWaiver computed on 12 non-retake credits = 39000, retakeWaiver 9750, tuitionNet = 97500 − 9750 − 39000 = 48750, totalDue 55250. Done when green.
6. Slice 6 (U8) at S1 — red first: PaymentSchedule. Goldens: trimester, recurringDue 104000 → preRegistration 20000, installments [33600, 25200, 25200]; semester (B.Pharm), recurringDue 50000 → 4 × 7500; recurringDue 15000 → remaining 0, installments [], the covers-note; rounding: recurringDue 100001 → remaining 80001 → [32000.40, 24000.30, 24000.30] with the last absorbing the remainder so the sum is exactly 80001. isFirstTerm note asserted. Done when green.
7. Slice 7 (U5, U7) at S1 — red first: ProgramTotal goldens at tier 0 equal the official published totals: bscse 1014500; ba-english 777575; bpharm 1178000; bsbge 1032000; bsc-civil 1082750. At tier 50: bscse → tuitionTotal 458250, total 576250 (documented estimate — official published waiver totals differ; conditions apply). Done when green.
8. Slice 8 (robustness) at S1 — red first: validation throws RangeError for creditsPlanned −1, 0.3; retakeCredits > creditsPlanned; waiverTier 30 (typed through a test helper, never by loosening types); unknown programId in getProgram. `listPrograms()` returns 12 entries and does not expose a mutable reference (mutating the result must not change a second call's output). Done when green.
9. Refactor pass: barrel exports exactly `calculateFees`, `calculatePaymentSchedule`, `calculateProgramTotal`, `listPrograms`, `getProgram` typed with the contract function types; `npm run check` and `npx vitest run src/lib/domain/fees` exit 0.
10. Self-review pass (skill `code-review`): Spec against U2/U5–U8 and the spec formulas; Standards against AGENTS.md and GLOSSARY.md (labels use glossary words: TermFee, LabFee, AdmissionFee, CautionMoney, PreRegistrationPayment, Installment). Fix hard findings; list leftovers.

## Acceptance criteria

Each line is checkable by a command.
1. `npx vitest run src/lib/domain/fees` exits 0 with at least 15 passing tests covering every golden value above (S1).
2. The five official tier-0 ProgramTotal goldens (1014500, 777575, 1178000, 1032000, 1082750) are asserted literally in tests — `npx vitest run src/lib/domain/fees -t "official"` exits 0.
3. Stories U5–U8 verified by the corresponding test names at S1; U2 by the RetakeWaiver tests.
4. `npm run verify` passes and `python .jules/tools/slop_guard.py --strict` reports no ERROR and no WARN.
5. `git diff --name-only origin/integration/uiu-calculator...HEAD` shows only your owned paths plus `.jules/reports/T03.md`.

## Decision defaults

- Colocated tests: `src/lib/domain/fees/*.test.ts`.
- Exact arithmetic: amounts may end in .5 (5525-rate); round only Installments, to 2 decimals, remainder into the last one. Never round intermediates.
- Money strings never appear in the domain: return numbers; T04 formats with en-IN grouping.
- FeeLine order: tuition-gross, retake-waiver, tier-waiver, term-fee, lab-fee, admission-fee, caution-money (zero components omitted).
- Error messages: one line, name the rule (`waiverTier must be 0, 25 or 50`).

## Fallbacks

- If the contract lacks a type you believe you need: the five functions and their result types are sufficient for every formula above — build with them; file a request if genuinely blocked, and continue with the rest.
- If a golden value above conflicts with `FEE_RULES`/`PROGRAMS` data: the data files are authoritative (they are the frozen official table); recompute the expectation, and note the discrepancy in your report — do not edit data files.
- If Vitest float comparison flakes on .5 amounts: use exact equality where amounts are halves (they are exact in binary), `toBeCloseTo(x, 10)` elsewhere.

## Hand-off

Report at `.jules/reports/T03.md` (format in AGENTS.md section 10). Tell dependent tasks: barrel exports, FeeLine label wording (T04 displays labels verbatim), note strings for the PaymentSchedule, and the WaiverTier estimate caveat T04 must surface next to the selector.
