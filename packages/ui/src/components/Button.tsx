import * as React from 'react';
import { cn } from '../utils/cn';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export function MagneticButton({ children, className, ...props }: MagneticButtonProps) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

const variants = {
  primary: 'bg-[#C9A84C] text-white hover:bg-[#b8963e]',
  secondary: 'bg-transparent border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white',
  tertiary: 'bg-transparent text-[#C9A84C] hover:underline',
} as const;

type Variant = keyof typeof variants;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  magnetic?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', magnetic = false, children, ...props }, ref) => {
    const baseClass = cn('px-6 py-3 rounded transition-colors duration-200', variants[variant as Variant], className);
    if (magnetic) {
      return (
        <MagneticButton className={baseClass} {...props}>
          {children}
        </MagneticButton>
      );
    }
    return (
      <button ref={ref} className={baseClass} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
