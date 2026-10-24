import React from 'react';
import './Table.css';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function Table({ children, className = '', compact = false }: TableProps) {
  return (
    <div className="ds-table-container">
      <table className={`ds-table ${compact ? 'ds-table-compact' : ''} ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TableHeader({ children, className = '', align = 'left' }: { children: React.ReactNode, className?: string, align?: 'left' | 'center' | 'right' }) {
  return <th className={`text-${align} ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '', align = 'left' }: { children: React.ReactNode, className?: string, align?: 'left' | 'center' | 'right' }) {
  return <td className={`text-${align} ${className}`}>{children}</td>;
}
