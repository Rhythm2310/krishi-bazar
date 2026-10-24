import { useState, useEffect } from 'react';
import type { CourseEntry } from '../domain/types';
import { PROGRAMS } from '../data/programs';
import { computeTermFee, computeDegreeTotal } from '../domain/fees';
import { loadCgpaPlannedCourses, saveCgpaPlannedCourses, loadFeeOverrides } from '../state/storage';
import { parseWaiverInput, parseCreditInput } from './parseInputs';
import { Card, CardHeader, CardContent } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';

const formatBdt = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function FeeBreakdown() {
  const [selectedProgramCode, setSelectedProgramCode] = useState<string>(PROGRAMS[0].code);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [waiverPct, setWaiverPct] = useState<number>(0);
  const [isCustomWaiver, setIsCustomWaiver] = useState(false);
  const [rawWaiver, setRawWaiver] = useState<string>('0');
  const [rawCredits, setRawCredits] = useState<Record<string, string>>({});
  const [hasOverrides, setHasOverrides] = useState(false);

  useEffect(() => {
    // Note: Reusing the CGPA planned courses for the fee breakdown as per original logic.
    // However, if there was a separate loadFeePlannedCourses, it doesn't exist in storage.ts
    // In original code it likely shared or there was a mistake. We will use a local state initialized empty if they were meant to be separate,
    // or just use cgpa planned courses if that was the intent. Actually looking at original code it might have been missing.
    // Let's use loadCgpaPlannedCourses to avoid compile errors and match available storage API.
    const c = loadCgpaPlannedCourses();
    setCourses(c);
    if (c.length > 0) {
      setNextId(Math.max(...c.map((course: CourseEntry) => parseInt(course.id))) + 1);
    }
    const overrides = loadFeeOverrides();
    setHasOverrides(Object.keys(overrides).length > 0);
  }, []);

  const programBase = PROGRAMS.find(p => p.code === selectedProgramCode);
  if (!programBase) return <div>Program not found</div>;

  // Apply overrides if any
  const overrides = loadFeeOverrides()[selectedProgramCode] || {};
  const program = { ...programBase, ...overrides };

  const updateCourses = (updated: CourseEntry[]) => {
    setCourses(updated);
    saveCgpaPlannedCourses(updated);
  };

  const addCourse = () => {
    const newCourse: CourseEntry = { id: nextId.toString(), name: `Course ${nextId}`, credits: 3, grade: 'A', isRetake: false, retakeFirstTime: false, waiverIneligible: false };
    updateCourses([...courses, newCourse]);
    setNextId(nextId + 1);
  };

  const removeCourse = (id: string) => {
    updateCourses(courses.filter(c => c.id !== id));
    const newRaws = { ...rawCredits };
    delete newRaws[`${id}-credits`];
    setRawCredits(newRaws);
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    updateCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleWaiverSelect = (val: string) => {
    if (val === 'custom') {
      setIsCustomWaiver(true);
    } else {
      setIsCustomWaiver(false);
      setWaiverPct(parseFloat(val));
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
    <div className="flex-col gap-4">
      {/* Settings Panel */}
      <Card className="animate-in" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest m-0">Parameters</h2>
          {hasOverrides && <span className="text-xs text-warning font-bold uppercase">Overrides Active</span>}
        </div>

        <div className="flex gap-4">
          <div className="w-full">
            <Select
              label="Program"
              value={selectedProgramCode}
              onChange={e => setSelectedProgramCode(e.target.value)}
            >
              {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
            </Select>
          </div>
          <div className="w-full flex gap-2">
            <div className="w-full">
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
            </div>
            {isCustomWaiver && (
              <div className="w-full animate-in" style={{ animationName: 'fadeIn' }}>
                <Input
                  label="Amount"
                  type="text"
                  inputMode="decimal"
                  value={rawWaiver}
                  onChange={e => handleCustomWaiverChange(e.target.value)}
                  onBlur={() => setRawWaiver(waiverPct !== null && waiverPct !== undefined ? waiverPct.toString() : '0')}
                  error={parseWaiverInput(rawWaiver).error || undefined}
                  style={{ textAlign: 'center' }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Courses List */}
      <Card padding="none" className="animate-in">
        <CardHeader className="flex justify-between items-center bg-transparent border-b-0 pb-0">
          <h2 style={{ margin: 0 }} className="text-sm font-bold text-main">Term Courses</h2>
          <Button variant="ghost" onClick={addCourse} style={{ color: 'var(--accent-primary)', padding: '4px 8px' }}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex-col items-center justify-center py-8 text-center">
              <p className="text-muted mb-4">Add courses to see your term fee breakdown.</p>
              <Button variant="primary" onClick={addCourse}>Add first course</Button>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {courses.map((course: CourseEntry) => {
                const raw = rawCredits[`${course.id}-credits`] ?? course.credits.toString();
                const { error } = parseCreditInput(raw);
                return (
                  <div key={course.id} className="flex-col gap-2 bg-page p-3 rounded-md border border-subtle" style={{ backgroundColor: 'var(--bg-page)' }}>
                    <div className="flex gap-2 items-start">
                      <div className="flex-col gap-1 w-full" style={{ flex: 3 }}>
                        <label className="sr-only">Course Name</label>
                        <Input
                          type="text"
                          value={course.name}
                          onChange={e => updateCourse(course.id, 'name', e.target.value)}
                          placeholder="Course Name"
                          aria-label={`Course name for ${course.name}`}
                          style={{ border: 'none', backgroundColor: 'transparent', padding: '0', fontSize: '1rem', fontWeight: 500, boxShadow: 'none', height: '24px' }}
                        />
                      </div>
                      <div className="flex-col gap-1" style={{ width: '60px' }}>
                        <label className="text-xs text-muted font-bold uppercase tracking-wider text-center">Cr</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={raw}
                          onChange={e => handleCreditChange(course.id, e.target.value)}
                          onBlur={() => setRawCredits({ ...rawCredits, [`${course.id}-credits`]: course.credits.toString() })}
                          error={error || undefined}
                          aria-label={`Credits for ${course.name}`}
                          style={{ textAlign: 'center', padding: '4px' }}
                        />
                      </div>
                      <div className="flex items-center justify-center pt-5 ml-2">
                        <button
                          onClick={() => removeCourse(course.id)}
                          aria-label={`Remove ${course.name}`}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Course Flags */}
                    <div className="flex gap-4 pt-2 mt-1 border-t border-subtle" style={{ borderColor: 'var(--border-subtle)' }}>
                      <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={course.isRetake}
                          onChange={e => {
                            updateCourse(course.id, 'isRetake', e.target.checked);
                            if (!e.target.checked) updateCourse(course.id, 'retakeFirstTime', false);
                          }}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        Retake
                      </label>
                      {course.isRetake && (
                        <label className="flex items-center gap-1 text-xs text-muted cursor-pointer animate-in" style={{ animationName: 'fadeIn' }}>
                          <input
                            type="checkbox"
                            checked={course.retakeFirstTime}
                            onChange={e => updateCourse(course.id, 'retakeFirstTime', e.target.checked)}
                            style={{ accentColor: 'var(--accent-primary)' }}
                          />
                          1st Time Retake
                        </label>
                      )}
                      <label className="flex items-center gap-1 text-xs text-muted cursor-pointer ml-auto">
                        <input
                          type="checkbox"
                          checked={course.waiverIneligible}
                          onChange={e => updateCourse(course.id, 'waiverIneligible', e.target.checked)}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        No Waiver
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="flex-col gap-4 animate-in">
        <Card className="flex-col" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xs font-bold text-muted uppercase tracking-widest m-0">Term Total</h2>
             <span className="font-data" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1 }}>
               {formatBdt(termFeeData.total)}
             </span>
          </div>

          <div className="flex-col gap-1 border-t border-subtle pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
            {termFeeData.lines.map((line, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted">{line.label}</span>
                <span className="font-data" style={{ color: line.isSub ? 'var(--text-danger)' : 'var(--text-main)' }}>
                  {line.isSub ? '-' : ''}{formatBdt(line.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-subtle" style={{ borderColor: 'var(--border-subtle)' }}>
             <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Installments</h3>
             <div className="flex justify-between">
                {termFeeData.installments.map((inst, idx) => (
                  <div key={idx} className="flex-col items-center">
                    <span className="text-xs text-muted mb-1">Inst {idx + 1}</span>
                    <span className="text-sm font-bold font-data">{formatBdt(inst)}</span>
                  </div>
                ))}
             </div>
          </div>
        </Card>

        <Card style={{ backgroundColor: 'var(--bg-page)' }}>
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Degree Estimate</h2>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-muted">Computed Base</span>
            <span className="font-bold font-data">{formatBdt(degreeTotalData.computed)}</span>
          </div>
          {degreeTotalData.published && (
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-muted">Official Published</span>
              <span className="font-data text-muted">{formatBdt(degreeTotalData.published)}</span>
            </div>
          )}
          {!degreeTotalData.matches && degreeTotalData.published && (
            <div className="text-xs text-muted bg-surface p-2 rounded border border-subtle">
              Note: Computed total differs from official published total due to non-credit foundational courses or lab fees not captured by credit multiplication.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
