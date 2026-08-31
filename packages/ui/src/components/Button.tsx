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
  primary: 'bg-primary text-text-primary hover:bg-primary-dark',
  secondary: 'border border-border bg-background-elevated text-text-primary hover:border-border-accent hover:bg-background-secondary',
  tertiary: 'bg-transparent text-text-secondary hover:bg-background-secondary hover:text-text-primary',
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
    const baseClass = cn('min-h-11 rounded-lg px-6 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50', variants[variant as Variant], className);
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
