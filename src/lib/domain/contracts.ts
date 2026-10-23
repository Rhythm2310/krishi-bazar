export type ProgramId =
  | 'BBA'
  | 'BBA-AIS'
  | 'BSECO'
  | 'BSSEDS'
  | 'BSCSE'
  | 'BSDS'
  | 'BSEEE'
  | 'BSC-CIVIL'
  | 'BPHARM'
  | 'BA-ENG'
  | 'BSSMSJ'
  | 'BSBGE';

export type TermSystem = 'Trimester' | 'Semester';
export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
export type WaiverTier = 0 | 25 | 50;
export type FeeLineKind =
  'tuition' | 'waiver' | 'term-fee' | 'lab-fee' | 'admission-fee' | 'caution-money';

export interface Program {
  id: ProgramId;
  name: string;
  totalCredits: number;
  termSystem: TermSystem;
  termsTotal: number;
  perCreditFee: number;
  labFeePerTerm: number;
}
export interface CourseEntry {
  id: string;
  code: string;
  title: string;
  credits: number;
  grade: LetterGrade;
  isRetake: boolean;
}
export interface TermRecord {
  id: string;
  label: string;
  courses: CourseEntry[];
}
export interface GpaResult {
  termGpa: number;
  earnedCredits: number;
  totalCredits: number;
}
export interface CgpaResult {
  cgpa: number;
  earnedCredits: number;
  totalCredits: number;
  replacedCodes: string[];
  meetsDegreeRequirement: boolean;
}
export interface FeeLine {
  kind: FeeLineKind;
  label: string;
  amount: number;
  refundable?: boolean;
}
export interface FeeInput {
  programId: ProgramId;
  creditsPlanned: number;
  retakeCredits: number;
  isFirstTerm: boolean;
  waiverTier: WaiverTier;
}
export interface FeeBreakdown {
  lines: FeeLine[];
  tuitionGross: number;
  tuitionNet: number;
  refundable: number;
  totalDue: number;
  isEstimate: boolean;
}
export interface Installment {
  index: number;
  fraction: number;
  amount: number;
}
export interface PaymentSchedule {
  preRegistration: number;
  installments: Installment[];
  firstTermNote: string | null;
}
export interface ProgramTotal {
  programId: ProgramId;
  waiverTier: WaiverTier;
  total: number;
}

export type GradePointFn = (grade: LetterGrade) => number;
export type CalculateTermGpaFn = (courses: CourseEntry[]) => GpaResult;
export type CalculateCgpaFn = (savedTerms: TermRecord[], planner: CourseEntry[]) => CgpaResult;
export type NormalizeCourseCodeFn = (code: string) => string;
export type CalculateFeesFn = (input: FeeInput) => FeeBreakdown;
export type CalculatePaymentScheduleFn = (input: FeeInput) => PaymentSchedule;
export type CalculateProgramTotalFn = (
  programId: ProgramId,
  waiverTier: WaiverTier
) => ProgramTotal;
export type ListProgramsFn = () => Program[];
export type GetProgramFn = (id: ProgramId) => Program;
