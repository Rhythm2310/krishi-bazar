import { expect, test, describe } from 'bun:test';
import { computeTermFee, computeDegreeTotal } from '../fees';
import { PROGRAMS } from '../../data/programs';
import type { CourseEntry } from '../types';

describe('computeTermFee', () => {
  const bbaProgram = PROGRAMS.find(p => p.code === 'BBA')!;
  const bpharmProgram = PROGRAMS.find(p => p.code === 'BPHARM')!;

  test('retake-50% case and waiver-ineligible exclusion', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 3, grade: null, isRetake: true, retakeFirstTime: true, waiverIneligible: true },
      { id: '2', name: 'C2', credits: 3, grade: null, isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeTermFee(bbaProgram, courses, 50);
    expect(result.tuitionGross).toBe(29250);
    expect(result.waiverDiscount).toBe(9750);
    expect(result.total).toBe(26000);
  });

  test('B.Pharm semester fee + lab case', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 3, grade: null, isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeTermFee(bpharmProgram, courses, 0);
    expect(result.tuitionGross).toBe(19500);
    expect(result.total).toBe(34250);
  });

  test('installments exact sum (trimester)', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 4.5, grade: null, isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeTermFee(bbaProgram, courses, 0);
    expect(result.installments.length).toBe(4);
    expect(result.installments.reduce((a, b) => a + b, 0)).toBe(result.total);
    expect(result.installments[0]).toBe(20000);
    expect(result.installments[1]).toBe(6300);
    expect(result.installments[2]).toBe(4725);
    expect(result.installments[3]).toBe(4725);
  });

  test('installments exact sum (semester)', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 4.5, grade: null, isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeTermFee(bpharmProgram, courses, 0);
    expect(result.installments.length).toBe(5);
    expect(result.installments.reduce((a, b) => a + b, 0)).toBe(result.total);
  });
});

describe('computeDegreeTotal (FULL PARITY SUITE)', () => {
  test('computed degree total === published full total for every seeded program', () => {
    for (const program of PROGRAMS) {
      const result = computeDegreeTotal(program);
      expect(result.matches).toBe(true);
      expect(result.computed).toBe(program.publishedTotals.full);
    }
  });
});
