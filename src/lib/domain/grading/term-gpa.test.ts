import { expect, test } from 'vitest';
import { calculateTermGpa, gradePoint } from './index';
import type { CourseEntry } from '../contracts';

test('gradePoint of A is 4.00', () => {
  expect(gradePoint('A')).toBe(4.0);
});

test('calculateTermGpa with a single 3cr A', () => {
  const courses: CourseEntry[] = [
    { id: '1', code: 'CSE 1101', title: 'Test', credits: 3, grade: 'A', isRetake: false }
  ];
  const result = calculateTermGpa(courses);
  expect(result.termGpa).toBe(4.0);
  expect(result.earnedCredits).toBe(3);
  expect(result.totalCredits).toBe(3);
});

test('calculateTermGpa with [3cr A, 3cr C+]', () => {
  const courses: CourseEntry[] = [
    { id: '1', code: 'C1', title: 'T1', credits: 3, grade: 'A', isRetake: false },
    { id: '2', code: 'C2', title: 'T2', credits: 3, grade: 'C+', isRetake: false }
  ];
  const result = calculateTermGpa(courses);
  expect(result.termGpa).toBeCloseTo(3.165, 10);
  expect(result.earnedCredits).toBe(6);
  expect(result.totalCredits).toBe(6);
});

test('calculateTermGpa with [3cr A, 2cr F]', () => {
  const courses: CourseEntry[] = [
    { id: '1', code: 'C1', title: 'T1', credits: 3, grade: 'A', isRetake: false },
    { id: '2', code: 'C2', title: 'T2', credits: 2, grade: 'F', isRetake: false }
  ];
  const result = calculateTermGpa(courses);
  expect(result.termGpa).toBe(2.4);
  expect(result.earnedCredits).toBe(3);
  expect(result.totalCredits).toBe(5);
});

test('calculateTermGpa with empty input', () => {
  const result = calculateTermGpa([]);
  expect(result.termGpa).toBe(0);
  expect(result.earnedCredits).toBe(0);
  expect(result.totalCredits).toBe(0);
});
