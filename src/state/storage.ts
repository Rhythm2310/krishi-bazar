import type { CourseEntry, StudentRecord, Program } from '../domain/types';

const PREFIX = 'uiu-calc:v1:';
const KEY_GPA_COURSES = `${PREFIX}gpa-courses`;
const KEY_CGPA_RECORD = `${PREFIX}cgpa-record`;
const KEY_CGPA_PLANNED = `${PREFIX}cgpa-planned`;
const KEY_OVERRIDES = `${PREFIX}overrides`;

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Safe fallback if window or window.localStorage is undefined
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    keys: () => []
  };
}

export function loadGpaCourses(): CourseEntry[] {
  try {
    const data = getStorage().getItem(KEY_GPA_COURSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export function saveGpaCourses(courses: CourseEntry[]): void {
  try {
    getStorage().setItem(KEY_GPA_COURSES, JSON.stringify(courses));
  } catch (error) {
    // Swallow the error
  }
}

export function loadStudentRecord(): StudentRecord {
  try {
    const data = getStorage().getItem(KEY_CGPA_RECORD);
    return data ? JSON.parse(data) : { completedCredits: 0, currentCgpa: 0 };
  } catch (error) {
    return { completedCredits: 0, currentCgpa: 0 };
  }
}

export function saveStudentRecord(record: StudentRecord): void {
  try {
    getStorage().setItem(KEY_CGPA_RECORD, JSON.stringify(record));
  } catch (error) {
    // Swallow the error
  }
}

export function loadCgpaPlannedCourses(): CourseEntry[] {
  try {
    const data = getStorage().getItem(KEY_CGPA_PLANNED);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export function saveCgpaPlannedCourses(courses: CourseEntry[]): void {
  try {
    getStorage().setItem(KEY_CGPA_PLANNED, JSON.stringify(courses));
  } catch (error) {
    // Swallow the error
  }
}

export function loadFeeOverrides(): Record<string, Partial<Program>> {
  try {
    const data = getStorage().getItem(KEY_OVERRIDES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

export function saveFeeOverrides(overrides: Record<string, Partial<Program>>): void {
  try {
    getStorage().setItem(KEY_OVERRIDES, JSON.stringify(overrides));
  } catch (error) {
    // Swallow the error
  }
}

export function clearAllData(): void {
  try {
    const storage = getStorage();
    // Assuming Object.keys works with localStorage.
    // In actual browser, Object.keys(localStorage) returns keys.
    // mockStorage may need to implement this correctly if tested.
    const keys = Object.keys(typeof window !== 'undefined' && window.localStorage ? window.localStorage : {});
    keys.forEach(key => {
      if (key.startsWith(PREFIX)) {
        storage.removeItem(key);
      }
    });
  } catch (error) {
    // Swallow the error
  }
}
