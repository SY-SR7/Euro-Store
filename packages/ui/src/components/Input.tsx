import * as React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id?: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label htmlFor={id} className="text-sm text-[#D6D3C7]">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-[#D6D3C7] focus:outline-none focus:border-[#C9A84C]',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
