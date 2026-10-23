import type { CourseEntry, StudentRecord } from './types';
import { GRADING_SCALE } from '../data/gradingScale';
import { round2 } from './format';

export function computeGpa(courses: CourseEntry[]): { gpa: number; earnedCredits: number; totalCredits: number; hasF: boolean } {
  let totalGradePoints = 0;
  let gpaCredits = 0;
  let earnedCredits = 0;
  let totalCredits = 0;
  let hasF = false;

  for (const course of courses) {
    if (course.credits <= 0) continue;
    totalCredits += course.credits;
    if (!course.grade) continue;

    const gradeData = GRADING_SCALE.find(g => g.letter === course.grade);
    if (!gradeData) continue;

    gpaCredits += course.credits;
    totalGradePoints += gradeData.point * course.credits;

    if (gradeData.point >= 1.0) {
      earnedCredits += course.credits;
    }
    if (gradeData.letter === 'F') {
      hasF = true;
    }
  }

  const gpa = gpaCredits > 0 ? round2(totalGradePoints / gpaCredits) : 0;
  return { gpa, earnedCredits, totalCredits, hasF };
}

export function computeCgpa(record: StudentRecord, planned: CourseEntry[]): { newCgpa: number; totalCredits: number } {
  const currentTotalGradePoints = record.currentCgpa * record.completedCredits;
  let plannedGradePoints = 0;
  let plannedGpaCredits = 0;

  for (const course of planned) {
    if (course.credits <= 0 || !course.grade) continue;
    const gradeData = GRADING_SCALE.find(g => g.letter === course.grade);
    if (!gradeData) continue;

    plannedGpaCredits += course.credits;
    plannedGradePoints += gradeData.point * course.credits;
  }

  const totalCredits = record.completedCredits + plannedGpaCredits;
  const newCgpa = totalCredits > 0 ? round2((currentTotalGradePoints + plannedGradePoints) / totalCredits) : 0;
  return { newCgpa, totalCredits };
}

export function requiredTermGpa(record: StudentRecord, plannedCredits: number, targetCgpa: number): { required: number | null } {
  if (plannedCredits <= 0) return { required: null };
  const currentTotalGradePoints = record.currentCgpa * record.completedCredits;
  const totalCredits = record.completedCredits + plannedCredits;
  const targetTotalGradePoints = targetCgpa * totalCredits;
  const requiredPoints = targetTotalGradePoints - currentTotalGradePoints;
  const requiredGpa = round2(requiredPoints / plannedCredits);

  if (requiredGpa > 4.0) return { required: null };
  return { required: Math.max(0, requiredGpa) };
}
