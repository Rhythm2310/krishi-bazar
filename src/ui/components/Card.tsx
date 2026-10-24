import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Card({ children, className = '', padding = 'md', style }: CardProps) {
  return (
    <div className={`ui-card ui-card--p-${padding} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`ui-card__header ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`ui-card__content ${className}`}>{children}</div>;
}
