import type { Program } from '../domain/types';

// Programs accessed 2026-10-23
// Source: https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/
export const PROGRAMS: Program[] = [
  // UG
  { code: 'BBA', totalCredits: 125, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 910500, waiver25: 712250, waiver50: 514000 } },
  { code: 'BBA-AIS', totalCredits: 125, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 910500, waiver25: 712250, waiver50: 514000 } },
  { code: 'BSECO', totalCredits: 122, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 891000, waiver25: 697625, waiver50: 504250 } },
  { code: 'BSSEDS', totalCredits: 123, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 897500, waiver25: 707375, waiver50: 517250 } },
  { code: 'BSCSE', totalCredits: 141, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 1014500, waiver25: 795125, waiver50: 575750 } },
  { code: 'BSDS', totalCredits: 138, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 995000, waiver25: 780500, waiver50: 566000 } },
  { code: 'BSEEE', totalCredits: 140, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 1008000, waiver25: 790250, waiver50: 572500 } },
  { code: 'BSCE', totalCredits: 151.5, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 1082750, waiver25: 846312.5, waiver50: 609875 } },
  { code: 'BPHARM', totalCredits: 160, terms: 8, termType: 'sem', perCreditFee: 6500, termFee: 9750, labFeePerTerm: 5000, publishedTotals: { full: 1178000, waiver25: 924500, waiver50: 671000 } },
  { code: 'BAENG', totalCredits: 123, terms: 12, termType: 'tri', perCreditFee: 5525, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 777575, waiver25: 611825, waiver50: 446075 } },
  { code: 'BSSMSJ', totalCredits: 130, terms: 12, termType: 'tri', perCreditFee: 5525, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 816250, waiver25: 640831.3, waiver50: 465412.5 } },
  { code: 'BSBGE', totalCredits: 140, terms: 12, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: 2000, publishedTotals: { full: 1032000, waiver25: 807750, waiver50: 583500 } },
  // PG
  { code: 'MBA-30', totalCredits: 30, terms: 4, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 241000, waiver25: 192250, waiver50: null } },
  { code: 'MBA-60', totalCredits: 60, terms: 6, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 449000, waiver25: 351500, waiver50: null } },
  { code: 'EMBA-30', totalCredits: 30, terms: 4, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 241000, waiver25: 192250, waiver50: null } },
  { code: 'EMBA-45', totalCredits: 45, terms: 5, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 345000, waiver25: 271875, waiver50: null } },
  { code: 'MSECO', totalCredits: 30, terms: 4, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 241000, waiver25: 202000, waiver50: null } },
  { code: 'MDS', totalCredits: 39, terms: 4, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 299500, waiver25: 245875, waiver50: null } },
  { code: 'MSCSE', totalCredits: 36, terms: 4, termType: 'tri', perCreditFee: 6500, termFee: 6500, labFeePerTerm: null, publishedTotals: { full: 280000, waiver25: 250750, waiver50: null } },
];
