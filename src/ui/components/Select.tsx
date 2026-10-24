import React, { useId } from 'react';
import './Input.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, fullWidth = true, className = '', children, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={`ds-input-group ${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="ds-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`ds-select ${error ? 'ds-input-error' : ''} font-data`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="ds-error-text">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
