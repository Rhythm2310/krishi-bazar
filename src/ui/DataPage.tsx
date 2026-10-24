import { useState, useEffect } from 'react';
import { loadFeeOverrides, saveFeeOverrides, clearAllData } from '../state/storage';
import { PROGRAMS } from '../data/programs';
import type { Program } from '../domain/types';
import { POLICY_NOTES, DATA_SOURCES } from '../data/policyNotes';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Select } from './components/Select';

export default function DataPage() {
  const [overrides, setOverrides] = useState<Record<string, Partial<Program>>>({});
  const [selectedProgramCode, setSelectedProgramCode] = useState<string>(PROGRAMS[0].code);

  useEffect(() => {
    setOverrides(loadFeeOverrides());
  }, []);

  const handleOverrideChange = (field: keyof Program, value: number | null) => {
    const newOverrides = { ...overrides };
    if (!newOverrides[selectedProgramCode]) {
      newOverrides[selectedProgramCode] = {};
    }

    const base = PROGRAMS.find(p => p.code === selectedProgramCode)!;
    if (value === base[field] || isNaN(value as number)) {
      delete newOverrides[selectedProgramCode][field];
      if (Object.keys(newOverrides[selectedProgramCode]).length === 0) {
        delete newOverrides[selectedProgramCode];
      }
    } else {
      (newOverrides[selectedProgramCode] as any)[field] = value;
    }

    setOverrides(newOverrides);
    saveFeeOverrides(newOverrides);
    window.dispatchEvent(new Event('storage'));
  };

  const currentProgramBase = PROGRAMS.find(p => p.code === selectedProgramCode)!;
  const currentOverrides = overrides[selectedProgramCode] || {};

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data (courses, records, overrides)?")) {
      clearAllData();
      window.dispatchEvent(new Event('storage'));
      window.location.reload();
    }
  };

  return (
    <div className="flex-col gap-6 animate-in">
      <Card>
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Fee Overrides</h2>
        <p className="text-sm text-muted mb-4">Edit fees to match your specific admission batch. Changes are saved locally.</p>

        <div className="flex-col gap-4">
          <Select
            label="Select Program"
            value={selectedProgramCode}
            onChange={e => setSelectedProgramCode(e.target.value)}
          >
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </Select>

          <div className="flex gap-4">
            <Input
              label="Per Credit (BDT)"
              type="text"
              inputMode="decimal"
              value={currentOverrides.perCreditFee ?? currentProgramBase.perCreditFee}
              onChange={e => handleOverrideChange('perCreditFee', parseInt(e.target.value))}
              style={{ textAlign: 'center' }}
            />
            <Input
              label="Term Fee (BDT)"
              type="text"
              inputMode="decimal"
              value={currentOverrides.termFee ?? currentProgramBase.termFee}
              onChange={e => handleOverrideChange('termFee', parseInt(e.target.value))}
              style={{ textAlign: 'center' }}
            />
          </div>
          <Input
            label="Lab Fee Per Term (BDT)"
            type="text"
            inputMode="decimal"
            value={currentOverrides.labFeePerTerm ?? currentProgramBase.labFeePerTerm ?? 0}
            onChange={e => handleOverrideChange('labFeePerTerm', parseInt(e.target.value) || null)}
            style={{ textAlign: 'center' }}
          />
        </div>
      </Card>

      <Card>
        <div className="flex-col gap-3">
          <div>
            <h2 className="text-xs font-bold text-danger uppercase tracking-widest mb-1">Reset Application</h2>
            <p className="text-sm text-muted m-0">Clear all local storage including courses, GPA records, and custom fee overrides.</p>
          </div>
          <Button variant="danger" onClick={handleReset} fullWidth>Reset All Data</Button>
        </div>
      </Card>

      <Card style={{ backgroundColor: 'var(--bg-surface)' }}>
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Policy Summary</h2>
        <ul className="flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
          {POLICY_NOTES.map((note, idx) => (
            <li key={idx}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>{note.title}</strong>
              <span className="text-muted leading-tight">{note.body}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="text-center">
         <span className="text-xs text-muted">
           For actual info, always refer to the <a href="https://uiu.ac.bd" target="_blank" rel="noopener noreferrer">official UIU website</a>.
           Sources: {DATA_SOURCES.map((src, idx) => (
            <span key={idx}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{src.label}</a>
              {idx < DATA_SOURCES.length - 1 ? ', ' : ''}
            </span>
          ))}
         </span>
      </div>
    </div>
  );
}
