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
      <div className={`ds-input-group ${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ds-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`ds-input ${error ? 'ds-input-error' : ''} font-data`}
          {...props}
        />
        {error && <span className="ds-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
