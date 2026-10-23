import { useState, useEffect } from 'react';
import { loadFeeOverrides, saveFeeOverrides, clearAllData } from '../state/storage';
import { PROGRAMS } from '../data/programs';
import type { Program } from '../domain/types';

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
    <div className="card">
      <h2>Data & Settings</h2>

      <div className="mt-2">
        <h3>Override Fees</h3>
        <p>Edit fees for your admission batch. Changes are saved locally.</p>
        <div className="flex">
          <select value={selectedProgramCode} onChange={e => setSelectedProgramCode(e.target.value)}>
            {PROGRAMS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </select>
        </div>
        <div className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <label>
            Per Credit Fee:
            <input
              type="number"
              value={currentOverrides.perCreditFee ?? currentProgramBase.perCreditFee}
              onChange={e => handleOverrideChange('perCreditFee', parseInt(e.target.value))}
            />
          </label>
          <label>
            Term Fee:
            <input
              type="number"
              value={currentOverrides.termFee ?? currentProgramBase.termFee}
              onChange={e => handleOverrideChange('termFee', parseInt(e.target.value))}
            />
          </label>
          <label>
            Lab Fee:
            <input
              type="number"
              value={currentOverrides.labFeePerTerm ?? currentProgramBase.labFeePerTerm ?? 0}
              onChange={e => handleOverrideChange('labFeePerTerm', parseInt(e.target.value) || null)}
            />
          </label>
        </div>
      </div>

      <div className="mt-2" style={{borderTop: '1px solid #dee2e6', paddingTop: '10px'}}>
        <button className="danger" onClick={handleReset}>Reset All Data</button>
      </div>

      <div className="mt-2" style={{borderTop: '1px solid #dee2e6', paddingTop: '10px'}}>
        <h3>Seed Data Overview</h3>
        <p>All data sourced from <code>uiu.ac.bd</code> on 2026-10-23.</p>
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg)', padding: '10px', borderRadius: '4px' }}>
          <h4>Programs Base Data</h4>
          <pre>{JSON.stringify(PROGRAMS, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
