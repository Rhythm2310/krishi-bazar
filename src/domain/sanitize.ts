export function sanitizeCredits(credits: number): number {
  if (!Number.isFinite(credits) || credits <= 0) return 0;
  return credits;
}

export function sanitizeWaiverPct(waiverPct: number): number {
  if (!Number.isFinite(waiverPct)) return 0;
  if (waiverPct < 0) return 0;
  if (waiverPct > 100) return 100;
  return waiverPct;
}

export function sanitizeCgpa(cgpa: number): number {
  if (!Number.isFinite(cgpa)) return 0;
  if (cgpa < 0) return 0;
  if (cgpa > 4.0) return 4.0;
  return cgpa;
}

export function sanitizeCompletedCredits(credits: number): number {
  if (!Number.isFinite(credits) || credits < 0) return 0;
  return credits;
}
