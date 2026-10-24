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
    if (value === base[field]) {
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
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <Card>
        <h2 className="mb-2">Data & Settings</h2>
        <p className="text-muted mb-6">Manage application data, custom fees for your specific batch, and review data sources.</p>

        <h3 className="mb-4">Fee Overrides</h3>
        <p className="text-sm text-muted mb-4">Edit fees to match your specific admission batch. Changes are saved automatically to your device.</p>

        <div style={{ maxWidth: '400px' }} className="flex-col gap-4">
          <Select
            label="Select Program to Override"
            value={selectedProgramCode}
            onChange={e => setSelectedProgramCode(e.target.value)}
          >
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </Select>

          <Input
            label="Per Credit Fee (BDT)"
            type="number"
            value={currentOverrides.perCreditFee ?? currentProgramBase.perCreditFee}
            onChange={e => handleOverrideChange('perCreditFee', parseInt(e.target.value))}
          />
          <Input
            label="Term Fee (BDT)"
            type="number"
            value={currentOverrides.termFee ?? currentProgramBase.termFee}
            onChange={e => handleOverrideChange('termFee', parseInt(e.target.value))}
          />
          <Input
            label="Lab Fee Per Term (BDT)"
            type="number"
            value={currentOverrides.labFeePerTerm ?? currentProgramBase.labFeePerTerm ?? 0}
            onChange={e => handleOverrideChange('labFeePerTerm', parseInt(e.target.value) || null)}
          />
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="mb-2">Reset Application</h3>
            <p className="text-sm text-muted mb-0">Clear all local storage including courses, GPA records, and custom fee overrides. This action cannot be undone.</p>
          </div>
          <Button variant="danger" onClick={handleReset}>Reset All Data</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4">Scholarship & Waiver Policy</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: 'var(--space-4)', margin: '0 0 var(--space-4) 0' }}>
          {POLICY_NOTES.map((note, idx) => (
            <li key={idx} className="mb-2" style={{ fontSize: '0.9375rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>{note.title}:</strong> <span className="text-muted">{note.body}</span>
            </li>
          ))}
        </ul>
        <div className="text-sm text-muted" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
          Sources: {DATA_SOURCES.map((src, idx) => (
            <span key={idx}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{src.label}</a>
              {idx < DATA_SOURCES.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </Card>

      <Card style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <h3 className="mb-2">Seed Data Overview</h3>
        <p className="text-sm text-muted mb-4">Base data sourced from <code>uiu.ac.bd</code> on 2026-10-23.</p>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(PROGRAMS, null, 2)}</pre>
        </div>
      </Card>
    </div>
  );
}
