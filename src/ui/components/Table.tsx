import React from 'react';
import './Table.css';

export function Table({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="ui-table-container">
      <table className={`ui-table ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="ui-table-head">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="ui-table-body">{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <tr className={`ui-table-row ${className}`}>{children}</tr>;
}

export function TableHeader({ children, className = '', align = 'left' }: { children: React.ReactNode, className?: string, align?: 'left' | 'center' | 'right' }) {
  return <th className={`ui-table-header text-${align} ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '', align = 'left' }: { children: React.ReactNode, className?: string, align?: 'left' | 'center' | 'right' }) {
  return <td className={`ui-table-cell text-${align} ${className}`}>{children}</td>;
}
