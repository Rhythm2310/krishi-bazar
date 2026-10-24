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
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './components/Table';

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
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <Card>
        <h2 className="mb-4">Current Standing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Input
            label="Completed Credits"
            type="text"
            inputMode="decimal"
            value={rawCompleted}
            onChange={e => handleCompletedChange(e.target.value)}
            onBlur={() => setRawCompleted(completedCredits.toString())}
            error={parseCompletedCreditsInput(rawCompleted).error || undefined}
          />
          <Input
            label="Current CGPA"
            type="text"
            inputMode="decimal"
            value={rawCgpa}
            onChange={e => handleCgpaChange(e.target.value)}
            onBlur={() => setRawCgpa(currentCgpa.toString())}
            error={parseCgpaInput(rawCgpa).error || undefined}
          />
        </div>
      </Card>

      <Card padding="none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 style={{ margin: 0 }}>Planned Courses</h3>
            <Button variant="primary" size="sm" onClick={addCourse}>Add Course</Button>
          </div>
        </CardHeader>
        <CardContent>
          {planned.length === 0 ? (
            <div className="flex-col items-center justify-center" style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
              <p className="text-muted mb-4">Add courses to project your upcoming CGPA.</p>
              <Button variant="secondary" onClick={addCourse}>Plan your first course</Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Course Name</TableHeader>
                  <TableHeader>Credits</TableHeader>
                  <TableHeader>Expected Grade</TableHeader>
                  <TableHeader align="center">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {planned.map(course => {
                  const rawCredits = rawPlannedCredits[`${course.id}-credits`] ?? course.credits.toString();
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
                          onBlur={() => setRawPlannedCredits({ ...rawPlannedCredits, [`${course.id}-credits`]: course.credits.toString() })}
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
                          {GRADING_SCALE.map(g => <option key={g.letter} value={g.letter}>{g.letter}</option>)}
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
          <h3 className="mb-4">Projected CGPA</h3>
          <div className="flex-col gap-2">
            <div className="flex justify-between items-center" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">New CGPA</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{newCgpa.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center" style={{ paddingTop: 'var(--space-2)' }}>
              <span className="text-muted">Total Credits</span>
              <strong>{totalCredits}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4">Goal Setting</h3>
          <Input
            label="Target CGPA"
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
          />
          {reqTarget && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              backgroundColor: reqTarget.required === null ? 'var(--accent-danger)' : 'var(--bg-subtle)',
              color: reqTarget.required === null ? 'white' : 'var(--text-main)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem'
            }}>
              {reqTarget.required === null
                ? <span><strong>Unreachable:</strong> Requires term GPA &gt; 4.00 or no planned credits.</span>
                : <span><strong>Required term GPA:</strong> <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{reqTarget.required.toFixed(2)}</span></span>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
