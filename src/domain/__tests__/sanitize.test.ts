import { describe, test, expect } from 'bun:test';
import { computeTermFee } from '../fees';
import { computeCgpa, computeGpa } from '../gpa';
import { PROGRAMS } from '../../data/programs';
import type { CourseEntry, StudentRecord } from '../types';

describe('Sanitization Contract (F-002, F-009)', () => {
  const bscCse = PROGRAMS.find(p => p.code === 'BSCSE')!;

  describe('F-002: Course credits sanitization', () => {
    test('NaN credits in term fee (F-002 probe)', () => {
      const courses: Partial<CourseEntry>[] = [
        { id: '1', credits: NaN, name: 'T1' }
      ];
      const result = computeTermFee(bscCse, courses as CourseEntry[], 0);
      expect(result.tuitionGross).toBe(0);
      expect(result.total).toBe(bscCse.termFee + (bscCse.labFeePerTerm ?? 0));
      expect(result.installments.every(Number.isFinite)).toBe(true);
      expect(result.installments.some(Number.isNaN)).toBe(false);
    });

    test('Negative credits in term fee', () => {
      const courses: Partial<CourseEntry>[] = [
        { id: '1', credits: -3, name: 'T1' }
      ];
      const result = computeTermFee(bscCse, courses as CourseEntry[], 0);
      expect(result.tuitionGross).toBe(0);
    });

    test('0 credits in term fee', () => {
      const courses: Partial<CourseEntry>[] = [
        { id: '1', credits: 0, name: 'T1' }
      ];
      const result = computeTermFee(bscCse, courses as CourseEntry[], 0);
      expect(result.tuitionGross).toBe(0);
    });

    test('credits NaN in GPA', () => {
      const courses: Partial<CourseEntry>[] = [
        { id: '1', credits: NaN, name: 'T1', grade: 'A' }
      ];
      const result = computeGpa(courses as CourseEntry[]);
      expect(result.gpa).toBe(0);
      expect(result.earnedCredits).toBe(0);
      expect(result.totalCredits).toBe(0);
    });
  });

  describe('F-009: Waiver sanitization', () => {
    test('waiver=101 clamps to 100', () => {
      const courses: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1' }];
      const res100 = computeTermFee(bscCse, courses as CourseEntry[], 100);
      const res101 = computeTermFee(bscCse, courses as CourseEntry[], 101);
      expect(res101.total).toBe(res100.total);
    });

    test('waiver=-5 clamps to 0', () => {
      const courses: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1' }];
      const res0 = computeTermFee(bscCse, courses as CourseEntry[], 0);
      const resMinus5 = computeTermFee(bscCse, courses as CourseEntry[], -5);
      expect(resMinus5.total).toBe(res0.total);
    });

    test('waiver=1e9 clamps to 100 (W02 probe)', () => {
      const courses: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1' }];
      const res100 = computeTermFee(bscCse, courses as CourseEntry[], 100);
      const res1e9 = computeTermFee(bscCse, courses as CourseEntry[], 1e9);
      expect(res1e9.total).toBe(res100.total);
      expect(res1e9.total).toBeGreaterThanOrEqual(0);
    });

    test('waiver=NaN clamps to 0', () => {
      const courses: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1' }];
      const res0 = computeTermFee(bscCse, courses as CourseEntry[], 0);
      const resNaN = computeTermFee(bscCse, courses as CourseEntry[], NaN);
      expect(resNaN.total).toBe(res0.total);
    });
  });

  describe('F-009: currentCgpa and completedCredits sanitization', () => {
    test('currentCgpa=4.1 clamps to 4.0 (W02 probe)', () => {
      const record4_0: StudentRecord = { currentCgpa: 4.0, completedCredits: 10 };
      const record4_1: StudentRecord = { currentCgpa: 4.1, completedCredits: 10 };
      const planned: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1', grade: 'A' }];

      const res4_0 = computeCgpa(record4_0, planned as CourseEntry[]);
      const res4_1 = computeCgpa(record4_1, planned as CourseEntry[]);
      expect(res4_1.newCgpa).toBe(res4_0.newCgpa);
    });

    test('currentCgpa=-1 clamps to 0', () => {
      const record0: StudentRecord = { currentCgpa: 0, completedCredits: 10 };
      const recordMinus1: StudentRecord = { currentCgpa: -1, completedCredits: 10 };
      const planned: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1', grade: 'A' }];

      const res0 = computeCgpa(record0, planned as CourseEntry[]);
      const resMinus1 = computeCgpa(recordMinus1, planned as CourseEntry[]);
      expect(resMinus1.newCgpa).toBe(res0.newCgpa);
    });

    test('currentCgpa=NaN clamps to 0', () => {
      const record0: StudentRecord = { currentCgpa: 0, completedCredits: 10 };
      const recordNaN: StudentRecord = { currentCgpa: NaN, completedCredits: 10 };
      const planned: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1', grade: 'A' }];

      const res0 = computeCgpa(record0, planned as CourseEntry[]);
      const resNaN = computeCgpa(recordNaN, planned as CourseEntry[]);
      expect(resNaN.newCgpa).toBe(res0.newCgpa);
    });

    test('completedCredits=-5 clamps to 0', () => {
      const record0: StudentRecord = { currentCgpa: 3.5, completedCredits: 0 };
      const recordMinus5: StudentRecord = { currentCgpa: 3.5, completedCredits: -5 };
      const planned: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1', grade: 'A' }];

      const res0 = computeCgpa(record0, planned as CourseEntry[]);
      const resMinus5 = computeCgpa(recordMinus5, planned as CourseEntry[]);
      expect(resMinus5.newCgpa).toBe(res0.newCgpa);
      expect(resMinus5.totalCredits).toBe(3);
    });

    test('completedCredits=NaN clamps to 0', () => {
      const record0: StudentRecord = { currentCgpa: 3.5, completedCredits: 0 };
      const recordNaN: StudentRecord = { currentCgpa: 3.5, completedCredits: NaN };
      const planned: Partial<CourseEntry>[] = [{ id: '1', credits: 3, name: 'T1', grade: 'A' }];

      const res0 = computeCgpa(record0, planned as CourseEntry[]);
      const resNaN = computeCgpa(recordNaN, planned as CourseEntry[]);
      expect(resNaN.newCgpa).toBe(res0.newCgpa);
      expect(resNaN.totalCredits).toBe(3);
    });
  });
});
