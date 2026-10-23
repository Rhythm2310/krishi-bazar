import { useState, useEffect } from 'react';
import GpaCalculator from './ui/GpaCalculator';
import CgpaPlanner from './ui/CgpaPlanner';
import FeeBreakdown from './ui/FeeBreakdown';
import DataPage from './ui/DataPage';
import { loadFeeOverrides } from './state/storage';

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
        <p>Unofficial tool. Disclaimer: Rates and computations may not perfectly match the official system. See official sources.</p>
        <p>Source pages (accessed 2026-10-23):
          <a href="https://www.uiu.ac.bd/academics/grading-performance-evaluation/">Grading</a> |
          <a href="https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/">Fees</a> |
          <a href="https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/">Policy</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
