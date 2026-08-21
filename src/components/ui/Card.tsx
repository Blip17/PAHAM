// Reusable Card Primitive for PAHAM Design System
// Subtle paper textures, tactile hover elevations, and clean academic layout slots

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'subtle' | 'interactive' | 'bordered';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg transition-all duration-200';

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 sm:p-10',
  }[padding];

  const variantClasses = {
    default: 'paper-sheet border border-paper-300 shadow-subtle',
    elevated: 'paper-sheet border border-paper-300 shadow-elevated',
    subtle: 'bg-paper-100 border border-paper-200',
    interactive: 'paper-sheet border border-paper-300 hover:border-moss-700 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:scale-[0.99] cursor-pointer',
    bordered: 'bg-paper-50 border-2 border-moss-800/80 shadow-subtle',
  }[variant];

  return (
    <div className={`${baseClasses} ${paddingClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
