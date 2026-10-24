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
      <header className="mb-6">
        <h1 style={{ marginBottom: hasOverrides ? '8px' : '24px' }}>UIU Calculator</h1>
        {hasOverrides && (
          <div style={{
            backgroundColor: 'var(--accent-warning-bg)',
            color: 'var(--accent-warning-text)',
            border: '1px solid var(--accent-warning-border)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: 'var(--space-6)'
          }}>
            Custom fees active
          </div>
        )}
        <nav aria-label="Main Navigation">
          <Tabs>
            <Tab active={activeTab === 'gpa'} onClick={() => setActiveTab('gpa')}>GPA Calculator</Tab>
            <Tab active={activeTab === 'cgpa'} onClick={() => setActiveTab('cgpa')}>CGPA Planner</Tab>
            <Tab active={activeTab === 'fees'} onClick={() => setActiveTab('fees')}>Fee Breakdown</Tab>
            <Tab active={activeTab === 'data'} onClick={() => setActiveTab('data')}>Data & Settings</Tab>
          </Tabs>
        </nav>
      </header>

      <main style={{ flexGrow: 1 }} className="mb-12">
        {activeTab === 'gpa' && <GpaCalculator />}
        {activeTab === 'cgpa' && <CgpaPlanner />}
        {activeTab === 'fees' && <FeeBreakdown />}
        {activeTab === 'data' && <DataPage />}
      </main>

      <footer style={{
        marginTop: 'auto',
        paddingTop: 'var(--space-8)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
      }}>
        <p className="mb-2">{DISCLAIMER}</p>
        <p className="mb-4">Source pages:{' '}
          {DATA_SOURCES.map((source, index) => (
            <span key={index}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{source.label}</a>
              <span className="text-xs"> {`(accessed ${source.accessed})`}</span>
              {index < DATA_SOURCES.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </p>
        <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-main)' }}>Policy summary: </strong>
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
