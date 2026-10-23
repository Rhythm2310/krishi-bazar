# 0002. A Retake replaces the earlier attempt in Cgpa (latest wins)

Status: accepted | Date: 2026-10-23

## Context

UIU's official grading page defines Cgpa as the credit-weighted average of "all the courses completed" and says a retaken Course must be re-registered and paid for — but it never states whether the new grade replaces the old one in the Cgpa or whether both attempts count. The alternatives: (a) latest attempt replaces the earlier attempt with the same CourseCode, (b) all attempts count, (c) a UI toggle for both. Bangladeshi private-university practice and UIU's retake-for-grade-improvement wording point to (a); (b) would make grade improvement impossible, contradicting the stated purpose of a Retake; (c) doubles the Cgpa UI and testing surface for a case the regulations almost certainly settle.

## Decision

Within Cgpa, attempts are deduplicated by normalized CourseCode (trim, collapse inner spaces, case-insensitive); the attempt in the latest Term wins (SavedTerms in stored order, the Planner last). The replaced CourseCodes are reported to the UI and shown to the Student. The Retake flag itself only drives the 50% first-time RetakeWaiver in fees. Listed as a VERIFY item: confirm against UIU regulations before the app is treated as authoritative.

## Consequences

Easy: one deterministic rule, golden-testable at seam S1, and the Student sees exactly which Courses were replaced. Hard: if UIU regulations say otherwise, the Cgpa engine, its tests and the CgpaPanel all change together — that is why this is an ADR and a VERIFY item, not a silent default. TermGpa is unaffected: it never deduplicates within its own Term.
