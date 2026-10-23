import type { Grade } from '../domain/types';

// Grading scale accessed 2026-10-23
// Source: https://www.uiu.ac.bd/academics/grading-performance-evaluation/
export const GRADING_SCALE: Grade[] = [
  { letter: 'A', point: 4.00, minMark: 90, maxMark: 100, assessment: 'Outstanding' },
  { letter: 'A-', point: 3.67, minMark: 86, maxMark: 89, assessment: 'Excellent' },
  { letter: 'B+', point: 3.33, minMark: 82, maxMark: 85, assessment: 'Very Good' },
  { letter: 'B', point: 3.00, minMark: 78, maxMark: 81, assessment: 'Good' },
  { letter: 'B-', point: 2.67, minMark: 74, maxMark: 77, assessment: 'Above Average' },
  { letter: 'C+', point: 2.33, minMark: 70, maxMark: 73, assessment: 'Average' },
  { letter: 'C', point: 2.00, minMark: 66, maxMark: 69, assessment: 'Below Average' },
  { letter: 'C-', point: 1.67, minMark: 62, maxMark: 65, assessment: 'Poor' },
  { letter: 'D+', point: 1.33, minMark: 58, maxMark: 61, assessment: 'Very poor' },
  { letter: 'D', point: 1.00, minMark: 55, maxMark: 57, assessment: 'Pass' },
  { letter: 'F', point: 0.00, minMark: 0, maxMark: 54, assessment: 'Fail' }
];
