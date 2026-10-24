import React, { useId } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`ui-input-group ${fullWidth ? 'ui-input-group--full' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${error ? 'ui-input--error' : ''}`}
          {...props}
        />
        {error && <span className="ui-input-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
