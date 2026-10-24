export function parseCreditInput(raw: string): { value: number; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: 0, error: null };
  const val = Number(trimmed);
  if (!Number.isFinite(val)) return { value: 0, error: 'Enter credits as a number.' };
  if (val < 0.5 || val > 6) return { value: val, error: 'Credits must be between 0.5 and 6.' };
  if (Math.abs(val % 0.5) > 1e-9) return { value: val, error: 'Credits must be in 0.5 steps.' };
  return { value: val, error: null };
}

export function parseWaiverInput(raw: string): { value: number; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: 0, error: null };
  const val = Number(trimmed);
  if (!Number.isFinite(val)) return { value: 0, error: 'Enter the waiver as a number.' };
  if (val < 0 || val > 100) return { value: Math.max(0, Math.min(100, val)), error: 'Waiver must be between 0% and 100%' };
  return { value: val, error: null };
}

export function parseCgpaInput(raw: string): { value: number; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: 0, error: null };
  const val = Number(trimmed);
  if (!Number.isFinite(val)) return { value: 0, error: 'Enter CGPA as a number.' };
  if (val < 0 || val > 4) return { value: Math.max(0, Math.min(4, val)), error: 'CGPA must be between 0.00 and 4.00.' };
  return { value: val, error: null };
}

export function parseCompletedCreditsInput(raw: string): { value: number; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: 0, error: null };
  const val = Number(trimmed);
  if (!Number.isFinite(val)) return { value: 0, error: 'Enter completed credits as a number.' };
  if (val < 0) return { value: 0, error: 'Completed credits cannot be negative.' };
  return { value: val, error: null };
}
