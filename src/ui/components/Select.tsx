import React, { useId } from 'react';
import './Input.css'; /* Shares input styling */

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
      <div className={`ui-input-group ${fullWidth ? 'ui-input-group--full' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="ui-input-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`ui-input ${error ? 'ui-input--error' : ''}`}
          style={{ appearance: 'auto' }} /* Let native select arrow show */
          {...props}
        >
          {children}
        </select>
        {error && <span className="ui-input-error-text">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
