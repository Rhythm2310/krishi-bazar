import type { CourseEntry, GpaResult, LetterGrade } from '../contracts';
import { GRADE_POINTS } from '../data';

export function gradePoint(grade: LetterGrade): number {
  return GRADE_POINTS[grade];
}

export function calculateTermGpa(courses: CourseEntry[]): GpaResult {
  if (courses.length === 0) {
    return { termGpa: 0, earnedCredits: 0, totalCredits: 0 };
  }

  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;

  for (const course of courses) {
    totalCredits += course.credits;
    if (course.grade !== 'F') {
      earnedCredits += course.credits;
    }
    totalGradePoints += course.credits * gradePoint(course.grade);
  }

  const termGpa = totalCredits === 0 ? 0 : totalGradePoints / totalCredits;

  return { termGpa, earnedCredits, totalCredits };
}
