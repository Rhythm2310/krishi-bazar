import { useState, useEffect } from 'react';
import GpaCalculator from './ui/GpaCalculator';
import CgpaPlanner from './ui/CgpaPlanner';
import FeeBreakdown from './ui/FeeBreakdown';
import DataPage from './ui/DataPage';
import { loadFeeOverrides } from './state/storage';
import { DISCLAIMER, DATA_SOURCES, POLICY_NOTES } from './data/policyNotes';
import { Tabs, Tab } from './ui/components/Tabs';

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
    <div className="layout-container flex-col" style={{ minHeight: '100vh' }}>
      <header className="mb-6 animate-in" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ color: 'var(--accent-primary)' }}>UIU Calculator</h1>
          {hasOverrides && (
            <div style={{
              backgroundColor: 'var(--accent-warning-bg)',
              color: 'var(--accent-warning-text)',
              border: `1px solid var(--accent-warning-border)`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Custom Fees
            </div>
          )}
        </div>

        <nav aria-label="Main Navigation">
          <Tabs>
            <Tab active={activeTab === 'gpa'} onClick={() => setActiveTab('gpa')}>GPA</Tab>
            <Tab active={activeTab === 'cgpa'} onClick={() => setActiveTab('cgpa')}>Planner</Tab>
            <Tab active={activeTab === 'fees'} onClick={() => setActiveTab('fees')}>Fees</Tab>
            <Tab active={activeTab === 'data'} onClick={() => setActiveTab('data')}>Data</Tab>
          </Tabs>
        </nav>
      </header>

      <main style={{ flexGrow: 1 }} className="mb-12 animate-in">
        <div key={activeTab} className="animate-in" style={{ animationName: 'fadeIn', animationDuration: 'var(--transition-smooth)' }}>
          {activeTab === 'gpa' && <GpaCalculator />}
          {activeTab === 'cgpa' && <CgpaPlanner />}
          {activeTab === 'fees' && <FeeBreakdown />}
          {activeTab === 'data' && <DataPage />}
        </div>
      </main>

      <footer className="mt-4 animate-in" style={{
        marginTop: 'auto',
        paddingTop: 'var(--space-6)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        animationDelay: '100ms'
      }}>
        <p className="mb-2 text-center font-medium">{DISCLAIMER}</p>
        <div className="flex flex-col gap-2 mb-4 text-center">
          <span>Sources:</span>
          <div className="flex justify-center gap-2 flex-wrap">
            {DATA_SOURCES.map((source, index) => (
              <span key={index}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
                {index < DATA_SOURCES.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', lineHeight: 1.5, opacity: 0.8 }} className="text-center">
          {POLICY_NOTES.map((note, index) => (
            <span key={index}>
              <strong>{note.title}</strong>: {note.body}
              {index < POLICY_NOTES.length - 1 ? ' | ' : ''}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
