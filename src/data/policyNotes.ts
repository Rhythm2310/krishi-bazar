export interface PolicyNote { title: string; body: string }
export interface DataSource { label: string; url: string; accessed: string }

export const POLICY_NOTES: PolicyNote[] = [
  { title: "Eligibility", body: "admission-based 25%/50% (SSC/HSC or O/A-level criteria); merit-based top 2%/4%/4% → 100/50/25% with min GPA 3.50; min registration 9 credits (B.Pharm 14, PG 6)" },
  { title: "Continuation", body: "continuation requires GPA ≥ 3.50; not applicable to Thesis/Project/Internship/Retake/Repeat" },
  { title: "Retake Policy", body: "retake course fee waived 50% first time only" },
  { title: "Payment Breakdown", body: "each term requires Tk 20,000 advance before registration, remainder in 3 installments (40/30/30, trimester) or 4 (25% each, semester)" }
];

export const DATA_SOURCES: DataSource[] = [
  { label: "Grading", url: "https://www.uiu.ac.bd/academics/grading-performance-evaluation/", accessed: "2026-10-23" },
  { label: "Tuition & waivers table", url: "https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/", accessed: "2026-10-23" },
  { label: "Scholarship/waiver policy", url: "https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/", accessed: "2026-10-23" }
];

export const DISCLAIMER: string = "unofficial student tool; figures may differ from official UIU records; verify with uiu.ac.bd before paying";
