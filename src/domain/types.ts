export type GradeLetter = 'A'|'A-'|'B+'|'B'|'B-'|'C+'|'C'|'C-'|'D+'|'D'|'F';

export interface Grade {
  letter: GradeLetter;
  point: number;
  minMark: number;
  maxMark: number;
  assessment: string;
}

export interface Program {
  code: string;
  totalCredits: number;
  terms: number;
  termType: 'tri' | 'sem';
  perCreditFee: number;
  termFee: number;
  labFeePerTerm: number | null;
  publishedTotals: {
    full: number;
    waiver25: number | null;
    waiver50: number | null;
  };
}

export interface CourseEntry {
  id: string;
  name: string;
  credits: number;
  grade: GradeLetter | null;
  isRetake: boolean;
  retakeFirstTime: boolean;
  waiverIneligible: boolean;
}

export interface FeeLine {
  label: string;
  amount: number;
  isSub: boolean;
}

export interface StudentRecord {
  completedCredits: number;
  currentCgpa: number;
}
