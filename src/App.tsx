import { useState, useEffect } from 'react';
import GpaCalculator from './ui/GpaCalculator';
import CgpaPlanner from './ui/CgpaPlanner';
import FeeBreakdown from './ui/FeeBreakdown';
import DataPage from './ui/DataPage';
import { loadFeeOverrides } from './state/storage';
import { DISCLAIMER, DATA_SOURCES, POLICY_NOTES } from './data/policyNotes';

function App() {
  const [activeTab, setActiveTab] = useState<'gpa' | 'cgpa' | 'fees' | 'data'>('gpa');
  const [hasOverrides, setHasOverrides] = useState(false);

  useEffect(() => {
    const checkOverrides = () => {
      const overrides = loadFeeOverrides();
      setHasOverrides(Object.keys(overrides).length > 0);
    };
    checkOverrides();
    window.addEventListener('storage', checkOverrides);
    return () => window.removeEventListener('storage', checkOverrides);
  }, []);

  return (
    <div className="container">
      <header>
        <h1>UIU Calculator</h1>
        {hasOverrides && <div className="banner">Custom fees active</div>}
        <nav>
          <button onClick={() => setActiveTab('gpa')} className={activeTab === 'gpa' ? 'active' : ''}>GPA</button>
          <button onClick={() => setActiveTab('cgpa')} className={activeTab === 'cgpa' ? 'active' : ''}>CGPA Planner</button>
          <button onClick={() => setActiveTab('fees')} className={activeTab === 'fees' ? 'active' : ''}>Fees</button>
          <button onClick={() => setActiveTab('data')} className={activeTab === 'data' ? 'active' : ''}>Data & Settings</button>
        </nav>
      </header>
      <main>
        {activeTab === 'gpa' && <GpaCalculator />}
        {activeTab === 'cgpa' && <CgpaPlanner />}
        {activeTab === 'fees' && <FeeBreakdown />}
        {activeTab === 'data' && <DataPage />}
      </main>
      <footer>
        <p>{DISCLAIMER}</p>
        <p>Source pages:
          {DATA_SOURCES.map((source, index) => (
            <span key={index}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
              {` (accessed ${source.accessed})`}
              {index < DATA_SOURCES.length - 1 ? ' | ' : ''}
            </span>
          ))}
        </p>
        <div style={{ marginTop: '10px', fontSize: '0.85em', color: 'var(--text-light)' }}>
          <strong>Policy summary: </strong>
          {POLICY_NOTES.map((note, index) => (
            <span key={index}>
              <em>{note.title}</em>: {note.body}
              {index < POLICY_NOTES.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
