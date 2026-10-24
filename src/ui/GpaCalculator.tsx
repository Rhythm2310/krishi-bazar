import { useState, useEffect } from 'react';
import type { CourseEntry, GradeLetter } from '../domain/types';
import { computeGpa } from '../domain/gpa';
import { loadGpaCourses, saveGpaCourses } from '../state/storage';
import { GRADING_SCALE } from '../data/gradingScale';
import { parseCreditInput } from './parseInputs';
import { Card, CardHeader, CardContent } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';

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
    <div className="flex-col gap-4">
      {/* Results Overview - Pinned to top for quick visibility */}
      <div className="flex gap-4 mb-2 animate-in" style={{ animationDelay: '100ms' }}>
        <Card className="w-full flex-col justify-center items-center py-4" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
          <span className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Semester GPA</span>
          <span className="font-data" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1 }}>
            {gpa.toFixed(2)}
          </span>
        </Card>
        <Card className="w-full flex-col justify-center items-center py-4">
          <span className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Credits</span>
          <div className="flex items-baseline gap-1 font-data">
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{earnedCredits}</span>
            <span className="text-muted">/ {totalCredits}</span>
          </div>
        </Card>
      </div>

      {hasF && (
        <div className="mb-2 animate-in" style={{ animationDelay: '150ms' }}>
          <div style={{
            backgroundColor: 'var(--bg-danger)',
            color: 'var(--text-danger)',
            border: '1px solid #fca5a5',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem'
          }}>
            <strong className="font-bold">Warning:</strong> Failing grades (F) count towards GPA but not earned credits.
          </div>
        </div>
      )}

      <Card padding="none" className="animate-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex justify-between items-center bg-transparent border-b-0 pb-0">
          <h2 style={{ margin: 0 }}>Courses</h2>
          <Button variant="ghost" onClick={addCourse} style={{ color: 'var(--accent-primary)', padding: '4px 8px' }}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex-col items-center justify-center py-8 text-center">
              <p className="text-muted mb-4">No courses added yet.</p>
              <Button variant="primary" onClick={addCourse}>Add your first course</Button>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {courses.map(course => {
                const rawCredits = rawInputStates[`${course.id}-credits`] ?? course.credits.toString();
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
                        onBlur={() => handleCreditBlur(course.id, course.credits)}
                        error={error || undefined}
                        aria-label={`Credits for ${course.name}`}
                        style={{ textAlign: 'center' }}
                      />
                    </div>
                    <div className="flex-col gap-1 w-full" style={{ flex: 1.5 }}>
                      <label className="text-xs text-muted font-bold uppercase tracking-wider pl-1">Grade</label>
                      <Select
                        value={course.grade || ''}
                        onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}
                        aria-label={`Grade for ${course.name}`}
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
