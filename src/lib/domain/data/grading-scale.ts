import type { LetterGrade } from '../contracts';

export const GRADE_POINTS: Record<LetterGrade, number> = {
  A: 4.0,
  'A-': 3.67,
  'B+': 3.33,
  B: 3.0,
  'B-': 2.67,
  'C+': 2.33,
  C: 2.0,
  'C-': 1.67,
  'D+': 1.33,
  D: 1.0,
  F: 0.0
};

export const DEGREE_REQUIREMENT_CGPA = 2.0;

export const GRADE_MARKS: Record<LetterGrade, string> = {
  A: '90-100',
  'A-': '86-89',
  'B+': '82-85',
  B: '78-81',
  'B-': '74-77',
  'C+': '70-73',
  C: '66-69',
  'C-': '62-65',
  'D+': '58-61',
  D: '55-57',
  F: '0-54'
};
