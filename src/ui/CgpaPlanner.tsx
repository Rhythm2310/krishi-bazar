import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeCgpa, requiredTermGpa } from '../domain/gpa';
import { loadStudentRecord, saveStudentRecord, loadCgpaPlannedCourses, saveCgpaPlannedCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';
import { parseCompletedCreditsInput, parseCgpaInput, parseCreditInput } from './parseInputs';
import { Card, CardHeader, CardContent } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';

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
    <div className="flex-col gap-4">
      {/* Current Standing Section */}
      <Card className="animate-in" style={{ animationDelay: '100ms', backgroundColor: 'var(--bg-surface)' }}>
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Current Standing</h2>
        <div className="flex gap-4">
          <div className="w-full">
            <Input
              label="Credits"
              type="text"
              inputMode="decimal"
              value={rawCompleted}
              onChange={e => handleCompletedChange(e.target.value)}
              onBlur={() => setRawCompleted(completedCredits.toString())}
              error={parseCompletedCreditsInput(rawCompleted).error || undefined}
              style={{ textAlign: 'center' }}
            />
          </div>
          <div className="w-full">
            <Input
              label="CGPA"
              type="text"
              inputMode="decimal"
              value={rawCgpa}
              onChange={e => handleCgpaChange(e.target.value)}
              onBlur={() => setRawCgpa(currentCgpa.toString())}
              error={parseCgpaInput(rawCgpa).error || undefined}
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>
      </Card>

      {/* Target Planning Section */}
      <Card className="animate-in" style={{ animationDelay: '150ms', backgroundColor: 'var(--bg-surface-hover)' }}>
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-xs font-bold text-muted uppercase tracking-widest m-0">Projected CGPA</h2>
           {reqTarget && reqTarget.required !== null && (
              <span className="text-xs font-medium text-muted">
                Need <strong style={{ color: 'var(--text-main)' }}>{reqTarget.required.toFixed(2)}</strong> this term
              </span>
           )}
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex-col w-full">
             <span className="font-data" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1 }}>
                {newCgpa.toFixed(2)}
             </span>
             <span className="text-xs text-muted mt-1 font-data">Total Credits: {totalCredits}</span>
          </div>

          <div className="w-full flex-col gap-2">
            <Input
              label="Goal CGPA (Optional)"
              type="text"
              inputMode="decimal"
              value={rawTargetCgpa}
              onChange={e => setRawTargetCgpa(e.target.value)}
              onBlur={() => {
                if (rawTargetCgpa.trim() !== '') {
                   const parsed = parseCgpaInput(rawTargetCgpa);
                   setRawTargetCgpa(parsed.error ? '' : (parsed.value !== null && parsed.value !== undefined ? parsed.value.toString() : ''));
                }
              }}
              error={rawTargetCgpa.trim() !== '' ? (parseCgpaInput(rawTargetCgpa).error || undefined) : undefined}
              placeholder="e.g. 3.50"
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>
        {reqTarget && reqTarget.required === null && (
          <div className="mt-3 text-xs text-danger font-medium p-2 rounded bg-danger" style={{ backgroundColor: 'var(--bg-danger)' }}>
            Unreachable: Requires term GPA &gt; 4.00 or no planned credits.
          </div>
        )}
      </Card>

      {/* Planned Courses Section */}
      <Card padding="none" className="animate-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex justify-between items-center bg-transparent border-b-0 pb-0">
          <h2 style={{ margin: 0 }} className="text-sm font-bold text-main">Planned Courses</h2>
          <Button variant="ghost" onClick={addCourse} style={{ color: 'var(--accent-primary)', padding: '4px 8px' }}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {planned.length === 0 ? (
            <div className="flex-col items-center justify-center py-8 text-center">
              <p className="text-muted mb-4">Add courses to project your upcoming CGPA.</p>
              <Button variant="primary" onClick={addCourse}>Plan your first course</Button>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {planned.map(course => {
                const rawCredits = rawPlannedCredits[`${course.id}-credits`] ?? course.credits.toString();
                const { error } = parseCreditInput(rawCredits);
                return (
                  <div key={course.id} className="flex gap-2 items-start bg-page p-2 rounded-md border border-subtle" style={{ backgroundColor: 'var(--bg-page)' }}>
                    <div className="flex-col gap-1 w-full" style={{ flex: 2 }}>
                      <label className="sr-only">Course Name</label>
                      <Input
                        type="text"
                        value={course.name}
                        onChange={e => updateCourse(course.id, 'name', e.target.value)}
                        placeholder="Course Name"
                        aria-label={`Course name for ${course.name}`}
                        style={{ border: 'none', backgroundColor: 'transparent', padding: '4px 0', fontSize: '1rem', fontWeight: 500, boxShadow: 'none' }}
                      />
                    </div>
                    <div className="flex-col gap-1 w-full" style={{ flex: 1 }}>
                      <label className="text-xs text-muted font-bold uppercase tracking-wider pl-1">Cr</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={rawCredits}
                        onChange={e => handleCreditChange(course.id, e.target.value)}
                        onBlur={() => setRawPlannedCredits({ ...rawPlannedCredits, [`${course.id}-credits`]: course.credits.toString() })}
                        error={error || undefined}
                        aria-label={`Credits for ${course.name}`}
                        style={{ textAlign: 'center' }}
                      />
                    </div>
                    <div className="flex-col gap-1 w-full" style={{ flex: 1.5 }}>
                      <label className="text-xs text-muted font-bold uppercase tracking-wider pl-1">Expected</label>
                      <Select
                        value={course.grade || ''}
                        onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}
                        aria-label={`Expected Grade for ${course.name}`}
                      >
                        <option value="" disabled>-</option>
                        {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter}</option>)}
                      </Select>
                    </div>
                    <div className="flex items-end justify-center pt-5">
                      <button
                        onClick={() => removeCourse(course.id)}
                        aria-label={`Remove ${course.name}`}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Remove"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
