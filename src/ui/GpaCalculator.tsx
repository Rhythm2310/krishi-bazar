import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeGpa } from '../domain/gpa';
import { loadGpaCourses, saveGpaCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';

export default function GpaCalculator() {
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const loaded = loadGpaCourses();
    setCourses(loaded);
    if (loaded.length > 0) {
      setNextId(Math.max(...loaded.map(c => parseInt(c.id))) + 1);
    }
  }, []);

  const addCourse = () => {
    const newCourse: CourseEntry = { id: nextId.toString(), name: `Course ${nextId}`, credits: 3, grade: 'A', isRetake: false, retakeFirstTime: false, waiverIneligible: false };
    const updated = [...courses, newCourse];
    setCourses(updated);
    saveGpaCourses(updated);
    setNextId(nextId + 1);
  };

  const removeCourse = (id: string) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    saveGpaCourses(updated);
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    const updated = courses.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCourses(updated);
    saveGpaCourses(updated);
  };

  const { gpa, earnedCredits, totalCredits, hasF } = computeGpa(courses);

  return (
    <div className="card">
      <h2>Semester GPA Calculator</h2>
      <table>
        <thead>
          <tr><th>Course Name</th><th>Credits</th><th>Grade</th><th>Action</th></tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.id}>
              <td><input type="text" value={course.name} onChange={e => updateCourse(course.id, 'name', e.target.value)} /></td>
              <td><input type="number" min="0.5" max="6" step="0.5" value={course.credits} onChange={e => updateCourse(course.id, 'credits', parseFloat(e.target.value))} /></td>
              <td>
                <select value={course.grade || ''} onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}>
                  <option value="" disabled>Select</option>
                  {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter} ({g.point.toFixed(2)})</option>)}
                </select>
              </td>
              <td><button className="danger" onClick={() => removeCourse(course.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addCourse}>Add Course</button>
      <div className="mt-2">
        <h3>Results</h3>
        <p><strong>GPA:</strong> {gpa.toFixed(2)}</p>
        <p><strong>Total Credits:</strong> {totalCredits}</p>
        <p><strong>Earned Credits:</strong> {earnedCredits}</p>
        {hasF && <div className="warning">Warning: You have one or more failing grades (F). These count towards GPA but not earned credits.</div>}
      </div>
      <div className="mt-2">
        <h4>Grading Scale</h4>
        <div style={{ fontSize: '0.9em', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {GRADING_SCALE.map(g => <span key={g.letter}>{g.letter}: {g.point.toFixed(2)} ({g.minMark}-{g.maxMark})</span>)}
        </div>
      </div>
    </div>
  );
}
