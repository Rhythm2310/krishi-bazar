import type { CourseEntry, StudentRecord } from './types';
import { GRADING_SCALE } from '../data/gradingScale';
import { round2 } from './format';
import { sanitizeCredits, sanitizeCgpa, sanitizeCompletedCredits } from './sanitize';

export function computeGpa(courses: CourseEntry[]): { gpa: number; earnedCredits: number; totalCredits: number; hasF: boolean } {
  let totalGradePoints = 0;
  let gpaCredits = 0;
  let earnedCredits = 0;
  let totalCredits = 0;
  let hasF = false;

  for (const course of courses) {
    const credits = sanitizeCredits(course.credits);
    if (credits === 0) continue;
    totalCredits += credits;
    if (!course.grade) continue;

    const gradeData = GRADING_SCALE.find(g => g.letter === course.grade);
    if (!gradeData) continue;

    gpaCredits += credits;
    totalGradePoints += gradeData.point * credits;

    if (gradeData.point >= 1.0) {
      earnedCredits += credits;
    }
    if (gradeData.letter === 'F') {
      hasF = true;
    }
  }

  const gpa = gpaCredits > 0 ? round2(totalGradePoints / gpaCredits) : 0;
  return { gpa, earnedCredits, totalCredits, hasF };
}

export function computeCgpa(record: StudentRecord, planned: CourseEntry[]): { newCgpa: number; totalCredits: number } {
  const sCgpa = sanitizeCgpa(record.currentCgpa);
  const sCredits = sanitizeCompletedCredits(record.completedCredits);
  const currentTotalGradePoints = sCgpa * sCredits;
  let plannedGradePoints = 0;
  let plannedGpaCredits = 0;

  for (const course of planned) {
    const credits = sanitizeCredits(course.credits);
    if (credits === 0 || !course.grade) continue;
    const gradeData = GRADING_SCALE.find(g => g.letter === course.grade);
    if (!gradeData) continue;

    plannedGpaCredits += credits;
    plannedGradePoints += gradeData.point * credits;
  }

  const totalCredits = sCredits + plannedGpaCredits;
  const newCgpa = totalCredits > 0 ? round2((currentTotalGradePoints + plannedGradePoints) / totalCredits) : 0;
  return { newCgpa, totalCredits };
}

export function requiredTermGpa(record: StudentRecord, plannedCredits: number, targetCgpa: number): { required: number | null } {
  const sCgpa = sanitizeCgpa(record.currentCgpa);
  const sCredits = sanitizeCompletedCredits(record.completedCredits);
  const sPlanned = sanitizeCredits(plannedCredits);

  if (sPlanned === 0) return { required: null };

  const currentTotalGradePoints = sCgpa * sCredits;
  const totalCredits = sCredits + sPlanned;
  const targetTotalGradePoints = targetCgpa * totalCredits;
  const requiredPoints = targetTotalGradePoints - currentTotalGradePoints;
  const requiredGpa = round2(requiredPoints / sPlanned);

  if (requiredGpa > 4.0) return { required: null };
  return { required: Math.max(0, requiredGpa) };
}
