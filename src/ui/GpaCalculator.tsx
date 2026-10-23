import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeGpa } from '../domain/gpa';
import { loadGpaCourses, saveGpaCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';
import { parseCreditInput } from './parseInputs';

export default function GpaCalculator() {
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [rawInputStates, setRawInputStates] = useState<Record<string, string>>({});

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
    const newRaws = { ...rawInputStates };
    delete newRaws[`${id}-credits`];
    setRawInputStates(newRaws);
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    const updated = courses.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCourses(updated);
    saveGpaCourses(updated);
  };

  const handleCreditChange = (id: string, raw: string) => {
    setRawInputStates({ ...rawInputStates, [`${id}-credits`]: raw });
    const { value } = parseCreditInput(raw);
    updateCourse(id, 'credits', value);
  };

  const handleCreditBlur = (id: string, currentCredits: number) => {
    setRawInputStates({ ...rawInputStates, [`${id}-credits`]: currentCredits.toString() });
  };

  const { gpa, earnedCredits, totalCredits, hasF } = computeGpa(courses);

  return (
    <div className="card">
      <h2>Semester GPA Calculator</h2>

      {courses.length === 0 ? (
        <div className="mt-2" style={{ padding: '20px', background: 'var(--bg)', borderRadius: '4px', textAlign: 'center' }}>
          <p>No courses yet — add your first course to see your GPA.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>Course Name</th><th>Credits</th><th>Grade</th><th>Action</th></tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const rawCredits = rawInputStates[`${course.id}-credits`] ?? course.credits.toString();
              const { error } = parseCreditInput(rawCredits);
              return (
                <tr key={course.id}>
                  <td><input type="text" value={course.name} onChange={e => updateCourse(course.id, 'name', e.target.value)} /></td>
                  <td>
                    <input type="text" inputMode="decimal" value={rawCredits} onChange={e => handleCreditChange(course.id, e.target.value)} onBlur={() => handleCreditBlur(course.id, course.credits)} />
                    {error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{error}</div>}
                  </td>
                  <td>
                    <select value={course.grade || ''} onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}>
                      <option value="" disabled>Select</option>
                      {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter} ({g.point.toFixed(2)})</option>)}
                    </select>
                  </td>
                  <td><button className="danger" onClick={() => removeCourse(course.id)}>Remove</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="mt-1" onClick={addCourse}>Add Course</button>

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
