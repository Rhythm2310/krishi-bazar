# Spec: UIU Calculator — Cgpa and tuition + registration money planner

Architect-owned. Agents read it; they never edit it. User stories are `U<n>`, seams are `S<n>`. Task files cite both.

## Problem Statement

A UIU Student cannot answer two basic questions before registering for a Term without hand arithmetic and the official fee PDFs: "What Cgpa will I have if I take these Courses with these grades?" and "Exactly how much Taka do I owe this Term, and when is each part due?" The official fee table publishes per-Credit rates, TermFees, LabFees, one-time AdmissionFee and CautionMoney, waiver tiers and an installment schedule, but nothing combines them with the credit-weighted grade math for a concrete Term plan.

## Solution

A web app (SvelteKit, deployed to Vercel) where a Student picks their Program, enters the Courses of the Term they are planning (CourseCode, Credits, expected LetterGrade, Retake flag), and immediately sees: the TermGpa of the Planner, the Cgpa across all SavedTerms plus the Planner with the degree-requirement 2.00 indicator, an itemized FeeBreakdown in Taka (tuition gross/net with RetakeWaiver and WaiverTier, TermFee, LabFee, FirstTerm one-time charges with the refundable CautionMoney shown separately), and the official PaymentSchedule (Tk 20,000 PreRegistrationPayment then 40/30/30 or 4×25% Installments). SavedTerms persist in the browser. Every screen shows the data EffectiveDate, official sources and a "UIU may change fees without notice" disclaimer.

## User Stories

1. **U1**: As a Student, I want to add, edit and remove Courses in the Planner for one Term — CourseCode, optional title, Credits (0.5 steps, 0.5–12) and expected LetterGrade — so that I see the credit-weighted TermGpa and EarnedCredits update as I plan, with F earning no Credits but counting in the average.
2. **U2**: As a Student, I want to flag a Course as a Retake, so that the earlier attempt with the same CourseCode is replaced in the Cgpa (latest Term wins) and the retaken Credits receive the 50% RetakeWaiver in my fee estimate, visibly labelled as first-time-only.
3. **U3**: As a Student, I want to save the Planner as a SavedTerm with a label, list my SavedTerms, and rename or delete them in my browser, so that my history survives reloads and visits without any account.
4. **U4**: As a Student, I want to see my Cgpa credit-weighted across all SavedTerms plus the Planner, so that I can track progress toward the degree requirement Cgpa 2.00 with a clear below/at-or-above indicator.
5. **U5**: As a Student, I want to select my Program and see the FeeBreakdown for my planned Credits — tuition at the Program's PerCreditFee (Tk 6,500; Tk 5,525 for BA English and BSSMSJ), plus the TermFee (Tk 6,500 Trimester; Tk 9,750 Semester) and the Program's LabFee — itemized in Taka, so that I know exactly what I owe for the Term.
6. **U6**: As a Student in my FirstTerm, I want the one-time AdmissionFee (Tk 20,000, non-refundable) and CautionMoney (Tk 2,000, refundable) included and separately labelled, so that my first-Term total is complete and I know what I get back.
7. **U7**: As a Student with a scholarship or waiver, I want to select a WaiverTier (0, 25 or 50 percent) and see the reduced tuition with a "conditions apply — official totals may differ" note, so that I get an honest estimate of what I pay.
8. **U8**: As a Student, I want the PaymentSchedule for the Term — Tk 20,000 PreRegistrationPayment, then the remaining dues in the official Installments (Trimester 40/30/30; Semester 4 × 25%) — so that I can plan my cash flow, and on a FirstTerm I want it stated that the AdmissionFee counts as that Term's PreRegistrationPayment.
9. **U9**: As a Student or visitor, I want every result area, the page footer and the README to show the data EffectiveDate, links to the official uiu.ac.bd grading and fees pages, and a "UIU may change fees without notice — verify before paying" disclaimer, so that I never mistake an estimate for an invoice.

## Implementation Decisions

- Stack: SvelteKit 3 with Svelte 5 runes, TypeScript 6 strict, Vite 8, deployed with the Vercel adapter; the Node.js runtime requirement is met by Vercel's Node functions and by Node 24 LTS everywhere the code runs (CI, Jules snapshot, local). The whole app prerenders to static output: no server logic, no API routes.
- Package management: npm with a committed lockfile; every version exactly pinned per the dependency ledger; zero production dependencies — everything is a devDependency because the deployed artifact is static.
- Architecture: three pure domain modules — grading, cgpa, fees — behind one frozen contract of shared types and function signatures. Domain code never imports Svelte, routing or storage. One Planner page composes panels that call domain functions. A versioned localStorage key holds Student state (ADR 0001); a state module owns load/save and guards server-side rendering.
- Grade math: GradePoints exactly as published (A 4.00, A- 3.67, B+ 3.33, B 3.00, B- 2.67, C+ 2.33, C 2.00, C- 1.67, D+ 1.33, D 1.00, F 0.00). TermGpa and Cgpa are Σ(Credit × GradePoint) / Σ(Credit) at full precision, displayed rounded to 2 decimals. EarnedCredits exclude F Courses.
- Retake rule: within Cgpa, Courses are deduplicated by normalized CourseCode (trim, collapse spaces, case-insensitive); the latest Term's attempt wins and the replaced codes are reported to the UI. The Retake flag itself only drives the RetakeWaiver in fees. (The official grading page does not state the replacement rule explicitly — recorded as an assumption to verify against UIU regulations.)
- Fee math, per Term: tuitionGross = Credits × PerCreditFee; retakeWaiver = retakeCredits × PerCreditFee × 0.5; tierWaiver = (Credits − retakeCredits) × PerCreditFee × tier/100 (official rule: waivers never apply to Retake credits, TermFee, LabFee or one-time charges); totalDue = tuitionGross − retakeWaiver − tierWaiver + TermFee + LabFee + (FirstTerm ? 20,000 + 2,000 : 0); refundable = FirstTerm ? 2,000 : 0. Waiver amounts are estimates: UIU's published 25%/50% program totals do not reproduce exactly from the public formula, so the UI and README carry the "conditions apply" pointer.
- Whole-degree total (used by tests and available to the UI): Credits_total × PerCreditFee × (1 − tier/100) + termsTotal × (TermFee + LabFeePerTerm) + AdmissionFee. At tier 0 this equals the official published totals exactly for every Program (validated: BSCSE 1,014,500; BA English 777,575; B.Pharm 1,178,000; BSBGE 1,032,000; BSc Civil 1,082,750).
- PaymentSchedule: preRegistration = 20,000; remaining = max(0, tuitionNet + TermFee + LabFee − 20,000); split 40/30/30 (Trimester) or 25/25/25/25 (Semester) with the rounding remainder added to the last Installment; on a FirstTerm the note states the AdmissionFee counts as the PreRegistrationPayment.
- Money: computed in exact Taka (halves possible at the 5,525 rate), never floats-formatted mid-computation; displayed with up to 2 decimals and en-IN digit grouping (Tk 1,26,000). GPA/CGPA displayed with exactly 2 decimals.
- Domain validation: invalid Credits (not a positive multiple of 0.5 up to 12), unknown ProgramId, retakeCredits > creditsPlanned or an unknown LetterGrade throw RangeError with a one-line message; the UI prevents invalid input and catches at the boundary with inline messages — never alert dialogs.
- Shared state shape (from the contract prototype, encoding the decision prose cannot):

```ts
// from prototype: the frozen core shapes every module speaks
interface CourseEntry { id: string; code: string; title: string; credits: number; grade: LetterGrade; isRetake: boolean }
interface TermRecord  { id: string; label: string; courses: CourseEntry[] }
interface FeeInput    { programId: ProgramId; creditsPlanned: number; retakeCredits: number; isFirstTerm: boolean; waiverTier: 0 | 25 | 50 }
```

- Data: the 11-grade scale, the 12-Program fee table and the fee constants are frozen data modules carrying EffectiveDate 2026-10-23 and the two official source URLs; fee updates happen only through an amendment task, never by an agent.
- UI language English; currency Taka (Tk); accessible by default (native form controls, every input labelled, results in aria-live regions).

## Testing Decisions

What a good test is here: external behaviour through a published interface with golden values — official UIU grade points and fee totals, and hand-checked Taka amounts — never implementation details.

Seams (prefer existing; the highest seam possible; the fewer the better):

- **S1**: domain public API: the exported functions of the grading, cgpa and fees modules called with pure inputs, observable through their returned result objects (GpaResult, CgpaResult, FeeBreakdown, PaymentSchedule, ProgramTotal) and thrown RangeErrors. Runner: Vitest, node environment, tests colocated in the module directories.
- **S2**: page flows: the built app in a real Chromium browser — a Student enters Courses, sees TermGpa/Cgpa/FeeBreakdown/PaymentSchedule, saves a Term, reloads the page and finds it persisted. Runner: Playwright against the preview server.

Modules tested: domain grading, domain cgpa, domain fees (S1); the Planner page including its panels, controls and persistence (S2).
Prior art in the repo: the T01 tracer tests (one Vitest suite and one Playwright smoke spec) are the first examples; follow their style.

## Out of Scope

- Graduate Programs (MBA, MSCSE and the rest) — a later ADD.
- Accounts, backend, database or cross-device sync (ADR 0001).
- Scraping or auto-updating UIU data; historical fee versions.
- The UIU course catalog: Students type their own CourseCodes and titles.
- Scholarships beyond the three WaiverTiers; improvement-exam and "I"-grade fee rules beyond the documented notes.
- Currencies other than Taka.
- Deploy automation: a human connects the repo to Vercel once (documented in the deployment guide).

## Further Notes

- Data EffectiveDate 2026-10-23, from uiu.ac.bd: the grading-performance-evaluation page and the tuition-fees-waiver page. Both recorded in the frozen data module.
- VERIFY items (tracked in .jules/plan.md): the Retake-replaces-original Cgpa rule against UIU regulations; whether the FirstTerm AdmissionFee formally doubles as the first PreRegistrationPayment (payment-policies page was unreachable during planning — the conservative no-double-charge interpretation is implemented and labelled); the Vercel Node runtime label.
- Strict profile: slop guard runs with --strict in CI; review task T06 follows the single integration point; a re-review follows every fix wave.
