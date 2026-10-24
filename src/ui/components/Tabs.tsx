import React from 'react';
import './Tabs.css';

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ children, className = '' }: TabsProps) {
  return (
    <div className={`ds-tabs-nav ${className}`} role="tablist">
      {children}
    </div>
  );
}

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Tab({ active, children, className = '', ...props }: TabProps) {
  return (
    <button
      className={`ds-tab-btn ${className}`}
      aria-selected={active}
      role="tab"
      tabIndex={active ? 0 : -1}
      {...props}
    >
      {children}
    </button>
  );
}
