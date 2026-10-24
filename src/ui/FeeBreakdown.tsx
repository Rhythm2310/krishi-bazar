import { useState, useEffect } from 'react';
import type { CourseEntry, Program } from '../domain/types';
import { computeTermFee, computeDegreeTotal } from '../domain/fees';
import { formatBdt } from '../domain/format';
import { loadFeeOverrides } from '../state/storage';
import { PROGRAMS } from '../data/programs';
import { parseCreditInput, parseWaiverInput } from './parseInputs';
import { Card, CardHeader, CardContent } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './components/Table';

export default function FeeBreakdown() {
  const [selectedProgramCode, setSelectedProgramCode] = useState<string>(PROGRAMS[0].code);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [waiverPct, setWaiverPct] = useState<number>(0);
  const [overrides, setOverrides] = useState<Record<string, Partial<Program>>>({});

  const [rawWaiver, setRawWaiver] = useState<string>('0');
  const [rawCredits, setRawCredits] = useState<Record<string, string>>({});
  const [isCustomWaiver, setIsCustomWaiver] = useState<boolean>(false);

  useEffect(() => {
    setOverrides(loadFeeOverrides());
  }, []);

  const getProgram = (): Program => {
    const base = PROGRAMS.find(p => p.code === selectedProgramCode)!;
    const override = overrides[base.code];
    return override ? { ...base, ...override } : base;
  };

  const program = getProgram();

  const addCourse = () => {
    const newCourse: CourseEntry = { id: nextId.toString(), name: `Course ${nextId}`, credits: 3, grade: null, isRetake: false, retakeFirstTime: false, waiverIneligible: false };
    setCourses([...courses, newCourse]);
    setNextId(nextId + 1);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
    const newRaws = { ...rawCredits };
    delete newRaws[`${id}-credits`];
    setRawCredits(newRaws);
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleWaiverSelect = (val: string) => {
    if (val === 'custom') {
      setIsCustomWaiver(true);
    } else {
      setIsCustomWaiver(false);
      const num = parseInt(val);
      setWaiverPct(num);
      setRawWaiver(val);
    }
  };

  const handleCustomWaiverChange = (raw: string) => {
    setRawWaiver(raw);
    const { value } = parseWaiverInput(raw);
    setWaiverPct(value);
  };

  const handleCreditChange = (id: string, raw: string) => {
    setRawCredits({ ...rawCredits, [`${id}-credits`]: raw });
    const { value } = parseCreditInput(raw);
    updateCourse(id, 'credits', value);
  };

  const termFeeData = computeTermFee(program, courses, waiverPct);
  const degreeTotalData = computeDegreeTotal(program);

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <Card>
        <h2 className="mb-4">Fee Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            label="Program"
            value={selectedProgramCode}
            onChange={e => setSelectedProgramCode(e.target.value)}
          >
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </Select>

          <Select
            label="Waiver %"
            value={isCustomWaiver ? 'custom' : waiverPct}
            onChange={e => handleWaiverSelect(e.target.value)}
          >
            <option value="0">0%</option>
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="100">100%</option>
            <option value="custom">Custom...</option>
          </Select>

          {isCustomWaiver && (
            <Input
              label="Custom Waiver (%)"
              type="text"
              inputMode="decimal"
              value={rawWaiver}
              onChange={e => handleCustomWaiverChange(e.target.value)}
              onBlur={() => setRawWaiver(waiverPct !== null && waiverPct !== undefined ? waiverPct.toString() : '0')}
              error={parseWaiverInput(rawWaiver).error || undefined}
            />
          )}
        </div>
      </Card>

      <Card padding="none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 style={{ margin: 0 }}>Term Courses</h3>
            <Button variant="primary" size="sm" onClick={addCourse}>Add Course</Button>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex-col items-center justify-center" style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
              <p className="text-muted mb-4">Add courses to see your term fee breakdown.</p>
              <Button variant="secondary" onClick={addCourse}>Add first course</Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Course</TableHeader>
                    <TableHeader>Credits</TableHeader>
                    <TableHeader align="center">Retake?</TableHeader>
                    <TableHeader align="center">1st Time?</TableHeader>
                    <TableHeader align="center">No Waiver?</TableHeader>
                    <TableHeader align="center">Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map(course => {
                    const raw = rawCredits[`${course.id}-credits`] ?? course.credits.toString();
                    const { error } = parseCreditInput(raw);
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
                            value={raw}
                            onChange={e => handleCreditChange(course.id, e.target.value)}
                            onBlur={() => setRawCredits({ ...rawCredits, [`${course.id}-credits`]: course.credits.toString() })}
                            error={error || undefined}
                            aria-label={`Credits for ${course.name}`}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <input
                            type="checkbox"
                            checked={course.isRetake}
                            onChange={e => updateCourse(course.id, 'isRetake', e.target.checked)}
                            aria-label={`Is ${course.name} a retake?`}
                            style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {course.isRetake && (
                            <input
                              type="checkbox"
                              checked={course.retakeFirstTime}
                              onChange={e => updateCourse(course.id, 'retakeFirstTime', e.target.checked)}
                              aria-label={`Is this the first retake for ${course.name}?`}
                              style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px' }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <input
                            type="checkbox"
                            checked={course.waiverIneligible}
                            onChange={e => updateCourse(course.id, 'waiverIneligible', e.target.checked)}
                            aria-label={`Is ${course.name} ineligible for waiver?`}
                            style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px' }}
                          />
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
            </div>
          )}
        </CardContent>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <h3 className="mb-4">Term Breakdown</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4) 0', fontSize: '0.875rem' }}>
            {termFeeData.lines.map((line, idx) => (
              <li key={idx} className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', color: line.isSub ? 'var(--accent-danger)' : 'inherit' }}>
                <span>{line.label}</span>
                <span>{line.isSub ? '-' : ''}{formatBdt(line.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center" style={{ paddingTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Total</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{formatBdt(termFeeData.total)}</strong>
          </div>

          <h4 className="mb-2 text-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installments</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
            {termFeeData.installments.map((inst, idx) => (
              <li key={idx} className="flex justify-between text-muted" style={{ padding: 'var(--space-1) 0' }}>
                <span>Installment {idx + 1}</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatBdt(inst)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <h3 className="mb-4">Degree Estimate</h3>
          <p className="text-muted text-sm mb-4">Total estimated cost without waivers based on current program fees.</p>

          <div className="flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-muted">Computed Total</span>
              <strong style={{ fontSize: '1.25rem' }}>{formatBdt(degreeTotalData.computed)}</strong>
            </div>

            {degreeTotalData.published && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted">Official Published</span>
                <span style={{ fontWeight: 500 }}>{formatBdt(degreeTotalData.published)}</span>
              </div>
            )}
          </div>

          {!degreeTotalData.matches && degreeTotalData.published && (
            <div style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--accent-warning-bg)',
              color: 'var(--accent-warning-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              border: '1px solid var(--accent-warning-border)'
            }}>
              <strong>Note:</strong> Computed total differs from official published total. This can happen due to non-credit foundational courses, lab fees, or specific policy nuances not captured by simple credit multiplication.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
