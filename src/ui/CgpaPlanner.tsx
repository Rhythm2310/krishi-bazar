import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeCgpa, requiredTermGpa } from '../domain/gpa';
import { loadStudentRecord, saveStudentRecord, loadCgpaPlannedCourses, saveCgpaPlannedCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';
import { parseCompletedCreditsInput, parseCgpaInput, parseCreditInput } from './parseInputs';

export default function CgpaPlanner() {
  const [completedCredits, setCompletedCredits] = useState<number>(0);
  const [currentCgpa, setCurrentCgpa] = useState<number>(0);
  const [planned, setPlanned] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const [rawCompleted, setRawCompleted] = useState<string>('0');
  const [rawCgpa, setRawCgpa] = useState<string>('0');
  const [rawTargetCgpa, setRawTargetCgpa] = useState<string>('');
  const [rawPlannedCredits, setRawPlannedCredits] = useState<Record<string, string>>({});

  useEffect(() => {
    const record = loadStudentRecord();
    setCompletedCredits(record.completedCredits);
    setRawCompleted(record.completedCredits.toString());
    setCurrentCgpa(record.currentCgpa);
    setRawCgpa(record.currentCgpa.toString());

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

  const removeCourse = (id: string) => {
    updatePlanned(planned.filter(c => c.id !== id));
    const newRaws = { ...rawPlannedCredits };
    delete newRaws[`${id}-credits`];
    setRawPlannedCredits(newRaws);
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    updatePlanned(planned.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleCompletedChange = (raw: string) => {
    setRawCompleted(raw);
    const { value } = parseCompletedCreditsInput(raw);
    saveRecord(value, currentCgpa);
  };

  const handleCgpaChange = (raw: string) => {
    setRawCgpa(raw);
    const { value } = parseCgpaInput(raw);
    saveRecord(completedCredits, value);
  };

  const handleCreditChange = (id: string, raw: string) => {
    setRawPlannedCredits({ ...rawPlannedCredits, [`${id}-credits`]: raw });
    const { value } = parseCreditInput(raw);
    updateCourse(id, 'credits', value);
  };

  const { newCgpa, totalCredits } = computeCgpa({ completedCredits, currentCgpa }, planned);
  const plannedCredits = planned.reduce((acc, c) => acc + c.credits, 0);

  const parsedTargetCgpa = parseCgpaInput(rawTargetCgpa);
  const reqTarget = rawTargetCgpa.trim() !== '' && parsedTargetCgpa.error === null
    ? requiredTermGpa({ completedCredits, currentCgpa }, plannedCredits, parsedTargetCgpa.value)
    : null;

  return (
    <div className="card">
      <h2>CGPA Planner</h2>
      <div className="flex mt-1">
        <label>
          Completed Credits:
          <input type="text" inputMode="decimal" value={rawCompleted} onChange={e => handleCompletedChange(e.target.value)} onBlur={() => setRawCompleted(completedCredits.toString())} />
          {parseCompletedCreditsInput(rawCompleted).error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{parseCompletedCreditsInput(rawCompleted).error}</div>}
        </label>
        <label>
          Current CGPA:
          <input type="text" inputMode="decimal" value={rawCgpa} onChange={e => handleCgpaChange(e.target.value)} onBlur={() => setRawCgpa(currentCgpa.toString())} />
          {parseCgpaInput(rawCgpa).error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{parseCgpaInput(rawCgpa).error}</div>}
        </label>
      </div>
      <h3 className="mt-2">Planned Courses</h3>

      {planned.length === 0 ? (
        <div className="mt-2" style={{ padding: '20px', background: 'var(--bg)', borderRadius: '4px', textAlign: 'center' }}>
          <p>Add the courses you plan to take this term to project your CGPA.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>Course Name</th><th>Credits</th><th>Expected Grade</th><th>Action</th></tr>
          </thead>
          <tbody>
            {planned.map(course => {
              const rawCredits = rawPlannedCredits[`${course.id}-credits`] ?? course.credits.toString();
              const { error } = parseCreditInput(rawCredits);
              return (
                <tr key={course.id}>
                  <td><input type="text" value={course.name} onChange={e => updateCourse(course.id, 'name', e.target.value)} /></td>
                  <td>
                    <input type="text" inputMode="decimal" value={rawCredits} onChange={e => handleCreditChange(course.id, e.target.value)} onBlur={() => setRawPlannedCredits({ ...rawPlannedCredits, [`${course.id}-credits`]: course.credits.toString() })} />
                    {error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{error}</div>}
                  </td>
                  <td>
                    <select value={course.grade || ''} onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}>
                      <option value="" disabled>Select</option>
                      {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter}</option>)}
                    </select>
                  </td>
                  <td><button className="danger" onClick={() => removeCourse(course.id)}>Remove</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="mt-1" onClick={addCourse}>Add Planned Course</button>

      <div className="mt-2">
        <h3>Projected CGPA</h3>
        <p><strong>New CGPA:</strong> {newCgpa.toFixed(2)}</p>
        <p><strong>Total Credits:</strong> {totalCredits}</p>
      </div>

      <div className="mt-2" style={{borderTop: '1px solid #dee2e6', paddingTop: '10px'}}>
        <h3>Target CGPA</h3>
        <label>
          Target:
          <input type="text" inputMode="decimal" value={rawTargetCgpa} onChange={e => setRawTargetCgpa(e.target.value)} onBlur={() => {
            if (rawTargetCgpa.trim() !== '') {
               const parsed = parseCgpaInput(rawTargetCgpa);
               setRawTargetCgpa(parsed.error ? '' : parsed.value.toString());
            }
          }} />
          {rawTargetCgpa.trim() !== '' && parseCgpaInput(rawTargetCgpa).error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{parseCgpaInput(rawTargetCgpa).error}</div>}
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
