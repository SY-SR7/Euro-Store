import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="relative w-full group">
        <input
          id={inputId}
          ref={ref}
          placeholder=" "
          className={cn(
            "peer w-full bg-transparent border border-[#2E2E2E] text-[#E2E2E2] rounded px-4 pt-6 pb-2",
            "focus:outline-none focus:border-[#C9A84C] transition-colors",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "absolute text-[#9CA3AF] transition-all duration-200 pointer-events-none",
              "top-4 start-4 text-sm origin-center",
              "peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#C9A84C]",
              "peer-not-placeholder-shown:-translate-y-3 peer-not-placeholder-shown:scale-75"
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
