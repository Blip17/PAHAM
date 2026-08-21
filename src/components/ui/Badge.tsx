// Reusable Badge Primitive for PAHAM Design System
// Subtle semantic indicators, metadata tags, and status labels

import React from 'react';

export type BadgeVariant = 'moss' | 'terracotta' | 'amber' | 'neutral' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-mono font-medium rounded uppercase tracking-wider select-none';

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] sm:text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantClasses = {
    moss: 'bg-moss-100 text-moss-900 border border-moss-300',
    terracotta: 'bg-terracotta-100 text-terracotta-900 border border-terracotta-300',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300',
    neutral: 'bg-paper-200 text-ink-800 border border-paper-300',
    outline: 'bg-transparent text-ink-700 border border-paper-400',
  }[variant];

  const dotColors = {
    moss: 'bg-moss-700',
    terracotta: 'bg-terracotta-700',
    amber: 'bg-amber-700',
    neutral: 'bg-ink-500',
    outline: 'bg-ink-400',
  }[variant];

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors} shrink-0`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
