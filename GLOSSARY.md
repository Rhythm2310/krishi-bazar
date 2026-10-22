# UIU Calculator glossary

Language only. No implementation detail, specs or scratch notes. One word per concept; the "Avoid" list names the synonyms nobody uses.

## Terms

**Student**: the person using the app; a UIU undergraduate planning or reviewing a Term.
_Avoid_: user, client, person

**Program**: one of the 12 official UIU undergraduate programs in the fee table (for example BSCSE or B.Pharm), carrying its PerCreditFee, total Credit requirement and TermSystem.
_Avoid_: department, faculty, major, course-of-study

**Term**: one teaching period at UIU; either a Trimester or a Semester depending on the Program.
_Avoid_: semester (alone), trimester (alone), session, quarter

**Trimester**: the Term system used by every Program except B.Pharm; 12 Trimesters per degree; TermFee Tk 6,500.

**Semester**: the Term system used by B.Pharm only; 8 Semesters per degree; TermFee Tk 9,750.

**Course**: one subject a Student plans or completed in a Term, identified by its CourseCode, with Credits and a LetterGrade.
_Avoid_: subject, class, module, paper

**CourseCode**: the official UIU identifier of a Course (for example `CSE 1101`); the key that identifies a Course across Terms for Retake replacement.
_Avoid_: course name (that is the title), course id

**Credit**: the weight of a Course; multiples of 0.5, range 0.5 to 12 per Course.
_Avoid_: credit hour, unit, point (point is the GradePoint)

**LetterGrade**: one of the 11 official UIU grades: A, A-, B+, B, B-, C+, C, C-, D+, D, F.
_Avoid_: grade letter, mark, score

**GradePoint**: the numeric value of a LetterGrade (A = 4.00 down to D = 1.00; F = 0.00).
_Avoid_: point value, grade value

**TermGpa**: the Credit-weighted average GradePoint of the Courses in one Term; F Courses count in the denominator and earn no Credits.
_Avoid_: GPA (alone), semester GPA, SGPA

**Cgpa**: cumulative GradePoint average: the Credit-weighted average GradePoint across all SavedTerms plus the Planner, after Retake replacement. Degree requirement: 2.00.
_Avoid_: GPA (alone), cumulative GPA, average

**EarnedCredits**: Credits from Courses graded D or higher; an F earns nothing and the Course must be retaken.
_Avoid_: completed credits, passed hours

**Retake**: re-registering for a Course after an F or for grade improvement; the new attempt replaces the earlier attempt with the same CourseCode in Cgpa, and its Credits get the RetakeWaiver the first time.
_Avoid_: repeat, retake-course, improvement (alone)

**RetakeWaiver**: the 50% reduction of the tuition charge on Retake Credits (first retake of a Course only, per official policy).

**SavedTerm**: a Term the Student finished planning and stored in the browser; has a label and its Courses. SavedTerms feed the Cgpa.
_Avoid_: history entry, archive

**Planner**: the Term currently being edited on the page; it counts toward Cgpa and fee estimates but is not a SavedTerm until saved.

**FeeBreakdown**: the itemized money due for one Term: tuition (gross, waivers, net), TermFee, LabFee, and on a FirstTerm the AdmissionFee and CautionMoney, plus the total.
_Avoid_: bill, invoice, cost summary

**FeeLine**: one row of a FeeBreakdown with a label, an amount in Taka (waivers are negative) and a kind.

**PerCreditFee**: the tuition charge per Credit of a Program: Tk 6,500, or Tk 5,525 for BA English and BSSMSJ (15% discount).
_Avoid_: credit rate, tuition rate

**TermFee**: the fixed registration charge per Term: Tk 6,500 per Trimester; Tk 9,750 per Semester (B.Pharm). This is what students colloquially call the "registration fee".
_Avoid_: registration fee (ambiguous with AdmissionFee), semester fee (alone)

**LabFee**: the per-Term laboratory charge of specific Programs: BSBGE Tk 2,000 per Trimester; B.Pharm Tk 5,000 per Semester; Tk 0 for every other Program.

**AdmissionFee**: the one-time Tk 20,000 non-refundable down payment made at admission; on a FirstTerm it counts as that Term's PreRegistrationPayment.
_Avoid_: admission cost, registration fee

**CautionMoney**: the one-time Tk 2,000 refundable ID-card deposit paid at admission; shown separately as refundable in the FeeBreakdown.
_Avoid_: deposit, security

**FirstTerm**: the Student's very first Term at UIU, when AdmissionFee and CautionMoney apply.

**WaiverTier**: the scholarship/waiver percentage a Student selects: 0, 25 or 50; it reduces tuition on non-Retake Credits only. Computed values are estimates: official conditions apply.
_Avoid_: scholarship (alone), discount

**PaymentSchedule**: how one Term's dues are paid: the PreRegistrationPayment of Tk 20,000, then the remaining amount in Installments (Trimester: 40/30/30; Semester: 4 × 25%).
_Avoid_: installment plan (that is part of it), payment plan

**PreRegistrationPayment**: the Tk 20,000 partial tuition payment required before course registration of each Term.

**Installment**: one of the scheduled partial payments of the remaining Term dues after the PreRegistrationPayment.

**Taka**: the currency (BDT, symbol Tk) of every amount in the app; amounts may end in .5 and are displayed with up to 2 decimals and en-IN digit grouping (Tk 1,26,000).
_Avoid_: BDT (in UI text), taka sign, dollars

**EffectiveDate**: the date (2026-10-23) the fee and grading data was taken from uiu.ac.bd; displayed with every result and in the footer because UIU may change fees without notice.
_Avoid_: last updated (use EffectiveDate)

## Relationships

- A Program has one TermSystem, one PerCreditFee, a total Credit requirement and a LabFeePerTerm.
- A Term contains many Courses; a Course belongs to exactly one Term.
- A Student keeps many SavedTerms plus exactly one Planner.
- Cgpa spans all SavedTerms and the Planner; TermGpa spans one Term.
- A FeeBreakdown belongs to one (Program, planned Credits, WaiverTier, FirstTerm) combination and produces one PaymentSchedule.
- A Retake of a Course replaces the earlier attempt with the same CourseCode in Cgpa and reduces tuition through the RetakeWaiver.

## Flagged ambiguities

- "semester" meant both the generic teaching period and the B.Pharm-specific Semester; the generic word is Term, the specific one is Semester (vs Trimester).
- "GPA" meant both the per-Term average and the cumulative one; use TermGpa and Cgpa.
- "registration fee" meant both the per-Term TermFee (Tk 6,500/9,750) and the one-time AdmissionFee (Tk 20,000); use those two words.
- "marks" vs "grade": percentage marks only exist in the grading-scale table; everything the Student enters is a LetterGrade.
