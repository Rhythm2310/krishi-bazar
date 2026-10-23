import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeCgpa, requiredTermGpa } from '../domain/gpa';
import { loadStudentRecord, saveStudentRecord, loadCgpaPlannedCourses, saveCgpaPlannedCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';

export default function CgpaPlanner() {
  const [completedCredits, setCompletedCredits] = useState<number>(0);
  const [currentCgpa, setCurrentCgpa] = useState<number>(0);
  const [planned, setPlanned] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [targetCgpa, setTargetCgpa] = useState<number | ''>('');

  useEffect(() => {
    const record = loadStudentRecord();
    setCompletedCredits(record.completedCredits);
    setCurrentCgpa(record.currentCgpa);
    const p = loadCgpaPlannedCourses();
    setPlanned(p);
    if (p.length > 0) {
      setNextId(Math.max(...p.map(c => parseInt(c.id))) + 1);
    }
  }, []);

  const saveRecord = (credits: number, cgpa: number) => {
    setCompletedCredits(credits);
    setCurrentCgpa(cgpa);
    saveStudentRecord({ completedCredits: credits, currentCgpa: cgpa });
  };

  const updatePlanned = (updated: CourseEntry[]) => {
    setPlanned(updated);
    saveCgpaPlannedCourses(updated);
  };

  const addCourse = () => {
    const newCourse: CourseEntry = { id: nextId.toString(), name: `Course ${nextId}`, credits: 3, grade: 'A', isRetake: false, retakeFirstTime: false, waiverIneligible: false };
    updatePlanned([...planned, newCourse]);
    setNextId(nextId + 1);
  };

  const removeCourse = (id: string) => updatePlanned(planned.filter(c => c.id !== id));

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    updatePlanned(planned.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const { newCgpa, totalCredits } = computeCgpa({ completedCredits, currentCgpa }, planned);
  const plannedCredits = planned.reduce((acc, c) => acc + c.credits, 0);

  const reqTarget = targetCgpa !== '' ? requiredTermGpa({ completedCredits, currentCgpa }, plannedCredits, targetCgpa) : null;

  return (
    <div className="card">
      <h2>CGPA Planner</h2>
      <div className="flex mt-1">
        <label>
          Completed Credits:
          <input type="number" min="0" step="0.5" value={completedCredits} onChange={e => saveRecord(parseFloat(e.target.value) || 0, currentCgpa)} />
        </label>
        <label>
          Current CGPA:
          <input type="number" min="0" max="4" step="0.01" value={currentCgpa} onChange={e => saveRecord(completedCredits, parseFloat(e.target.value) || 0)} />
        </label>
      </div>
      <h3 className="mt-2">Planned Courses</h3>
      <table>
        <thead>
          <tr><th>Course Name</th><th>Credits</th><th>Expected Grade</th><th>Action</th></tr>
        </thead>
        <tbody>
          {planned.map(course => (
            <tr key={course.id}>
              <td><input type="text" value={course.name} onChange={e => updateCourse(course.id, 'name', e.target.value)} /></td>
              <td><input type="number" min="0.5" max="6" step="0.5" value={course.credits} onChange={e => updateCourse(course.id, 'credits', parseFloat(e.target.value) || 0)} /></td>
              <td>
                <select value={course.grade || ''} onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}>
                  <option value="" disabled>Select</option>
                  {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter}</option>)}
                </select>
              </td>
              <td><button className="danger" onClick={() => removeCourse(course.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addCourse}>Add Planned Course</button>

      <div className="mt-2">
        <h3>Projected CGPA</h3>
        <p><strong>New CGPA:</strong> {newCgpa.toFixed(2)}</p>
        <p><strong>Total Credits:</strong> {totalCredits}</p>
      </div>

      <div className="mt-2" style={{borderTop: '1px solid #dee2e6', paddingTop: '10px'}}>
        <h3>Target CGPA</h3>
        <label>
          Target:
          <input type="number" min="0" max="4" step="0.01" value={targetCgpa} onChange={e => setTargetCgpa(e.target.value === '' ? '' : parseFloat(e.target.value))} />
        </label>
        {reqTarget && (
          <p className="mt-1">
            {reqTarget.required === null
              ? <span className="error">Unreachable target (requires GPA &gt; 4.00 or no planned credits)</span>
              : <strong>Required term GPA: {reqTarget.required.toFixed(2)}</strong>}
          </p>
        )}
      </div>
    </div>
  );
}
