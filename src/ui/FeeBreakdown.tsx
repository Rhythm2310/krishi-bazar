import { useState, useEffect } from 'react';
import type { CourseEntry, Program } from '../domain/types';
import { computeTermFee, computeDegreeTotal } from '../domain/fees';
import { formatBdt } from '../domain/format';
import { loadFeeOverrides } from '../state/storage';
import { PROGRAMS } from '../data/programs';
import { parseCreditInput, parseWaiverInput } from './parseInputs';

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
    <div className="card">
      <h2>Fee Breakdown</h2>

      <div className="flex mt-1">
        <label>
          Program:
          <select value={selectedProgramCode} onChange={e => setSelectedProgramCode(e.target.value)}>
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </select>
        </label>
        <label>
          Waiver %:
          <select value={isCustomWaiver ? 'custom' : waiverPct} onChange={e => handleWaiverSelect(e.target.value)}>
            <option value="0">0%</option>
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="100">100%</option>
            <option value="custom">Custom...</option>
          </select>
        </label>
        {isCustomWaiver && (
          <label>
            Custom Waiver:
            <input type="text" inputMode="decimal" value={rawWaiver} onChange={e => handleCustomWaiverChange(e.target.value)} onBlur={() => setRawWaiver(waiverPct.toString())} />
            {parseWaiverInput(rawWaiver).error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{parseWaiverInput(rawWaiver).error}</div>}
          </label>
        )}
      </div>

      <h3 className="mt-2">Term Courses</h3>

      {courses.length === 0 ? (
        <div className="mt-2" style={{ padding: '20px', background: 'var(--bg)', borderRadius: '4px', textAlign: 'center' }}>
          <p>Select a program and add courses to see your term fee breakdown.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Course Name</th><th>Credits</th><th>Retake?</th><th>1st Time?</th><th>Waiver Inel?</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const raw = rawCredits[`${course.id}-credits`] ?? course.credits.toString();
              const { error } = parseCreditInput(raw);
              return (
                <tr key={course.id}>
                  <td><input type="text" value={course.name} onChange={e => updateCourse(course.id, 'name', e.target.value)} /></td>
                  <td>
                    <input type="text" inputMode="decimal" value={raw} onChange={e => handleCreditChange(course.id, e.target.value)} onBlur={() => setRawCredits({ ...rawCredits, [`${course.id}-credits`]: course.credits.toString() })} />
                    {error && <div className="error" style={{ fontSize: '0.8em', marginTop: '4px' }}>{error}</div>}
                  </td>
                  <td><input type="checkbox" checked={course.isRetake} onChange={e => updateCourse(course.id, 'isRetake', e.target.checked)} /></td>
                  <td>{course.isRetake && <input type="checkbox" checked={course.retakeFirstTime} onChange={e => updateCourse(course.id, 'retakeFirstTime', e.target.checked)} />}</td>
                  <td><input type="checkbox" checked={course.waiverIneligible} onChange={e => updateCourse(course.id, 'waiverIneligible', e.target.checked)} /></td>
                  <td><button className="danger" onClick={() => removeCourse(course.id)}>Remove</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="mt-1" onClick={addCourse}>Add Course</button>

      <div className="mt-2" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>Line Items</h3>
          <ul>
            {termFeeData.lines.map((line, idx) => (
              <li key={idx}>
                {line.label}: {line.isSub ? '-' : ''}{formatBdt(line.amount)}
              </li>
            ))}
          </ul>
          <p><strong>Total: {formatBdt(termFeeData.total)}</strong></p>
          <h4>Installments</h4>
          <ul>
            {termFeeData.installments.map((inst, idx) => (
              <li key={idx}>Installment {idx + 1}: {formatBdt(inst)}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: '1', minWidth: '300px', background: 'var(--bg)', padding: '15px', borderRadius: '4px' }}>
          <h3>Degree Total Estimate (No Waiver)</h3>
          <p><strong>Computed:</strong> {formatBdt(degreeTotalData.computed)}</p>
          <p><strong>Official Published:</strong> {degreeTotalData.published ? formatBdt(degreeTotalData.published) : 'N/A'}</p>
          {!degreeTotalData.matches && degreeTotalData.published && (
            <p className="error">Note: Computed differs from official published total. See official policy for nuances.</p>
          )}
        </div>
      </div>
    </div>
  );
}
