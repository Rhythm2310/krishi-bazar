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
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './components/Table';

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
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <Card padding="none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 style={{ margin: 0 }}>Semester GPA Calculator</h2>
            <Button variant="primary" size="sm" onClick={addCourse}>Add Course</Button>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex-col items-center justify-center" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
              </div>
              <p className="text-muted mb-4">No courses added yet.</p>
              <Button variant="secondary" onClick={addCourse}>Add your first course</Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Course Name</TableHeader>
                  <TableHeader>Credits</TableHeader>
                  <TableHeader>Grade</TableHeader>
                  <TableHeader align="center">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map(course => {
                  const rawCredits = rawInputStates[`${course.id}-credits`] ?? course.credits.toString();
                  const { error } = parseCreditInput(rawCredits);
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Input
                          type="text"
                          value={course.name}
                          onChange={e => updateCourse(course.id, 'name', e.target.value)}
                          aria-label={`Course name for ${course.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={rawCredits}
                          onChange={e => handleCreditChange(course.id, e.target.value)}
                          onBlur={() => handleCreditBlur(course.id, course.credits)}
                          error={error || undefined}
                          aria-label={`Credits for ${course.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={course.grade || ''}
                          onChange={e => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}
                          aria-label={`Grade for ${course.name}`}
                        >
                          <option value="" disabled>Select</option>
                          {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter} ({g.point.toFixed(2)})</option>)}
                        </Select>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourse(course.id)}
                          aria-label={`Remove ${course.name}`}
                          style={{ color: 'var(--accent-danger)' }}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <h3 className="mb-4">Results</h3>
          <div className="flex-col gap-2">
            <div className="flex justify-between items-center" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">GPA</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{gpa.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">Total Credits</span>
              <strong>{totalCredits}</strong>
            </div>
            <div className="flex justify-between items-center" style={{ paddingTop: 'var(--space-2)' }}>
              <span className="text-muted">Earned Credits</span>
              <strong>{earnedCredits}</strong>
            </div>
          </div>
          {hasF && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--accent-warning-bg)',
              color: 'var(--accent-warning-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem'
            }}>
              <strong>Warning:</strong> You have one or more failing grades (F). These count towards GPA but not earned credits.
            </div>
          )}
        </Card>

        <Card>
          <h4 className="mb-4">Grading Scale</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
            {GRADING_SCALE.map(g => (
              <div key={g.letter} className="flex justify-between" style={{ padding: 'var(--space-1) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 500 }}>{g.letter} ({g.point.toFixed(2)})</span>
                <span className="text-muted">{g.minMark}-{g.maxMark}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
