import type { CourseEntry, FeeLine, Program } from './types';
import { sanitizeCredits, sanitizeWaiverPct } from './sanitize';

export function computeTermFee(program: Program, courses: CourseEntry[], waiverPct: number): { lines: FeeLine[]; tuitionGross: number; waiverDiscount: number; total: number; installments: number[] } {
  let tuitionGross = 0;
  let waiverEligibleTuition = 0;
  const lines: FeeLine[] = [];

  for (const course of courses) {
    const credits = sanitizeCredits(course.credits);
    if (credits === 0) continue;
    const discountFactor = (course.isRetake && course.retakeFirstTime) ? 0.5 : 1;
    const courseTuition = credits * program.perCreditFee * discountFactor;

    tuitionGross += courseTuition;
    if (!course.waiverIneligible) {
      waiverEligibleTuition += courseTuition;
    }
  }

  lines.push({ label: 'Tuition Fee', amount: tuitionGross, isSub: false });
  const sWaiverPct = sanitizeWaiverPct(waiverPct);
  const waiverDiscount = sWaiverPct > 0 ? (sWaiverPct / 100) * waiverEligibleTuition : 0;
  if (waiverDiscount > 0) {
    lines.push({ label: `Waiver (${sWaiverPct}%)`, amount: waiverDiscount, isSub: true });
  }

  lines.push({ label: `${program.termType === 'tri' ? 'Trimester' : 'Semester'} Fee`, amount: program.termFee, isSub: false });
  if (program.labFeePerTerm) {
    lines.push({ label: 'Lab Fee', amount: program.labFeePerTerm, isSub: false });
  }

  const total = tuitionGross - waiverDiscount + program.termFee + (program.labFeePerTerm ?? 0);
  const advance = 20000;
  let installments: number[] = [];

  if (total <= advance) {
    installments = [total];
  } else {
    const remainder = total - advance;
    installments.push(advance);
    if (program.termType === 'tri') {
      const p1 = Math.round(remainder * 0.40);
      const p2 = Math.round(remainder * 0.30);
      const p3 = remainder - p1 - p2;
      installments.push(p1, p2, p3);
    } else {
      const p1 = Math.round(remainder * 0.25);
      const p2 = Math.round(remainder * 0.25);
      const p3 = Math.round(remainder * 0.25);
      const p4 = remainder - p1 - p2 - p3;
      installments.push(p1, p2, p3, p4);
    }
  }

  return { lines, tuitionGross, waiverDiscount, total, installments };
}

export function computeDegreeTotal(program: Program): { computed: number; published: number | null; matches: boolean } {
  const tuitionTotal = program.totalCredits * program.perCreditFee;
  const termFeesTotal = program.terms * program.termFee;
  const labFeesTotal = program.terms * (program.labFeePerTerm ?? 0);
  const admissionFee = 20000;
  const computed = tuitionTotal + termFeesTotal + labFeesTotal + admissionFee;
  return {
    computed,
    published: program.publishedTotals.full,
    matches: computed === program.publishedTotals.full
  };
}
