import { expect, test, describe } from 'bun:test';
import { computeGpa, computeCgpa, requiredTermGpa } from '../gpa';
import type { CourseEntry } from '../types';

describe('computeGpa', () => {
  test('handles all-F term', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'Math', credits: 3, grade: 'F', isRetake: false, retakeFirstTime: false, waiverIneligible: false },
      { id: '2', name: 'Physics', credits: 3, grade: 'F', isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeGpa(courses);
    expect(result.gpa).toBe(0);
    expect(result.earnedCredits).toBe(0);
    expect(result.totalCredits).toBe(6);
    expect(result.hasF).toBe(true);
  });

  test('handles empty list', () => {
    const result = computeGpa([]);
    expect(result.gpa).toBe(0);
    expect(result.earnedCredits).toBe(0);
    expect(result.totalCredits).toBe(0);
    expect(result.hasF).toBe(false);
  });

  test('handles 0.5-credit course', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'Lab', credits: 0.5, grade: 'A', isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeGpa(courses);
    expect(result.gpa).toBe(4.00);
    expect(result.earnedCredits).toBe(0.5);
    expect(result.totalCredits).toBe(0.5);
  });

  test('D earned-credit rule (>= 1.00 is earned, F is not)', () => {
    const courses: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 3, grade: 'D', isRetake: false, retakeFirstTime: false, waiverIneligible: false },
      { id: '2', name: 'C2', credits: 3, grade: 'F', isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeGpa(courses);
    expect(result.earnedCredits).toBe(3); // Only D is earned
  });
});

describe('computeCgpa', () => {
  test('hand-computed projection cases', () => {
    const record = { completedCredits: 10, currentCgpa: 3.50 };
    const planned: CourseEntry[] = [
      { id: '1', name: 'C1', credits: 3, grade: 'A', isRetake: false, retakeFirstTime: false, waiverIneligible: false }
    ];
    const result = computeCgpa(record, planned);
    expect(result.newCgpa).toBe(3.62);
    expect(result.totalCredits).toBe(13);
  });
});

describe('requiredTermGpa', () => {
  test('calculates required GPA', () => {
    const record = { completedCredits: 10, currentCgpa: 3.00 };
    expect(requiredTermGpa(record, 3, 3.5).required).toBeNull();
    expect(requiredTermGpa(record, 3, 3.2).required).toBe(3.87);
  });

  test('returns null when unreachable', () => {
    const record = { completedCredits: 100, currentCgpa: 3.00 };
    expect(requiredTermGpa(record, 3, 4.0).required).toBeNull();
  });

  test('zero-credit guard', () => {
    const record = { completedCredits: 10, currentCgpa: 3.00 };
    expect(requiredTermGpa(record, 0, 3.5).required).toBeNull();
  });
});
