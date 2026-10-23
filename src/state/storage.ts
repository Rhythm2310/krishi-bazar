import type { CourseEntry, StudentRecord, Program } from '../domain/types';

const PREFIX = 'uiu-calc:v1:';
const KEY_GPA_COURSES = `${PREFIX}gpa-courses`;
const KEY_CGPA_RECORD = `${PREFIX}cgpa-record`;
const KEY_CGPA_PLANNED = `${PREFIX}cgpa-planned`;
const KEY_OVERRIDES = `${PREFIX}overrides`;

export function loadGpaCourses(): CourseEntry[] {
  const data = localStorage.getItem(KEY_GPA_COURSES);
  return data ? JSON.parse(data) : [];
}

export function saveGpaCourses(courses: CourseEntry[]): void {
  localStorage.setItem(KEY_GPA_COURSES, JSON.stringify(courses));
}

export function loadStudentRecord(): StudentRecord {
  const data = localStorage.getItem(KEY_CGPA_RECORD);
  return data ? JSON.parse(data) : { completedCredits: 0, currentCgpa: 0 };
}

export function saveStudentRecord(record: StudentRecord): void {
  localStorage.setItem(KEY_CGPA_RECORD, JSON.stringify(record));
}

export function loadCgpaPlannedCourses(): CourseEntry[] {
  const data = localStorage.getItem(KEY_CGPA_PLANNED);
  return data ? JSON.parse(data) : [];
}

export function saveCgpaPlannedCourses(courses: CourseEntry[]): void {
  localStorage.setItem(KEY_CGPA_PLANNED, JSON.stringify(courses));
}

export function loadFeeOverrides(): Record<string, Partial<Program>> {
  const data = localStorage.getItem(KEY_OVERRIDES);
  return data ? JSON.parse(data) : {};
}

export function saveFeeOverrides(overrides: Record<string, Partial<Program>>): void {
  localStorage.setItem(KEY_OVERRIDES, JSON.stringify(overrides));
}

export function clearAllData(): void {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
