import React from 'react';
import './Tabs.css';

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ children, className = '' }: TabsProps) {
  return (
    <div className={`ui-tabs ${className}`}>
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
      className={`ui-tab ${active ? 'ui-tab--active' : ''} ${className}`}
      aria-selected={active}
      role="tab"
      {...props}
    >
      {children}
    </button>
  );
}
