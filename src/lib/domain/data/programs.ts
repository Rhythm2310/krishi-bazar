import type { Program, ProgramId } from '../contracts';

export const PROGRAMS: readonly Program[] = [
  {
    id: 'BBA',
    name: 'BBA',
    totalCredits: 125,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BBA-AIS',
    name: 'BBA in AIS',
    totalCredits: 125,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSECO',
    name: 'BSECO',
    totalCredits: 122,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSSEDS',
    name: 'BSSEDS',
    totalCredits: 123,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSCSE',
    name: 'BSCSE',
    totalCredits: 141,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSDS',
    name: 'BSDS',
    totalCredits: 138,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSEEE',
    name: 'BSEEE',
    totalCredits: 140,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BSC-CIVIL',
    name: 'BSc Civil',
    totalCredits: 151.5,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 0
  },
  {
    id: 'BPHARM',
    name: 'B.Pharm',
    totalCredits: 160,
    termSystem: 'Semester',
    termsTotal: 8,
    perCreditFee: 6500,
    labFeePerTerm: 5000
  },
  {
    id: 'BA-ENG',
    name: 'BA English',
    totalCredits: 123,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 5525,
    labFeePerTerm: 0
  },
  {
    id: 'BSSMSJ',
    name: 'BSSMSJ',
    totalCredits: 130,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 5525,
    labFeePerTerm: 0
  },
  {
    id: 'BSBGE',
    name: 'BSBGE (BSc in Biotechnology & Genetic Engineering)',
    totalCredits: 140,
    termSystem: 'Trimester',
    termsTotal: 12,
    perCreditFee: 6500,
    labFeePerTerm: 2000
  }
];

export const PUBLISHED_PROGRAM_TOTALS_TIER_0: Record<ProgramId, number> = {
  BBA: 910500,
  'BBA-AIS': 910500,
  BSECO: 891000,
  BSSEDS: 897500,
  BSCSE: 1014500,
  BSDS: 995000,
  BSEEE: 1008000,
  'BSC-CIVIL': 1082750,
  BPHARM: 1178000,
  'BA-ENG': 777575,
  BSSMSJ: 816250,
  BSBGE: 1032000
};
