// Reusable Button Primitive for PAHAM Design System
// Tactile feedback, accessibility-first, and semantic variants

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tactile';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  // Base styling
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-moss-700 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  // Size styling
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 rounded gap-1.5',
    md: 'text-xs sm:text-sm py-2 px-4 rounded gap-2',
    lg: 'text-sm sm:text-base py-3 px-6 rounded-md gap-2.5',
  }[size];

  // Variant styling
  const variantClasses = {
    primary: 'bg-moss-900 text-paper-50 border border-moss-950 hover:bg-moss-850 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-subtle',
    secondary: 'bg-paper-50 text-ink-900 border border-paper-300 hover:bg-paper-100 hover:border-paper-400 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
    ghost: 'bg-transparent text-ink-600 hover:bg-paper-200 hover:text-ink-950 active:bg-paper-300',
    danger: 'bg-terracotta-800 text-paper-50 border border-terracotta-900 hover:bg-terracotta-900 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-subtle',
    tactile: 'bg-paper-50 text-ink-950 border-2 border-paper-300 hover:border-moss-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] shadow-subtle',
  }[variant];

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
