import { expect, test } from 'vitest';
import { PROGRAMS } from './programs';
import { GRADE_POINTS } from './grading-scale';

test('programs table has 12 rows', () => {
  expect(PROGRAMS).toHaveLength(12);
});

test('perCreditFee is 5525 for BA-ENG and BSSMSJ', () => {
  const baEng = PROGRAMS.find((p) => p.id === 'BA-ENG');
  const bssmsj = PROGRAMS.find((p) => p.id === 'BSSMSJ');
  expect(baEng?.perCreditFee).toBe(5525);
  expect(bssmsj?.perCreditFee).toBe(5525);
});

test('grade points scale has 11 entries', () => {
  expect(Object.keys(GRADE_POINTS)).toHaveLength(11);
  expect(GRADE_POINTS['A']).toBe(4.0);
  expect(GRADE_POINTS['F']).toBe(0.0);
});
